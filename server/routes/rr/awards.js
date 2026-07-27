const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/awardController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.get('/my', verifyToken, ctrl.getMyAwards);
router.get('/:id/certificate/download', verifyToken, ctrl.downloadMyCertificate);

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/', ctrl.getAwards);
router.post('/announce', ctrl.announceResults);
router.patch('/:id/mark-awarded', ctrl.markAwarded);
router.post('/:id/generate-certificate', ctrl.generateCertificate);

module.exports = router;
