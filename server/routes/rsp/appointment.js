const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Base route: /api/rsp/[module-name]
router.get('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), (req, res) => {
    res.json({ 
        module: req.baseUrl.split('/').pop(), 
        status: 'Ready',
        authorizedUser: req.user.name 
    });
});

module.exports = router;