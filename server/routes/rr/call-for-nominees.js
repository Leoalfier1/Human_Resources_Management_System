const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/callForNomineesController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

const staffRoles = requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority');

router.get('/award-types', verifyToken, staffRoles, ctrl.getAwardTypes);
router.get('/nomination-calls', verifyToken, staffRoles, ctrl.getNominationCalls);
router.get('/nomination-calls/:callId', verifyToken, staffRoles, ctrl.getNominationCallById);
router.post('/nomination-calls', verifyToken, staffRoles, ctrl.createNominationCall);
router.put('/nomination-calls/:callId', verifyToken, staffRoles, ctrl.updateNominationCall);
router.patch('/nomination-calls/:callId/publish', verifyToken, staffRoles, ctrl.publishNominationCall);

router.get('/nominations', verifyToken, staffRoles, ctrl.getNominations);
router.get('/nominations/:nominationId', verifyToken, staffRoles, ctrl.getNominationById);
router.post('/nominations', verifyToken, staffRoles, ctrl.createNomination);

module.exports = router;
