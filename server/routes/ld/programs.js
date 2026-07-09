const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/ld/programController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const attendanceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/ld/attendance-sheets';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `attendance-${Date.now()}-${file.originalname}`);
    }
});

const certStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/ld/certificates';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `cert-${Date.now()}-${file.originalname}`);
    }
});

const materialStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/ld/materials';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `material-${Date.now()}-${file.originalname}`);
    }
});

const uploadAttendance = multer({ storage: attendanceStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadCert = multer({ storage: certStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadMaterial = multer({ storage: materialStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// Applicant routes — MUST be before /:id to avoid 'my' being matched as an :id param
router.get('/my/list', verifyToken, requireRole('applicant'), ctrl.getMyPrograms);
router.post('/my/:id/acknowledge', verifyToken, requireRole('applicant'), ctrl.acknowledgeParticipation);

// Static sub-paths — must also be before /:id
router.get('/materials/list', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getMaterials);
router.post('/materials/upload', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), uploadMaterial.single('file'), ctrl.uploadMaterial);
router.patch('/attendance/:id', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.markAttendance);
router.post('/attendance/:id/certificate', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), uploadCert.single('file'), ctrl.uploadCertificate);

// Admin CRUD — /:id routes last
router.get('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getPrograms);
router.post('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.createProgram);
router.get('/:id', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.getProgramById);
router.patch('/:id', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.updateProgram);
router.patch('/:id/status', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.updateStatus);
router.post('/:id/attendance-sheet', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), uploadAttendance.single('file'), ctrl.uploadAttendanceSheet);
router.post('/:id/seed-attendance', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.bulkSeedAttendance);

module.exports = router;
