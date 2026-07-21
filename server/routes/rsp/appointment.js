const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getProcessingAppointees,
    getDocuments,
    verifyDocument,
    requestRevision,
    uploadDocument,
    issueAppointment
} = require('../../controllers/rsp/appointmentController');

// Multer for HR-side document uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/rsp/appointment-docs';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `APPT-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF and image files are allowed'), false);
    }
});

const guard = [verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority')];

// BASE PATH: /api/rsp/appointment
router.get('/processing',                     ...guard, getProcessingAppointees);
router.get('/documents/:applicantId',         ...guard, getDocuments);
router.patch('/documents/:documentId/verify',   ...guard, verifyDocument);
router.patch('/documents/:documentId/revision', ...guard, requestRevision);
router.post('/documents/:documentId/upload',    ...guard, upload.single('file'), uploadDocument);
router.post('/issue',                         ...guard, issueAppointment);

module.exports = router;