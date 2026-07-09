const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/ld/evaluationController');

// Admin routes
router.post('/forms', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.createEvalForm);
router.post('/forms/:id/activate', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.activateEvalForm);
router.get('/forms/:id', verifyToken, ctrl.getEvalForm);
router.get('/forms/:id/results', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getEvalResults);
router.get('/impact-report', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getLDImpactReport);

// Applicant routes
router.get('/my', verifyToken, requireRole('applicant'), ctrl.getMyEvalForms);
router.post('/submit', verifyToken, requireRole('applicant'), ctrl.submitEvalResponse);

module.exports = router;
