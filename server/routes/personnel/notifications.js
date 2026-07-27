const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/notificationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// All routes require authentication
router.get('/', verifyToken, requireRole('applicant'), ctrl.getMyNotifications);
router.get('/unread-count', verifyToken, requireRole('applicant'), ctrl.getUnreadCount);
router.patch('/:id/read', verifyToken, requireRole('applicant'), ctrl.markAsRead);
router.patch('/read-all', verifyToken, requireRole('applicant'), ctrl.markAllAsRead);

module.exports = router;
