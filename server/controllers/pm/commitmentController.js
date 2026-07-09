const db = require('../../db');

function computeAdjectival(num) {
    if (num == null) return null;
    if (num >= 4.5) return 'Outstanding';
    if (num >= 3.5) return 'Very Satisfactory';
    if (num >= 2.5) return 'Satisfactory';
    if (num >= 1.5) return 'Unsatisfactory';
    return 'Poor';
}

const PPST_KRAS = [
    { kra: 'Content Knowledge and Pedagogy', weight: 20 },
    { kra: 'Learning Environment and Diversity of Learners', weight: 20 },
    { kra: 'Curriculum and Planning, Assessment and Reporting', weight: 20 },
    { kra: 'Community Linkages and Professional Development', weight: 20 },
    { kra: 'Plus Factor', weight: 20 },
];

const CSC_KRAS = [
    { kra: 'Core Function 1 – Quality Service Delivery', weight: 25 },
    { kra: 'Core Function 2 – Operational Efficiency', weight: 25 },
    { kra: 'Core Function 3 – Client Satisfaction', weight: 20 },
    { kra: 'Support Function 1 – Documentation & Reporting', weight: 15 },
    { kra: 'Support Function 2 – Team Collaboration', weight: 15 },
];

exports.getMyCommitments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period_id } = req.query;
        let sql = `SELECT c.*, p.school_year, p.period_label, p.phase
                   FROM performance_commitments c
                   JOIN performance_periods p ON c.period_id = p.id
                   WHERE c.user_id = ?`;
        const params = [userId];
        if (period_id) { sql += ' AND c.period_id = ?'; params.push(period_id); }
        sql += ' ORDER BY p.start_date DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('getMyCommitments Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getCommitmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const [commitments] = await db.query(
            'SELECT c.*, u.full_name, u.applicant_type FROM performance_commitments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [id]
        );
        if (commitments.length === 0) return res.status(404).json({ message: 'Commitment not found' });
        const [targets] = await db.query('SELECT * FROM performance_targets WHERE commitment_id = ? ORDER BY id ASC', [id]);
        res.json({ ...commitments[0], targets });
    } catch (error) {
        console.error('getCommitmentById Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllCommitments = async (req, res) => {
    try {
        const { period_id, position_type, status } = req.query;
        let sql = `SELECT c.*, u.full_name, u.applicant_type, p.school_year, p.period_label
                   FROM performance_commitments c
                   JOIN users u ON c.user_id = u.id
                   JOIN performance_periods p ON c.period_id = p.id
                   WHERE 1=1`;
        const params = [];
        if (period_id) { sql += ' AND c.period_id = ?'; params.push(period_id); }
        if (position_type) { sql += ' AND c.position_type = ?'; params.push(position_type); }
        if (status) { sql += ' AND c.status = ?'; params.push(status); }
        sql += ' ORDER BY u.full_name ASC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('getAllCommitments Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createCommitment = async (req, res) => {
    try {
        const { period_id, form_type, position_type } = req.body;
        const userId = req.user.id;
        if (!period_id) return res.status(400).json({ message: 'period_id is required' });
        const [existing] = await db.query(
            'SELECT id FROM performance_commitments WHERE user_id = ? AND period_id = ?', [userId, period_id]
        );
        if (existing.length > 0) {
            return res.json({ id: existing[0].id, message: 'Already exists' });
        }
        const posType = position_type || req.user.applicant_type || 'teaching';
        const formT = form_type || 'ipcrf';
        const [result] = await db.query(
            'INSERT INTO performance_commitments (user_id, period_id, form_type, position_type) VALUES (?, ?, ?, ?)',
            [userId, period_id, formT, posType]
        );
        const commitmentId = result.insertId;
        const template = posType === 'teaching' ? PPST_KRAS : CSC_KRAS;
        const tData = template.map(k => [commitmentId, k.kra, '', '', k.weight, null, null, null, null, null, '', '']);
        await db.query(
            'INSERT INTO performance_targets (commitment_id, kra_label, success_indicator, means_of_verification, weight, q1_rating, q2_rating, q3_rating, q4_rating, average_rating, remarks, mfo_label) VALUES ?',
            [tData]
        );
        const io = req.app.get('socketio');
        if (io) io.emit('pm:dashboard:update');
        res.status(201).json({ id: commitmentId, message: 'Commitment created' });
    } catch (error) {
        console.error('createCommitment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateCommitment = async (req, res) => {
    try {
        const { id } = req.params;
        const { targets, ...fields } = req.body;
        if (Object.keys(fields).length > 0) {
            const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
            const vals = Object.values(fields);
            await db.query(`UPDATE performance_commitments SET ${sets} WHERE id = ?`, [...vals, id]);
        }
        if (targets && Array.isArray(targets)) {
            for (const t of targets) {
                if (t.id) {
                    const q1 = t.q1_rating != null ? parseFloat(t.q1_rating) : null;
                    const q2 = t.q2_rating != null ? parseFloat(t.q2_rating) : null;
                    const q3 = t.q3_rating != null ? parseFloat(t.q3_rating) : null;
                    const q4 = t.q4_rating != null ? parseFloat(t.q4_rating) : null;
                    const ratings = [q1, q2, q3, q4].filter(r => r != null);
                    const avg = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
                    await db.query(
                        `UPDATE performance_targets SET kra_label=?, mfo_label=?, success_indicator=?, weight=?,
                         q1_rating=?, q2_rating=?, q3_rating=?, q4_rating=?, average_rating=?,
                         means_of_verification=?, remarks=? WHERE id=? AND commitment_id=?`,
                        [t.kra_label, t.mfo_label || '', t.success_indicator || '', t.weight || 0,
                         q1, q2, q3, q4, avg ? Math.round(avg * 100) / 100 : null,
                         t.means_of_verification || '', t.remarks || '', t.id, id]
                    );
                }
            }
            const [allTargets] = await db.query('SELECT weight, average_rating FROM performance_targets WHERE commitment_id = ?', [id]);
            const totalWeight = allTargets.reduce((s, t) => s + parseFloat(t.weight || 0), 0);
            const weightedSum = allTargets.reduce((s, t) => s + (parseFloat(t.weight || 0) * (parseFloat(t.average_rating || 0) / 100)), 0);
            const overall = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : null;
            const adj = overall != null ? computeAdjectival(overall) : null;
            await db.query(
                'UPDATE performance_commitments SET overall_rating = ?, adjectival_rating = ? WHERE id = ?',
                [overall != null ? Math.round(overall * 100) / 100 : null, adj, id]
            );
        }
        const io = req.app.get('socketio');
        if (io) io.emit('pm:dashboard:update');
        res.json({ message: 'Commitment updated' });
    } catch (error) {
        console.error('updateCommitment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.submitCommitment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("UPDATE performance_commitments SET status = 'submitted', submitted_at = NOW() WHERE id = ?", [id]);
        await db.query(
            'INSERT INTO activity_log (actor_id, action_description) VALUES (?, ?)',
            [req.user.id, `Performance commitment ${id} submitted for rating`]
        );
        const io = req.app.get('socketio');
        if (io) io.emit('pm:dashboard:update');
        res.json({ message: 'Submitted for rating' });
    } catch (error) {
        console.error('submitCommitment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.rateCommitment = async (req, res) => {
    try {
        const { id } = req.params;
        const { numerical_rating, rater_remarks } = req.body;
        if (numerical_rating == null) return res.status(400).json({ message: 'numerical_rating is required' });
        const num = parseFloat(numerical_rating);
        const adj = computeAdjectival(num);
        await db.query("UPDATE performance_commitments SET status='rated', overall_rating=?, adjectival_rating=?, rated_at=NOW() WHERE id=?", [num, adj, id]);
        await db.query(
            'INSERT INTO performance_ratings (commitment_id, rated_by, numerical_rating, adjectival_rating, rater_remarks) VALUES (?, ?, ?, ?, ?)',
            [id, req.user.id, num, adj, rater_remarks || null]
        );
        const [commitment] = await db.query('SELECT user_id FROM performance_commitments WHERE id = ?', [id]);
        await db.query(
            'INSERT INTO activity_log (actor_id, action_description) VALUES (?, ?)',
            [req.user.id, `Performance commitment ${id} rated ${num} (${adj})`]
        );
        const io = req.app.get('socketio');
        if (io) {
            io.emit('pm:dashboard:update');
            if (commitment[0]) {
                io.emit('notification:admin', { message: `Your IPCRF/OPCRF has been rated`, type: 'pm' });
            }
        }
        res.json({ message: 'Rated successfully', adjectival_rating: adj });
    } catch (error) {
        console.error('rateCommitment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.finalizeCommitment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("UPDATE performance_commitments SET status='finalized', finalized_at=NOW() WHERE id=?", [id]);
        await db.query(
            'INSERT INTO activity_log (actor_id, action_description) VALUES (?, ?)',
            [req.user.id, `Performance commitment ${id} finalized`]
        );
        const [commitment] = await db.query('SELECT user_id FROM performance_commitments WHERE id = ?', [id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('pm:dashboard:update');
            if (commitment[0]) io.emit('notification:admin', { message: 'Your IPCRF/OPCRF has been finalized', type: 'pm' });
        }
        res.json({ message: 'Finalized' });
    } catch (error) {
        console.error('finalizeCommitment Error:', error);
        res.status(500).json({ message: error.message });
    }
};
