const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/nominationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.post('/can-nominate', verifyToken, ctrl.canNominate);
router.get('/my', verifyToken, ctrl.getMyNominations);
router.post('/', verifyToken, ctrl.createNomination);
router.post('/:id/upload', verifyToken, ctrl.uploadNominationDocument);

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/', ctrl.getNominations);
router.get('/:id', ctrl.getNominationById);
router.patch('/:id/eligibility', ctrl.updateEligibility);

module.exports = router;
