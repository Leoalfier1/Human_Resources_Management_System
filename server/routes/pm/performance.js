const express = require('express');
const router = express.Router();
const performanceController = require('../../controllers/pm/performanceController');
const { verifyToken } = require('../../middleware/authMiddleware');

// Protect all routes under this module
router.use(verifyToken);

// Supervisor Endpoints
router.get('/supervisor/employees', performanceController.getAssignedEmployees);
router.get('/active-period', performanceController.getActivePeriodAndCriteria);
router.get('/evaluation/:employeeId', performanceController.getEvaluationDetails);
router.post('/evaluation', performanceController.saveOrSubmitEvaluation);

// Employee Endpoints
router.get('/history', performanceController.getPerformanceHistory);
router.get('/evaluation/details/:evaluationId', performanceController.getEvaluationDetailsById);
router.post('/evaluation/:evaluationId/acknowledge', performanceController.acknowledgeEvaluation);

module.exports = router;
