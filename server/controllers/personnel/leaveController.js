const db = require('../../db');
const { findOrCreateEmployee } = require('../../utils/employeeHelper');

exports.getMyLeaveCredits = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
        const [credits] = await db.query('SELECT * FROM leave_credits WHERE employee_id = ?', [empRow.id]);
        res.json(credits[0] || { employee_id: empRow.id, sick_leave_balance: 0, vacation_leave_balance: 0, forced_leave_balance: 0, special_privilege_balance: 0 });
    } catch (error) {
        console.error('getMyLeaveCredits Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyLeaveApplications = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
        const [rows] = await db.query('SELECT * FROM leave_applications WHERE employee_id = ? ORDER BY created_at DESC', [empRow.id]);
        res.json(rows);
    } catch (error) {
        console.error('getMyLeaveApplications Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.submitLeaveApplication = async (req, res) => {
    try {
        const {
            leave_type, date_from, date_to, num_days, reason,
            leave_details, commutation, esignature_consented
        } = req.body;
        if (!leave_type || !date_from || !date_to) {
            return res.status(400).json({ message: 'leave_type, date_from, and date_to are required.' });
        }
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });

        const [result] = await db.query(
            `INSERT INTO leave_applications
             (employee_id, leave_type, date_from, date_to, num_days, reason,
              leave_details, commutation, esignature_consented, esignature_ip, esignature_timestamp, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
                empRow.id, leave_type, date_from, date_to,
                num_days || null, reason || null,
                leave_details || null, commutation || 'not_requested',
                esignature_consented ? 1 : 0,
                req.ip || req.connection?.remoteAddress || null,
                'pending'
            ]
        );

        await db.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [empRow.id, 'leave', result.insertId, `Leave application submitted: ${leave_type} (${date_from} to ${date_to})`]
        );

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, empRow.id, 'leave_submitted', `Leave application #${result.insertId} submitted`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:leave:update');
            io.emit('personnel:notification:update');
        }

        res.status(201).json({ message: 'Leave application submitted.', id: result.insertId });
    } catch (error) {
        console.error('submitLeaveApplication Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.cancelLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });

        const [leave] = await db.query(
            'SELECT id FROM leave_applications WHERE id = ? AND employee_id = ? AND status IN (?, ?)',
            [id, empRow.id, 'pending', 'recommended']
        );
        if (leave.length === 0) return res.status(403).json({ message: 'Only pending or recommended leave applications can be cancelled.' });

        await db.query('UPDATE leave_applications SET status = ? WHERE id = ?', ['cancelled', id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:leave:update');
        }
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
            `SELECT la.*,
                    e.first_name, e.last_name, e.employee_no, e.position_title, e.assigned_school,
                    u_rec.full_name AS recommender_name,
                    u_fin.full_name AS final_approver_name,
                    sg.full_name AS signatory_name, sg.position AS signatory_position
             FROM leave_applications la
             JOIN employees e ON e.id = la.employee_id
             LEFT JOIN users u_rec ON u_rec.id = la.recommended_by
             LEFT JOIN users u_fin ON u_fin.id = la.final_action_by
             LEFT JOIN signatories sg ON sg.id = la.signatory_id
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

// ============================================================
// STEP 1: Recommendation (7.B) — hr_staff/admin
// Sets status to 'recommended'. NO credit deduction.
// ============================================================
exports.recommendLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { recommendation, remark } = req.body;
        const [leave] = await db.query('SELECT * FROM leave_applications WHERE id = ? AND status = ?', [id, 'pending']);
        if (leave.length === 0) return res.status(400).json({ message: 'Leave not found or not in pending status.' });

        if (recommendation === 'approve') {
            await db.query(
                'UPDATE leave_applications SET status = ?, recommended_by = ?, recommended_at = NOW(), recommendation_remark = ? WHERE id = ?',
                ['recommended', req.user.id, remark || null, id]
            );

            await db.query(
                'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
                [leave[0].employee_id, 'leave', id, 'Your leave application has been recommended for approval.']
            );

            await db.query(
                'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
                [req.user.id, leave[0].employee_id, 'leave_recommended', `Leave #${id} recommended for approval`]
            );

            const io = req.app.get('socketio');
            if (io) {
                io.emit('personnel:update');
                io.emit('personnel:leave:update');
                io.emit('personnel:notification:update');
            }
            res.json({ message: 'Leave recommended for approval.' });
        } else {
            await db.query(
                'UPDATE leave_applications SET status = ?, recommended_by = ?, recommended_at = NOW(), recommendation_remark = ? WHERE id = ?',
                ['rejected', req.user.id, remark || null, id]
            );

            await db.query(
                'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
                [leave[0].employee_id, 'leave', id, `Your leave application was disapproved at recommendation.${remark ? ' Reason: ' + remark : ''}`]
            );

            await db.query(
                'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
                [req.user.id, leave[0].employee_id, 'leave_disapproved_recommendation', `Leave #${id} disapproved at recommendation`]
            );

            const io = req.app.get('socketio');
            if (io) {
                io.emit('personnel:update');
                io.emit('personnel:leave:update');
                io.emit('personnel:notification:update');
            }
            res.json({ message: 'Leave disapproved at recommendation.' });
        }
    } catch (error) {
        console.error('recommendLeave Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// STEP 2: Final Action (7.C/7.D) — appointing_authority/admin
// Sets status to 'approved'. DEDUCTS leave credits here.
// ============================================================
exports.finalApproveLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { days_type, remark, signatory_id } = req.body;
        const [leave] = await db.query('SELECT * FROM leave_applications WHERE id = ? AND status = ?', [id, 'recommended']);
        if (leave.length === 0) return res.status(400).json({ message: 'Leave not found or not in recommended status.' });

        await db.query(
            `UPDATE leave_applications SET
                status = 'approved',
                final_action_by = ?,
                signatory_id = ?,
                final_action_at = NOW(),
                final_action_days_type = ?,
                final_action_remark = ?
             WHERE id = ?`,
            [req.user.id, signatory_id || null, days_type || 'with_pay', remark || null, id]
        );

        // Deduct leave credits — ONLY on final approval
        const l = leave[0];
        if (days_type === 'with_pay') {
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
        }

        await db.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [l.employee_id, 'leave', id, `Your leave application has been approved (${days_type || 'with pay'}).`]
        );

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, l.employee_id, 'leave_approved_final', `Leave #${id} approved (final action, ${days_type || 'with pay'})`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:leave:update');
            io.emit('personnel:notification:update');
        }
        res.json({ message: 'Leave approved (final action).' });
    } catch (error) {
        console.error('finalApproveLeave Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// REJECT — works from either step
// stage: 'recommendation' → sets recommendation_remark
// stage: 'final_action'   → sets final_action_remark
// ============================================================
exports.rejectLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { stage, rejection_reason } = req.body;
        const [leave] = await db.query('SELECT * FROM leave_applications WHERE id = ? AND status IN (?, ?)', [id, 'pending', 'recommended']);
        if (leave.length === 0) return res.status(400).json({ message: 'Leave not found or already processed.' });

        let updateSQL, logAction, notifMsg;

        if (stage === 'final_action') {
            updateSQL = `UPDATE leave_applications SET
                status = 'rejected',
                final_action_by = ?,
                final_action_at = NOW(),
                final_action_remark = ?
             WHERE id = ?`;
            logAction = 'leave_disapproved_final';
            notifMsg = `Your leave application was disapproved at final action.${rejection_reason ? ' Reason: ' + rejection_reason : ''}`;
        } else {
            updateSQL = `UPDATE leave_applications SET
                status = 'rejected',
                recommended_by = ?,
                recommended_at = NOW(),
                recommendation_remark = ?
             WHERE id = ?`;
            logAction = 'leave_disapproved_recommendation';
            notifMsg = `Your leave application was disapproved at recommendation.${rejection_reason ? ' Reason: ' + rejection_reason : ''}`;
        }

        await db.query(updateSQL, [req.user.id, rejection_reason || null, id]);

        await db.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [leave[0].employee_id, 'leave', id, notifMsg]
        );

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, leave[0].employee_id, logAction, `Leave #${id} ${logAction}`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:leave:update');
            io.emit('personnel:notification:update');
        }
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
