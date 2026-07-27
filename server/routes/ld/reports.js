const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/ld/reportController');

const staffRoles = ['admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'];

// Employee routes — before /:id routes
router.get('/my-records', verifyToken, ctrl.getMyRecords);
router.get('/employee/training-records', verifyToken, ctrl.getMyTrainingRecords);

// Admin & Shared Read routes
router.get('/archive/completed-programs', verifyToken, ctrl.getCompletedProgramsArchive);
router.get('/completed-programs',          verifyToken, ctrl.getCompletedPrograms);
router.post('/programs/:id/completion-report', verifyToken, requireRole(...staffRoles), ctrl.submitCompletionReport);
router.get('/programs/:id/completion-report',  verifyToken, requireRole(...staffRoles), ctrl.getCompletionReport);
router.get('/programs/:id/me-summary',         verifyToken, requireRole(...staffRoles), ctrl.getMESummary);
router.put('/programs/:id/me-summary',         verifyToken, requireRole(...staffRoles), ctrl.saveMESummary);
router.get('/programs/:id/me-summary/export',  verifyToken, requireRole(...staffRoles), ctrl.exportMESummaryPDF);

// Feature 3: Participants view per program
router.get('/programs/:id/participants', verifyToken, ctrl.getParticipants);
router.get('/:id/participants',          verifyToken, ctrl.getParticipants);

// Feature 4: Attendance export as DOCX or PDF
router.get('/attendance/export', verifyToken, requireRole(...staffRoles), ctrl.exportAttendance);

module.exports = router;

