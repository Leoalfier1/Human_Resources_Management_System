const db = require('../../db');
const syncApplicationsStage = require('../../utils/syncApplicationsStage');

// ── 1. GET APPOINTEE QUEUE ─────────────────────────────────────────
const getProcessingAppointees = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) {
            return res.status(400).json({ message: 'vacancy_id is required' });
        }

        const [rows] = await db.query(`
            SELECT
                a.id, a.full_name, a.applicant_id,
                v.position_title, v.item_number,
                RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) AS rank_val,
                ca.report_date
            FROM applications a
            JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
            LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
            WHERE a.vacancy_id = ?
              AND a.status IN ('selected', 'appointed')
            ORDER BY rank_val ASC
        `, [vacancy_id]);

        res.json(rows);
    } catch (error) {
        console.error('getProcessingAppointees Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── ISSUE APPOINTMENT ──────────────────────────────────────────────
const issueAppointment = async (req, res) => {
    try {
        const { applicant_id, vacancy_id } = req.body;

        // --- STEP 1: CREATE APPOINTMENT RECORD ---
        const postingDeadline = new Date();
        postingDeadline.setDate(postingDeadline.getDate() + 15);

        const [apptResult] = await db.query(`
            INSERT INTO appointments (applicant_id, vacancy_id, issued_by, issued_at, notice_posting_deadline) 
            VALUES (?, ?, ?, NOW(), ?)`, 
            [applicant_id, vacancy_id, req.user.id, postingDeadline]
        );

        await db.query(`UPDATE applications SET status = 'appointed' WHERE id = ?`, [applicant_id]);

        // --- STEP 2: STAGE ADVANCEMENT CHECK ---
        const [vac] = await db.query('SELECT no_of_vacancies, position_title FROM vacancies WHERE id = ?', [vacancy_id]);
        const [appointedCount] = await db.query('SELECT COUNT(*) as count FROM applications WHERE vacancy_id = ? AND status = "appointed"', [vacancy_id]);

        if (appointedCount[0].count >= vac[0].no_of_vacancies) {
            await db.query('UPDATE vacancies SET current_stage = 10 WHERE id = ?', [vacancy_id]);
            await syncApplicationsStage(vacancy_id, 10, req.app.get('socketio'));
        }

        await db.query(
            `INSERT INTO stage_history (application_id, stage_number, status, completed_at)
             VALUES (?, 10, 'completed', NOW()) ON DUPLICATE KEY UPDATE status='completed', completed_at=NOW()`,
            [applicant_id]
        );
        await db.query(`UPDATE applications SET current_stage = 10 WHERE id = ?`, [applicant_id]);

        await db.query(
            `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
            [applicant_id, 'Your appointment has been officially issued.']
        );

        await db.query(
            'INSERT INTO activity_log (vacancy_id, applicant_id, actor_id, action_description) VALUES (?, ?, ?, ?)',
            [vacancy_id, applicant_id, req.user.id, `Appointment issued for ${vac[0].position_title}`]
        );

        // --- SOCKET.IO BROADCAST ---
        const [[appFullName]] = await db.query('SELECT full_name FROM applications WHERE id = ?', [applicant_id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('rsp:dashboard:update');
            io.emit('notification:admin', {
                message: `Appointment issued to ${appFullName?.full_name || ''} for ${vac[0]?.position_title || ''}`,
                type: 'rsp'
            });
            io.to(`application-${applicant_id}`).emit('application:stage-update', {
                applicationId: applicant_id, status: 'appointed'
            });
        }

        res.status(201).json({ 
            message: "Appointment Issued successfully", 
            appointmentId: apptResult.insertId 
        });

    } catch (error) {
        console.error("issueAppointment Error:", error);
        res.status(500).json({ message: "Server error during issuance." });
    }
};

module.exports = {
    getProcessingAppointees,
    issueAppointment
};
