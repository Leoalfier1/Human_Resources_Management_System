const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const iesController = require('../../controllers/rsp/iesController');

const guard = [verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb')];

// Queue endpoint (must come before parameterized routes)
router.get('/queue', ...guard, iesController.getQueue);

router.get('/weight-templates/:positionCategory', ...guard, iesController.getWeightTemplates);
router.get('/weight-templates/:positionCategory/:bracketKey', ...guard, iesController.getWeightTemplates);
router.get('/applicant/:applicationId', ...guard, iesController.getByApplication);
router.post('/:applicationId', ...guard, iesController.createEvaluation);
router.put('/:ieId/scores', ...guard, iesController.updateScores);
router.patch('/:ieId/status', ...guard, iesController.updateStatus);
router.get('/:ieId', ...guard, iesController.getEvaluation);
router.get('/:ieId/pdf', ...guard, iesController.generatePDF);

module.exports = router;
