require('dotenv').config();
const db = require('./db');
(async () => {
    try {
        const [result] = await db.query(
            `INSERT INTO employees (user_id, employee_no, first_name, middle_name, last_name, name_extension,
             date_of_birth, place_of_birth, sex, civil_status, blood_type,
             gsis_id, pagibig_id, philhealth_no, tin_no, mobile_no, email, address,
             photo_path,
             employment_status, employment_type, position_title, salary_grade,
             authorized_salary, actual_salary, monthly_salary, salary_step,
             eligibility, item_number, assigned_school, office, job_status,
             school_office_id,
             date_hired, date_original_appointment)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [9, 'EMP-TEST-002', 'Juan', null, 'Santos', null,
             null, null, null, null, null,
             null, null, null, null, '09179988776', 'applicant.teaching2@depedhrmis.test', null,
             null,
             'permanent', 'teaching', 'Teacher I', '11',
             null, null, null, null,
             null, null, null, null, 'active',
             null,
             '2026-07-28', null]
        );
        console.log('SUCCESS! Insert ID:', result.insertId);
        // Cleanup
        await db.query('DELETE FROM employees WHERE id = ?', [result.insertId]);
        console.log('Cleaned up test row');
    } catch (err) {
        console.error('ERROR:', err.message);
    }
    process.exit(0);
})();
