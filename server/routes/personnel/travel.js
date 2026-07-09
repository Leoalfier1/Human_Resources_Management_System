const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/travelController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Employee portal routes
router.get('/my-requests', verifyToken, requireRole('applicant'), ctrl.getMyTravelRequests);
router.post('/', verifyToken, requireRole('applicant'), ctrl.submitTravelRequest);
router.patch('/:id/cancel', verifyToken, requireRole('applicant'), ctrl.cancelTravelRequest);

// HR admin routes
router.get('/all', verifyToken, requireRole('admin', 'hr_staff'), ctrl.getAllTravelRequests);
router.patch('/:id/approve', verifyToken, requireRole('admin', 'hr_staff'), ctrl.approveTravel);
router.patch('/:id/reject', verifyToken, requireRole('admin', 'hr_staff'), ctrl.rejectTravel);

module.exports = router;
