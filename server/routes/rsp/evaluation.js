const express = require('express');
const router = express.Router();
const { getQueue, getApplicantDetails, finalizeDecision } = require('../../controllers/rsp/evaluationController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const db = require('../../db');

router.get('/queue', verifyToken, requireRole('admin', 'hr_staff'), getQueue);
router.get('/applicant/:applicantId', verifyToken, requireRole('admin', 'hr_staff'), getApplicantDetails);
router.patch('/applicant/:applicantId/decision', verifyToken, requireRole('admin', 'hr_staff'), finalizeDecision);

router.patch('/applicant/:applicantId/criterion/:criterionId', verifyToken, async (req, res) => {
    try {
        const { applicantId, criterionId } = req.params;
        const { passed } = req.body;
        await db.query(
            'INSERT INTO applicant_qualification_results (applicant_id, criterion_id, passed) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE passed = ?',
            [applicantId, criterionId, passed, passed]
        );
        res.json({ message: "Updated" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.patch('/document/:documentId/verify', verifyToken, async (req, res) => {
    try {
        const { documentId } = req.params;
        await db.query('UPDATE applicant_documents SET verification_status = "verified" WHERE id = ?', [documentId]);
        res.json({ message: "Verified" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;