const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rsp/appealsController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb'));

router.get('/', ctrl.getPendingAppeals);
router.patch('/:id/respond', ctrl.respondToAppeal);

module.exports = router;
