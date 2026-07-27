const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/pm/periodController');

router.get('/', verifyToken, ctrl.getPeriods);
router.post('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.createPeriod);
router.patch('/:id', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.updatePeriodStatus);

module.exports = router;
