const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/notificationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// All routes require authentication + admin/hr_staff role
router.use(verifyToken, requireRole('admin', 'hr_staff'));

router.get('/', ctrl.getRspNotifications);
router.get('/unread-count', ctrl.getRspUnreadCount);
router.patch('/:id/read', ctrl.markRspAsRead);
router.patch('/read-all', ctrl.markRspAllAsRead);

module.exports = router;
