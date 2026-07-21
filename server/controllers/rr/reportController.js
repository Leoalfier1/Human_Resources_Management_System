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
        const currentYear = new Date().getFullYear();

        // 1. Current / active nomination cycles (new system)
        const [activeCalls] = await db.query(`
            SELECT nc.*, at.name AS award_type_name, at.award_level
            FROM rr_nomination_calls nc
            JOIN rr_award_types at ON nc.award_type_id = at.id
            WHERE nc.status IN ('published','closed')
            ORDER BY nc.created_at DESC
            LIMIT 1
        `);
        const currentCycle = activeCalls[0] || null;

        // 2. Active calls count (published status)
        const [activeCallsCount] = await db.query(
            "SELECT COUNT(*) AS count FROM rr_nomination_calls WHERE status = 'published'"
        );

        // 3. Total nominations this year (new system)
        const [nominationsThisYear] = await db.query(`
            SELECT COUNT(*) AS count FROM rr_call_nominations
            WHERE YEAR(created_at) = ?
        `, [currentYear]);

        // 4. Advanced / awardees this year (new system — status = 'advanced')
        const [awardeesThisYear] = await db.query(`
            SELECT COUNT(*) AS count FROM rr_call_nominations
            WHERE status = 'advanced' AND YEAR(created_at) = ?
        `, [currentYear]);

        // 5. Finalized meetings
        const [finalizedMeetings] = await db.query(
            "SELECT COUNT(*) AS count FROM rr_praise_meetings WHERE status = 'finalized'"
        );

        // 6. Upcoming ceremonies
        const [upcomingCeremonies] = await db.query(
            "SELECT COUNT(*) AS count FROM rr_ceremonies WHERE ceremony_datetime >= NOW()"
        );

        // 7. Award distribution by category (teaching / teaching_related / non_teaching)
        const [categoryBreakdown] = await db.query(`
            SELECT nominee_category AS position_type, COUNT(*) AS count
            FROM rr_call_nominations
            WHERE YEAR(created_at) = ?
            GROUP BY nominee_category
        `, [currentYear]);

        // 8. Award levels breakdown — derive from calls joined to award_types
        const [levelBreakdown] = await db.query(`
            SELECT at.award_level, COUNT(cn.id) AS count
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON cn.call_id = nc.id
            JOIN rr_award_types at ON nc.award_type_id = at.id
            WHERE YEAR(cn.created_at) = ?
            GROUP BY at.award_level
        `, [currentYear]);

        // 9. Recent activity feed (last 10 events across multiple tables)
        const [recentActivity] = await db.query(`
            (SELECT 'nomination' AS type, cn.created_at AS date,
                CONCAT(cn.nominee_name, ' nominated for ', at.name) AS description
             FROM rr_call_nominations cn
             JOIN rr_nomination_calls nc ON cn.call_id = nc.id
             JOIN rr_award_types at ON nc.award_type_id = at.id
             ORDER BY cn.created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'meeting' AS type, pm.created_at AS date,
                CONCAT('PRAISE Meeting on ', DATE_FORMAT(pm.meeting_date, '%b %d, %Y')) AS description
             FROM rr_praise_meetings pm
             ORDER BY pm.created_at DESC LIMIT 3)
            UNION ALL
            (SELECT 'ceremony' AS type, cr.created_at AS date,
                CONCAT('Ceremony: ', COALESCE(cr.venue, 'TBD')) AS description
             FROM rr_ceremonies cr
             ORDER BY cr.created_at DESC LIMIT 3)
            UNION ALL
            (SELECT 'announcement' AS type, an.created_at AS date,
                CONCAT('Results announced for call #', an.nomination_call_id) AS description
             FROM rr_announcements an
             ORDER BY an.created_at DESC LIMIT 3)
            ORDER BY date DESC LIMIT 10
        `);

        // 10. Legacy stats (fallback if new tables are empty)
        let legacyStats = null;
        if (nominationsThisYear[0].count === 0) {
            const [legActive] = await db.query(
                "SELECT COUNT(*) AS count FROM rr_searches WHERE status IN ('open','evaluation','deliberation','announced')"
            );
            const [legNoms] = await db.query(`
                SELECT COUNT(*) AS count FROM rr_nominations n
                JOIN rr_searches s ON n.search_id = s.id
                WHERE YEAR(n.created_at) = ?
            `, [currentYear]);
            const [legAwardees] = await db.query(`
                SELECT COUNT(*) AS count FROM rr_awards a
                JOIN rr_searches s ON a.search_id = s.id
                WHERE YEAR(a.created_at) = ?
            `, [currentYear]);
            legacyStats = {
                active_searches: legActive[0].count,
                nominations_this_year: legNoms[0].count,
                awardees_this_year: legAwardees[0].count,
            };
        }

        res.json({
            current_cycle: currentCycle,
            active_cycles: activeCallsCount[0].count,
            nominations_this_year: nominationsThisYear[0].count,
            awardees_this_year: awardeesThisYear[0].count,
            finalized_meetings: finalizedMeetings[0].count,
            upcoming_ceremonies: upcomingCeremonies[0].count,
            category_breakdown: categoryBreakdown,
            level_breakdown: levelBreakdown,
            recent_activity: recentActivity,
            legacy: legacyStats
        });
    } catch (err) {
        console.error('❌ DASHBOARD STATS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};
