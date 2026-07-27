const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/pm/commitmentController');

router.get('/my', verifyToken, ctrl.getMyCommitments);
router.get('/all', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getAllCommitments);
router.get('/:id', verifyToken, ctrl.getCommitmentById);
router.post('/', verifyToken, ctrl.createCommitment);
router.patch('/:id', verifyToken, ctrl.updateCommitment);
router.post('/:id/submit', verifyToken, ctrl.submitCommitment);
router.post('/:id/rate', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.rateCommitment);
router.post('/:id/finalize', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.finalizeCommitment);

module.exports = router;
