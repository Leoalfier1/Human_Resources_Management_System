const db = require('../../db');

exports.getAwardTypes = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, is_active FROM rr_award_types WHERE is_active = 1 ORDER BY name'
        );
        res.json(rows);
    } catch (err) {
        console.error('❌ GET AWARD TYPES ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch award types' });
    }
};

exports.getNominationCalls = async (req, res) => {
    try {
        const { status } = req.query;
        let sql = `
            SELECT nc.*, at.name AS award_type_name,
                (SELECT COUNT(*) FROM rr_call_nominations WHERE call_id = nc.id) AS nominee_count
            FROM rr_nomination_calls nc
            JOIN rr_award_types at ON at.id = nc.award_type_id
        `;
        const params = [];
        if (status) {
            sql += ' WHERE nc.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY nc.created_at DESC';

        const [rows] = await db.query(sql, params);

        const today = new Date().toISOString().slice(0, 10);
        const enriched = rows.map(r => ({
            ...r,
            computed_status: (r.status === 'published' && r.nomination_closes && r.nomination_closes < today)
                ? 'closed'
                : r.status
        }));

        res.json(enriched);
    } catch (err) {
        console.error('❌ GET NOMINATION CALLS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch nomination calls' });
    }
};

exports.getNominationCallById = async (req, res) => {
    try {
        const { callId } = req.params;
        const [rows] = await db.query(`
            SELECT nc.*, at.name AS award_type_name
            FROM rr_nomination_calls nc
            JOIN rr_award_types at ON at.id = nc.award_type_id
            WHERE nc.id = ?
        `, [callId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Nomination call not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('❌ GET NOMINATION CALL ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch nomination call' });
    }
};

exports.createNominationCall = async (req, res) => {
    try {
        const { awardTypeId, eligibleCategory, nominationOpens, nominationCloses, criteriaSummary } = req.body;

        if (!awardTypeId || !eligibleCategory) {
            return res.status(400).json({ message: 'Award type and eligible category are required' });
        }
        if (nominationOpens && nominationCloses && nominationCloses < nominationOpens) {
            return res.status(400).json({ message: 'Closing date must be after opening date' });
        }

        const [result] = await db.query(`
            INSERT INTO rr_nomination_calls (award_type_id, eligible_category, nomination_opens, nomination_closes, criteria_summary, status)
            VALUES (?, ?, ?, ?, ?, 'draft')
        `, [awardTypeId, eligibleCategory, nominationOpens || null, nominationCloses || null, criteriaSummary || null]);

        res.status(201).json({ message: 'Nomination call created', id: result.insertId });
    } catch (err) {
        console.error('❌ CREATE NOMINATION CALL ERROR:', err);
        res.status(500).json({ message: 'Failed to create nomination call' });
    }
};

exports.updateNominationCall = async (req, res) => {
    try {
        const { callId } = req.params;
        const [rows] = await db.query('SELECT status FROM rr_nomination_calls WHERE id = ?', [callId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Nomination call not found' });
        if (rows[0].status === 'closed') return res.status(403).json({ message: 'Cannot edit a closed call' });

        const fields = [];
        const values = [];
        const allowed = ['award_type_id', 'eligible_category', 'nomination_opens', 'nomination_closes', 'criteria_summary'];
        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }
        if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

        values.push(callId);
        await db.query(`UPDATE rr_nomination_calls SET ${fields.join(', ')} WHERE id = ?`, values);
        res.json({ message: 'Nomination call updated' });
    } catch (err) {
        console.error('❌ UPDATE NOMINATION CALL ERROR:', err);
        res.status(500).json({ message: 'Failed to update nomination call' });
    }
};

exports.publishNominationCall = async (req, res) => {
    try {
        const { callId } = req.params;
        const [rows] = await db.query('SELECT * FROM rr_nomination_calls WHERE id = ?', [callId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Nomination call not found' });

        const call = rows[0];
        if (call.status === 'published') return res.status(400).json({ message: 'Call is already published' });
        if (call.status === 'closed') return res.status(403).json({ message: 'Cannot publish a closed call' });

        const missing = [];
        if (!call.award_type_id) missing.push('award_type');
        if (!call.eligible_category) missing.push('eligible_category');
        if (!call.nomination_opens) missing.push('nomination_opens');
        if (!call.nomination_closes) missing.push('nomination_closes');
        if (missing.length > 0) {
            return res.status(422).json({ message: 'Missing required fields', missing });
        }

        await db.query(`
            UPDATE rr_nomination_calls
            SET status = 'published', published_at = NOW(), published_by = ?
            WHERE id = ?
        `, [req.user.id, callId]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:call-published', { callId });
            io.emit('rr:dashboard:update');
        }

        res.json({ message: 'Call published successfully' });
    } catch (err) {
        console.error('❌ PUBLISH NOMINATION CALL ERROR:', err);
        res.status(500).json({ message: 'Failed to publish nomination call' });
    }
};

exports.getNominations = async (req, res) => {
    try {
        const { category } = req.query;
        let sql = `
            SELECT n.*, nc.status AS call_status, at.name AS award_type_name,
                   u1.full_name AS nominee_user_name,
                   u2.full_name AS nominated_by_user_name
            FROM rr_call_nominations n
            JOIN rr_nomination_calls nc ON nc.id = n.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            LEFT JOIN users u1 ON u1.id = n.nominee_user_id
            LEFT JOIN users u2 ON u2.id = n.nominated_by_user_id
        `;
        const params = [];
        if (category && category !== 'all') {
            sql += ' WHERE n.nominee_category = ?';
            params.push(category);
        }
        sql += ' ORDER BY n.submitted_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('❌ GET NOMINATIONS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch nominations' });
    }
};

exports.createNomination = async (req, res) => {
    try {
        const { callId, nomineeUserId, nomineeName, nomineeCategory, nominatedByLabel, nominatedByUserId } = req.body;

        if (!callId || !nomineeName || !nomineeCategory) {
            return res.status(400).json({ message: 'Call ID, nominee name, and category are required' });
        }

        const [result] = await db.query(`
            INSERT INTO rr_call_nominations (call_id, nominee_user_id, nominee_name, nominee_category, nominated_by_label, nominated_by_user_id, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [callId, nomineeUserId || null, nomineeName, nomineeCategory, nominatedByLabel || null, nominatedByUserId || null]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:nomination-received', { nominationId: result.insertId, callId });
            io.emit('rr:dashboard:update');
        }

        res.status(201).json({ message: 'Nomination submitted', id: result.insertId });
    } catch (err) {
        console.error('❌ CREATE NOMINATION ERROR:', err);
        res.status(500).json({ message: 'Failed to create nomination' });
    }
};

exports.getNominationById = async (req, res) => {
    try {
        const { nominationId } = req.params;
        const [rows] = await db.query(`
            SELECT n.*, nc.status AS call_status, at.name AS award_type_name,
                   u1.full_name AS nominee_user_name,
                   u2.full_name AS nominated_by_user_name
            FROM rr_call_nominations n
            JOIN rr_nomination_calls nc ON nc.id = n.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            LEFT JOIN users u1 ON u1.id = n.nominee_user_id
            LEFT JOIN users u2 ON u2.id = n.nominated_by_user_id
            WHERE n.id = ?
        `, [nominationId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Nomination not found' });

        const [docs] = await db.query(
            'SELECT * FROM rr_call_nomination_documents WHERE nomination_id = ?', [nominationId]
        );

        res.json({ ...rows[0], documents: docs });
    } catch (err) {
        console.error('❌ GET NOMINATION ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch nomination' });
    }
};
