const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/reportController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.get('/dashboard-stats', verifyToken, ctrl.getDashboardStats);

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.post('/generate', ctrl.generateReport);
router.get('/:searchId', ctrl.getReport);
router.get('/:searchId/export-csv', ctrl.exportReportCSV);

module.exports = router;
