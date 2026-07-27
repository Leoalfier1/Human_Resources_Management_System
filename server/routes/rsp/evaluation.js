const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rsp/evaluationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Base route: /api/rsp/evaluation
router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/queue', ctrl.getQueue);
router.get('/applicant/:id', ctrl.getApplicantDetails);
router.patch('/document/:docId/verify', ctrl.verifyDocument);
router.patch('/applicant/:id/criterion/:criterionId', ctrl.updateCriterion);
router.post('/applicant/:id/decision', ctrl.submitDecision);
router.post('/finalize', ctrl.finalizeInitialEvaluation);

module.exports = router;