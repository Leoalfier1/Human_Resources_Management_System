const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/rsp/caWorkspaceController');

const guard = [verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb')];

router.get('/:vacancyId',           ...guard, ctrl.getWorkspace);
router.put('/:vacancyId/scores',    ...guard, ctrl.bulkUpsertScores);
router.post('/:vacancyId/submit',   ...guard, ctrl.submitToHRMPSB);
router.get('/:vacancyId/export',    ...guard, ctrl.getExportCSV);

module.exports = router;
