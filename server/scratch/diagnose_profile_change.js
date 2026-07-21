/**
 * DIAGNOSTIC SCRIPT — Profile Change Request Bug Investigation
 * Run: node scratch/diagnose_profile_change.js
 *
 * Steps:
 *  1. Find the approved request(s) for "kiki okay" / "jhustyn jhustyn"
 *  2. Dump the full changes_json from the request
 *  3. Query the actual employees row pointed to by employee_id
 *  4. Check for duplicate employee records for the same user
 *  5. Show what Employee Directory would query (by user_id path)
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

    console.log('='.repeat(70));
    console.log('STEP 1 — Find approved change request(s) for jhustyn/kiki');
    console.log('='.repeat(70));

    const [requests] = await db.query(`
        SELECT 
            r.id,
            r.employee_id,
            r.user_id,
            r.status,
            r.changes_json,
            r.reviewed_at,
            r.review_notes,
            r.created_at,
            e.first_name  AS emp_first_name,
            e.last_name   AS emp_last_name,
            e.user_id     AS emp_user_id,
            u.full_name   AS user_full_name,
            u.email       AS user_email
        FROM employee_profile_change_requests r
        LEFT JOIN employees e ON e.id = r.employee_id
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.status = 'approved'
        ORDER BY r.reviewed_at DESC
        LIMIT 10
    `);

    if (requests.length === 0) {
        console.log('⚠️  No approved requests found at all!');
    } else {
        console.log(`Found ${requests.length} approved request(s):`);
        for (const r of requests) {
            console.log('\n' + '-'.repeat(60));
            console.log(`  Request ID    : ${r.id}`);
            console.log(`  employee_id   : ${r.employee_id}`);
            console.log(`  user_id       : ${r.user_id}`);
            console.log(`  status        : ${r.status}`);
            console.log(`  reviewed_at   : ${r.reviewed_at}`);
            console.log(`  review_notes  : ${r.review_notes}`);
            console.log(`  created_at    : ${r.created_at}`);
            console.log(`  emp row name  : ${r.emp_first_name} ${r.emp_last_name}`);
            console.log(`  emp user_id   : ${r.emp_user_id}`);
            console.log(`  user full_name: ${r.user_full_name}`);
            console.log(`  user email    : ${r.user_email}`);
            console.log('  changes_json  :');
            const changes = typeof r.changes_json === 'string' 
                ? JSON.parse(r.changes_json) 
                : r.changes_json;
            for (const [field, diff] of Object.entries(changes)) {
                console.log(`    ${field}: "${diff.old}" → "${diff.new}"`);
            }
        }
    }

    // Use the first (most recent) approved request for deep-dive
    if (requests.length === 0) { await db.end(); return; }

    const req = requests[0];
    const changes = typeof req.changes_json === 'string'
        ? JSON.parse(req.changes_json)
        : req.changes_json;

    console.log('\n' + '='.repeat(70));
    console.log(`STEP 2 — Query employees WHERE id = ${req.employee_id}`);
    console.log('='.repeat(70));

    const [empById] = await db.query(
        'SELECT id, user_id, first_name, middle_name, last_name, name_extension, sex, civil_status, date_of_birth, tin_no, gsis_id, pagibig_id, philhealth_no, mobile_no, email FROM employees WHERE id = ?',
        [req.employee_id]
    );

    if (empById.length === 0) {
        console.log(`❌ NO employee row found WHERE id = ${req.employee_id} — the change request points to a non-existent employee!`);
    } else {
        const emp = empById[0];
        console.log(`\nemployees row (id=${emp.id}):`);
        const fields = ['first_name','middle_name','last_name','name_extension','sex','civil_status','date_of_birth','tin_no','gsis_id','pagibig_id','philhealth_no','mobile_no','email'];
        for (const f of fields) {
            const val = emp[f];
            const inChanges = changes[f];
            if (inChanges) {
                const valStr = val != null ? String(val) : null;
                const matchesOld = valStr === inChanges.old;
                const matchesNew = valStr === inChanges.new;
                const marker = matchesNew ? '✅ NEW (applied)' : matchesOld ? '❌ OLD (NOT applied)' : '⚠️  NEITHER';
                console.log(`  ${f}: "${val}"  ← ${marker}  (expected new="${inChanges.new}")`);
            } else {
                console.log(`  ${f}: "${val}"  (not in changes)`);
            }
        }
        console.log(`\n  linked user_id in employees: ${emp.user_id}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log(`STEP 3 — Check for duplicate employees for user_id = ${req.user_id}`);
    console.log('='.repeat(70));

    const [allEmpRows] = await db.query(
        'SELECT id, user_id, first_name, last_name, sex, civil_status, mobile_no FROM employees WHERE user_id = ?',
        [req.user_id]
    );
    console.log(`\nemployees rows for user_id=${req.user_id}: ${allEmpRows.length} row(s)`);
    for (const e of allEmpRows) {
        console.log(`  id=${e.id}  name="${e.first_name} ${e.last_name}"  sex=${e.sex}  civil_status=${e.civil_status}  mobile=${e.mobile_no}`);
    }

    // Also check by emp_user_id from the join (might differ)
    if (req.emp_user_id && req.emp_user_id !== req.user_id) {
        console.log(`\n⚠️  MISMATCH: r.user_id=${req.user_id} but the employees row's user_id=${req.emp_user_id}`);
        const [byEmpUserId] = await db.query(
            'SELECT id, user_id, first_name, last_name FROM employees WHERE user_id = ?',
            [req.emp_user_id]
        );
        console.log(`employees rows for emp.user_id=${req.emp_user_id}: ${byEmpUserId.length} row(s)`);
        for (const e of byEmpUserId) {
            console.log(`  id=${e.id}  name="${e.first_name} ${e.last_name}"`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('STEP 4 — What does findOrCreateEmployee(user_id) actually return?');
    console.log('='.repeat(70));

    const [empByUserId] = await db.query(
        'SELECT id, user_id, first_name, last_name, sex, civil_status, mobile_no FROM employees WHERE user_id = ? LIMIT 1',
        [req.user_id]
    );
    if (empByUserId.length === 0) {
        console.log(`❌ findOrCreateEmployee(${req.user_id}) would find NO row!`);
    } else {
        const e = empByUserId[0];
        console.log(`findOrCreateEmployee(${req.user_id}) returns employee id=${e.id}`);
        console.log(`  name="${e.first_name} ${e.last_name}"  sex=${e.sex}  civil_status=${e.civil_status}  mobile=${e.mobile_no}`);
        if (e.id !== req.employee_id) {
            console.log(`\n  ❌❌❌ CRITICAL MISMATCH:`);
            console.log(`     Change request employee_id = ${req.employee_id}`);
            console.log(`     findOrCreateEmployee returns id  = ${e.id}`);
            console.log(`     These are DIFFERENT records! The profile display is showing id=${e.id},`);
            console.log(`     but the approval updated (or tried to update) id=${req.employee_id}.`);
        } else {
            console.log(`  ✅ ID matches change request's employee_id (${req.employee_id})`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('STEP 5 — Manual replay: what UPDATE would the approve handler run?');
    console.log('='.repeat(70));
    const setClauses = [];
    const values = [];
    for (const [field, diff] of Object.entries(changes)) {
        setClauses.push(`${field} = ?`);
        values.push(diff.new);
    }
    values.push(req.employee_id);
    const sql = `UPDATE employees SET ${setClauses.join(', ')} WHERE id = ${req.employee_id}`;
    console.log('\nSQL that the handler would have run:');
    console.log('  ' + sql);
    console.log('  values: ' + JSON.stringify(values));

    console.log('\n' + '='.repeat(70));
    console.log('STEP 6 — Verify all change keys are valid employees columns');
    console.log('='.repeat(70));
    const [cols] = await db.query("SHOW COLUMNS FROM employees");
    const colNames = cols.map(c => c.Field);
    for (const field of Object.keys(changes)) {
        const exists = colNames.includes(field);
        console.log(`  ${field}: ${exists ? '✅ column exists' : '❌ COLUMN DOES NOT EXIST in employees table'}`);
    }

    await db.end();
    console.log('\n✅ Diagnostic complete.');
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
