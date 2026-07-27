const express = require('express');
const router = express.Router();
const { getPreview, publishResults } = require('../../controllers/rsp/resultsController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// The path here is just '/preview' because the prefix '/api/rsp/results' 
// is already handled in index.js
router.get('/preview', verifyToken, requireRole('admin', 'hr_staff'), getPreview);
router.post('/publish', verifyToken, requireRole('admin', 'hr_staff'), publishResults);

module.exports = router;