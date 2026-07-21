const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/deliberationFinalizationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/nominees', ctrl.getNominees);
router.put('/:nominationId/vote', ctrl.putVote);
router.patch('/finalize', ctrl.patchFinalize);

module.exports = router;
