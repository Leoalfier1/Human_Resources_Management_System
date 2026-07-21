const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/preliminaryEvaluationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

const staffRoles = requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority');

router.get('/queue', verifyToken, staffRoles, ctrl.getQueue);
router.get('/award-requirements/:awardTypeId', verifyToken, staffRoles, ctrl.getAwardDocumentRequirements);
router.get('/:nominationId', verifyToken, staffRoles, ctrl.getNominationChecklist);
router.patch('/:nominationId/request-missing-docs', verifyToken, staffRoles, ctrl.requestMissingDocs);
router.patch('/:nominationId/flag', verifyToken, staffRoles, ctrl.flagForReview);

module.exports = router;
