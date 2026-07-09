const db = require('../../db');

exports.getMyNotifications = async (req, res) => {
    try {
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.json([]);
        const [rows] = await db.query(
            'SELECT * FROM personnel_notifications WHERE employee_id = ? ORDER BY created_at DESC LIMIT 50',
            [emp[0].id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getMyNotifications Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });
        await db.query(
            'UPDATE personnel_notifications SET is_read = 1 WHERE id = ? AND employee_id = ?',
            [id, emp[0].id]
        );
        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error('markAsRead Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });
        await db.query(
            'UPDATE personnel_notifications SET is_read = 1 WHERE employee_id = ? AND is_read = 0',
            [emp[0].id]
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('markAllAsRead Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.json({ count: 0 });
        const [row] = await db.query(
            'SELECT COUNT(*) as count FROM personnel_notifications WHERE employee_id = ? AND is_read = 0',
            [emp[0].id]
        );
        res.json({ count: row[0].count });
    } catch (error) {
        console.error('getUnreadCount Error:', error);
        res.status(500).json({ message: error.message });
    }
};
