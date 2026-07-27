const db = require('../../db');

exports.getRewards = async (req, res) => {
    try {
        const { period_id } = req.query;
        let sql = `SELECT r.*, u.full_name, u.applicant_type
                   FROM rewards_recognition r
                   JOIN users u ON r.user_id = u.id
                   WHERE 1=1`;
        const params = [];
        if (period_id) { sql += ' AND r.period_id = ?'; params.push(period_id); }
        sql += ' ORDER BY r.awarded_at DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('getRewards Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyRewards = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.*, p.school_year, p.period_label
             FROM rewards_recognition r
             JOIN performance_periods p ON r.period_id = p.id
             WHERE r.user_id = ?
             ORDER BY r.awarded_at DESC`, [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getMyRewards Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createReward = async (req, res) => {
    try {
        const { user_id, period_id, award_type, award_level, description, awarded_at } = req.body;
        if (!user_id || !period_id || !award_type) {
            return res.status(400).json({ message: 'user_id, period_id, award_type are required' });
        }
        const [result] = await db.query(
            'INSERT INTO rewards_recognition (user_id, period_id, award_type, award_level, description, awarded_at) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, period_id, award_type, award_level || 'division', description || null, awarded_at || null]
        );
        await db.query(
            'INSERT INTO activity_log (actor_id, action_description) VALUES (?, ?)',
            [req.user.id, `Reward "${award_type}" awarded to user ${user_id}`]
        );
        const io = req.app.get('socketio');
        if (io) io.emit('pm:dashboard:update');
        res.status(201).json({ id: result.insertId, message: 'Reward created' });
    } catch (error) {
        console.error('createReward Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteReward = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM rewards_recognition WHERE id = ?', [id]);
        const io = req.app.get('socketio');
        if (io) io.emit('pm:dashboard:update');
        res.json({ message: 'Reward deleted' });
    } catch (error) {
        console.error('deleteReward Error:', error);
        res.status(500).json({ message: error.message });
    }
};
