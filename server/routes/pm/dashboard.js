const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/authMiddleware');

router.use(verifyToken);

const getSchoolUnits = (schoolOrCategory) => {
    if (!schoolOrCategory) return [];
    
    if (schoolOrCategory === 'category:Elementary') {
        return [
            'Dapitan City Central School', 'Ma. Cristina ES', 'Capucao Primary School', 'Dapitan City Experimental ES', 'Lawaan ES', 'Polo ES', 'Sinonoc ES', 'Talisay ES',
            'Baylimango Central School', 'Carang ES', 'Banbanan ES', 'Canlucani ES', 'Kauswagan ES', 'Napo ES', 'Bacong ES', 'Oro ES', 'Guimputlan ES', 'Sto. Niño ES', 'Taguilon ES', 'Tag-ulo ES', 'Selinog ES', 'Daro Primary School',
            'Barcelona Central School', 'Ba-ao ES', 'Burgos ES', 'Hilltop ES', 'Ilaya ES', 'Ma. Uray ES', 'Oyan ES', 'Tamion ES', 'Yabu Primary School', 'Diwaan ES',
            'Potungan Central School', 'Aseniero ES', 'Dampalan ES', 'Masidlakon ES', 'Opao ES', 'San Francisco ES', 'San Nicolas ES', 'Sigayan ES',
            'Sulangon Central School', 'Aliguay ES', 'Antipolo ES', 'Larayan ES', 'Liyang ES', 'Owaon ES', 'San Pedro ES', 'San Vicente ES', 'Sicayab ES',
            'Dapitan Elementary School'
        ];
    }
    if (schoolOrCategory === 'category:Secondary') {
        return [
            'Dapitan City National High School',
            'Barcelona National High School',
            'Baylimango National High School',
            'Ilaya National High School',
            'Potungan National High School',
            'Sulangon National High School',
            'Aseniero National High School',
            'Oro National High School',
            'Taguilon National High School',
            'Dapitan National High School'
        ];
    }
    if (schoolOrCategory === 'category:Integrated') {
        return [
            'Kauswagan Integrated School',
            'Guimputlan Integrated School',
            'Aliguay Integrated School',
            'Selinog Integrated School'
        ];
    }
    if (schoolOrCategory === 'category:SPED') {
        return [
            'Dapitan City SPED Center'
        ];
    }

    if (schoolOrCategory === 'Dapitan City Central School') {
        return ['Dapitan City Central School', 'Dapitan Elementary School'];
    }
    if (schoolOrCategory === 'Dapitan City National High School') {
        return ['Dapitan City National High School', 'Dapitan National High School'];
    }
    return [schoolOrCategory];
};

