const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const adviceController = require('../../controllers/rsp/adviceController');

// BASE PATH: /api/rsp/congratulatory-advice

const guard = [verifyToken, requireRole('admin', 'hr_staff')];

router.get('/eligible-appointees',  ...guard, adviceController.getEligible);
router.get('/:applicantId/pdf',     ...guard, adviceController.generatePDF);   // must be before /:applicantId
router.get('/:applicantId',         ...guard, adviceController.getAdviceDetail);
router.post('/',                    ...guard, adviceController.saveAndGenerate);

module.exports = router;