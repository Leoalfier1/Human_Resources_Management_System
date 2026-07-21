const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rsp/applicantController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Base route: /api/rsp/applicants
router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/export', ctrl.exportApplicants);
router.get('/mqs-criteria', ctrl.getVacancyMqsCriteria);
router.put('/mqs-criteria', ctrl.upsertMqsCriteria);
router.get('/', ctrl.getApplicants);
router.get('/summary', ctrl.getApplicantSummary);
router.patch('/:id/status', ctrl.updateApplicantStatus);

module.exports = router;