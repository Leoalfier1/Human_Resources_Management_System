const db = require('../../db');

const ORG_HEADER = {
    republic: "REPUBLIC OF THE PHILIPPINES",
    dept: "DEPARTMENT OF EDUCATION",
    region: "REGION IX – ZAMBOANGA PENINSULA",
    office: "Schools Division Office of Dapitan City"
};

const getPreview = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) return res.status(400).json({ message: "vacancy_id is required" });

        // 1. Get Vacancy Info
        const [vacRows] = await db.query(
            'SELECT position_title, item_number, assigned_school, ref_no, current_stage FROM vacancies WHERE id = ?',
            [vacancy_id]
        );
        if (vacRows.length === 0) return res.status(404).json({ message: "Vacancy not found." });
        const vacancy = vacRows[0];

        // 2. Get Ranked Results
        // NOTE: comparative_assessment_results does NOT have rank_val or is_qualified
        // columns — those are computed here instead of trusted from storage.
        const [results] = await db.query(`
            SELECT 
                a.full_name, 
                a.status,
                IFNULL(r.total_score, 0) as total_score,
                RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) as rank_val
            FROM applications a
            LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
            WHERE a.vacancy_id = ? 
              AND a.status IN ('qualified', 'disqualified', 'shortlisted', 'selected', 'appointed')
            ORDER BY rank_val ASC`, [vacancy_id]);

        // 3. Check Publication Status
        const [pubRows] = await db.query('SELECT * FROM results_postings WHERE vacancy_id = ?', [vacancy_id]);
        const isPublished = pubRows.length > 0;

        // 4. Calculate Deadline (1 WD per 30 applicants — Stage 7 SLA)
        const [appCount] = await db.query('SELECT COUNT(*) as count FROM applications WHERE vacancy_id = ?', [vacancy_id]);
        const slaDays = Math.max(1, Math.ceil(appCount[0].count / 30));
        const deadlineLabel = `Deadline: ${slaDays} Working Day${slaDays > 1 ? 's' : ''} from posting`;

        res.json({
            org: ORG_HEADER,
            vacancy,
            results: results.map(r => {
                const isQualified = r.status !== 'disqualified';
                return {
                    rank: isQualified ? r.rank_val : "—",
                    name: r.full_name,
                    score: isQualified ? parseFloat(r.total_score).toFixed(2) : "N/A",
                    remarks: isQualified ? "Qualified" : "Disqualified"
                };
            }),
            posting_status: isPublished ? 'published' : 'not_yet_published',
            posted_date: isPublished
                ? (pubRows[0].published_division_website || pubRows[0].published_facebook || pubRows[0].published_bulletin)
                : null,
            deadline_label: deadlineLabel
        });
    } catch (error) {
        console.error("❌ GET RESULTS PREVIEW ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

const publishResults = async (req, res) => {
    try {
        const { vacancy_id } = req.body;
        const userId = req.user.id;

        if (!vacancy_id) return res.status(400).json({ message: "vacancy_id is required" });

        // 1. Validate Stage
        const [vac] = await db.query('SELECT current_stage, ref_no FROM vacancies WHERE id = ?', [vacancy_id]);
        if (vac.length === 0) return res.status(404).json({ message: "Vacancy not found." });
        if (vac[0].current_stage < 6) {
            return res.status(400).json({ message: "Comparative assessment must be completed first." });
        }

        // 2. Prevent double publishing
        const [existing] = await db.query('SELECT id FROM results_postings WHERE vacancy_id = ?', [vacancy_id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Results have already been published for this vacancy." });
        }

        // 3. Log Publication
        const now = new Date();
        await db.query(`
            INSERT INTO results_postings 
            (vacancy_id, published_division_website, published_facebook, published_bulletin, published_by) 
            VALUES (?, ?, ?, ?, ?)`,
            [vacancy_id, now, now, now, userId]
        );

        // 4. Advance Stage to 8 (Deliberation) — only if not already past it
        if (vac[0].current_stage < 8) {
            await db.query('UPDATE vacancies SET current_stage = 8 WHERE id = ?', [vacancy_id]);
        }

        // 5. Activity Log & Socket
        await db.query('INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)',
            [vacancy_id, userId, `Comparative assessment results posted for ${vac[0].ref_no}`]);

        const io = req.app.get('socketio');
        if (io) io.emit('rsp:dashboard:update');

        // 6. APPLICANT-FACING NOTIFICATIONS
        // Push a personalized result+rank notification to every qualified applicant's own socket room.
        const [rankedApplicants] = await db.query(`
            SELECT 
                a.id,
                IFNULL(r.total_score, 0) as total_score,
                RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) as rank_val,
                COUNT(*) OVER () as rank_total
            FROM applications a
            LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
            WHERE a.vacancy_id = ? AND a.status IN ('qualified', 'shortlisted', 'selected', 'appointed')
        `, [vacancy_id]);

        for (const applicant of rankedApplicants) {
    const message = `The HRMPSB Secretariat has officially posted the Comparative Assessment Results for ${vac[0].ref_no}. Your total score is ${Number(applicant.total_score).toFixed(2)}/100, placing you at Rank #${applicant.rank_val} of ${applicant.rank_total}.`;
    const [notifResult] = await db.query(
        `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
        [applicant.id, message]
    );

    // ADD THIS BLOCK:
    await db.query(
        `INSERT INTO stage_history (application_id, stage_number, status, completed_at)
         VALUES (?, 7, 'completed', NOW()) ON DUPLICATE KEY UPDATE status='completed', completed_at=NOW()`,
        [applicant.id]
    );
    await db.query(`UPDATE applications SET current_stage = 7 WHERE id = ?`, [applicant.id]);

    if (io) {
        io.to(`application-${applicant.id}`).emit('application:notification', {
            id: notifResult.insertId,
            message,
            created_at: new Date()
        });
        io.to(`application-${applicant.id}`).emit('application:score-update');
    }
}

        res.json({ message: "Results published successfully", posted_date: now });
    } catch (error) {
        console.error("❌ PUBLISH RESULTS ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPreview, publishResults };