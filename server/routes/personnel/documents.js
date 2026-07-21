const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/documentsController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Employee portal routes
router.get('/my-documents', verifyToken, requireRole('applicant'), ctrl.getMyDocuments);
router.post('/my-documents/upload', verifyToken, requireRole('applicant'), ctrl.uploadMyDocument);

// HR admin routes
router.get('/201-summary', verifyToken, requireRole('admin', 'hr_staff'), ctrl.get201Summary);
router.get('/', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getAllEmployeeDocuments);
router.patch('/:id/verify', verifyToken, requireRole('admin', 'hr_staff'), ctrl.verifyDocument);
router.patch('/:id/reject', verifyToken, requireRole('admin', 'hr_staff'), ctrl.rejectDocument);
router.post('/upload', verifyToken, requireRole('admin', 'hr_staff'), ctrl.uploadHRDocument);

module.exports = router;
