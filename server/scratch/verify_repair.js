require('dotenv').config({path: require('path').join(__dirname, '../.env')});
const mysql = require('mysql2/promise');
(async () => {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST, user: process.env.DB_USER,
        password: process.env.DB_PASS, database: process.env.DB_NAME
    });
    const [r3] = await db.query('SELECT changes_json FROM employee_profile_change_requests WHERE id=3');
    const ch = typeof r3[0].changes_json === 'string' ? JSON.parse(r3[0].changes_json) : r3[0].changes_json;
    console.log('Request #3 changes:', JSON.stringify(ch, null, 2));
    const [pds] = await db.query('SELECT sex, civil_status, first_name, surname, mobile_no, tin_no, gsis_id_no, pagibig_id_no, philhealth_no FROM personal_data_sheets WHERE id=4');
    console.log('PDS (id=4) now:', JSON.stringify(pds[0], null, 2));
    const [emp] = await db.query('SELECT sex, civil_status, first_name, last_name, mobile_no FROM employees WHERE id=3');
    console.log('Employees (id=3) now:', JSON.stringify(emp[0], null, 2));
    await db.end();
})();
