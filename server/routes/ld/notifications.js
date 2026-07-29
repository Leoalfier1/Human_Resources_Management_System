const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/authMiddleware');
const db = require('../../db');

// GET /api/ld/notifications — user's own notifications (most recent first)
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM ld_notifications
             WHERE user_id = ?
             ORDER BY is_read ASC, created_at DESC
             LIMIT 50`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/ld/notifications error:', err);
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/ld/notifications/read-all — mark all as read
router.patch('/read-all', verifyToken, async (req, res) => {
    try {
        await db.query(
            `UPDATE ld_notifications SET is_read = 1 WHERE user_id = ?`,
            [req.user.id]
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
        console.error('PATCH /api/ld/notifications/read-all error:', err);
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/ld/notifications/:id/read — mark one as read
router.patch('/:id/read', verifyToken, async (req, res) => {
    try {
        await db.query(
            `UPDATE ld_notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Notification marked as read.' });
    } catch (err) {
        console.error('PATCH /api/ld/notifications/:id/read error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
