const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const caController = require('../../controllers/rsp/caController');

const guard = [verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb')];

router.get('/criteria',  ...guard, caController.getCriteria);
router.get('/rankings',  ...guard, caController.getRankings);
router.get('/scores',    ...guard, caController.getScores);
router.put('/score',     ...guard, caController.updateScore);
router.post('/submit',   ...guard, caController.submitAssessment);
router.post('/reset',    ...guard, caController.resetScores);   // clears stale inflated scores

module.exports = router;