const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/deliberationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/ranked-list', ctrl.getRankedList);
router.put('/notes', ctrl.saveNotes);
router.post('/select-awardee', ctrl.selectAwardee);
router.post('/deselect-awardee', ctrl.deselectAwardee);
router.post('/lock-results', ctrl.lockResults);

module.exports = router;
