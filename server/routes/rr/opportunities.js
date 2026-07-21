const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/opportunitiesController');
const { verifyToken } = require('../../middleware/authMiddleware');

router.get('/cycle-info', verifyToken, ctrl.getCycleInfo);
router.get('/', verifyToken, ctrl.getOpportunities);

module.exports = router;
