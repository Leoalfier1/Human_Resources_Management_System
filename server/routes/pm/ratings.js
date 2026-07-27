const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/pm/ratingsController');

router.get('/summary', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getRatingsSummary);
router.get('/distribution', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getRatingsDistribution);
router.get('/individual/:userId', verifyToken, ctrl.getIndividualRatings); // self-or-admin check inside controller

module.exports = router;
