const db = require('../../db');

exports.getPendingAppeals = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ap.*, a.full_name, a.email, v.position_title, v.ref_no as vacancy_ref
            FROM appeals ap
            JOIN applications a ON a.id = ap.application_id
            JOIN vacancies v ON v.id = a.vacancy_id
            WHERE ap.status = 'pending'
            ORDER BY ap.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.respondToAppeal = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, adminResponse } = req.body;

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ message: 'Decision must be approved or rejected.' });
        }

        const [appeal] = await db.query('SELECT * FROM appeals WHERE id = ?', [id]);
        if (appeal.length === 0) return res.status(404).json({ message: 'Appeal not found.' });

        await db.query(
            'UPDATE appeals SET status = ?, admin_response = ?, reviewed_at = NOW() WHERE id = ?',
            [decision, adminResponse || null, id]
        );

        if (decision === 'approved') {
            await db.query(
                "UPDATE applications SET status = 'for_evaluation' WHERE id = ?",
                [appeal[0].application_id]
            );
        }

        const io = req.app.get('socketio');
        if (io) {
            io.to(`application-${appeal[0].application_id}`).emit('application:stage-update', { status: decision });
        }

        res.json({ message: `Appeal ${decision}.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
