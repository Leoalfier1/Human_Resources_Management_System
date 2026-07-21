const db = require('../../db');

/**
 * GET /api/rr/validation/nominees?category={teaching|teaching_related|non_teaching}
 * Returns nominees who have advanced past Preliminary Evaluation for the given category.
 */
exports.getNominees = async (req, res) => {
    try {
        const { category } = req.query;
        let sql = `
            SELECT
                cn.id AS nomination_id,
                cn.nominee_name,
                cn.nominee_category,
                nc.eligible_category,
                at.id AS award_type_id,
                at.name AS award_type_name,
                vi.status AS validation_status,
                vi.weighted_total
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON nc.id = cn.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            LEFT JOIN rr_validation_interviews vi ON vi.nomination_id = cn.id
            WHERE cn.status = 'advanced'
        `;
        const params = [];
        if (category && category !== 'all') {
            sql += ' AND cn.nominee_category = ?';
            params.push(category);
        }
        sql += ' ORDER BY cn.submitted_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('❌ GET VALIDATION NOMINEES ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch validation nominees' });
    }
};

/**
 * GET /api/rr/validation/:nominationId
 * Returns nominee info, criteria list with weights + current scores, interview notes.
 */
exports.getNominationDetail = async (req, res) => {
    try {
        const { nominationId } = req.params;

        const [nomRows] = await db.query(`
            SELECT cn.id, cn.nominee_name, cn.nominee_category,
                   at.id AS award_type_id, at.name AS award_type_name
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON nc.id = cn.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            WHERE cn.id = ?
        `, [nominationId]);

        if (nomRows.length === 0) {
            return res.status(404).json({ message: 'Nomination not found' });
        }

        const nomination = nomRows[0];

        const [criteria] = await db.query(`
            SELECT rc.id, rc.criterion_label, rc.weight_percent, rc.max_raw_score, rc.display_order
            FROM rr_validation_criteria rc
            WHERE rc.award_type_id = ?
            ORDER BY rc.display_order ASC
        `, [nomination.award_type_id]);

        const [scores] = await db.query(`
            SELECT vs.criterion_id, vs.raw_score, vs.scored_by, vs.updated_at
            FROM rr_validation_scores vs
            WHERE vs.nomination_id = ?
        `, [nominationId]);

        const scoreMap = {};
        for (const s of scores) {
            scoreMap[s.criterion_id] = {
                raw_score: s.raw_score !== null ? Number(s.raw_score) : null,
                scored_by: s.scored_by,
                updated_at: s.updated_at
            };
        }

        const criteriaWithScores = criteria.map(c => {
            const s = scoreMap[c.id] || {};
            const rawScore = s.raw_score !== undefined ? s.raw_score : null;
            const maxRaw = Number(c.max_raw_score);
            const weight = Number(c.weight_percent);
            const weightedContribution = rawScore !== null && rawScore !== undefined
                ? Math.round((rawScore / maxRaw) * weight * 100) / 100
                : 0;

            return {
                id: c.id,
                criterion_label: c.criterion_label,
                weight_percent: weight,
                max_raw_score: maxRaw,
                display_order: c.display_order,
                raw_score: rawScore,
                weighted_contribution: weightedContribution
            };
        });

        const weightedTotal = criteriaWithScores.reduce((sum, c) => sum + c.weighted_contribution, 0);

        const [interviewRows] = await db.query(`
            SELECT interview_notes, weighted_total, status, last_saved_at, last_saved_by
            FROM rr_validation_interviews
            WHERE nomination_id = ?
        `, [nominationId]);

        const interview = interviewRows[0] || null;

        res.json({
            nomination: {
                id: nomination.id,
                nominee_name: nomination.nominee_name,
                nominee_category: nomination.nominee_category,
                award_type_id: nomination.award_type_id,
                award_type_name: nomination.award_type_name
            },
            criteria: criteriaWithScores,
            server_weighted_total: interview ? Number(interview.weighted_total) : weightedTotal,
            interview_notes: interview?.interview_notes || '',
            status: interview?.status || 'in_progress',
            last_saved_at: interview?.last_saved_at || null
        });
    } catch (err) {
        console.error('❌ GET VALIDATION DETAIL ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch validation detail' });
    }
};

