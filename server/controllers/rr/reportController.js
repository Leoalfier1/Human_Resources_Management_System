const db = require('../../db');

exports.generateReport = async (req, res) => {
    try {
        const { search_id } = req.body;
        if (!search_id) return res.status(400).json({ message: 'search_id is required' });

        const [searchRows] = await db.query('SELECT * FROM rr_searches WHERE id = ?', [search_id]);
        if (searchRows.length === 0) return res.status(404).json({ message: 'Search not found' });

        const [awards] = await db.query(`
            SELECT a.*, u.full_name as user_name,
                ac.category_name, ac.category_level,
                s.title as search_title, s.school_year
            FROM rr_awards a
            JOIN users u ON a.user_id = u.id
            JOIN rr_award_categories ac ON a.category_id = ac.id
            JOIN rr_searches s ON a.search_id = s.id
            WHERE a.search_id = ?
            ORDER BY ac.category_name, u.full_name
        `, [search_id]);

        const [nominations] = await db.query(
            'SELECT COUNT(*) as count FROM rr_nominations WHERE search_id = ?', [search_id]
        );

        const teachingAwardees = awards.filter(a => a.position_type === 'teaching').length;
        const nonTeachingAwardees = awards.filter(a => a.position_type === 'non_teaching').length;
        const teachingRelatedAwardees = awards.filter(a => a.position_type === 'teaching_related').length;

        const byLevel = {};
        awards.forEach(a => {
            const level = a.award_level || 'division';
            byLevel[level] = (byLevel[level] || 0) + 1;
        });

        const byCategory = {};
        awards.forEach(a => {
            byCategory[a.category_name] = (byCategory[a.category_name] || 0) + 1;
        });

        const reportData = {
            search: searchRows[0],
            awards,
            total_nominees: nominations[0].count,
            total_awardees: awards.length,
            teaching_awardees: teachingAwardees,
            non_teaching_awardees: nonTeachingAwardees,
            teaching_related_awardees: teachingRelatedAwardees,
            by_level: byLevel,
            by_category: byCategory,
            generated_at: new Date()
        };

        await db.query(`
            INSERT INTO rr_implementation_reports (search_id, generated_by, total_nominees, total_awardees,
                teaching_awardees, non_teaching_awardees, teaching_related_awardees, report_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE generated_by = VALUES(generated_by), total_nominees = VALUES(total_nominees),
                total_awardees = VALUES(total_awardees), teaching_awardees = VALUES(teaching_awardees),
                non_teaching_awardees = VALUES(non_teaching_awardees),
                teaching_related_awardees = VALUES(teaching_related_awardees), report_data = VALUES(report_data),
                generated_at = CURRENT_TIMESTAMP
        `, [search_id, req.user.id, reportData.total_nominees, reportData.total_awardees,
            reportData.teaching_awardees, reportData.non_teaching_awardees,
            reportData.teaching_related_awardees, JSON.stringify(reportData)]);

        res.json(reportData);
    } catch (err) {
        console.error('❌ GENERATE REPORT ERROR:', err);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};

exports.getReport = async (req, res) => {
    try {
        const { searchId } = req.params;
        const [rows] = await db.query(`
            SELECT r.*, u.full_name as generated_by_name
            FROM rr_implementation_reports r
            LEFT JOIN users u ON r.generated_by = u.id
            WHERE r.search_id = ?
        `, [searchId]);

        if (rows.length === 0) return res.status(404).json({ message: 'Report not found. Generate one first.' });

        const report = rows[0];
        if (typeof report.report_data === 'string') {
            report.report_data = JSON.parse(report.report_data);
        }

        res.json(report);
    } catch (err) {
        console.error('❌ GET REPORT ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch report' });
    }
};

