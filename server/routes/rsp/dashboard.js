const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const { getDashboardData } = require('../../controllers/rsp/dashboardController');

// GET /api/rsp/dashboard/consolidated
router.get('/consolidated',
    verifyToken,
    requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'),
    getDashboardData
);

module.exports = router;