const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/implementationReportController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/:cycleId',                ctrl.getReport);
router.put('/:cycleId',                ctrl.putReport);
router.post('/:cycleId/generate-pdf',  ctrl.postGeneratePDF);
router.patch('/:cycleId/submit',       ctrl.patchSubmit);

module.exports = router;
