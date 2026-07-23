const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/authMiddleware');

router.use(verifyToken);

// 1. GET recent notifications log
router.get('/', async (req, res) => {
    try {
        // Fetch recent active submissions that the supervisor needs to inspect
        const [rows] = await db.query(`
            SELECT e.name, i.status, i.submitted_at
            FROM employees e
            JOIN ipcrf i ON e.id = i.employee_id
            WHERE i.status IN ('submitted', 'under_review', 'needs_revision')
            ORDER BY i.submitted_at DESC, i.id DESC
            LIMIT 5
        `);
        
        // Map rows to strings matching the frontend notification templates
        const notifications = rows.map(r => {
            if (r.status === 'needs_revision') {
                return `${r.name}'s IPCRF needs revision`;
            }
            return `${r.name} submitted their IPCRF`;
        });
        
        // Add a fallback if empty
        if (notifications.length === 0) {
            notifications.push("No new submissions received.");
        }
        
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;