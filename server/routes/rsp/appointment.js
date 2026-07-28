const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const {
    getProcessingAppointees,
    issueAppointment
} = require('../../controllers/rsp/appointmentController');

const guard = [verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority')];

// BASE PATH: /api/rsp/appointment
router.get('/processing',                     ...guard, getProcessingAppointees);
router.post('/issue',                         ...guard, issueAppointment);

module.exports = router;
