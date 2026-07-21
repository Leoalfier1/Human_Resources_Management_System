const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/leaveController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Employee portal routes
router.get('/my-credits', verifyToken, requireRole('applicant'), ctrl.getMyLeaveCredits);
router.get('/my-applications', verifyToken, requireRole('applicant'), ctrl.getMyLeaveApplications);
router.post('/', verifyToken, requireRole('applicant'), ctrl.submitLeaveApplication);
router.patch('/:id/cancel', verifyToken, requireRole('applicant'), ctrl.cancelLeave);

// HR admin routes — two-level approval chain
router.get('/all', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getAllLeaveApplications);
router.patch('/:id/recommend', verifyToken, requireRole('admin', 'hr_staff'), ctrl.recommendLeave);
router.patch('/:id/final-approve', verifyToken, requireRole('admin', 'hr_staff', 'appointing_authority'), ctrl.finalApproveLeave);
router.patch('/:id/reject', verifyToken, requireRole('admin', 'hr_staff', 'appointing_authority'), ctrl.rejectLeave);
router.get('/report', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getLeaveReport);

module.exports = router;
