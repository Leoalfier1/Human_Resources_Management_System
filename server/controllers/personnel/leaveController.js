const db = require('../../db');

exports.getMyLeaveCredits = async (req, res) => {
    try {
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });
        const [credits] = await db.query('SELECT * FROM leave_credits WHERE employee_id = ?', [emp[0].id]);
        res.json(credits[0] || { employee_id: emp[0].id, sick_leave_balance: 0, vacation_leave_balance: 0, forced_leave_balance: 0, special_privilege_balance: 0 });
    } catch (error) {
        console.error('getMyLeaveCredits Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyLeaveApplications = async (req, res) => {
    try {
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });
        const [rows] = await db.query('SELECT * FROM leave_applications WHERE employee_id = ? ORDER BY created_at DESC', [emp[0].id]);
        res.json(rows);
    } catch (error) {
        console.error('getMyLeaveApplications Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.submitLeaveApplication = async (req, res) => {
    try {
        const { leave_type, date_from, date_to, num_days, reason } = req.body;
        if (!leave_type || !date_from || !date_to) {
            return res.status(400).json({ message: 'leave_type, date_from, and date_to are required.' });
        }
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });

        const [result] = await db.query(
            'INSERT INTO leave_applications (employee_id, leave_type, date_from, date_to, num_days, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [emp[0].id, leave_type, date_from, date_to, num_days || null, reason || null, 'pending']
        );

        await db.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [emp[0].id, 'leave', result.insertId, `Leave application submitted: ${leave_type} (${date_from} to ${date_to})`]
        );

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, emp[0].id, 'leave_submitted', `Leave application #${result.insertId} submitted`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');

        res.status(201).json({ message: 'Leave application submitted.', id: result.insertId });
    } catch (error) {
        console.error('submitLeaveApplication Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.cancelLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });

        const [leave] = await db.query('SELECT id FROM leave_applications WHERE id = ? AND employee_id = ? AND status = ?', [id, emp[0].id, 'pending']);
        if (leave.length === 0) return res.status(403).json({ message: 'Only pending leave applications can be cancelled.' });

        await db.query('UPDATE leave_applications SET status = ? WHERE id = ?', ['cancelled', id]);
        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Leave application cancelled.' });
    } catch (error) {
        console.error('cancelLeave Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllLeaveApplications = async (req, res) => {
    try {
        const { status, leave_type, employee_id, date_from, date_to, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let where = ['1=1'];
        let params = [];

        if (status) { where.push('la.status = ?'); params.push(status); }
        if (leave_type) { where.push('la.leave_type = ?'); params.push(leave_type); }
        if (employee_id) { where.push('la.employee_id = ?'); params.push(employee_id); }
        if (date_from) { where.push('la.date_from >= ?'); params.push(date_from); }
        if (date_to) { where.push('la.date_to <= ?'); params.push(date_to); }

        const whereClause = where.join(' AND ');

        const [count] = await db.query(`SELECT COUNT(*) as total FROM leave_applications la WHERE ${whereClause}`, params);
        const [rows] = await db.query(
            `SELECT la.*, e.first_name, e.last_name, e.employee_no, e.position_title, e.assigned_school
             FROM leave_applications la
             JOIN employees e ON e.id = la.employee_id
             WHERE ${whereClause}
             ORDER BY la.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({ applications: rows, total: count[0].total, page: parseInt(page), totalPages: Math.ceil(count[0].total / parseInt(limit)) });
    } catch (error) {
        console.error('getAllLeaveApplications Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.approveLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const [leave] = await db.query('SELECT * FROM leave_applications WHERE id = ? AND status = ?', [id, 'pending']);
        if (leave.length === 0) return res.status(400).json({ message: 'Leave not found or already processed.' });

        await db.query(
            'UPDATE leave_applications SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
            ['approved', req.user.id, id]
        );

        // Deduct leave credits
        const l = leave[0];
        const creditField = {
            sick: 'sick_leave_balance',
            vacation: 'vacation_leave_balance',
            forced: 'forced_leave_balance',
            special_privilege: 'special_privilege_balance'
        }[l.leave_type];

        if (creditField) {
            await db.query(
                `UPDATE leave_credits SET ${creditField} = GREATEST(${creditField} - ?, 0) WHERE employee_id = ?`,
                [l.num_days || 1, l.employee_id]
            );
        }

        await db.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [l.employee_id, 'leave', id, 'Your leave application has been approved.']
        );

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, l.employee_id, 'leave_approved', `Leave #${id} approved`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Leave approved.' });
    } catch (error) {
        console.error('approveLeave Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.rejectLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const [leave] = await db.query('SELECT * FROM leave_applications WHERE id = ? AND status = ?', [id, 'pending']);
        if (leave.length === 0) return res.status(400).json({ message: 'Leave not found or already processed.' });

        await db.query(
            'UPDATE leave_applications SET status = ?, rejection_reason = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
            ['rejected', rejection_reason || null, req.user.id, id]
        );

        await db.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [leave[0].employee_id, 'leave', id, `Your leave application has been rejected.${rejection_reason ? ' Reason: ' + rejection_reason : ''}`]
        );

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, leave[0].employee_id, 'leave_rejected', `Leave #${id} rejected`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Leave rejected.' });
    } catch (error) {
        console.error('rejectLeave Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getLeaveReport = async (req, res) => {
    try {
        const { date_from, date_to, format = 'json' } = req.query;
        let where = ['1=1'];
        let params = [];
        if (date_from) { where.push('la.date_from >= ?'); params.push(date_from); }
        if (date_to) { where.push('la.date_to <= ?'); params.push(date_to); }

        const [rows] = await db.query(
            `SELECT la.*, e.first_name, e.last_name, e.employee_no, e.position_title, e.assigned_school
             FROM leave_applications la
             JOIN employees e ON e.id = la.employee_id
             WHERE ${where.join(' AND ')}
             ORDER BY la.created_at DESC`,
            params
        );

        if (format === 'csv') {
            const header = 'ID,Employee No,Name,Leave Type,Date From,Date To,Days,Status,Created\n';
            const csv = header + rows.map(r =>
                `${r.id},${r.employee_no || ''},"${r.first_name || ''} ${r.last_name || ''}",${r.leave_type},${r.date_from},${r.date_to},${r.num_days || ''},${r.status},${r.created_at}`
            ).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="leave_report.csv"');
            return res.send(csv);
        }
        res.json(rows);
    } catch (error) {
        console.error('getLeaveReport Error:', error);
        res.status(500).json({ message: error.message });
    }
};
