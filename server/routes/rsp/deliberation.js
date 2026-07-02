const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const deliberationController = require('../../controllers/rsp/deliberationController');

router.get('/ranked-list', verifyToken, requireRole('admin', 'hr_staff'), deliberationController.getRankedList);
router.put('/notes', verifyToken, requireRole('admin', 'hr_staff'), deliberationController.updateNotes);
router.put('/recommend', verifyToken, requireRole('admin', 'hr_staff'), deliberationController.toggleRecommend);
router.post('/endorse', verifyToken, requireRole('admin', 'hr_staff'), deliberationController.endorseShortlist);

module.exports = router; // <--- MUST BE THE ROUTER