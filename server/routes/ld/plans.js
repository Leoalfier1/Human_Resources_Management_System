const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/ld/planController');

router.get('/active', verifyToken, ctrl.getActivePlan);
router.get('/', verifyToken, ctrl.getPlans);
router.get('/:id', verifyToken, ctrl.getPlanById);
router.post('/', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.createPlan);
router.patch('/:id', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.updatePlan);
router.post('/:id/wfp', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.addWFPProgram);
router.delete('/:id/wfp/:progId', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.deleteWFPProgram);
router.post('/:id/submit', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.submitPlan);
router.post('/:id/approve', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.approvePlan);

module.exports = router;
