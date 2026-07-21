const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/employeeController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Employee portal routes
router.get('/my-profile', verifyToken, requireRole('applicant'), ctrl.getMyProfile);
router.post('/my-profile/photo', verifyToken, requireRole('applicant'), ctrl.uploadPhoto, ctrl.uploadMyProfilePhoto);

// Employee change requests
router.post('/change-requests', verifyToken, requireRole('applicant'), ctrl.submitChangeRequest);
router.get('/change-requests/mine', verifyToken, requireRole('applicant'), ctrl.getMyChangeRequests);
router.patch('/change-requests/:id/revoke', verifyToken, requireRole('applicant'), ctrl.revokeChangeRequest);

// HR admin change request review
router.get('/change-requests', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getPendingChangeRequests);
router.patch('/change-requests/:id/review', verifyToken, requireRole('admin', 'hr_staff'), ctrl.reviewChangeRequest);

// HR admin routes
router.get('/', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getAllEmployees);
router.get('/filter-options', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getFilterOptions);
router.get('/:id', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getEmployeeById);
router.post('/', verifyToken, requireRole('admin', 'hr_staff'), ctrl.uploadPhoto, ctrl.createEmployee);
router.put('/:id', verifyToken, requireRole('admin', 'hr_staff'), ctrl.uploadPhoto, ctrl.updateEmployee);
router.patch('/:id/archive', verifyToken, requireRole('admin', 'hr_staff'), ctrl.archiveEmployee);
router.patch('/:id/restore', verifyToken, requireRole('admin', 'hr_staff'), ctrl.restoreEmployee);

module.exports = router;
