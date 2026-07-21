/**
 * END-TO-END VERIFICATION TEST FOR PROFILE CHANGE REQUESTS
 *
 * 1. Submits a new profile change request for user_id = 10 (emp_id = 3).
 * 2. Simulates HR approving the request.
 * 3. Verifies direct DB values in `employees` AND `personal_data_sheets`.
 * 4. Verifies what `getMyProfile` / `getEmployeeById` response logic yields.
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

    const USER_ID = 10;
    const EMP_ID = 3;
    const REVIEWER_USER_ID = 1; // Admin user ID for reviewed_by

    console.log('='.repeat(70));
    console.log('E2E TEST 1: Clean up any old pending requests for emp_id=3');
    console.log('='.repeat(70));

    await db.query(
        "UPDATE employee_profile_change_requests SET status = 'rejected', review_notes = 'Cleaned up by test' WHERE employee_id = ? AND status = 'pending'",
        [EMP_ID]
    );

    console.log('\n' + '='.repeat(70));
    console.log('E2E TEST 2: Submit new profile change request');
    console.log('='.repeat(70));

    const testChanges = {
        civil_status: { old: 'widowed', new: 'married' },
        mobile_no: { old: '09124353531', new: '09998887777' },
        blood_type: { old: 'A+', new: 'O+' }
    };

    const [insertRes] = await db.query(
        'INSERT INTO employee_profile_change_requests (employee_id, user_id, changes_json, reason, status) VALUES (?, ?, ?, ?, ?)',
        [EMP_ID, USER_ID, JSON.stringify(testChanges), 'E2E Automated Verification Test', 'pending']
    );

    const requestId = insertRes.insertId;
    console.log(`Submitted change request #${requestId}`);

    console.log('\n' + '='.repeat(70));
    console.log(`E2E TEST 3: Approve request #${requestId} (simulating reviewChangeRequest)`);
    console.log('='.repeat(70));

    // Simulate reviewChangeRequest logic directly in transaction
    await db.beginTransaction();
    try {
        const [rows] = await db.query(
            "SELECT * FROM employee_profile_change_requests WHERE id = ? AND status = 'pending' FOR UPDATE",
            [requestId]
        );
        const req = rows[0];
        const changes = typeof req.changes_json === 'string' ? JSON.parse(req.changes_json) : req.changes_json;

        // 1. Update employees
        const setClauses = [];
        const values = [];
        for (const [field, diff] of Object.entries(changes)) {
            setClauses.push(`${field} = ?`);
            values.push(diff.new);
        }
        values.push(req.employee_id);
        await db.query(`UPDATE employees SET ${setClauses.join(', ')} WHERE id = ?`, values);

        // 2. Sync PDS
        const [[empForPds]] = await db.query(
            'SELECT user_id FROM employees WHERE id = ? LIMIT 1',
            [req.employee_id]
        );

        if (empForPds) {
            const [pdsRows] = await db.query(
                "SELECT id FROM personal_data_sheets WHERE user_id = ? AND status = 'submitted' LIMIT 1",
                [empForPds.user_id]
            );
            if (pdsRows.length > 0) {
                const pdsClauses = [];
                const pdsValues = [];
                for (const [empField, diff] of Object.entries(changes)) {
                    const pdsCol = EMP_TO_PDS_COL[empField];
                    if (pdsCol) {
                        pdsClauses.push(`${pdsCol} = ?`);
                        pdsValues.push(diff.new);
                    }
                }
                if (pdsClauses.length > 0) {
                    pdsValues.push(pdsRows[0].id);
                    await db.query(
                        `UPDATE personal_data_sheets SET ${pdsClauses.join(', ')} WHERE id = ?`,
                        pdsValues
                    );
                }
            }
        }

        // 3. Mark approved
        await db.query(
            "UPDATE employee_profile_change_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), review_notes = 'E2E Approved' WHERE id = ?",
            [REVIEWER_USER_ID, requestId]
        );

        await db.commit();
        console.log(`Successfully approved request #${requestId}`);
    } catch (err) {
        await db.rollback();
        throw err;
    }

    console.log('\n' + '='.repeat(70));
    console.log('E2E TEST 4: Direct DB Verification');
    console.log('='.repeat(70));

    const [empRows] = await db.query(
        'SELECT civil_status, mobile_no, blood_type FROM employees WHERE id = ?',
        [EMP_ID]
    );
    console.log('employees table values:');
    console.log(empRows[0]);

    const [pdsRows] = await db.query(
        'SELECT civil_status, mobile_no, blood_type FROM personal_data_sheets WHERE user_id = ?',
        [USER_ID]
    );
    console.log('personal_data_sheets table values:');
    console.log(pdsRows[0]);

    console.log('\n' + '='.repeat(70));
    console.log('E2E TEST 5: Verify getMyProfile / getEmployeeById output');
    console.log('='.repeat(70));

    const [joined] = await db.query(
        `SELECT e.civil_status as emp_civil_status, e.mobile_no as emp_mobile_no, e.blood_type as emp_blood_type,
                pds.status as pds_status,
                pds.civil_status as pds_civil_status, pds.mobile_no as pds_mobile_no, pds.blood_type as pds_blood_type
         FROM employees e
         LEFT JOIN personal_data_sheets pds ON pds.user_id = e.user_id
         WHERE e.id = ?`,
        [EMP_ID]
    );

    const resObj = { ...joined[0] };
    if (resObj.pds_status === 'submitted') {
        if (resObj.pds_civil_status) resObj.civil_status = resObj.pds_civil_status;
        if (resObj.pds_mobile_no) resObj.mobile_no = resObj.pds_mobile_no;
        if (resObj.pds_blood_type) resObj.blood_type = resObj.pds_blood_type;
    }

    console.log('Final API output object:');
    console.log({
        civil_status: resObj.civil_status,
        mobile_no: resObj.mobile_no,
        blood_type: resObj.blood_type
    });

    const isMatch = resObj.civil_status === 'married' && resObj.mobile_no === '09998887777' && resObj.blood_type === 'O+';

    if (isMatch) {
        console.log('\n✅ E2E TEST PASSED! All tables and API outputs reflect the newly approved request changes.');
    } else {
        console.log('\n❌ E2E TEST FAILED! Mismatch detected.');
    }

    await db.end();
}

main().catch(err => {
    console.error('E2E TEST ERROR:', err);
    process.exit(1);
});
