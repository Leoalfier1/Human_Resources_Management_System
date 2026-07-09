const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rsp/eligibilityController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb'));

router.get('/', ctrl.getEligibilityList);
router.patch('/:id/remarks', ctrl.updateRemarks);
router.get('/export-csv', ctrl.exportCSV);

module.exports = router;
