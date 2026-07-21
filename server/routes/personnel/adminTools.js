const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/adminToolsController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.get('/stats',            verifyToken, requireRole('admin', 'hr_staff'), ctrl.adminStats);
router.post('/accrue',          verifyToken, requireRole('admin'), ctrl.accrueLeaveCredits);
router.post('/year-end-lock',   verifyToken, requireRole('admin'), ctrl.yearEndLock);
router.post('/backup',          verifyToken, requireRole('admin'), ctrl.dbBackup);
router.get('/backups',          verifyToken, requireRole('admin'), ctrl.listBackups);
router.post('/reset-balances',  verifyToken, requireRole('admin'), ctrl.resetBalances);
router.get('/export/leave-applications', verifyToken, requireRole('admin', 'hr_staff'), ctrl.exportLeaveApplications);
router.get('/export/leave-credits',      verifyToken, requireRole('admin', 'hr_staff'), ctrl.exportLeaveCredits);

module.exports = router;
