const db = require('../../db');

const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

exports.getCoachingLogs = async (req, res) => {
    try {
        const { ratee_id, rater_id, period_id, status } = req.query;
        let sql = `SELECT cl.*, ratee.full_name AS ratee_name, rater.full_name AS rater_name
                   FROM coaching_logs cl
                   JOIN users ratee ON cl.ratee_id = ratee.id
                   JOIN users rater ON cl.rater_id = rater.id
                   WHERE 1=1`;
        const params = [];
        if (ratee_id) { sql += ' AND cl.ratee_id = ?'; params.push(ratee_id); }
        if (rater_id) { sql += ' AND cl.rater_id = ?'; params.push(rater_id); }
        if (period_id) { sql += ' AND cl.period_id = ?'; params.push(period_id); }
        if (status) { sql += ' AND cl.status = ?'; params.push(status); }
        sql += ' ORDER BY cl.coaching_date DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('getCoachingLogs Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyCoachingLogs = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            `SELECT cl.*, rater.full_name AS rater_name
             FROM coaching_logs cl
             JOIN users rater ON cl.rater_id = rater.id
             WHERE cl.ratee_id = ?
             ORDER BY cl.coaching_date DESC`, [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('getMyCoachingLogs Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createCoachingLog = async (req, res) => {
    try {
        const { ratee_id, period_id, coaching_date, observations, agreed_actions, follow_up_date } = req.body;
        if (!ratee_id || !period_id || !coaching_date) {
            return res.status(400).json({ message: 'ratee_id, period_id, coaching_date are required' });
        }
        const [result] = await db.query(
            'INSERT INTO coaching_logs (ratee_id, rater_id, period_id, coaching_date, observations, agreed_actions, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ratee_id, req.user.id, period_id, coaching_date, observations || null, agreed_actions || null, follow_up_date || null]
        );
        await db.query(
            'INSERT INTO activity_log (actor_id, action_description) VALUES (?, ?)',
            [req.user.id, `Coaching log created for user ${ratee_id}`]
        );
        const io = req.app.get('socketio');
        if (io) io.emit('pm:dashboard:update');
        res.status(201).json({ id: result.insertId, message: 'Coaching log created' });
    } catch (error) {
        console.error('createCoachingLog Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateCoachingLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { observations, agreed_actions, follow_up_date, status } = req.body;
        const sets = [];
        const vals = [];
        if (observations !== undefined) { sets.push('observations = ?'); vals.push(observations); }
        if (agreed_actions !== undefined) { sets.push('agreed_actions = ?'); vals.push(agreed_actions); }
        if (follow_up_date !== undefined) { sets.push('follow_up_date = ?'); vals.push(follow_up_date); }
        if (status !== undefined) { sets.push('status = ?'); vals.push(status); }
        if (sets.length === 0) return res.status(400).json({ message: 'No fields to update' });
        vals.push(id);
        await db.query(`UPDATE coaching_logs SET ${sets.join(', ')} WHERE id = ?`, vals);
        const io = req.app.get('socketio');
        if (io) io.emit('pm:dashboard:update');
        res.json({ message: 'Coaching log updated' });
    } catch (error) {
        console.error('updateCoachingLog Error:', error);
        res.status(500).json({ message: error.message });
    }
};
