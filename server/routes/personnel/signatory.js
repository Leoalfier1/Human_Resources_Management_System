const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/signatoryController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

router.get('/',       verifyToken, requireRole('admin', 'hr_staff'), ctrl.getAll);
router.get('/:id',    verifyToken, requireRole('admin', 'hr_staff'), ctrl.getById);
router.post('/',      verifyToken, requireRole('admin'), ctrl.upload, ctrl.create);
router.put('/:id',    verifyToken, requireRole('admin'), ctrl.upload, ctrl.update);
router.delete('/:id', verifyToken, requireRole('admin'), ctrl.remove);

module.exports = router;
