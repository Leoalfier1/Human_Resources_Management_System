const db = require('../db');

exports.getApplicationStatus = async (req, res) => {
    const { id } = req.params; // or resolve current user's latest app
    
    try {
        // Aggregate all data in one go
        const [app] = await db.query(`
            SELECT a.*, v.position_title, v.ref_no as vacancy_ref 
            FROM applications a 
            JOIN vacancies v ON a.vacancy_id = v.id 
            WHERE a.id = ?`, [id]);
            
        const [history] = await db.query("SELECT * FROM stage_history WHERE application_id = ? ORDER BY stage_number ASC", [id]);
        const [scores] = await db.query("SELECT * FROM assessment_scores WHERE application_id = ?", [id]);
        const [notifs] = await db.query("SELECT * FROM notifications WHERE application_id = ? ORDER BY created_at DESC", [id]);

        res.json({
            application: app[0],
            stages: history,
            assessment: scores[0] || null,
            notifications: notifs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};