const db = require('../../db');

exports.getOpportunities = async (req, res) => {
    try {
        const { category } = req.query;
        const today = new Date().toISOString().slice(0, 10);

        let sql = `
            SELECT
                nc.id,
                nc.award_type_id,
                nc.eligible_category,
                nc.nomination_opens,
                nc.nomination_closes,
                nc.criteria_summary,
                nc.status,
                at.name AS award_type_name,
                DATEDIFF(nc.nomination_closes, CURDATE()) AS days_remaining
            FROM rr_nomination_calls nc
            JOIN rr_award_types at ON at.id = nc.award_type_id
            WHERE nc.status = 'published'
              AND nc.nomination_closes >= ?
        `;
        const params = [today];

        if (category && category !== 'all') {
            sql += ' AND nc.eligible_category = ?';
            params.push(category);
        }

        sql += ' ORDER BY nc.nomination_closes ASC';

        const [rows] = await db.query(sql, params);

        const enriched = rows.map(r => ({
            ...r,
            days_remaining: Math.max(0, r.days_remaining || 0),
        }));

        res.json(enriched);
    } catch (err) {
        console.error('❌ GET OPPORTUNITIES ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch opportunities' });
    }
};

exports.getCycleInfo = async (req, res) => {
    try {
        const [yearRows] = await db.query(`
            SELECT YEAR(nomination_opens) AS cycle_year
            FROM rr_nomination_calls
            WHERE status IN ('published', 'closed')
            ORDER BY nomination_opens DESC
            LIMIT 1
        `);

        if (yearRows.length === 0 || !yearRows[0].cycle_year) {
            return res.json({
                year: new Date().getFullYear(),
                label: 'PRAISE',
                status_text: 'Coming Soon',
                is_open: false,
            });
        }

        const year = yearRows[0].cycle_year;

        const [openRows] = await db.query(`
            SELECT COUNT(*) AS open_calls
            FROM rr_nomination_calls
            WHERE status = 'published'
              AND YEAR(nomination_opens) = ?
              AND nomination_closes >= CURDATE()
        `, [year]);

        const isOpen = openRows[0].open_calls > 0;

        res.json({
            year,
            label: 'PRAISE',
            status_text: isOpen ? 'Nominations are now open' : 'Nominations are closed',
            is_open: isOpen,
        });
    } catch (err) {
        console.error('❌ GET CYCLE INFO ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch cycle info' });
    }
};
