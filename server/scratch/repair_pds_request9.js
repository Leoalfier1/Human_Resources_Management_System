/**
 * MANUAL DATA REPAIR — Apply already-approved request #9 to PDS
 *
 * The approved profile change request #9 (reviewed 2026-07-21 09:45:26)
 * correctly updated employees id=3, but the PDS (id=4, user_id=10) was
 * never updated because the fix didn't exist yet. This script shows the
 * current state and then applies the PDS update to match.
 *
 * Run with --apply flag to actually make the change:
 *   node scratch/repair_pds_request9.js --apply
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const EMP_TO_PDS_COL = {
    first_name:    'first_name',
    middle_name:   'middle_name',
    last_name:     'surname',
    name_extension:'name_extension',
    date_of_birth: 'date_of_birth',
    sex:           'sex',
    civil_status:  'civil_status',
    mobile_no:     'mobile_no',
    gsis_id:       'gsis_id_no',
    pagibig_id:    'pagibig_id_no',
    philhealth_no: 'philhealth_no',
    tin_no:        'tin_no',
};

async function main() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'deped_hrmis',
    });

    const applyFlag = process.argv.includes('--apply');

    console.log('='.repeat(70));
    console.log('CURRENT STATE — employees id=3 (what the DB actually has, after approval)');
    console.log('='.repeat(70));

    const [empRows] = await db.query(
        'SELECT first_name, middle_name, last_name, name_extension, date_of_birth, sex, civil_status, mobile_no, tin_no, gsis_id, pagibig_id, philhealth_no FROM employees WHERE id = 3'
    );
    const emp = empRows[0];
    console.log('\nemployees (id=3):');
    for (const [k, v] of Object.entries(emp)) console.log(`  ${k}: "${v}"`);

    console.log('\n' + '='.repeat(70));
    console.log('CURRENT STATE — personal_data_sheets id=4 (the one overriding the display)');
    console.log('='.repeat(70));

    const [pdsRows] = await db.query(
        "SELECT id, status, first_name, middle_name, surname, name_extension, date_of_birth, sex, civil_status, mobile_no, tin_no, gsis_id_no, pagibig_id_no, philhealth_no FROM personal_data_sheets WHERE id = 4"
    );
    const pds = pdsRows[0];
    console.log('\npersonal_data_sheets (id=4):');
    for (const [k, v] of Object.entries(pds)) console.log(`  ${k}: "${v}"`);

    console.log('\n' + '='.repeat(70));
    console.log('CHANGES from approved request #9 to apply to PDS:');
    console.log('='.repeat(70));

    // From the diagnostic output we know the changes_json for request #9
    const [reqRows] = await db.query(
        'SELECT changes_json FROM employee_profile_change_requests WHERE id = 9'
    );
    const changes = typeof reqRows[0].changes_json === 'string'
        ? JSON.parse(reqRows[0].changes_json)
        : reqRows[0].changes_json;

    const pdsClauses = [];
    const pdsValues  = [];
    console.log('\nField mappings (employees_field → pds_column: new_value):');
    for (const [empField, diff] of Object.entries(changes)) {
        const pdsCol = EMP_TO_PDS_COL[empField];
        if (pdsCol) {
            const currentPdsVal = pds[pdsCol];
            const alreadyMatches = String(currentPdsVal ?? '') === String(diff.new ?? '');
            console.log(`  ${empField} → pds.${pdsCol}: "${currentPdsVal}" → "${diff.new}"  ${alreadyMatches ? '(already matches, skip)' : '← needs update'}`);
            if (!alreadyMatches) {
                pdsClauses.push(`${pdsCol} = ?`);
                pdsValues.push(diff.new);
            }
        } else {
            console.log(`  ${empField}: no PDS mapping (employees-only field)`);
        }
    }

    if (pdsClauses.length === 0) {
        console.log('\n✅ PDS already in sync — no update needed.');
        await db.end();
        return;
    }

    console.log(`\nSQL to execute:`);
    console.log(`  UPDATE personal_data_sheets SET ${pdsClauses.join(', ')} WHERE id = 4`);
    console.log(`  values: ${JSON.stringify(pdsValues)}`);

    if (!applyFlag) {
        console.log('\n⚠️  DRY RUN — pass --apply to actually execute the update.');
        await db.end();
        return;
    }

    console.log('\n🔧 Applying PDS update...');
    pdsValues.push(4); // WHERE id = 4
    const [result] = await db.query(
        `UPDATE personal_data_sheets SET ${pdsClauses.join(', ')} WHERE id = ?`,
        pdsValues
    );
    console.log(`   Rows affected: ${result.affectedRows}`);

    console.log('\n✅ Verification — personal_data_sheets id=4 after update:');
    const [verifyRows] = await db.query(
        "SELECT first_name, middle_name, surname, name_extension, date_of_birth, sex, civil_status, mobile_no, tin_no, gsis_id_no, pagibig_id_no, philhealth_no FROM personal_data_sheets WHERE id = 4"
    );
    for (const [k, v] of Object.entries(verifyRows[0])) console.log(`  ${k}: "${v}"`);

    await db.end();
    console.log('\n✅ Repair complete.');
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
