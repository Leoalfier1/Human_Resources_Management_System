/**
 * DIAGNOSTIC PART 2 — PDS override investigation
 * Checks whether personal_data_sheets for user_id=10 (jhustyn) has old values
 * that are silently overriding the approved changes in the API response.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'deped_hrmis',
    });

    const USER_ID = 10;   // jhustyn's user_id (from request row)
    const EMP_ID  = 3;    // employee_id from the change request

    console.log('='.repeat(70));
    console.log(`STEP A — personal_data_sheets for user_id=${USER_ID}`);
    console.log('='.repeat(70));

    const [pdsList] = await db.query(
        `SELECT id, user_id, status,
                first_name, middle_name, surname, name_extension,
                date_of_birth, sex, civil_status, blood_type,
                mobile_no, email_address,
                gsis_id_no, pagibig_id_no, philhealth_no, tin_no
         FROM personal_data_sheets
         WHERE user_id = ?`,
        [USER_ID]
    );

    if (pdsList.length === 0) {
        console.log(`✅ No PDS record exists for user_id=${USER_ID} — PDS override does NOT apply.`);
    } else {
        for (const pds of pdsList) {
            console.log(`\nPDS id=${pds.id}  status="${pds.status}"`);
            console.log(`  first_name     : "${pds.first_name}"`);
            console.log(`  middle_name    : "${pds.middle_name}"`);
            console.log(`  surname        : "${pds.surname}"`);
            console.log(`  name_extension : "${pds.name_extension}"`);
            console.log(`  date_of_birth  : "${pds.date_of_birth}"`);
            console.log(`  sex            : "${pds.sex}"`);
            console.log(`  civil_status   : "${pds.civil_status}"`);
            console.log(`  blood_type     : "${pds.blood_type}"`);
            console.log(`  mobile_no      : "${pds.mobile_no}"`);
            console.log(`  email_address  : "${pds.email_address}"`);
            console.log(`  gsis_id_no     : "${pds.gsis_id_no}"`);
            console.log(`  pagibig_id_no  : "${pds.pagibig_id_no}"`);
            console.log(`  philhealth_no  : "${pds.philhealth_no}"`);
            console.log(`  tin_no         : "${pds.tin_no}"`);
            if (pds.status === 'submitted') {
                console.log(`\n  ⚠️  STATUS IS "submitted" — this PDS is ACTIVELY OVERRIDING the employees table!`);
                console.log(`     The API response will use PDS values instead of employees table values.`);
            }
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`STEP B — Simulate getMyProfile / getEmployeeById API response`);
    console.log('='.repeat(70));

    // This is exactly what the API does
    const [empRows] = await db.query(
        `SELECT e.first_name, e.middle_name, e.last_name, e.name_extension,
                e.date_of_birth, e.sex, e.civil_status, e.mobile_no,
                e.tin_no, e.gsis_id, e.pagibig_id, e.philhealth_no,
                pds.status as pds_status,
                pds.first_name as pds_first_name,
                pds.middle_name as pds_middle_name,
                pds.surname as pds_surname,
                pds.name_extension as pds_name_extension,
                pds.date_of_birth as pds_date_of_birth,
                pds.sex as pds_sex,
                pds.civil_status as pds_civil_status,
                pds.mobile_no as pds_mobile_no,
                pds.gsis_id_no as pds_gsis_id_no,
                pds.pagibig_id_no as pds_pagibig_id_no,
                pds.philhealth_no as pds_philhealth_no,
                pds.tin_no as pds_tin_no
         FROM employees e
         LEFT JOIN personal_data_sheets pds ON pds.user_id = e.user_id
         WHERE e.id = ?`,
        [EMP_ID]
    );

    if (empRows.length === 0) {
        console.log('No row returned!');
        await db.end(); return;
    }

    const employeeData = { ...empRows[0] };
    const rawFromDb = {
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        sex: employeeData.sex,
        civil_status: employeeData.civil_status,
        mobile_no: employeeData.mobile_no,
        tin_no: employeeData.tin_no,
    };
    console.log('\nRaw employees table values (before PDS override):');
    for (const [k, v] of Object.entries(rawFromDb)) console.log(`  ${k}: "${v}"`);

    // Apply PDS override (same logic as the controller)
    if (employeeData.pds_status === 'submitted') {
        if (employeeData.pds_first_name) employeeData.first_name = employeeData.pds_first_name;
        if (employeeData.pds_middle_name) employeeData.middle_name = employeeData.pds_middle_name;
        if (employeeData.pds_surname) employeeData.last_name = employeeData.pds_surname;
        if (employeeData.pds_name_extension) employeeData.name_extension = employeeData.pds_name_extension;
        if (employeeData.pds_sex) employeeData.sex = employeeData.pds_sex;
        if (employeeData.pds_civil_status) employeeData.civil_status = employeeData.pds_civil_status;
        if (employeeData.pds_mobile_no) employeeData.mobile_no = employeeData.pds_mobile_no;
        if (employeeData.pds_gsis_id_no) employeeData.gsis_id = employeeData.pds_gsis_id_no;
        if (employeeData.pds_pagibig_id_no) employeeData.pagibig_id = employeeData.pds_pagibig_id_no;
        if (employeeData.pds_philhealth_no) employeeData.philhealth_no = employeeData.pds_philhealth_no;
        if (employeeData.pds_tin_no) employeeData.tin_no = employeeData.pds_tin_no;
    }

    const afterOverride = {
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        sex: employeeData.sex,
        civil_status: employeeData.civil_status,
        mobile_no: employeeData.mobile_no,
        tin_no: employeeData.tin_no,
    };
    console.log(`\nSimulated API response (after PDS override, pds_status="${empRows[0].pds_status}"):`)
    for (const [k, v] of Object.entries(afterOverride)) {
        const raw = rawFromDb[k];
        const wasOverridden = raw !== v;
        console.log(`  ${k}: "${v}"  ${wasOverridden ? '← ⚠️  OVERRIDDEN by PDS' : '(unchanged)'}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('STEP C — What was stored in changes_json vs what PDS has?');
    console.log('='.repeat(70));

    // Show the approved changes diff against PDS values
    const approved_changes = {
        sex: { old: 'male', new: 'Female' },
        last_name: { old: 'jhustyn', new: 'okay' },
        first_name: { old: 'jhustyn', new: 'kiki' },
        civil_status: { old: 'null', new: 'widowed' },
    };

    const pds = pdsList[0] || null;
    if (pds) {
        console.log('\nComparison: approved change "new" value vs PDS stored value:');
        const pdsFieldMap = { first_name: 'first_name', last_name: 'surname', sex: 'sex', civil_status: 'civil_status' };
        for (const [empField, pdsField] of Object.entries(pdsFieldMap)) {
            const approvedNew = approved_changes[empField]?.new;
            const pdsVal = pds[pdsField];
            console.log(`  ${empField}: approved_new="${approvedNew}" vs PDS.${pdsField}="${pdsVal}"  → ${approvedNew !== pdsVal ? '❌ MISMATCH (PDS wins in API)' : '✅ match'}`);
        }
    }

    await db.end();
    console.log('\n✅ Diagnostic part 2 complete.');
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