/**
 * Internal: recompute weighted_total for a nomination and upsert the cache.
 */
async function recomputeWeightedTotal(nominationId) {
    const [rows] = await db.query(`
        SELECT vs.raw_score, rc.max_raw_score, rc.weight_percent
        FROM rr_validation_scores vs
        JOIN rr_validation_criteria rc ON vs.criterion_id = rc.id
        WHERE vs.nomination_id = ?
    `, [nominationId]);

    let total = 0;
    for (const r of rows) {
        if (r.raw_score !== null) {
            total += (Number(r.raw_score) / Number(r.max_raw_score)) * Number(r.weight_percent);
        }
    }
    total = Math.round(total * 100) / 100;

    await db.query(`
        INSERT INTO rr_validation_interviews (nomination_id, weighted_total, status)
        VALUES (?, ?, 'in_progress')
        ON DUPLICATE KEY UPDATE weighted_total = VALUES(weighted_total)
    `, [nominationId, total]);

    return total;
}

/**
 * PUT /api/rr/validation/:nominationId/scores
 * Body: { scores: [{ criterionId, rawScore }] }
 * Bulk upserts scores, recomputes weighted_total server-side.
 */
exports.putScores = async (req, res) => {
    try {
        const { nominationId } = req.params;
        const { scores } = req.body;

        if (!Array.isArray(scores) || scores.length === 0) {
            return res.status(400).json({ message: 'scores array is required' });
        }

        for (const item of scores) {
            await db.query(`
                INSERT INTO rr_validation_scores (nomination_id, criterion_id, raw_score, scored_by)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE raw_score = VALUES(raw_score), scored_by = VALUES(scored_by)
            `, [nominationId, item.criterionId, item.rawScore, req.user.id]);
        }

        const weightedTotal = await recomputeWeightedTotal(nominationId);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:validation-scored', { nominationId, weightedTotal });
        }

        res.json({ weighted_total: weightedTotal });
    } catch (err) {
        console.error('❌ PUT VALIDATION SCORES ERROR:', err);
        res.status(500).json({ message: 'Failed to save scores' });
    }
};

/**
 * PUT /api/rr/validation/:nominationId/notes
 * Body: { interviewNotes }
 * Updates interview notes with debounced auto-save.
 */
exports.putNotes = async (req, res) => {
    try {
        const { nominationId } = req.params;
        const { interviewNotes } = req.body;

        await db.query(`
            INSERT INTO rr_validation_interviews (nomination_id, interview_notes, status)
            VALUES (?, ?, 'in_progress')
            ON DUPLICATE KEY UPDATE interview_notes = VALUES(interview_notes)
        `, [nominationId, interviewNotes || '']);

        res.json({ message: 'Notes saved' });
    } catch (err) {
        console.error('❌ PUT VALIDATION NOTES ERROR:', err);
        res.status(500).json({ message: 'Failed to save notes' });
    }
};

/**
 * PATCH /api/rr/validation/:nominationId/save
 * Marks validation as saved (explicit checkpoint).
 * Emits Socket.IO event for Deliberation stage.
 */
exports.patchSave = async (req, res) => {
    try {
        const { nominationId } = req.params;

        const weightedTotal = await recomputeWeightedTotal(nominationId);

        await db.query(`
            INSERT INTO rr_validation_interviews (nomination_id, weighted_total, status, last_saved_at, last_saved_by)
            VALUES (?, ?, 'saved', NOW(), ?)
            ON DUPLICATE KEY UPDATE
                weighted_total = VALUES(weighted_total),
                status = 'saved',
                last_saved_at = NOW(),
                last_saved_by = VALUES(last_saved_by)
        `, [nominationId, weightedTotal, req.user.id]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:validation-saved', { nominationId, weightedTotal });
            io.emit('rr:dashboard:update');
        }

        res.json({ message: 'Evaluation saved', weighted_total: weightedTotal });
    } catch (err) {
        console.error('❌ PATCH VALIDATION SAVE ERROR:', err);
        res.status(500).json({ message: 'Failed to save evaluation' });
    }
};
