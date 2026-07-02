const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/applicant/applicationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// All routes require a valid JWT and the 'applicant' role
router.use(verifyToken, requireRole('applicant'));

// ── Core Application Routes ──────────────────────────────────────
router.get('/my-latest',        ctrl.getLatestApplication);   // resolves current app ID
router.post('/',                ctrl.createOrGetDraft);
router.patch('/:id',            ctrl.updateApplication);
router.get('/:id',              ctrl.getApplicationById);
router.get('/:id/status',       ctrl.getApplicationStatus);

// ── Document Upload / Delete ─────────────────────────────────────
// NOTE: uploadDocument runs its own multer instance internally (saves to
// uploads/applications/ with a proper extension) — do NOT also apply multer
// here, or the file gets consumed twice and the saved path won't match
// where the file actually lands on disk.
router.post('/:id/documents',            ctrl.uploadDocument);
router.delete('/:id/documents/:docId',   ctrl.deleteDocument);

// ── Phase 4: Congratulatory Advice & Appointment Documents ───────
const adviceCtrl = require('../../controllers/applicant/adviceController');
router.get('/:id/advice',                adviceCtrl.getAdvice);
router.get('/:id/advice/pdf',            adviceCtrl.getAdvicePDF);
router.post('/:id/appointment-documents', adviceCtrl.uploadAppointmentDocument); // same — multer is internal to the controller
router.get('/:id/appointment', adviceCtrl.getMyAppointment);
router.get('/:id/appointment/pdf', adviceCtrl.getAppointmentPDF);

module.exports = router;