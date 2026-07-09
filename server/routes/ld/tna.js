const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/ld/tnaController');

// Admin routes
router.get('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getForms);
router.get('/:id', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getFormById);
router.post('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.createForm);
router.patch('/:id', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.updateForm);
router.post('/:id/activate', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.activateForm);
router.post('/:id/close', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.closeForm);
router.get('/:id/results', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getTNAResults);
router.get('/:id/export', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.exportTNAReport);

// Applicant routes
router.get('/my/list', verifyToken, requireRole('applicant'), ctrl.getMyTNA);
router.get('/my/:id', verifyToken, requireRole('applicant'), ctrl.getMyTNAForm);
router.patch('/my/save', verifyToken, requireRole('applicant'), ctrl.saveMyResponse);
router.post('/my/submit', verifyToken, requireRole('applicant'), ctrl.submitMyResponse);

module.exports = router;
