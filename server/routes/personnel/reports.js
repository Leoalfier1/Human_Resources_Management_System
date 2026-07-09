const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/reportController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// All report routes are HR admin only
router.get('/summary', verifyToken, requireRole('admin', 'hr_staff'), ctrl.personnelSummary);
router.get('/leave-utilization', verifyToken, requireRole('admin', 'hr_staff'), ctrl.leaveUtilization);
router.get('/employee-movement', verifyToken, requireRole('admin', 'hr_staff'), ctrl.employeeMovement);
router.get('/travel-history', verifyToken, requireRole('admin', 'hr_staff'), ctrl.travelHistory);
router.get('/certificate-requests', verifyToken, requireRole('admin', 'hr_staff'), ctrl.certificateRequests);
router.get('/audit-log', verifyToken, requireRole('admin', 'hr_staff'), ctrl.auditLog);

module.exports = router;
