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

const proofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/ld/attendance-proofs';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `proof-${Date.now()}-${file.originalname}`);
    }
});
const uploadProof = multer({ storage: proofStorage, limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/my/attendance/submit', verifyToken, requireRole('applicant'), uploadProof.single('proof'), ctrl.submitAttendanceProof);

const reportCtrl = require('../../controllers/ld/reportController');
const staffRoles = ['admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'];

// Admin & Portal aggregated routes — MUST be before generic /:id
router.get('/dashboard-stats', verifyToken, ctrl.getDashboardStats);
router.get('/attendance-monitor', verifyToken, ctrl.getAttendanceMonitorRecords);
router.get('/qa/review', verifyToken, ctrl.getProgramQA);
router.get('/:id/qa', verifyToken, ctrl.getProgramQA);
router.patch('/:id/qa', verifyToken, ctrl.updateProgramQA);
router.get('/conduct/data', verifyToken, ctrl.getConductData);
router.get('/:id/conduct', verifyToken, ctrl.getConductData);

// Static sub-paths & specific /:id/subpath routes — MUST be before generic /:id
router.get('/materials/list', verifyToken, ctrl.getMaterials);
router.post('/materials/upload', verifyToken, requireRole(...staffRoles), uploadMaterial.single('file'), ctrl.uploadMaterial);
router.patch('/attendance/:id', verifyToken, requireRole(...staffRoles), ctrl.markAttendance);
router.post('/attendance/:id/certificate', verifyToken, requireRole(...staffRoles), uploadCert.single('file'), ctrl.uploadCertificate);
router.get('/:id/participants', verifyToken, reportCtrl.getParticipants);

// Employee routes — MUST be before generic /:id
router.get('/my-enrollments', verifyToken, ctrl.getMyEnrollments);
router.get('/:id/eligibility', verifyToken, ctrl.getProgramEligibility);
router.post('/:id/enroll', verifyToken, ctrl.enrollProgram);
router.get('/:id/session-materials', verifyToken, ctrl.getProgramSessionMaterials);
router.post('/:id/checkin', verifyToken, ctrl.checkinSession);
router.post('/:id/checkout', verifyToken, ctrl.checkoutSession);
// Assessment / Test System Routes
router.get('/:id/tests', verifyToken, ctrl.getProgramTests);
router.post('/:id/tests', verifyToken, requireRole(...staffRoles), ctrl.saveProgramTests);
router.get('/:id/my-test-status', verifyToken, ctrl.getMyTestStatus);
router.post('/:id/submit-test', verifyToken, ctrl.submitProgramTest);

// Admin CRUD — /:id routes last
router.get('/', verifyToken, ctrl.getPrograms);
router.post('/', verifyToken, requireRole(...staffRoles), ctrl.createProgram);
router.get('/:id', verifyToken, ctrl.getProgramById);
router.patch('/:id', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.updateProgram);
router.patch('/:id/status', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.updateStatus);
router.post('/:id/submit-qa', verifyToken, requireRole(...staffRoles), ctrl.submitForQA);
router.post('/:id/attendance-sheet', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), uploadAttendance.single('file'), ctrl.uploadAttendanceSheet);
router.delete('/:id', verifyToken, requireRole('admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'), ctrl.deleteProgram);

module.exports = router;
