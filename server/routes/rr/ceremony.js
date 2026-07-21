const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/ceremonyController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/:cycleId',                  ctrl.getceremony);
router.put('/:cycleId',                  ctrl.putceremony);
router.post('/:cycleId/photos',          ctrl.postPhotos);
router.delete('/photos/:photoId',        ctrl.deletePhoto);
router.patch('/awardee/:nominationId/attendance',  ctrl.patchAttendance);
router.patch('/awardee/:nominationId/certificate',  ctrl.patchCertificate);
router.patch('/awardee/:nominationId/plaque',       ctrl.patchPlaque);

module.exports = router;
