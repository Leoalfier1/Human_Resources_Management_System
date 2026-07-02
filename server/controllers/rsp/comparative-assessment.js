const express = require('express');
const router = express.Router();
const { 
    getCriteria, 
    updateScore, 
    getRankings, 
    submitAssessment 
} = require('../../controllers/rsp/caController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Ensure these match the frontend calls
router.get('/criteria', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb'), getCriteria);
router.get('/rankings', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb'), getRankings);
router.put('/score', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb'), updateScore);
router.post('/submit', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb'), submitAssessment);

module.exports = router;