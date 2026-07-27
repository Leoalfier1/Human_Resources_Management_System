const db = require('../../db');

const getRankedList = async (req, res) => {
    try {
        const { vacancy_id } = req.query;

        const query = `
            SELECT 
                a.id, a.ref_no as applicant_code, a.full_name,
                r.category_subscore_classroom as A,
                r.category_subscore_nonclassroom as B,
                r.category_subscore_document as C,
                r.total_score,
                RANK() OVER (ORDER BY r.total_score DESC) as rank_val,
                n.background_investigation_notes,
                n.is_recommended,
                v.position_title, v.ref_no, v.current_stage
            FROM applications a
            JOIN comparative_assessment_results r ON a.id = r.applicant_id
            JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN deliberation_notes n ON a.id = n.applicant_id
            WHERE a.vacancy_id = ?
            ORDER BY rank_val ASC`;

        const [rows] = await db.query(query, [vacancy_id]);
        
        // Add is_top5 flag server-side for security
        const results = rows.map(row => ({
            ...row,
            is_top5: row.rank_val <= 5
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateNotes = async (req, res) => {
    try {
        const { applicant_id, background_investigation_notes } = req.body;

        // Security Check: Verify rank is Top 5
        const [rankCheck] = await db.query(`
            SELECT rank_val FROM comparative_assessment_results WHERE applicant_id = ?`, [applicant_id]);
        
        if (!rankCheck[0] || rankCheck[0].rank_val > 5) {
            return res.status(403).json({ message: "Notes allowed only for Top 5 candidates." });
        }

        await db.query(`
            INSERT INTO deliberation_notes (applicant_id, background_investigation_notes)
            VALUES (?, ?) ON DUPLICATE KEY UPDATE background_investigation_notes = VALUES(background_investigation_notes)`,
            [applicant_id, background_investigation_notes]
        );

        res.json({ message: "Notes saved." });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const toggleRecommend = async (req, res) => {
    try {
        const { applicant_id, is_recommended } = req.body;

        await db.query(`
            INSERT INTO deliberation_notes (applicant_id, is_recommended, recommended_by)
            VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE is_recommended = VALUES(is_recommended), recommended_by = VALUES(recommended_by)`,
            [applicant_id, is_recommended, req.user.id]
        );

        // Update main applicant status
        const newStatus = is_recommended ? 'shortlisted' : 'qualified';
        await db.query(`UPDATE applications SET status = ? WHERE id = ?`, [newStatus, applicant_id]);

        res.json({ message: "Recommendation updated." });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const endorseShortlist = async (req, res) => {
    try {
        const { vacancy_id } = req.body;

        // Validation: Must have at least one recommended
        const [check] = await db.query(`
            SELECT COUNT(*) as count FROM deliberation_notes n
            JOIN applications a ON n.applicant_id = a.id
            WHERE a.vacancy_id = ? AND n.is_recommended = TRUE`, [vacancy_id]);

        if (check[0].count === 0) {
            return res.status(400).json({ message: "Select at least one candidate for endorsement." });
        }

        // Advance to Stage 9
        await db.query(`UPDATE vacancies SET current_stage = 9 WHERE id = ?`, [vacancy_id]);

        // Log Activity
        await db.query(`INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [vacancy_id, req.user.id, `Shortlist finalized - top ${check[0].count} endorsed to SDS`]);

        const [[vacRef]] = await db.query('SELECT ref_no FROM vacancies WHERE id = ?', [vacancy_id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('rsp:dashboard:update');
            io.emit('notification:admin', {
                message: `Shortlist endorsed to SDS for ${vacRef?.ref_no || vacancy_id}`,
                type: 'rsp'
            });
        }

        // APPLICANT-FACING NOTIFICATIONS: tell each recommended candidate their rank
        const [vacRow] = await db.query('SELECT position_title FROM vacancies WHERE id = ?', [vacancy_id]);
        const posTitle = vacRow[0]?.position_title || 'this position';

        const [shortlisted] = await db.query(`
            SELECT a.id, IFNULL(r.total_score, 0) as total_score,
                   RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) as rank_val,
                   (SELECT COUNT(*) FROM applications WHERE vacancy_id = ? AND status IN ('qualified','shortlisted','selected','appointed')) as rank_total
            FROM applications a
            LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
            JOIN deliberation_notes n ON n.applicant_id = a.id
            WHERE a.vacancy_id = ? AND n.is_recommended = TRUE
        `, [vacancy_id, vacancy_id]);

        for (const candidate of shortlisted) {
    const message = `Congratulations! You are ranked #${candidate.rank_val} out of ${candidate.rank_total} qualified applicants for ${posTitle}. The HRMPSB has endorsed your name to the appointing authority.`;
    const [notifResult] = await db.query(
        `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
        [candidate.id, message]
    );

    // ADD THIS BLOCK:
    await db.query(
        `INSERT INTO stage_history (application_id, stage_number, status, completed_at)
         VALUES (?, 8, 'completed', NOW()) ON DUPLICATE KEY UPDATE status='completed', completed_at=NOW()`,
        [candidate.id]
    );
    await db.query(`UPDATE applications SET current_stage = 8 WHERE id = ?`, [candidate.id]);

    if (io) {
        io.to(`application-${candidate.id}`).emit('application:notification', {
            id: notifResult.insertId,
            message,
            created_at: new Date()
        });
        io.to(`application-${candidate.id}`).emit('application:stage-update', { status: 'shortlisted' });
    }
}
        res.json({ message: "Shortlist successfully endorsed." });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getRankedList, updateNotes, toggleRecommend, endorseShortlist };