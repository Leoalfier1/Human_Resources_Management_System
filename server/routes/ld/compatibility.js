const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const tnaController = require('../../controllers/ld/tnaController');
const evaluationController = require('../../controllers/ld/evaluationController');

router.get('/applicant/dashboard', verifyToken, requireRole('applicant'), async (req, res) => {
    try {
        const userId = req.user.id;
        const applicantType = req.user.applicant_type || 'teaching';

        const [openTnaForms] = await db.query(
            `SELECT f.id, f.title, f.description, f.school_year, f.deadline_date, f.target_position_type, f.status,
                    (SELECT COUNT(*) FROM tna_questions q WHERE q.form_id = f.id) AS question_count
             FROM tna_forms f
             WHERE f.status = 'active' AND (f.target_position_type = 'all' OR f.target_position_type = ?)
             ORDER BY f.created_at DESC`,
            [applicantType]
        );

        const [upcomingTrainings] = await db.query(
            `SELECT p.id, p.title, p.description, p.venue, p.start_date, p.end_date, p.status,
                    a.status AS attendance_status, a.id AS attendance_id
             FROM ld_programs p
             LEFT JOIN ld_attendance a ON a.program_id = p.id AND a.user_id = ?
             WHERE p.status IN ('planned', 'ongoing')
             ORDER BY p.start_date ASC`,
            [userId]
        );

        const [myTrainings] = await db.query(
            `SELECT p.id, p.title, p.description, p.venue, p.start_date, p.end_date, p.status,
                    a.status AS attendance_status, a.id AS attendance_id
             FROM ld_programs p
             JOIN ld_attendance a ON a.program_id = p.id AND a.user_id = ?
             ORDER BY p.start_date DESC`,
            [userId]
        );

        res.json({ openTnaForms, upcomingTrainings, myTrainings });
    } catch (error) {
        console.error('compat applicant dashboard error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/submit-tna', verifyToken, requireRole('applicant'), async (req, res) => {
    try {
        req.body = { form_id: req.body.tna_form_id || req.body.form_id, answers: req.body.answers || [] };
        return tnaController.submitMyResponse(req, res);
    } catch (error) {
        console.error('compat submit-tna error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/my-tna-response', verifyToken, requireRole('applicant'), async (req, res) => {
    try {
        const { tna_form_id } = req.query;
        const userId = req.user.id;
        const [responses] = await db.query('SELECT * FROM tna_responses WHERE form_id = ? AND user_id = ?', [tna_form_id, userId]);
        if (responses.length === 0) return res.json(null);
        const [answers] = await db.query('SELECT * FROM tna_answers WHERE response_id = ?', [responses[0].id]);
        res.json({ ...responses[0], answers });
    } catch (error) {
        console.error('compat my-tna-response error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/register-training', verifyToken, requireRole('applicant'), async (req, res) => {
    try {
        const { training_id } = req.body;
        const userId = req.user.id;
        const [programs] = await db.query('SELECT id FROM ld_programs WHERE id = ?', [training_id]);
        if (programs.length === 0) return res.status(404).json({ message: 'Training/program not found' });
        await db.query('INSERT IGNORE INTO ld_attendance (program_id, user_id, status) VALUES (?, ?, ?)', [programs[0].id, userId, 'absent']);
        res.json({ message: 'Registered successfully', training_id: programs[0].id });
    } catch (error) {
        console.error('compat register-training error:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/evaluations', verifyToken, requireRole('applicant'), async (req, res) => {
    try {
        const { training_id, ...rest } = req.body;
        req.body = {
            eval_form_id: training_id || rest.eval_form_id,
            answers: rest.answers || []
        };
        return evaluationController.submitEvalResponse(req, res);
    } catch (error) {
        console.error('compat evaluations error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
