const db = require('../../db');
const { findOrCreateEmployee } = require('../../utils/employeeHelper');

exports.getMyNotifications = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.json([]);
        const [rows] = await db.query(
            'SELECT * FROM personnel_notifications WHERE employee_id = ? ORDER BY created_at DESC LIMIT 50',
            [empRow.id]
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
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
        await db.query(
            'UPDATE personnel_notifications SET is_read = 1 WHERE id = ? AND employee_id = ?',
            [id, empRow.id]
        );
        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error('markAsRead Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
        await db.query(
            'UPDATE personnel_notifications SET is_read = 1 WHERE employee_id = ? AND is_read = 0',
            [empRow.id]
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('markAllAsRead Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.json({ count: 0 });
        const [row] = await db.query(
            'SELECT COUNT(*) as count FROM personnel_notifications WHERE employee_id = ? AND is_read = 0',
            [empRow.id]
        );
        res.json({ count: row[0].count });
    } catch (error) {
        console.error('getUnreadCount Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── RSP Admin Notifications (Part 1: qualified-applicant alerts) ──

exports.getRspNotifications = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.json([]);
        const [rows] = await db.query(
            `SELECT pn.*, a.full_name AS applicant_name, v.position_title
             FROM personnel_notifications pn
             LEFT JOIN applications a ON a.id = pn.application_id
             LEFT JOIN vacancies v ON v.id = a.vacancy_id
             WHERE pn.employee_id = ? AND pn.type = 'rsp_qualified'
             ORDER BY pn.created_at DESC LIMIT 20`,
            [empRow.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getRspNotifications Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getRspUnreadCount = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.json({ count: 0 });
        const [row] = await db.query(
            `SELECT COUNT(*) as count FROM personnel_notifications
             WHERE employee_id = ? AND type = 'rsp_qualified' AND is_read = 0`,
            [empRow.id]
        );
        res.json({ count: row[0].count });
    } catch (error) {
        console.error('getRspUnreadCount Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.markRspAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
        await db.query(
            `UPDATE personnel_notifications SET is_read = 1
             WHERE id = ? AND employee_id = ? AND type = 'rsp_qualified'`,
            [id, empRow.id]
        );
        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error('markRspAsRead Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.markRspAllAsRead = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
        await db.query(
            `UPDATE personnel_notifications SET is_read = 1
             WHERE employee_id = ? AND type = 'rsp_qualified' AND is_read = 0`,
            [empRow.id]
        );
        res.json({ message: 'All RSP notifications marked as read.' });
    } catch (error) {
        console.error('markRspAllAsRead Error:', error);
        res.status(500).json({ message: error.message });
    }
};
