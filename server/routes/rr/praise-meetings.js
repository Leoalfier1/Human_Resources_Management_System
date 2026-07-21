const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/praiseMeetingController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

const staffRoles = requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority');

router.get('/committee-members', verifyToken, staffRoles, ctrl.getCommitteeMembers);
router.get('/latest', verifyToken, staffRoles, ctrl.getLatestMeeting);
router.put('/:meetingId', verifyToken, staffRoles, ctrl.updateMeeting);
router.patch('/:meetingId/agenda/:itemId', verifyToken, staffRoles, ctrl.toggleAgendaItem);
router.post('/:meetingId/agenda', verifyToken, staffRoles, ctrl.addAgendaItem);
router.patch('/:meetingId/attendance/:committeeMemberId', verifyToken, staffRoles, ctrl.toggleAttendance);
router.patch('/:meetingId/finalize', verifyToken, staffRoles, ctrl.finalizeMeeting);

module.exports = router;
