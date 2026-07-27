const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/pm/rewardsController');

router.get('/', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getRewards);
router.get('/my', verifyToken, ctrl.getMyRewards);
router.post('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.createReward);
router.delete('/:id', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.deleteReward);

module.exports = router;
