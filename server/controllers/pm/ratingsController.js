const db = require('../../db');

exports.getRatingsSummary = async (req, res) => {
    try {
        const { period_id } = req.query;
        let sql = `SELECT
                    COUNT(DISTINCT c.user_id) AS total_personnel,
                    SUM(CASE WHEN c.status = 'submitted' THEN 1 ELSE 0 END) AS submitted_count,
                    SUM(CASE WHEN c.status = 'rated' THEN 1 ELSE 0 END) AS rated_count,
                    SUM(CASE WHEN c.status = 'finalized' THEN 1 ELSE 0 END) AS finalized_count,
                    ROUND(AVG(CASE WHEN c.overall_rating IS NOT NULL THEN c.overall_rating END), 2) AS avg_rating
                   FROM performance_commitments c
                   WHERE 1=1`;
        const params = [];
        if (period_id) { sql += ' AND c.period_id = ?'; params.push(period_id); }
        const [[row]] = await db.query(sql, params);
        res.json({
            total_personnel: Number(row.total_personnel) || 0,
            submitted_count: Number(row.submitted_count) || 0,
            rated_count: Number(row.rated_count) || 0,
            finalized_count: Number(row.finalized_count) || 0,
            avg_rating: row.avg_rating || 0,
        });
    } catch (error) {
        console.error('getRatingsSummary Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getRatingsDistribution = async (req, res) => {
    try {
        const { period_id } = req.query;
        let sql = `SELECT adjectival_rating, COUNT(*) AS count
                   FROM performance_commitments
                   WHERE adjectival_rating IS NOT NULL`;
        const params = [];
        if (period_id) { sql += ' AND period_id = ?'; params.push(period_id); }
        sql += ' GROUP BY adjectival_rating ORDER BY FIELD(adjectival_rating, "Outstanding","Very Satisfactory","Satisfactory","Unsatisfactory","Poor")';
        const [rows] = await db.query(sql, params);
        const labels = ['Outstanding', 'Very Satisfactory', 'Satisfactory', 'Unsatisfactory', 'Poor'];
        const distribution = labels.map(label => ({
            label,
            count: Number(rows.find(r => r.adjectival_rating === label)?.count || 0),
        }));
        res.json(distribution);
    } catch (error) {
        console.error('getRatingsDistribution Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getIndividualRatings = async (req, res) => {
    try {
        const { userId } = req.params;
        // Users can only view their own ratings unless they are an administrator
        const adminRoles = ['admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'];
        if (!adminRoles.includes(req.user.role) && String(req.user.id) !== String(userId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const [rows] = await db.query(
            `SELECT c.id, c.period_id, c.overall_rating, c.adjectival_rating, c.status, c.rated_at,
                    p.school_year, p.period_label, p.phase
             FROM performance_commitments c
             JOIN performance_periods p ON c.period_id = p.id
             WHERE c.user_id = ? AND c.status IN ('rated','finalized')
             ORDER BY p.start_date DESC`, [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('getIndividualRatings Error:', error);
        res.status(500).json({ message: error.message });
    }
};
