const db = require('../../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 1. MULTER CONFIGURATION FOR WIZARD UPLOADS ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../../uploads/applications');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `DOC-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('file');


// --- 2. GET OR CREATE DRAFT (Step 1 of Wizard) ---
exports.createOrGetDraft = async (req, res) => {
    try {
        const { vacancy_id } = req.body;
        const applicant_id = req.user.id;

        const [existing] = await db.query(
            "SELECT * FROM applications WHERE vacancy_id = ? AND applicant_id = ? LIMIT 1",
            [vacancy_id, applicant_id]
        );

        if (existing.length > 0) {
            return res.json({ applicationId: existing[0].id, application: existing[0] });
        }

        const [userRow] = await db.query('SELECT full_name, email FROM users WHERE id = ?', [applicant_id]);
        const fullName = userRow.length > 0 ? userRow[0].full_name : req.user.name || 'Unknown';
        const email = userRow.length > 0 ? userRow[0].email : req.user.email || '';

        const [result] = await db.query(
            `INSERT INTO applications (vacancy_id, applicant_id, full_name, email, status) 
             VALUES (?, ?, ?, ?, 'draft')`,
            [vacancy_id, applicant_id, fullName, email]
        );

        res.json({ applicationId: result.insertId });
    } catch (error) {
        console.error('Draft Error:', error);
        res.status(500).json({ message: 'Could not initialize application.' });
    }
};


// --- 3. GET LATEST SUBMITTED APPLICATION (Used by ApplicationStatus & AdviceNextSteps) ---
exports.getLatestApplication = async (req, res) => {
    try {
        const applicant_id = req.user.id;

        // Get the most recent non-draft application for this user
        const [rows] = await db.query(
            `SELECT id, ref_no, status, vacancy_id, submitted_at 
             FROM applications 
             WHERE applicant_id = ? AND status != 'draft' 
             ORDER BY submitted_at DESC 
             LIMIT 1`,
            [applicant_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No active applications found.' });
        }

        res.json({ applicationId: rows[0].id, application: rows[0] });
    } catch (error) {
        console.error('getLatestApplication Error:', error);
        res.status(500).json({ message: 'Could not fetch latest application.' });
    }
};


// --- 4. PATCH UPDATE INFO (Saving progress in Wizard) ---
exports.updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, phone, current_school, years_experience, status } = req.body;
        const applicant_id = req.user.id;

        const [appCheck] = await db.query(
            'SELECT * FROM applications WHERE id = ? AND applicant_id = ?',
            [id, applicant_id]
        );
        if (appCheck.length === 0) return res.status(403).json({ message: 'Unauthorized access.' });

        // CASE A: Drafting / progress save
        if (status !== 'submitted') {
            await db.query(
                `UPDATE applications SET full_name=?, email=?, phone=?, current_school=?, years_experience=? WHERE id=?`,
                [full_name, email, phone, current_school, years_experience, id]
            );
            return res.json({ message: 'Progress saved successfully.' });
        }

        // CASE B: Final submission
        // CASE B: Final submission
if (status === 'submitted') {
    const year = new Date().getFullYear();
    const ref_no = `APP-${String(id).padStart(3, '0')}-${year}`;

    await db.query(
        `UPDATE applications SET status='submitted', submitted_at=NOW(), ref_no=? WHERE id=?`,
        [ref_no, id]
    );

    const [vacInfo] = await db.query(
        'SELECT position_title, assigned_school FROM vacancies WHERE id = ?',
        [appCheck[0].vacancy_id]
    );
    const posTitle = vacInfo[0]?.position_title || 'Position';
    const school = vacInfo[0]?.assigned_school || '';
    const appFullName = appCheck[0].full_name; // ← ADD THIS LINE

    await db.query(
        `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
        [appCheck[0].vacancy_id, applicant_id,
         `New application submitted for ${posTitle} (${ref_no}) by ${appFullName}`] // ← use appFullName here
    );

    const notifMessage = `Your application for ${posTitle}${school ? ` at ${school}` : ''} has been successfully received. Reference No: ${ref_no}. Your documents are now under review.`;
            const [notifResult] = await db.query(
                `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
                [id, notifMessage]
            );

            const io = req.app.get('socketio');
            if (io) {
                io.emit('rsp:dashboard:update');
                io.emit('notification:admin', {
                    message: `New application: ${full_name} applied for ${posTitle}`
                });
                io.to(`application-${id}`).emit('application:notification', {
                    id: notifResult.insertId,
                    message: notifMessage,
                    created_at: new Date()
                });
                io.to(`application-${id}`).emit('application:stage-update', { status: 'submitted' });
            }

            return res.json({ message: 'Application submitted!', ref_no });
        }

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error processing submission.' });
    }
};


// --- 5. FILE UPLOAD HANDLER ---
exports.uploadDocument = (req, res) => {
    upload(req, res, async function (err) {
        if (err) return res.status(400).json({ message: err.message });
        if (!req.file) return res.status(400).json({ message: 'No file selected.' });

        try {
            const { id } = req.params;
            const { document_type } = req.body;
            const file_path = `/uploads/applications/${req.file.filename}`;

            const [result] = await db.query(
                `INSERT INTO application_documents (application_id, document_type, file_name, file_path) 
                 VALUES (?, ?, ?, ?)`,
                [id, document_type, req.file.originalname, file_path]
            );

            res.json({
                message: 'Upload success',
                document: {
                    id: result.insertId,
                    document_type,
                    file_name: req.file.originalname,
                    file_path
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Database error saving file.' });
        }
    });
};


// --- 6. DELETE DOCUMENT ---
exports.deleteDocument = async (req, res) => {
    try {
        const { id, docId } = req.params;
        const applicant_id = req.user.id;

        // Verify the application belongs to this user
        const [appCheck] = await db.query(
            'SELECT id FROM applications WHERE id = ? AND applicant_id = ?',
            [id, applicant_id]
        );
        if (appCheck.length === 0) return res.status(403).json({ message: 'Unauthorized.' });

        // Fetch the file path so we can delete it from disk
        const [docRows] = await db.query(
            'SELECT file_path FROM application_documents WHERE id = ? AND application_id = ?',
            [docId, id]
        );
        if (docRows.length === 0) return res.status(404).json({ message: 'Document not found.' });

        // Delete from disk (ignore error if file is already gone)
        const fullPath = path.join(__dirname, '../../', docRows[0].file_path);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        // Delete from DB
        await db.query('DELETE FROM application_documents WHERE id = ?', [docId]);

        res.json({ message: 'Document removed.' });
    } catch (error) {
        console.error('deleteDocument Error:', error);
        res.status(500).json({ message: 'Could not delete document.' });
    }
};


// --- 7. GET APPLICATION BY ID (Review Page) ---
exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const applicant_id = req.user.id;

        const [rows] = await db.query(
            "SELECT * FROM applications WHERE id = ? AND applicant_id = ?",
            [id, applicant_id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });

        const [docs] = await db.query(
            "SELECT * FROM application_documents WHERE application_id = ?",
            [id]
        );
        res.json({ ...rows[0], documents: docs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// --- 8. GET APPLICATION STATUS (Status Tracker Page) ---
exports.getApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const applicant_id = req.user.id;

        const [app] = await db.query(`
            SELECT a.*, v.position_title, v.subject, v.assigned_school, v.ref_no as vacancy_ref,
                   s.name as school_name
            FROM applications a 
            JOIN vacancies v ON a.vacancy_id = v.id 
            LEFT JOIN schools s ON s.name = v.assigned_school
            WHERE a.id = ? AND a.applicant_id = ?`, [id, applicant_id]);

        if (app.length === 0) return res.status(404).json({ message: 'Application not found.' });

        const [history] = await db.query(
            "SELECT * FROM stage_history WHERE application_id = ? ORDER BY stage_number ASC",
            [id]
        );

        const [notifs] = await db.query(
            "SELECT * FROM notifications WHERE application_id = ? ORDER BY created_at DESC",
            [id]
        );

        // Fetch CA score if available
        const [scoreRows] = await db.query(`
            SELECT 
                r.total_score,
                r.category_subscore_classroom   as classroom_score,
                r.category_subscore_nonclassroom as nonclassroom_score,
                r.category_subscore_document    as document_score,
                60 as classroom_max,
                20 as nonclassroom_max,
                20 as document_max,
                RANK() OVER (
                    PARTITION BY a.vacancy_id 
                    ORDER BY r.total_score DESC
                ) as rank_position,
                (SELECT COUNT(*) FROM applications 
                 WHERE vacancy_id = a.vacancy_id 
                 AND status IN ('qualified','shortlisted','selected','appointed')
                ) as rank_total
            FROM comparative_assessment_results r
            JOIN applications a ON a.id = r.applicant_id
            WHERE r.applicant_id = ?
        `, [id]);

        res.json({
            application: app[0],
            stageHistory: history,
            notifications: notifs,
            score: scoreRows.length > 0 ? scoreRows[0] : null
        });
    } catch (error) {
        console.error('getApplicationStatus Error:', error);
        res.status(500).json({ message: error.message });
    }
};