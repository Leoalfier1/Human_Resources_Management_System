const express = require('express');
const router = express.Router();
const { getQueue, getApplicantDetails, finalizeDecision } = require('../../controllers/rsp/evaluationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Ensure these match the frontend fetch calls
router.get('/queue', verifyToken, requireRole('admin', 'hr_staff'), getQueue);
router.get('/applicant/:applicantId', verifyToken, requireRole('admin', 'hr_staff'), getApplicantDetails);
router.patch('/applicant/:applicantId/decision', verifyToken, requireRole('admin', 'hr_staff'), finalizeDecision);

// Temporary fix for missing routes in previous step:
const db = require('../../db');
router.patch('/applicant/:applicantId/criterion/:criterionId', verifyToken, async (req, res) => {
    const { applicantId, criterionId } = req.params;
    const { passed } = req.body;
    await db.query(
        'INSERT INTO applicant_qualification_results (applicant_id, criterion_id, passed) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE passed = ?',
        [applicantId, criterionId, passed, passed]
    );
    res.json({ message: "Updated" });
});

router.patch('/document/:documentId/verify', verifyToken, async (req, res) => {
    const { documentId } = req.params;
    await db.query('UPDATE applicant_documents SET verification_status = "verified" WHERE id = ?', [documentId]);
    res.json({ message: "Verified" });
});

module.exports = router;