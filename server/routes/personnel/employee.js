const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/employeeController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Employee portal routes
router.get('/my-profile', verifyToken, requireRole('applicant'), ctrl.getMyProfile);
router.post('/request-update', verifyToken, requireRole('applicant'), ctrl.requestProfileUpdate);

// HR admin routes
router.get('/', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getAllEmployees);
router.get('/:id', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getEmployeeById);
router.post('/', verifyToken, requireRole('admin', 'hr_staff'), ctrl.createEmployee);
router.put('/:id', verifyToken, requireRole('admin', 'hr_staff'), ctrl.updateEmployee);
router.patch('/:id/archive', verifyToken, requireRole('admin', 'hr_staff'), ctrl.archiveEmployee);
router.patch('/:id/restore', verifyToken, requireRole('admin', 'hr_staff'), ctrl.restoreEmployee);

module.exports = router;
