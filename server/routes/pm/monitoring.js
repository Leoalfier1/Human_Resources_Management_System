const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/authMiddleware');
const { uploadMOV } = require('../../middleware/uploadMiddleware');

router.use(verifyToken);

// ==========================================
// 1. PERSONNEL LIST FOR COACHING
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

// GET /api/pm/coaching/personnel (or /api/pm/monitoring/personnel)
const getCoachingPersonnel = async (req, res) => {
    try {
        const { position_type, period_id } = req.query;
        const targetPeriodId = await getEffectivePeriodId(period_id);
        
        const { ensureEmployeeCommitmentsAndIpcrf } = require('../../utils/ensureRecords');
        await ensureEmployeeCommitmentsAndIpcrf(targetPeriodId);

        let query = `
            SELECT pc.id as commitment_id, pc.employee_id, pc.position_type, pc.status,
                   e.name as employee_name, e.position as employee_position, e.unit as employee_unit,
                   rp.start_date, rp.end_date
            FROM performance_commitments pc
            JOIN employees e ON pc.employee_id = e.id
            JOIN rating_periods rp ON pc.rating_period_id = rp.id
            WHERE pc.status IN ('draft', 'submitted', 'under_review', 'needs_revision', 'committed')
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

        query += ` ORDER BY e.name ASC`;

        const [personnel] = await db.query(query, params);

        // Fetch coaching logs count and last log date for each personnel
        for (let p of personnel) {
            const [logs] = await db.query(
                `SELECT COUNT(*) as count, MAX(entry_date) as last_date 
                 FROM coaching_logs 
                 WHERE commitment_id = ?`,
                [p.commitment_id]
            );
            p.coaching_count = logs[0].count;
            p.last_coaching_date = logs[0].last_date;

            // Calculate midpoint flag
            p.needs_coaching_attention = false;
            if (p.coaching_count === 0 && p.start_date && p.end_date) {
                const start = new Date(p.start_date).getTime();
                const end = new Date(p.end_date).getTime();
                const midpoint = start + (end - start) / 2;
                const now = Date.now();
                if (now > midpoint) {
                    p.needs_coaching_attention = true;
                }
            }
        }

        res.json(personnel);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.get('/personnel', getCoachingPersonnel);
router.get('/coaching/personnel', getCoachingPersonnel);

// ==========================================
// 2. COACHING LOGS LIST
// ==========================================

// GET /api/pm/coaching/logs/:commitmentId (or /api/pm/monitoring/logs/:commitmentId)
const getCoachingLogs = async (req, res) => {
    try {
        const [logs] = await db.query(
            `SELECT cl.*, e.name as author_name, e.position as author_position,
                    pt.target_description as target_desc, pt.kra_category
             FROM coaching_logs cl
             JOIN employees e ON cl.author_id = e.id
             LEFT JOIN performance_targets pt ON cl.target_id = pt.id
             WHERE cl.commitment_id = ?
             ORDER BY cl.entry_date DESC, cl.id DESC`,
            [req.params.commitmentId]
        );
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.get('/logs/:commitmentId', getCoachingLogs);
router.get('/coaching/logs/:commitmentId', getCoachingLogs);

// ==========================================
// 3. CREATE COACHING LOG
// ==========================================

// POST /api/pm/coaching/logs (or /api/pm/monitoring/logs)
// Accepts file upload under name 'evidence' or 'file'
const createCoachingLog = async (req, res) => {
    try {
        const { commitment_id, target_id, note, entry_date } = req.body;
        const file = req.file;

        if (!commitment_id || !note) {
            return res.status(400).json({ message: "commitment_id and note are required" });
        }

        // Get commitment info to find employee ID
        const [comm] = await db.query('SELECT * FROM performance_commitments WHERE id = ?', [commitment_id]);
        if (comm.length === 0) return res.status(404).json({ message: "Commitment not found" });

        const filePath = file ? `/uploads/pm_movs/${file.filename}` : null;
        const dateVal = entry_date || new Date().toISOString().split('T')[0];

        let authorEmployeeId = req.user.id;
        const [empRows] = await db.query('SELECT id FROM employees WHERE email = ?', [req.user.email]);
        if (empRows.length > 0) {
            authorEmployeeId = empRows[0].id;
        }

        let validatedTargetId = null;
        if (target_id) {
            const [targetCheck] = await db.query('SELECT id FROM performance_targets WHERE id = ?', [target_id]);
            if (targetCheck.length > 0) {
                validatedTargetId = target_id;
            }
        }

        const [result] = await db.query(
            `INSERT INTO coaching_logs (commitment_id, target_id, author_id, entry_date, note, evidence_file_path)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [commitment_id, validatedTargetId, authorEmployeeId, dateVal, note, filePath]
        );

        // Emit Socket.IO event 'coaching:new' to the employee room and broadcast to all connected clients
        const io = req.app.get('socketio');
        if (io) {
            io.to(String(comm[0].employee_id)).emit('coaching:new', {
                log_id: result.insertId,
                commitment_id,
                note
            });
            io.emit('coaching:new', {
                log_id: result.insertId,
                commitment_id,
                note
            });
        }

        res.status(201).json({ 
            success: true, 
            id: result.insertId,
            evidence_file_path: filePath
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.post('/logs', uploadMOV.single('evidence'), createCoachingLog);
router.post('/coaching/logs', uploadMOV.single('evidence'), createCoachingLog);

module.exports = router;