// GET /api/pm/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const [periods] = await db.query('SELECT * FROM rating_periods WHERE is_active = 1 LIMIT 1');
        if (periods.length === 0) return res.status(404).json({ message: "No active rating period" });
        
        const activePeriod = periods[0];
        const periodId = req.query.period_id || activePeriod.id;
        const school = req.query.school;
        
        let query = `
            SELECT 
                COUNT(CASE WHEN COALESCE(CAST(i.status AS CHAR), CASE WHEN CAST(pc.status AS CHAR) = 'draft' THEN 'not_submitted' ELSE CAST(pc.status AS CHAR) END, 'not_submitted') IN ('not_submitted', 'draft', 'returned') THEN 1 END) as pendingSubmissions,
                COUNT(CASE WHEN CAST(i.status AS CHAR) IN ('submitted', 'under_review', 'needs_revision', 'reviewed') AND pc.final_rating_submitted_at IS NULL THEN 1 END) as pendingReviews,
                COUNT(CASE WHEN pc.final_rating_submitted_at IS NOT NULL OR CAST(i.status AS CHAR) IN ('reviewed', 'finalized') THEN 1 END) as finalizedAppraisals,
                COUNT(*) as totalPersonnel
            FROM employees e
            LEFT JOIN ipcrf i ON e.id = i.employee_id AND i.rating_period_id = ?
            LEFT JOIN performance_commitments pc ON e.id = pc.employee_id AND pc.rating_period_id = ?
            WHERE e.role = 'employee'
        `;
        const params = [periodId, periodId];
        
        if (school && school !== 'all') {
            const units = getSchoolUnits(school);
            if (units.length > 0) {
                const placeholders = units.map(() => '?').join(',');
                query += ` AND e.unit IN (${placeholders}) `;
                params.push(...units);
            }
        }
        
        const [stats] = await db.query(query, params);

        res.json({ period: activePeriod, stats: stats[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pm/dashboard/personnel-status
router.get('/personnel-status', async (req, res) => {
    try {
        const periodId = req.query.period_id ? Number(req.query.period_id) : null;
        const school = req.query.school;
        
        let query = `
            SELECT e.id, e.name, e.position, e.unit, e.email, 
                   COALESCE(i.status, CASE WHEN pc.status = 'draft' THEN 'not_submitted' ELSE pc.status END, 'not_submitted') as status, 
                   pc.overall_weighted_score as rating, 
                   pc.id as commitment_id,
                   i.id as ipcrf_id
            FROM employees e
        `;
        const params = [];
        if (periodId) {
            query += ` LEFT JOIN ipcrf i ON e.id = i.employee_id AND i.rating_period_id = ? `;
            query += ` LEFT JOIN performance_commitments pc ON e.id = pc.employee_id AND pc.rating_period_id = ? `;
            params.push(periodId, periodId);
        } else {
            query += ` LEFT JOIN ipcrf i ON e.id = i.employee_id AND i.rating_period_id = (SELECT id FROM rating_periods WHERE is_active = 1 LIMIT 1) `;
            query += ` LEFT JOIN performance_commitments pc ON e.id = pc.employee_id AND pc.rating_period_id = (SELECT id FROM rating_periods WHERE is_active = 1 LIMIT 1) `;
        }
        query += ` WHERE e.role = 'employee' `;
        
        if (school && school !== 'all') {
            const units = getSchoolUnits(school);
            if (units.length > 0) {
                const placeholders = units.map(() => '?').join(',');
                query += ` AND e.unit IN (${placeholders}) `;
                params.push(...units);
            }
        }
        
        query += ` ORDER BY e.name ASC `;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pm/dashboard/unit-completion
router.get('/unit-completion', async (req, res) => {
    try {
        const periodId = req.query.period_id ? Number(req.query.period_id) : null;
        let query = `
            SELECT 
                e.unit as name,
                COUNT(*) as total,
                SUM(CASE WHEN pc.final_rating_submitted_at IS NOT NULL THEN 1 ELSE 0 END) as completed
            FROM employees e
        `;
        const params = [];
        if (periodId) {
            query += ` LEFT JOIN performance_commitments pc ON e.id = pc.employee_id AND pc.rating_period_id = ? `;
            params.push(periodId);
        } else {
            query += ` LEFT JOIN performance_commitments pc ON e.id = pc.employee_id AND pc.rating_period_id = (SELECT id FROM rating_periods WHERE is_active = 1 LIMIT 1) `;
        }
        query += ` WHERE e.role = 'employee' GROUP BY e.unit `;

        const [rows] = await db.query(query, params);
        
        const result = rows.map(r => ({
            name: r.name,
            total: Number(r.total) || 0,
            completed: Number(r.completed) || 0,
            percent: r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0
        }));
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pm/dashboard/periods
router.get('/periods', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM rating_periods ORDER BY year DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pm/dashboard/ratings-distribution
router.get('/ratings-distribution', async (req, res) => {
    try {
        const { position_type, period_id, school } = req.query;
        let query = `
            SELECT 
                COALESCE(SUM(CASE WHEN pc.adjectival_rating = 'Outstanding' THEN 1 ELSE 0 END), 0) as outstanding,
                COALESCE(SUM(CASE WHEN pc.adjectival_rating = 'Very Satisfactory' THEN 1 ELSE 0 END), 0) as verySatisfactory,
                COALESCE(SUM(CASE WHEN pc.adjectival_rating = 'Satisfactory' THEN 1 ELSE 0 END), 0) as satisfactory,
                COALESCE(SUM(CASE WHEN pc.adjectival_rating = 'Unsatisfactory' THEN 1 ELSE 0 END), 0) as unsatisfactory,
                COALESCE(SUM(CASE WHEN pc.adjectival_rating = 'Poor' THEN 1 ELSE 0 END), 0) as poor
            FROM performance_commitments pc
            JOIN employees e ON pc.employee_id = e.id
            WHERE pc.final_rating_submitted_at IS NOT NULL
        `;
        const params = [];
        if (position_type && position_type !== 'all') {
            query += ` AND pc.position_type = ?`;
            params.push(position_type);
        }
        if (period_id) {
            query += ` AND pc.rating_period_id = ?`;
            params.push(period_id);
        } else {
            query += ` AND rating_period_id = (SELECT id FROM rating_periods WHERE is_active = 1 LIMIT 1)`;
        }
        if (school && school !== 'all') {
            const units = getSchoolUnits(school);
            if (units.length > 0) {
                const placeholders = units.map(() => '?').join(',');
                query += ` AND e.unit IN (${placeholders})`;
                params.push(...units);
            }
        }

        const [rows] = await db.query(query, params);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pm/dashboard/cycle
router.get('/cycle', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM rating_periods WHERE is_active = 1 LIMIT 1');
        if (rows.length === 0) return res.status(404).json({ message: "No active cycle rating period found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
