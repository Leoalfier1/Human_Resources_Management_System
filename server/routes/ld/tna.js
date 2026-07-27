const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/ld/tnaController');

const staffRoles = ['admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'];

// 1. Applicant / Employee self-assessment routes — MUST be before /:id routes
router.get('/my-esat', verifyToken, ctrl.getMyESAT);
router.post('/my-esat', verifyToken, ctrl.saveMyESAT);
router.get('/my-ipcrf', verifyToken, ctrl.getMyIPCRF);
router.get('/my-idp', verifyToken, ctrl.getMyIDP);
router.post('/my-idp', verifyToken, ctrl.saveMyIDP);

router.get('/my/list', verifyToken, requireRole('applicant'), ctrl.getMyTNA);
router.patch('/my/save', verifyToken, requireRole('applicant'), ctrl.saveMyResponse);
router.post('/my/submit', verifyToken, requireRole('applicant'), ctrl.submitMyResponse);
router.get('/my/:id', verifyToken, requireRole('applicant'), ctrl.getMyTNAForm);

// 2. Admin static & summary routes — MUST be before /:id routes
router.get('/summary', verifyToken, ctrl.getTNASummary);
router.get('/', verifyToken, requireRole(...staffRoles), ctrl.getForms);
router.post('/', verifyToken, requireRole(...staffRoles), ctrl.createForm);

// 3. Admin parameterized /:id routes — MUST be last
router.get('/:id', verifyToken, requireRole(...staffRoles), ctrl.getFormById);
router.patch('/:id', verifyToken, requireRole(...staffRoles), ctrl.updateForm);
router.post('/:id/activate', verifyToken, requireRole(...staffRoles), ctrl.activateForm);
router.post('/:id/close', verifyToken, requireRole(...staffRoles), ctrl.closeForm);
router.get('/:id/results', verifyToken, requireRole(...staffRoles), ctrl.getTNAResults);
router.get('/:id/export', verifyToken, requireRole(...staffRoles), ctrl.exportTNAReport);

module.exports = router;
