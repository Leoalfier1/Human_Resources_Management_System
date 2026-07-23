const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/authMiddleware');

router.use(verifyToken);

// ==========================================
// 1. KRA TEMPLATES CRUD
// ==========================================

// GET /kra-templates
router.get('/kra-templates', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT *, kra_name AS name, weight_percent AS weight FROM kra_templates WHERE is_active = TRUE ORDER BY position_type, sort_order ASC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /kra-templates
router.post('/kra-templates', async (req, res) => {
    const { rating_period_id = 1, kra_name, weight_percent, position_type, category_name, default_weight_percent, description } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO kra_templates (rating_period_id, kra_name, weight_percent, position_type, category_name, default_weight_percent, description, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [rating_period_id, kra_name || category_name, weight_percent || default_weight_percent, position_type, category_name, default_weight_percent, description, true]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /kra-templates/:id
router.put('/kra-templates/:id', async (req, res) => {
    const { kra_name, weight_percent, position_type, category_name, default_weight_percent, description, is_active } = req.body;
    try {
        await db.query(
            `UPDATE kra_templates 
             SET kra_name = ?, weight_percent = ?, position_type = ?, category_name = ?, default_weight_percent = ?, description = ?, is_active = ? 
             WHERE id = ?`,
            [kra_name || category_name, weight_percent || default_weight_percent, position_type, category_name, default_weight_percent, description, is_active === undefined ? true : is_active, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /kra-templates/:id
router.delete('/kra-templates/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM kra_templates WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. RATING PERIODS CRUD
// ==========================================

// GET /rating-periods
router.get('/rating-periods', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM rating_periods ORDER BY school_year DESC, year DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /rating-periods
router.post('/rating-periods', async (req, res) => {
    const { year, cycle, school_year, period_label, start_date, end_date } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO rating_periods (year, cycle, school_year, period_label, start_date, end_date, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [year || 2026, cycle || 'annual', school_year, period_label, start_date, end_date, false]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /rating-periods/:id
router.put('/rating-periods/:id', async (req, res) => {
    const { year, cycle, school_year, period_label, start_date, end_date, is_active } = req.body;
    try {
        if (is_active) {
            // Activate selected, deactivate all others in a transaction
            await db.query('START TRANSACTION');
            await db.query(`UPDATE rating_periods SET is_active = false`);
            await db.query(
                `UPDATE rating_periods 
                 SET year = ?, cycle = ?, school_year = ?, period_label = ?, start_date = ?, end_date = ?, is_active = true 
                 WHERE id = ?`,
                [year || 2026, cycle || 'annual', school_year, period_label, start_date, end_date, req.params.id]
            );
            await db.query('COMMIT');
        } else {
            await db.query(
                `UPDATE rating_periods 
                 SET year = ?, cycle = ?, school_year = ?, period_label = ?, start_date = ?, end_date = ?, is_active = ? 
                 WHERE id = ?`,
                [year || 2026, cycle || 'annual', school_year, period_label, start_date, end_date, is_active, req.params.id]
            );
        }
        res.json({ success: true });
    } catch (err) {
        try { await db.query('ROLLBACK'); } catch(re) {}
        res.status(500).json({ error: err.message });
    }
});

// DELETE /rating-periods/:id
router.delete('/rating-periods/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM rating_periods WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. ADJECTIVAL BANDS CRUD
// ==========================================

// GET /adjectival-bands
router.get('/adjectival-bands', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM adjectival_bands ORDER BY sort_order ASC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /adjectival-bands
router.post('/adjectival-bands', async (req, res) => {
    const { min_score, max_score, label, sort_order } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO adjectival_bands (min_score, max_score, label, sort_order) VALUES (?, ?, ?, ?)`,
            [min_score, max_score, label, sort_order || 0]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /adjectival-bands/:id
router.put('/adjectival-bands/:id', async (req, res) => {
    const { min_score, max_score, label, sort_order } = req.body;
    try {
        await db.query(
            `UPDATE adjectival_bands SET min_score = ?, max_score = ?, label = ?, sort_order = ? WHERE id = ?`,
            [min_score, max_score, label, sort_order || 0, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /adjectival-bands/:id
router.delete('/adjectival-bands/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM adjectival_bands WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. REWARD TYPES CRUD
// ==========================================

// GET /reward-types
router.get('/reward-types', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM reward_types ORDER BY id ASC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /reward-types
router.post('/reward-types', async (req, res) => {
    const { name, description, is_active } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO reward_types (name, description, is_active) VALUES (?, ?, ?)`,
            [name, description, is_active === undefined ? true : is_active]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /reward-types/:id
router.put('/reward-types/:id', async (req, res) => {
    const { name, description, is_active } = req.body;
    try {
        await db.query(
            `UPDATE reward_types SET name = ?, description = ?, is_active = ? WHERE id = ?`,
            [name, description, is_active === undefined ? true : is_active, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /reward-types/:id
router.delete('/reward-types/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM reward_types WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
