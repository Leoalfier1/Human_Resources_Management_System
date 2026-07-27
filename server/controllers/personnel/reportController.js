const db = require('../../db');

exports.personnelSummary = async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as count FROM employees WHERE is_active = 1');
        const [byType] = await db.query('SELECT employment_type, COUNT(*) as count FROM employees WHERE is_active = 1 GROUP BY employment_type');
        const [byStatus] = await db.query('SELECT employment_status, COUNT(*) as count FROM employees WHERE is_active = 1 GROUP BY employment_status');
        const [bySchool] = await db.query('SELECT assigned_school, COUNT(*) as count FROM employees WHERE is_active = 1 AND assigned_school IS NOT NULL GROUP BY assigned_school ORDER BY count DESC LIMIT 10');
        const [pendingLeave] = await db.query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'pending'");
        const [pendingTravel] = await db.query("SELECT COUNT(*) as count FROM travel_authority_requests WHERE status = 'pending'");
        const [pendingDocs] = await db.query("SELECT COUNT(*) as count FROM document_requests WHERE status = 'pending'");

        res.json({
            total_employees: total[0].count,
            by_employment_type: byType,
            by_employment_status: byStatus,
            top_schools: bySchool,
            pending_leave: pendingLeave[0].count,
            pending_travel: pendingTravel[0].count,
            pending_documents: pendingDocs[0].count
        });
    } catch (error) {
        console.error('personnelSummary Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.leaveUtilization = async (req, res) => {
    try {
        const { year } = req.query;
        const y = year || new Date().getFullYear();

        const [rows] = await db.query(
            `SELECT e.id, e.first_name, e.last_name, e.employee_no,
                    lc.sick_leave_balance, lc.vacation_leave_balance, lc.forced_leave_balance, lc.special_privilege_balance,
                    (SELECT SUM(num_days) FROM leave_applications WHERE employee_id = e.id AND leave_type = 'sick' AND YEAR(date_from) = ? AND status = 'approved') as sick_used,
                    (SELECT SUM(num_days) FROM leave_applications WHERE employee_id = e.id AND leave_type = 'vacation' AND YEAR(date_from) = ? AND status = 'approved') as vacation_used
             FROM employees e
             LEFT JOIN leave_credits lc ON lc.employee_id = e.id
             WHERE e.is_active = 1
             ORDER BY e.last_name ASC`,
            [y, y]
        );

        res.json(rows);
    } catch (error) {
        console.error('leaveUtilization Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.employeeMovement = async (req, res) => {
    try {
        const { days = 90 } = req.query;

        const [recentHires] = await db.query(
            'SELECT id, first_name, last_name, position_title, assigned_school, date_hired, created_at FROM employees WHERE date_hired >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ORDER BY date_hired DESC',
            [parseInt(days)]
        );

        const [archived] = await db.query(
            'SELECT id, first_name, last_name, position_title, assigned_school, updated_at as action_date FROM employees WHERE is_active = 0 AND updated_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ORDER BY updated_at DESC',
            [parseInt(days)]
        );

        const [activity] = await db.query(
            'SELECT * FROM personnel_activity_log WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ORDER BY created_at DESC LIMIT 50',
            [parseInt(days)]
        );

        res.json({ recent_hires: recentHires, archived, activity });
    } catch (error) {
        console.error('employeeMovement Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.travelHistory = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;
        let where = ["tr.status = 'approved'"];
        let params = [];
        if (date_from) { where.push('tr.date_from >= ?'); params.push(date_from); }
        if (date_to) { where.push('tr.date_to <= ?'); params.push(date_to); }

        const [rows] = await db.query(
            `SELECT tr.*, e.first_name, e.last_name, e.employee_no, e.position_title, e.assigned_school
             FROM travel_authority_requests tr
             JOIN employees e ON e.id = tr.employee_id
             WHERE ${where.join(' AND ')}
             ORDER BY tr.date_from DESC`,
            params
        );
        res.json(rows);
    } catch (error) {
        console.error('travelHistory Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.certificateRequests = async (req, res) => {
    try {
        const { date_from, date_to, status } = req.query;
        let where = ['1=1'];
        let params = [];
        if (date_from) { where.push('dr.created_at >= ?'); params.push(date_from); }
        if (date_to) { where.push('dr.created_at <= ?'); params.push(date_to); }
        if (status) { where.push('dr.status = ?'); params.push(status); }

        const [rows] = await db.query(
            `SELECT dr.*, e.first_name, e.last_name, e.employee_no, e.position_title
             FROM document_requests dr
             JOIN employees e ON e.id = dr.employee_id
             WHERE ${where.join(' AND ')}
             ORDER BY dr.created_at DESC`,
            params
        );
        res.json(rows);
    } catch (error) {
        console.error('certificateRequests Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.auditLog = async (req, res) => {
    try {
        const { limit = 100, offset = 0, action_type, employee_id } = req.query;
        let where = ['1=1'];
        let params = [];
        if (action_type) { where.push('pal.action_type = ?'); params.push(action_type); }
        if (employee_id) { where.push('pal.employee_id = ?'); params.push(parseInt(employee_id)); }

        const [rows] = await db.query(
            `SELECT pal.*, u.full_name as actor_name
             FROM personnel_activity_log pal
             LEFT JOIN users u ON u.id = pal.actor_id
             WHERE ${where.join(' AND ')}
             ORDER BY pal.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );
        const [count] = await db.query(
            `SELECT COUNT(*) as total FROM personnel_activity_log pal WHERE ${where.join(' AND ')}`,
            params
        );
        res.json({ logs: rows, total: count[0].total });
    } catch (error) {
        console.error('auditLog Error:', error);
        res.status(500).json({ message: error.message });
    }
};
