const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/awardController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.post('/', ctrl.recordCeremony);
router.post('/upload-photos', ctrl.uploadCeremonyPhotos);

module.exports = router;
