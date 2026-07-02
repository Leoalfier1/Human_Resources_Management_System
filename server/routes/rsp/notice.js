const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const { getAppointedList, getNoticeDetails, postNotice, generatePDF } = require('../../controllers/rsp/noticeController');

const guard = [verifyToken, requireRole('admin', 'hr_staff')];

// Order matters: specific routes before param routes
router.get('/vacancy/:vacancyId',       ...guard, getAppointedList);   // list of appointees per vacancy
router.get('/:applicantId/pdf',         ...guard, generatePDF);         // must be before /:applicantId
router.get('/:applicantId',             ...guard, getNoticeDetails);
router.post('/:appointmentId/post',     ...guard, postNotice);

module.exports = router;