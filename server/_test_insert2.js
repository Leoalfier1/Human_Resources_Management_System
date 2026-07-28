require('dotenv').config();
const db = require('./db');
(async () => {
    try {
        const trimmedEmployeeNo = 'EMP-TEST-004';
        const user_id = 15;
        const first_name = 'Maria';
        const middle_name = '';
        const last_name = 'Clara';
        const name_extension = '';
        const date_of_birth = '';
        const place_of_birth = '';
        const sex = 'female';
        const civil_status = 'single';
        const blood_type = '';
        const gsis_id = '';
        const pagibig_id = '';
        const philhealth_no = '';
        const tin_no = '';
        const mobile_no = '09171234567';
        const email = 'maria@test.com';
        const address = '';
        const employment_status = 'permanent';
        const employment_type = 'teaching';
        const position_title = 'Teacher I';
        const salary_grade = '11';
        const monthly_salary = '';
        const item_number = '';
        const assigned_school = '';
        const date_hired = '2026-07-28';
        const date_original_appointment = '';
        const authorized_salary = '';
        const actual_salary = '';
        const salary_step = '';
        const eligibility = '';
        const office = '';
        const job_status = 'active';
        const school_office_id = '';
        const photoPath = null;

        const category = employment_type || 'teaching';
        const resolvedSchool = assigned_school || null;
        const resolvedOffice = office || null;
        const resolvedSchoolOfficeId = school_office_id || null;

        const values = [user_id, trimmedEmployeeNo, first_name, middle_name || null, last_name, name_extension || null,
            date_of_birth || null, place_of_birth || null, sex || null, civil_status || null, blood_type || null,
            gsis_id || null, pagibig_id || null, philhealth_no || null, tin_no || null, mobile_no || null, email || null, address || null,
            photoPath,
            employment_status || 'permanent', category, position_title || null, salary_grade || null,
            authorized_salary || null, actual_salary || null, monthly_salary || null, salary_step || null,
            eligibility || null, item_number || null, resolvedSchool, resolvedOffice, job_status || 'active',
            resolvedSchoolOfficeId,
            date_hired || null, date_original_appointment || null];

        const sql = `INSERT INTO employees (user_id, employee_no, first_name, middle_name, last_name, name_extension,
             date_of_birth, place_of_birth, sex, civil_status, blood_type,
             gsis_id, pagibig_id, philhealth_no, tin_no, mobile_no, email, address,
             photo_path,
             employment_status, employment_type, position_title, salary_grade,
             authorized_salary, actual_salary, monthly_salary, salary_step,
             eligibility, item_number, assigned_school, office, job_status,
             school_office_id,
             date_hired, date_original_appointment)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        // Count ? in SQL
        const qCount = (sql.match(/\?/g) || []).length;
        console.log('Columns in INSERT:', 35);
        console.log('? count in VALUES:', qCount);
        console.log('Values array length:', values.length);

        if (qCount !== values.length) {
            console.error('MISMATCH! ? count != values count');
        } else {
            console.log('Counts match. Testing INSERT...');
            const [result] = await db.query(sql, values);
            console.log('SUCCESS! Insert ID:', result.insertId);
            await db.query('DELETE FROM employees WHERE id = ?', [result.insertId]);
            console.log('Cleaned up test row');
        }
    } catch (err) {
        console.error('ERROR:', err.message);
        console.error('Code:', err.code);
    }
    process.exit(0);
})();
