const db = require('../../db');

exports.getPeriods = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM performance_periods ORDER BY start_date DESC');
        res.json(rows);
    } catch (error) {
        console.error('getPeriods Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createPeriod = async (req, res) => {
    try {
        const { school_year, phase, period_label, start_date, end_date, status } = req.body;
        if (!school_year || !phase || !start_date || !end_date) {
            return res.status(400).json({ message: 'school_year, phase, start_date, end_date are required' });
        }
        const [result] = await db.query(
            'INSERT INTO performance_periods (school_year, phase, period_label, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
            [school_year, phase, period_label || null, start_date, end_date, status || 'upcoming']
        );
        await db.query(
            'INSERT INTO activity_log (actor_id, action_description) VALUES (?, ?)',
            [req.user.id, `Performance period created: ${period_label || 'Phase ' + phase} ${school_year}`]
        );
        const io = req.app.get('socketio');
        if (io) io.emit('pm:dashboard:update');
        res.status(201).json({ id: result.insertId, message: 'Period created' });
    } catch (error) {
        console.error('createPeriod Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updatePeriodStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) return res.status(400).json({ message: 'Status is required' });
        await db.query('UPDATE performance_periods SET status = ? WHERE id = ?', [status, id]);
        await db.query(
            'INSERT INTO activity_log (actor_id, action_description) VALUES (?, ?)',
            [req.user.id, `Performance period ${id} status changed to ${status}`]
        );
        const io = req.app.get('socketio');
        if (io) io.emit('pm:dashboard:update');
        res.json({ message: 'Period status updated' });
    } catch (error) {
        console.error('updatePeriodStatus Error:', error);
        res.status(500).json({ message: error.message });
    }
};
