const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/announcementController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const { uploadMemo } = require('../../middleware/uploadMiddleware');

router.use(verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'));

router.get('/winners',       ctrl.getWinnersPreview);
router.get('/settings',      ctrl.getSettings);
router.put('/:callId/settings', ctrl.putSettings);
router.post('/:callId/memo', uploadMemo.single('memo'), ctrl.postMemo);
router.patch('/:callId/publish', ctrl.patchPublish);

module.exports = router;