exports.exportReportCSV = async (req, res) => {
    try {
        const { searchId } = req.params;
        const [searchRows] = await db.query('SELECT * FROM rr_searches WHERE id = ?', [searchId]);
        if (searchRows.length === 0) return res.status(404).json({ message: 'Search not found' });

        const search = searchRows[0];
        const year = search.school_year || new Date().getFullYear();

        const [awards] = await db.query(`
            SELECT a.*, u.full_name as user_name,
                ac.category_name, ac.category_level,
                s.title as search_title
            FROM rr_awards a
            JOIN users u ON a.user_id = u.id
            JOIN rr_award_categories ac ON a.category_id = ac.id
            JOIN rr_searches s ON a.search_id = s.id
            WHERE a.search_id = ?
            ORDER BY ac.category_name, u.full_name
        `, [searchId]);

        const headers = [
            'No.', 'Last Name', 'First Name', 'Middle Initial',
            'Extension Name (if any)', 'Sex (M/F)', 'Position/Designation',
            'Position Level', 'Category', 'Award Title', 'Office/Unit/School'
        ];

        let csv = 'Schools Division Office of Dapitan City\n';
        csv += `Summary List of Awards (Individual)\n`;
        csv += `CY ${year}\n\n`;
        csv += headers.join(',') + '\n';

        awards.forEach((a, i) => {
            const nameParts = (a.user_name || '').trim().split(/\s+/);
            const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';
            const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
            const sex = '';

            const row = [
                i + 1,
                escapeCsv(lastName),
                escapeCsv(firstName),
                '', '', sex,
                escapeCsv(''),
                escapeCsv(a.award_level || 'Division'),
                escapeCsv(a.category_name),
                escapeCsv(a.award_title),
                escapeCsv('SDO Dapitan City')
            ];
            csv += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="Summary_List_of_Awards_CY_${year}.csv"`);
        res.send(csv);
    } catch (err) {
        console.error('❌ EXPORT CSV ERROR:', err);
        res.status(500).json({ message: 'Failed to export CSV' });
    }
};

function escapeCsv(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

exports.getDashboardStats = async (req, res) => {
    try {
        const [activeSearches] = await db.query(
            "SELECT COUNT(*) as count FROM rr_searches WHERE status IN ('open','evaluation','deliberation','announced')"
        );

        const [nominationsThisYear] = await db.query(`
            SELECT COUNT(*) as count FROM rr_nominations n
            JOIN rr_searches s ON n.search_id = s.id
            WHERE YEAR(n.created_at) = YEAR(CURRENT_DATE)
        `);

        const [awardeesThisYear] = await db.query(`
            SELECT COUNT(*) as count FROM rr_awards a
            JOIN rr_searches s ON a.search_id = s.id
            WHERE YEAR(a.created_at) = YEAR(CURRENT_DATE)
        `);

        const [positionBreakdown] = await db.query(`
            SELECT a.position_type, COUNT(*) as count
            FROM rr_awards a
            JOIN rr_searches s ON a.search_id = s.id
            WHERE YEAR(a.created_at) = YEAR(CURRENT_DATE)
            GROUP BY a.position_type
        `);

        const [levelBreakdown] = await db.query(`
            SELECT a.award_level, COUNT(*) as count
            FROM rr_awards a
            JOIN rr_searches s ON a.search_id = s.id
            WHERE YEAR(a.created_at) = YEAR(CURRENT_DATE)
            GROUP BY a.award_level
        `);

        const [upcomingCeremonies] = await db.query(`
            SELECT COUNT(*) as count FROM rr_ceremony c
            JOIN rr_searches s ON c.search_id = s.id
            WHERE c.ceremony_date >= CURRENT_DATE
        `);

        const [recentActivity] = await db.query(`
            (SELECT 'nomination' as type, n.created_at as date, CONCAT(u.full_name, ' nominated for ', ac.category_name) as description
                FROM rr_nominations n
                JOIN users u ON n.nominee_id = u.id
                JOIN rr_award_categories ac ON n.category_id = ac.id
                ORDER BY n.created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'award' as type, a.created_at as date, CONCAT(u.full_name, ' awarded as ', a.award_title) as description
                FROM rr_awards a
                JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC LIMIT 5)
            ORDER BY date DESC LIMIT 10
        `);

        res.json({
            active_searches: activeSearches[0].count,
            nominations_this_year: nominationsThisYear[0].count,
            awardees_this_year: awardeesThisYear[0].count,
            position_breakdown: positionBreakdown,
            level_breakdown: levelBreakdown,
            upcoming_ceremonies: upcomingCeremonies[0].count,
            recent_activity: recentActivity
        });
    } catch (err) {
        console.error('❌ DASHBOARD STATS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};
