const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const resultsController = require('../../controllers/rsp/resultsController');

router.get('/preview', verifyToken, requireRole('admin', 'hr_staff'), resultsController.getPreview);
router.post('/publish', verifyToken, requireRole('admin', 'hr_staff'), resultsController.publishResults);

module.exports = router;