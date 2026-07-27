const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/evaluationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/workspace', ctrl.getEvaluationWorkspace);
router.get('/criteria', ctrl.getCriteria);
router.get('/scores', ctrl.getScores);
router.get('/scores-summary', ctrl.getScoresSummary);
router.put('/score', ctrl.submitScore);
router.post('/bulk-scores', ctrl.bulkSubmitScores);

module.exports = router;
