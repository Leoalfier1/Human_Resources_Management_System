const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/rr/searchController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

const staffRoles = requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority');

router.get('/', verifyToken, ctrl.getSearches);
router.get('/:id', verifyToken, ctrl.getSearchById);
router.post('/', verifyToken, staffRoles, ctrl.createSearch);
router.patch('/:id', verifyToken, staffRoles, ctrl.updateSearch);
router.patch('/:id/advance', verifyToken, staffRoles, ctrl.advanceStatus);
router.delete('/:id', verifyToken, staffRoles, ctrl.deleteSearch);

module.exports = router;
