const express = require('express');
const router = express.Router();
const { getApplicants, getSummary, updateStatus, exportCSV } = require('../../controllers/rsp/applicantController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const db = require('../../db');

router.get('/', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), getApplicants);
router.get('/summary', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), getSummary);
router.patch('/:id/status', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), updateStatus);
router.get('/export', verifyToken, requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), exportCSV);

// GET /my-applications
// Fetch current logged in applicant's applications
router.get('/my-applications', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.*, v.position_title, v.assigned_school as school_abbreviation 
             FROM applicants a
             JOIN vacancies v ON a.vacancy_id = v.id
             WHERE a.user_id = ?
             ORDER BY a.date_submitted DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// POST /apply
// Allow applicants to submit application data
router.post('/apply', verifyToken, async (req, res) => {
    try {
        const { vacancy_id, full_name, id_number, criteriaAnswers, documents } = req.body;
        
        // 1. Generate applicant code (e.g. APP-YYYY-001)
        const year = new Date().getFullYear();
        const [rows] = await db.query(
            `SELECT applicant_code FROM applicants WHERE applicant_code LIKE ? ORDER BY id DESC LIMIT 1`,
            [`APP-${year}-%`]
        );
        let nextNum = "001";
        if (rows.length > 0) {
            const lastNum = parseInt(rows[0].applicant_code.split('-')[2]);
            nextNum = String(lastNum + 1).padStart(3, '0');
        }
        const applicantCode = `APP-${year}-${nextNum}`;

        // 2. Insert into applicants table
        const [result] = await db.query(
            `INSERT INTO applicants (applicant_code, full_name, id_number, vacancy_id, user_id, status) VALUES (?, ?, ?, ?, ?, 'submitted')`,
            [applicantCode, full_name, id_number, vacancy_id, req.user.id]
        );
        const applicantId = result.insertId;

        // 3. Insert checklist results
        if (criteriaAnswers && Array.isArray(criteriaAnswers)) {
            for (let ans of criteriaAnswers) {
                // ans is { criterion_id, passed }
                await db.query(
                    `INSERT INTO applicant_qualification_results (applicant_id, criterion_id, passed) VALUES (?, ?, ?)`,
                    [applicantId, ans.criterion_id, ans.passed ? 1 : 0]
                );
            }
        }

        // 4. Insert documents
        if (documents && Array.isArray(documents)) {
            for (let doc of documents) {
                // doc is { document_type, is_required }
                await db.query(
                    `INSERT INTO applicant_documents (applicant_id, document_type, is_required, verification_status) VALUES (?, ?, ?, 'uploaded_pending_review')`,
                    [applicantId, doc.document_type, doc.is_required ? 1 : 0]
                );
            }
        }

        // 5. Log activity
        await db.query(
            `INSERT INTO activity_log (vacancy_id, applicant_id, actor_id, action_description) VALUES (?, ?, ?, ?)`,
            [vacancy_id, applicantId, req.user.id, `Applicant ${full_name} submitted application for vacancy ID ${vacancy_id}`]
        );

        // Notify dashboard
        if (req.app.get('socketio')) {
            req.app.get('socketio').emit('rsp:dashboard:update');
        }

        res.status(201).json({ message: "Application submitted successfully", applicantCode });
    } catch (error) {
        console.error("Apply Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;