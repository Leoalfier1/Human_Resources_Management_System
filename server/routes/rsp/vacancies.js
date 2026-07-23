const express = require('express');
const router = express.Router();
const { getVacancies, createVacancy } = require('../../controllers/rsp/vacancyController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const { uploadMemo } = require('../../middleware/uploadMiddleware');
const db = require('../../db');

router.get('/', verifyToken, getVacancies);
router.post('/', verifyToken, requireRole('admin', 'hr_staff'), uploadMemo.single('division_memorandum'), createVacancy);

// New endpoint to fetch minimum qualifications checklist for a vacancy
router.get('/:id/checklist', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, criterion_label, is_required FROM minimum_qualifications_checklist WHERE vacancy_id = ?',
            [req.params.id]
        );
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;