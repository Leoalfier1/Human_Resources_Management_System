const db = require('../db');

/**
 * Finds the employee record for a given user_id.
 * If none exists, auto-creates one (and leave_credits) so that
 * personnel-module endpoints work immediately after registration.
 *
 * Returns { id } or null if the users row itself is missing.
 */
async function findOrCreateEmployee(userId) {
    const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [userId]);
    if (emp.length > 0) return emp[0];

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return null;

    const u = users[0];
    const nameParts = (u.full_name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;

    const [result] = await db.query(
        `INSERT INTO employees (user_id, first_name, middle_name, last_name, email, mobile_no, employment_type)
         VALUES (?, ?, ?, ?, ?, ?, 'teaching')`,
        [userId, firstName, middleName, lastName, u.email, u.mobile || null]
    );

    await db.query(
        'INSERT INTO leave_credits (employee_id, sick_leave_balance, vacation_leave_balance, forced_leave_balance, special_privilege_balance, as_of_date) VALUES (?, 15, 15, 5, 3, CURDATE())',
        [result.insertId]
    );

    return { id: result.insertId };
}

/**
 * Returns a SQL WHERE fragment that excludes auto-created stub employees.
 * Every query that LISTS or AGGREGATES employees MUST include this clause.
 *
 * Stubs are rows created by findOrCreateEmployee() with employee_no IS NULL
 * — they represent applicants who have never been properly onboarded.
 *
 * For personnel-module queries, prefer using the `v_appointed_employees` view
 * instead of the raw `employees` table — it applies this filter automatically.
 *
 * @param {string} alias - table alias (default 'e')
 * @returns {string} SQL fragment, e.g. "e.employee_no IS NOT NULL"
 *
 * @example
 *   // In a WHERE clause:
 *   WHERE ${isAppointedEmployee()} AND e.is_active = 1
 *
 *   // In a WHERE array:
 *   where.push(isAppointedEmployee());
 */
function isAppointedEmployee(alias = 'e') {
    return `${alias}.employee_no IS NOT NULL`;
}

module.exports = { findOrCreateEmployee, isAppointedEmployee };
