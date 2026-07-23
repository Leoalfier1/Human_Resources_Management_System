const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/authMiddleware');

router.use(verifyToken);

// Expose routes at both root level and sub-path for complete compatibility

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

// GET /api/pm/planning/commitments (or /api/pm/planning)
const getCommitments = async (req, res) => {
    try {
        const { position_type, status, period_id } = req.query;
        const targetPeriodId = await getEffectivePeriodId(period_id);
        
        const { ensureEmployeeCommitmentsAndIpcrf } = require('../../utils/ensureRecords');
        await ensureEmployeeCommitmentsAndIpcrf(targetPeriodId);

        let query = `
            SELECT pc.*, e.name as employee_name, e.position as employee_position, e.unit as employee_unit
            FROM performance_commitments pc
            JOIN employees e ON pc.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];
        
        if (position_type && position_type !== 'all') {
            query += ` AND pc.position_type = ?`;
            params.push(position_type);
        }
        if (status && status !== 'all') {
            query += ` AND pc.status = ?`;
            params.push(status);
        }
        if (targetPeriodId) {
            query += ` AND pc.rating_period_id = ?`;
            params.push(targetPeriodId);
        }

        query += ` ORDER BY e.name ASC`;

        const [commitments] = await db.query(query, params);

        // Fetch targets weight sum for each commitment
        for (let pc of commitments) {
            const [targets] = await db.query(
                `SELECT COALESCE(SUM(weight_percent), 0) as weight_sum FROM performance_targets WHERE commitment_id = ?`,
                [pc.id]
            );
            pc.weight_sum = parseFloat(targets[0].weight_sum);
        }

        res.json(commitments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.get('/', getCommitments);
router.get('/commitments', getCommitments);

// GET /api/pm/planning/commitments/:id/targets (or /api/pm/planning/:id/targets)
const getTargets = async (req, res) => {
    try {
        const [targets] = await db.query(
            `SELECT pt.*, kt.description as kra_description
             FROM performance_targets pt
             LEFT JOIN kra_templates kt ON pt.kra_template_id = kt.id
             WHERE pt.commitment_id = ?`,
            [req.params.id]
        );

        if (targets.length > 0) {
            return res.json(targets);
        }

        const [comm] = await db.query('SELECT employee_id, rating_period_id FROM performance_commitments WHERE id = ?', [req.params.id]);
        if (comm.length === 0) return res.json(targets);

        const [ipcrfRows] = await db.query(
            'SELECT id FROM ipcrf WHERE employee_id = ? AND rating_period_id = ?',
            [comm[0].employee_id, comm[0].rating_period_id]
        );
        if (ipcrfRows.length === 0) return res.json(targets);

        const [objectives] = await db.query(
            `SELECT io.*, k.kra_name, COALESCE(io.weight_percent, k.weight_percent) as weight_percent
             FROM ipcrf_objectives io
             JOIN kra_templates k ON io.kra_template_id = k.id
             WHERE io.ipcrf_id = ?
             ORDER BY io.sequence_no`,
            [ipcrfRows[0].id]
        );

        const fallbackTargets = objectives.map(obj => ({
            id: obj.id,
            commitment_id: req.params.id,
            kra_template_id: obj.kra_template_id,
            kra_category: obj.kra_name || 'Unassigned',
            weight_percent: obj.weight_percent || 0,
            target_description: obj.target_statement || obj.objective_description || '',
            success_indicator: obj.success_indicator || '',
            self_rating: null,
            rater_rating: null,
            final_rating: null
        }));

        res.json(fallbackTargets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.get('/:id/targets', getTargets);
router.get('/commitments/:id/targets', getTargets);

// PUT /api/pm/planning/commitments/:id/return (or /api/pm/planning/:id/return)
const returnCommitment = async (req, res) => {
    try {
        const [comm] = await db.query('SELECT * FROM performance_commitments WHERE id = ?', [req.params.id]);
        if (comm.length === 0) return res.status(404).json({ message: "Commitment not found" });

        await db.query(
            `UPDATE performance_commitments SET status = 'returned' WHERE id = ?`,
            [req.params.id]
        );

        // Emit Socket.IO event 'commitment:returned' to the employee room
        const io = req.app.get('socketio');
        if (io) {
            io.to(String(comm[0].employee_id)).emit('commitment:returned', {
                commitment_id: req.params.id,
                status: 'returned'
            });
            io.emit('notification_received', {
                message: `Commitment for ${comm[0].employee_id} was returned for revision.`,
                type: 'pm_returned'
            });
            io.emit('performance_update', { type: 'commitment_returned', commitment_id: req.params.id });
        }

        res.json({ success: true, status: 'returned' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.put('/:id/return', returnCommitment);
router.put('/commitments/:id/return', returnCommitment);

// PUT /api/pm/planning/commitments/:id/approve (or /api/pm/planning/:id/approve)
const approveCommitment = async (req, res) => {
    try {
        const [comm] = await db.query('SELECT * FROM performance_commitments WHERE id = ?', [req.params.id]);
        if (comm.length === 0) return res.status(404).json({ message: "Commitment not found" });

        await db.query(
            `UPDATE performance_commitments SET status = 'committed', committed_at = NOW() WHERE id = ?`,
            [req.params.id]
        );

        // Emit Socket.IO event 'commitment:approved' to the employee room and broadcast to all connected clients
        const io = req.app.get('socketio');
        if (io) {
            io.to(String(comm[0].employee_id)).emit('commitment:approved', {
                commitment_id: req.params.id,
                status: 'committed'
            });
            io.emit('notification_received', {
                message: `Commitment for commitment ID ${req.params.id} was approved and locked.`,
                type: 'pm_approved'
            });
            io.emit('performance_update', { type: 'commitment_approved', commitment_id: req.params.id });
        }

        res.json({ success: true, status: 'committed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.put('/:id/approve', approveCommitment);
router.put('/commitments/:id/approve', approveCommitment);

// GET /api/pm/planning/stats (or /api/pm/planning/commitments/stats)
const getStats = async (req, res) => {
    try {
        const { period_id } = req.query;
        const targetPeriodId = await getEffectivePeriodId(period_id);
        let query = `
            SELECT 
                pc.position_type,
                SUM(CASE WHEN pc.status = 'draft' THEN 1 ELSE 0 END) as draft_count,
                SUM(CASE WHEN pc.status IN ('submitted', 'under_review') THEN 1 ELSE 0 END) as submitted_count,
                SUM(CASE WHEN pc.status IN ('committed', 'approved', 'finalized') THEN 1 ELSE 0 END) as committed_count,
                COUNT(*) as total_count
            FROM performance_commitments pc
            JOIN employees e ON pc.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];
        if (targetPeriodId) {
            query += ` AND pc.rating_period_id = ? `;
            params.push(targetPeriodId);
        }
        query += ` GROUP BY pc.position_type `;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.get('/stats/summary', getStats);
router.get('/commitments/stats', getStats);

module.exports = router;
