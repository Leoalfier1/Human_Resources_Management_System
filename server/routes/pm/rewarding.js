const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/authMiddleware');
const { sendRewardNotification } = require('../../utils/mailer');

router.use(verifyToken);

// Helper to get socket.io instance
const getIO = (req) => req.app.get('socketio');

// ==========================================
// 1. ELIGIBILITY LIST
// ==========================================

const getEffectivePeriodId = async (requestedPeriodId) => {
    const [active] = await db.query('SELECT id FROM rating_periods WHERE is_active = 1 LIMIT 1');
    const activeId = active[0]?.id;
    if (!requestedPeriodId || requestedPeriodId === 'all' || requestedPeriodId === 'undefined' || requestedPeriodId === 'null') {
        return activeId;
    }
    const [check] = await db.query('SELECT id FROM performance_commitments WHERE rating_period_id = ? LIMIT 1', [requestedPeriodId]);
    if (check.length === 0 && activeId) {
        return activeId;
    }
    return requestedPeriodId;
};

// GET /api/pm/rewarding/eligible
router.get('/eligible', async (req, res) => {
    try {
        const { position_type, period_id } = req.query;
        const targetPeriodId = await getEffectivePeriodId(period_id);
        
        const { ensureEmployeeCommitmentsAndIpcrf } = require('../../utils/ensureRecords');
        await ensureEmployeeCommitmentsAndIpcrf(targetPeriodId);

        let query = `
             SELECT pc.id as commitment_id, pc.employee_id, pc.position_type, 
                    CASE 
                      WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 
                      THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4))
                      ELSE 5.0000 
                    END as overall_weighted_score,
                    CASE 
                      WHEN (CASE WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4)) ELSE 5.0000 END) >= 4.5 THEN 'Outstanding'
                      WHEN (CASE WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4)) ELSE 5.0000 END) >= 3.5 THEN 'Very Satisfactory'
                      WHEN (CASE WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4)) ELSE 5.0000 END) >= 2.5 THEN 'Satisfactory'
                      WHEN (CASE WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4)) ELSE 5.0000 END) >= 1.5 THEN 'Unsatisfactory'
                      ELSE 'Outstanding'
                    END as adjectival_rating,
                    e.name as employee_name, e.position as employee_position, e.unit as employee_unit, e.email as employee_email
             FROM performance_commitments pc
             JOIN employees e ON pc.employee_id = e.id
             WHERE (pc.final_rating_submitted_at IS NOT NULL OR pc.status IN ('submitted', 'under_review', 'reviewed', 'finalized', 'approved', 'committed'))
               AND pc.id NOT IN (
                   SELECT commitment_id 
                   FROM rewards_recognition
               )
        `;
        const params = [];
        if (position_type && position_type !== 'all') {
            query += ` AND pc.position_type = ?`;
            params.push(position_type);
        }
        if (targetPeriodId) {
            query += ` AND pc.rating_period_id = ?`;
            params.push(targetPeriodId);
        }
        query += ` ORDER BY overall_weighted_score DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. NOMINATIONS WORKFLOW
// ==========================================

// POST /api/pm/rewarding/nominate
router.post('/nominate', async (req, res) => {
    try {
        const { commitment_id, employee_id, reward_type, notes } = req.body;

        if (!commitment_id || !employee_id || !reward_type) {
            return res.status(400).json({ message: "commitment_id, employee_id, and reward_type are required" });
        }

        const [result] = await db.query(
            `INSERT INTO rewards_recognition (commitment_id, employee_id, reward_type, nomination_status, nominated_by, nominated_at, notes)
             VALUES (?, ?, ?, 'nominated', ?, NOW(), ?)`,
            [commitment_id, employee_id, reward_type, req.user.id, notes || '']
        );

        const io = getIO(req);
        if (io) {
            io.emit('performance_update', { type: 'reward_nominated', commitment_id, employee_id, reward_type });
        }

        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/pm/rewarding/nomination/:id
router.put('/nomination/:id', async (req, res) => {
    try {
        const { nomination_status, notes } = req.body; // 'approved' or 'rejected'
        
        await db.query(
            `UPDATE rewards_recognition 
             SET nomination_status = ?, approved_by = ?, approved_at = NOW(), notes = COALESCE(?, notes)
             WHERE id = ?`,
            [nomination_status, req.user.id, notes, req.params.id]
        );

        if (nomination_status === 'approved') {
            const [nom] = await db.query('SELECT employee_id, commitment_id FROM rewards_recognition WHERE id = ?', [req.params.id]);
            if (nom.length > 0) {
                const empId = nom[0].employee_id;
                const commId = nom[0].commitment_id;

                await db.query("UPDATE ipcrf SET status = 'finalized', finalized_at = NOW(), rater_signed = TRUE WHERE employee_id = ?", [empId]);
                await db.query("UPDATE performance_commitments SET status = 'finalized', final_rating_submitted_at = COALESCE(final_rating_submitted_at, NOW()) WHERE id = ?", [commId]);
                await db.query(
                    `UPDATE performance_targets 
                     SET final_rating = COALESCE(final_rating, rater_rating, self_rating, 5)
                     WHERE commitment_id = ?`,
                    [commId]
                );

                const notificationMessage = `Congratulations! Your performance evaluation and recognition have been officially approved & finalized by Rater Jay Montealto, CESO V!`;
                await db.query(
                    `INSERT INTO notifications (user_id, message, type, is_read) 
                     VALUES (?, ?, 'pm_finalized', FALSE)`,
                    [empId, notificationMessage]
                );

                const io = getIO(req);
                if (io) {
                    io.to(String(empId)).emit('rating:finalized', { commitment_id: commId, status: 'finalized' });
                    io.to(String(empId)).emit('review:finalized', { commitment_id: commId, status: 'finalized' });
                    io.to(String(empId)).emit('ipcrf:status_changed', { status: 'finalized' });
                    io.emit('commitment:approved', { commitment_id: commId, employee_id: empId });
                    io.emit('performance_update', { type: 'nomination_approved', employee_id: empId });
                }
            }
        }

        const io = getIO(req);
        if (io) {
            io.emit('performance_update', { type: 'nomination_status_changed', nomination_id: req.params.id, status: nomination_status });
        }

        res.json({ success: true, message: 'Nomination approved & IPCRF automatically signed & finalized!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pm/rewarding/nominations
router.get('/nominations', async (req, res) => {
    try {
        const { period_id } = req.query;
        const targetPeriodId = await getEffectivePeriodId(period_id);
        let query = `
             SELECT rr.*, e.name as employee_name, e.position as employee_position, e.unit as employee_unit,
                    n.name as nominator_name, a.name as approver_name
             FROM rewards_recognition rr
             JOIN employees e ON rr.employee_id = e.id
             JOIN employees n ON rr.nominated_by = n.id
             LEFT JOIN employees a ON rr.approved_by = a.id
             JOIN performance_commitments pc ON rr.commitment_id = pc.id
             WHERE 1=1
        `;
        const params = [];
        if (targetPeriodId) {
            query += ` AND pc.rating_period_id = ? `;
            params.push(targetPeriodId);
        }
        query += ` ORDER BY rr.nominated_at DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/pm/rewarding/nomination/:id
router.delete('/nomination/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM rewards_recognition WHERE id = ?', [req.params.id]);
        const io = getIO(req);
        if (io) {
            io.emit('performance_update', { type: 'nomination_deleted', nomination_id: req.params.id });
        }
        res.json({ success: true, message: 'Nomination removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. PDP DEVELOPMENT PLANNING Suggestions
// ==========================================

// GET /api/pm/rewarding/pdp/:commitmentId
router.get('/pdp/:commitmentId', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT pt.id, pt.kra_category, pt.target_description, pt.self_rating, pt.rater_rating, pt.final_rating
             FROM performance_targets pt
             WHERE pt.commitment_id = ?`,
            [req.params.commitmentId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. SEND REWARD NOTIFICATION EMAIL
// ==========================================

// POST /api/pm/rewarding/send-email
router.post('/send-email', async (req, res) => {
    try {
        const { employee_id, reward_type, notes } = req.body;
        
        const [empRows] = await db.query('SELECT id, name, email FROM employees WHERE id = ?', [employee_id]);
        if (empRows.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }
        
        const employee = empRows[0];
        if (!employee.email) {
            return res.status(400).json({ message: "Employee has no email address on file" });
        }

        await sendRewardNotification(employee.email, employee.name, reward_type, notes || '');
        
        // Log the email send
        const logMsg = '[Email sent to ' + employee.email + ']';
        await db.query(
            'UPDATE rewards_recognition SET notes = CONCAT(COALESCE(notes, ""), ?) WHERE employee_id = ? AND reward_type = ?',
            [logMsg, employee_id, reward_type]
        );

        res.json({ success: true, message: `Official signed IPCRF & Recognition notification email successfully sent directly to ${employee.name}'s Gmail (${employee.email})!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
