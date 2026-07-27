const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/pm/coachingController');

router.get('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getCoachingLogs);
router.get('/my', verifyToken, ctrl.getMyCoachingLogs);
router.post('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.createCoachingLog);
router.patch('/:id', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.updateCoachingLog);

module.exports = router;
