const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/personnel/schoolsOfficesController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

const auth = [verifyToken, requireRole('admin', 'hr_staff')];

router.get('/',           ...auth, ctrl.getAll);
router.get('/:id',        ...auth, ctrl.getById);
router.post('/',          ...auth, ctrl.create);
router.put('/:id',        ...auth, ctrl.update);
router.patch('/:id/toggle-active', ...auth, ctrl.toggleActive);

module.exports = router;
