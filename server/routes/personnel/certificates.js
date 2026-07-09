const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/certificateController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Employee portal routes
router.get('/my-requests', verifyToken, requireRole('applicant'), ctrl.getMyRequests);
router.post('/', verifyToken, requireRole('applicant'), ctrl.submitRequest);

// HR admin routes
router.get('/all', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getAllRequests);
router.patch('/:id/process', verifyToken, requireRole('admin', 'hr_staff'), ctrl.processRequest);
router.patch('/:id/release', verifyToken, requireRole('admin', 'hr_staff'), ctrl.releaseDocument);

// PDF generation - accessible by both employee and HR
router.get('/:employee_id/service-record', verifyToken, requireRole('admin', 'hr_staff', 'applicant'), ctrl.generateServiceRecord);
router.get('/:employee_id/coe', verifyToken, requireRole('admin', 'hr_staff', 'applicant'), ctrl.generateCOE);

module.exports = router;
