const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/validationInterviewController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/nominees', ctrl.getNominees);
router.get('/:nominationId', ctrl.getNominationDetail);
router.put('/:nominationId/scores', ctrl.putScores);
router.put('/:nominationId/notes', ctrl.putNotes);
router.patch('/:nominationId/save', ctrl.patchSave);

module.exports = router;
