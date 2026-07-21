const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rsp/evaluationController');
const annexE = require('../../controllers/rsp/annexEController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Base route: /api/rsp/evaluation
router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/queue', ctrl.getQueue);
router.get('/applicant/:id', ctrl.getApplicantDetails);
router.patch('/document/:docId/verify', ctrl.verifyDocument);
router.patch('/document/:docId/request-revision', ctrl.requestRevision);
router.patch('/applicant/:id/criterion/:criterionId', ctrl.updateCriterion);
router.patch('/applicant/:id/decision', ctrl.submitDecision);
router.post('/finalize', ctrl.finalizeInitialEvaluation);

// Annex E – Initial Evaluation Result notification letter
router.get('/:applicationId/annex-e/pdf', annexE.generateAnnexEPdf);
router.get('/:applicationId/annex-e', annexE.getAnnexEData);
router.patch('/:applicationId/annex-e/letter-type', annexE.updateLetterType);
router.patch('/:applicationId/annex-e/overrides', annexE.updateLetterOverrides);
router.patch('/:applicationId/annex-e/table-rows', annexE.saveTableRows);
router.delete('/:applicationId/annex-e/table-rows', annexE.clearTableRows);
router.post('/:applicationId/annex-e/send', annexE.sendAnnexEAdvice);

module.exports = router;