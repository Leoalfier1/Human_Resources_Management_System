const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/authMiddleware');

router.use(verifyToken);

// ==========================================
// 1. PENDING REVIEWS QUEUE
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

// GET /api/pm/review/pending-count
router.get('/pending-count', async (req, res) => {
    try {
        const { period_id } = req.query;
        const targetPeriodId = await getEffectivePeriodId(period_id);
        const { ensureEmployeeCommitmentsAndIpcrf } = require('../../utils/ensureRecords');
        await ensureEmployeeCommitmentsAndIpcrf(targetPeriodId);

        let query = `
             SELECT COUNT(*) as count 
             FROM performance_commitments pc
             JOIN employees e ON pc.employee_id = e.id
             LEFT JOIN ipcrf i ON pc.employee_id = i.employee_id AND pc.rating_period_id = i.rating_period_id
             WHERE pc.final_rating_submitted_at IS NULL
               AND i.status IN ('submitted', 'under_review', 'needs_revision', 'reviewed')
        `;
        const params = [];
        if (targetPeriodId) {
            query += ` AND pc.rating_period_id = ?`;
            params.push(targetPeriodId);
        }
        
        const [rows] = await db.query(query, params);
        res.json({ count: rows[0].count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pm/review/queue
router.get('/queue', async (req, res) => {
    try {
        const { position_type, period_id, include_id } = req.query;
        const targetPeriodId = await getEffectivePeriodId(period_id);
        
        const { ensureEmployeeCommitmentsAndIpcrf } = require('../../utils/ensureRecords');
        await ensureEmployeeCommitmentsAndIpcrf(targetPeriodId);

        let query = `
            SELECT pc.*, e.name as employee_name, e.position as employee_position, e.unit as employee_unit
            FROM performance_commitments pc
            JOIN employees e ON pc.employee_id = e.id
            LEFT JOIN ipcrf i ON pc.employee_id = i.employee_id AND pc.rating_period_id = i.rating_period_id
            WHERE (
                (pc.final_rating_submitted_at IS NULL AND i.status IN ('submitted', 'under_review', 'needs_revision', 'reviewed'))
        `;
        
        const params = [];
        if (include_id) {
            query += ` OR pc.id = ?`;
            params.push(include_id);
        }
        query += `)`;

        if (position_type && position_type !== 'all') {
            query += ` AND pc.position_type = ?`;
            params.push(position_type);
        }
        if (targetPeriodId) {
            query += ` AND pc.rating_period_id = ?`;
            params.push(targetPeriodId);
        }
        query += ` ORDER BY COALESCE(pc.rater_rating_submitted_at, pc.submitted_at) ASC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pm/review/commitment/:id
router.get('/commitment/:id', async (req, res) => {
    try {
        // Fetch commitment and employee info
        const [commRows] = await db.query(
            `SELECT pc.*, e.name as employee_name, e.position as employee_position, e.unit as employee_unit
             FROM performance_commitments pc
             JOIN employees e ON pc.employee_id = e.id
             WHERE pc.id = ?`,
            [req.params.id]
        );
        if (commRows.length === 0) return res.status(404).json({ message: "Commitment not found" });
        const commitment = commRows[0];



        // Fetch targets
        const [targets] = await db.query(
            `SELECT pt.*, kt.description as kra_description
             FROM performance_targets pt
             LEFT JOIN kra_templates kt ON pt.kra_template_id = kt.id
             WHERE pt.commitment_id = ?`,
            [req.params.id]
        );

        // Expose adjectival bands for display
        const [bands] = await db.query(`SELECT * FROM adjectival_bands ORDER BY sort_order ASC`);

        res.json({ commitment, targets, adjectivalBands: bands });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. SAVE RATING FOR A TARGET
// ==========================================

// PUT /api/pm/review/target/:targetId
router.put('/target/:targetId', async (req, res) => {
    try {
        const { final_rating, rater_rating, self_rating } = req.body;
        
        await db.query(
            `UPDATE performance_targets 
             SET final_rating = ?, rater_rating = COALESCE(?, rater_rating), self_rating = COALESCE(?, self_rating)
             WHERE id = ?`,
            [final_rating, rater_rating, self_rating, req.params.targetId]
        );

        // Find the employee_id from this target's commitment and emit real-time event
        const [targetRows] = await db.query(
            `SELECT pt.commitment_id, pc.employee_id 
             FROM performance_targets pt 
             JOIN performance_commitments pc ON pt.commitment_id = pc.id 
             WHERE pt.id = ?`,
            [req.params.targetId]
        );
        const io = req.app.get('socketio');
        if (io && targetRows.length > 0) {
            const employeeId = targetRows[0].employee_id;
            io.to(String(employeeId)).emit('review:rating_updated', {
                target_id: req.params.targetId,
                final_rating,
                rater_rating,
                self_rating
            });
            io.to(String(employeeId)).emit('performance_update', {
                type: 'rating_updated',
                target_id: req.params.targetId
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. FINALIZE EVALUATION RATINGS
// ==========================================

// PUT /api/pm/review/commitment/:id/review
router.put('/commitment/:id/review', async (req, res) => {
    try {
        const [comm] = await db.query('SELECT employee_id, rating_period_id FROM performance_commitments WHERE id = ?', [req.params.id]);
        if (comm.length > 0) {
            await db.query(
                `UPDATE ipcrf 
                 SET status = 'under_review' 
                 WHERE employee_id = ? AND rating_period_id = ?`,
                [comm[0].employee_id, comm[0].rating_period_id]
            );

            const io = req.app.get('socketio');
            if (io) {
                io.to(String(comm[0].employee_id)).emit('ipcrf:status_changed', {
                    newStatus: 'under_review',
                    commitment_id: req.params.id
                });
                io.emit('performance_update', {
                    type: 'commitment_under_review',
                    commitment_id: req.params.id
                });
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/pm/review/commitment/:id/unlock
router.put('/commitment/:id/unlock', async (req, res) => {
    try {
        await db.query(
            `UPDATE performance_commitments 
             SET final_rating_submitted_at = NULL,
                 status = 'submitted'
             WHERE id = ?`,
            [req.params.id]
        );
        const [comm] = await db.query('SELECT employee_id, rating_period_id FROM performance_commitments WHERE id = ?', [req.params.id]);
        if (comm.length > 0) {
            await db.query(
                `UPDATE ipcrf 
                 SET status = 'under_review' 
                 WHERE employee_id = ? AND rating_period_id = ?`,
                [comm[0].employee_id, comm[0].rating_period_id]
            );
        }
        const io = req.app.get('socketio');
        if (io) {
            io.emit('notification_received', {
                message: `Commitment for commitment ID ${req.params.id} was unlocked.`,
                type: 'pm_unlocked'
            });
            io.emit('performance_update', { type: 'commitment_unlocked', commitment_id: req.params.id });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/pm/review/commitment/:id/finalize
router.put('/commitment/:id/finalize', async (req, res) => {
    try {
        const [comm] = await db.query('SELECT * FROM performance_commitments WHERE id = ?', [req.params.id]);
        if (comm.length === 0) return res.status(404).json({ message: "Commitment not found" });

        const employeeId = comm[0].employee_id;
        const periodId = comm[0].rating_period_id;

        // Calculate overall weighted score directly from employee self-ratings (Rater cannot alter ratee ratings)
        const [ipcrfRows] = await db.query(
            `SELECT i.id FROM ipcrf i WHERE i.employee_id = ? AND i.rating_period_id = ?`,
            [employeeId, periodId]
        );

        let overallWeightedScore = 5.0000;
        let adjectivalRating = 'Outstanding';

        if (ipcrfRows.length > 0) {
            const [objs] = await db.query(
                `SELECT io.weight_percent, io.self_rating,
                        (SELECT osr.average_rating 
                         FROM performance_objectives po 
                         JOIN objective_self_ratings osr ON osr.performance_objective_id = po.id 
                         WHERE po.ipcrf_objective_id = io.id 
                         ORDER BY osr.id DESC LIMIT 1) as computed_self_rating
                 FROM ipcrf_objectives io
                 WHERE io.ipcrf_id = ?`,
                [ipcrfRows[0].id]
            );

            if (objs.length > 0) {
                let totalWeightedSum = 0;
                let totalWeightSum = 0;
                const safeNum = (v) => {
                    const n = parseFloat(v);
                    return (!isNaN(n) && n >= 1 && n <= 5) ? n : 5.0;
                };
                for (let o of objs) {
                    const rating = safeNum(o.computed_self_rating || o.self_rating || 5);
                    const w = parseFloat(o.weight_percent) || (100 / objs.length);
                    totalWeightedSum += (rating * w);
                    totalWeightSum += w;
                }
                overallWeightedScore = totalWeightSum > 0 ? (totalWeightedSum / totalWeightSum) : 5.0000;
            }
        }

        if (overallWeightedScore >= 4.5) adjectivalRating = 'Outstanding';
        else if (overallWeightedScore >= 3.5) adjectivalRating = 'Very Satisfactory';
        else if (overallWeightedScore >= 2.5) adjectivalRating = 'Satisfactory';
        else if (overallWeightedScore >= 1.5) adjectivalRating = 'Unsatisfactory';
        else adjectivalRating = 'Poor';

        const { rater_signature } = req.body;

        // Save evaluation on admin side
        await db.query(
            `UPDATE performance_commitments 
             SET final_rating_submitted_at = NOW(), 
                 overall_weighted_score = ?, 
                 adjectival_rating = ?,
                 status = 'committed',
                 rater_signature = ?
             WHERE id = ?`,
            [overallWeightedScore, adjectivalRating, rater_signature || null, req.params.id]
        );

        // Populate final_rating for all targets if null
        await db.query(
            `UPDATE performance_targets 
             SET final_rating = COALESCE(final_rating, rater_rating, self_rating, 5)
             WHERE commitment_id = ?`,
            [req.params.id]
        );

        // Also update IPCRF record for employee view
        await db.query(
            "UPDATE ipcrf SET status = 'finalized', finalized_at = NOW(), rater_signed = TRUE, weighted_average_rating = ?, rater_signature = ? WHERE employee_id = ? AND rating_period_id = ?",
            [overallWeightedScore, rater_signature || null, employeeId, periodId]
        );

        // Emit real-time WebSocket notifications
        const io = req.app.get('socketio');
        if (io) {
            io.to(String(employeeId)).emit('rating:finalized', { overallWeightedScore, adjectivalRating, rater_signature });
            io.to(String(employeeId)).emit('ipcrf:status_changed', { newStatus: 'finalized', rater_signature });
            io.emit('commitment:approved', { commitment_id: req.params.id, employee_id: employeeId, rater_signature });
            io.emit('performance_update', { employee_id: employeeId, type: 'rating_finalized', rater_signature });
        }

        res.json({ 
            success: true, 
            overall_weighted_score: overallWeightedScore, 
            adjectival_rating: adjectivalRating 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/pm/review/commitment/:id/return
router.put('/commitment/:id/return', async (req, res) => {
    try {
        const { reason } = req.body;
        const [comm] = await db.query('SELECT employee_id, rating_period_id FROM performance_commitments WHERE id = ?', [req.params.id]);
        if (comm.length === 0) return res.status(404).json({ message: "Commitment not found" });

        const employeeId = comm[0].employee_id;
        const periodId = comm[0].rating_period_id;

        await db.query("UPDATE performance_commitments SET status = 'needs_revision', final_rating_submitted_at = NULL WHERE id = ?", [req.params.id]);
        await db.query("UPDATE ipcrf SET status = 'needs_revision', finalized_at = NULL WHERE employee_id = ? AND rating_period_id = ?", [employeeId, periodId]);

        const io = req.app.get('socketio');
        if (io) {
            io.to(String(employeeId)).emit('commitment:returned', { commitment_id: req.params.id, reason });
            io.to(String(employeeId)).emit('ipcrf:status_changed', { newStatus: 'needs_revision' });
            io.emit('performance_update', { type: 'commitment_returned', commitment_id: req.params.id });
        }

        res.json({ success: true, message: "IPCRF returned to employee for revision." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
