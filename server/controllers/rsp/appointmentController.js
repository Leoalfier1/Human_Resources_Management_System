const db = require('../../db');

const REQUIRED_APPT_DOCS = [
    "Official Transcript of Records",
    "Original Diploma (BSEd)",
    "Updated Personal Data Sheet (CS Form 212)",
    "NBI Clearance (issued within 6 months)",
    "Medical Certificate (from government hospital)",
    "Dental Certificate",
    "4 pcs. Passport-size ID photos (white background)",
    "Marriage Certificate (for married female)",
    "Authenticated Service Record",
    "Certificate of No Pending Administrative Case"
];

// ── 1. GET APPOINTEES FOR PROCESSING ─────────────────────────────
// Returns applicants with status 'selected' or 'appointed' for a vacancy
const getProcessingAppointees = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) return res.status(400).json({ message: 'vacancy_id is required' });

        const [rows] = await db.query(`
            SELECT 
                a.id,
                a.full_name,
                a.ref_no AS applicant_code,
                a.status,
                v.position_title,
                v.assigned_school,
                v.salary_grade,
                IFNULL(r.total_score, 0) AS total_score,
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

// ── 2. GET DOCUMENT CHECKLIST ─────────────────────────────────────
// Seeds the 10-doc list if not yet created, returns status per doc
const getDocuments = async (req, res) => {
    try {
        const { applicantId } = req.params;

        // Seed if first time
        const [existing] = await db.query(
            'SELECT id FROM appointment_documents WHERE applicant_id = ?',
            [applicantId]
        );

        if (existing.length === 0) {
            const seedData = REQUIRED_APPT_DOCS.map(docType => [
                applicantId, docType, true, 'not_uploaded'
            ]);
            await db.query(
                `INSERT INTO appointment_documents
                    (applicant_id, document_type, is_required, verification_status)
                 VALUES ?`,
                [seedData]
            );
        }

        const [docs] = await db.query(
            'SELECT * FROM appointment_documents WHERE applicant_id = ? ORDER BY id ASC',
            [applicantId]
        );

        const stats = {
            total:    docs.length,
            verified: docs.filter(d => d.verification_status === 'verified').length,
            uploaded: docs.filter(d => d.verification_status === 'uploaded_pending_review').length,
            pending:  docs.filter(d => d.verification_status === 'not_uploaded').length
        };

        res.json({ documents: docs, stats });
    } catch (error) {
        console.error('getDocuments Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── 3. VERIFY DOCUMENT ────────────────────────────────────────────
const verifyDocument = async (req, res) => {
    try {
        const { documentId } = req.params;

        const [result] = await db.query(
            `UPDATE appointment_documents
             SET verification_status = 'verified', verified_at = NOW()
             WHERE id = ?`,
            [documentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.json({ message: 'Document verified successfully' });
    } catch (error) {
        console.error('verifyDocument Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── 4. UPLOAD DOCUMENT (HR on behalf of appointee) ────────────────
const uploadDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const filePath = req.file ? req.file.path.replace(/\\/g, '/') : null;

        if (!filePath) return res.status(400).json({ message: 'No file provided.' });

        await db.query(
            `UPDATE appointment_documents
             SET file_path = ?, file_name = ?, verification_status = 'uploaded_pending_review'
             WHERE id = ?`,
            [filePath, req.file.originalname, documentId]
        );

        res.json({ message: 'File uploaded successfully', path: filePath });
    } catch (error) {
        console.error('uploadDocument Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── 5. ISSUE APPOINTMENT (Hard Gate) ─────────────────────────────
// 5. ISSUE APPOINTMENT (The "Hard Gate")
const issueAppointment = async (req, res) => {
    try {
        const { applicant_id, vacancy_id } = req.body;

        // --- STEP 1: VALIDATION ---
        // Check if there are any required documents that are NOT verified
        const [pending] = await db.query(`
            SELECT document_type FROM appointment_documents 
            WHERE applicant_id = ? AND is_required = TRUE AND verification_status != 'verified'`, 
            [applicant_id]
        );

        if (pending.length > 0) {
            const pendingList = pending.map(d => d.document_type).join(', ');
            return res.status(400).json({ 
                message: `${pending.length} documents still pending. Cannot issue appointment: (${pendingList})` 
            });
        }

        // --- STEP 2: CREATE APPOINTMENT RECORD ---
        const postingDeadline = new Date();
        postingDeadline.setDate(postingDeadline.getDate() + 15); // Deadline is 15 days from issuance

        const [apptResult] = await db.query(`
            INSERT INTO appointments (applicant_id, vacancy_id, issued_by, issued_at, notice_posting_deadline) 
            VALUES (?, ?, ?, NOW(), ?)`, 
            [applicant_id, vacancy_id, req.user.id, postingDeadline]
        );

        // Update applicant status to 'appointed'
        await db.query(`UPDATE applications SET status = 'appointed' WHERE id = ?`, [applicant_id]);

        // --- STEP 3: STAGE ADVANCEMENT CHECK ---
        const [vac] = await db.query('SELECT no_of_vacancies, position_title FROM vacancies WHERE id = ?', [vacancy_id]);
        const [appointedCount] = await db.query('SELECT COUNT(*) as count FROM applications WHERE vacancy_id = ? AND status = "appointed"', [vacancy_id]);

        // If all slots for this vacancy are filled, move to Stage 11 (Final)
        if (appointedCount[0].count >= vac[0].no_of_vacancies) {
            await db.query('UPDATE vacancies SET current_stage = 11 WHERE id = ?', [vacancy_id]);
        }

        // Per-applicant stage tracking: this applicant has now completed Stage 11
        // (Issuance of Appointment) regardless of whether all vacancy slots are filled
        await db.query(
            `INSERT INTO stage_history (application_id, stage_number, status, completed_at)
             VALUES (?, 11, 'completed', NOW()) ON DUPLICATE KEY UPDATE status='completed', completed_at=NOW()`,
            [applicant_id]
        );
        await db.query(`UPDATE applications SET current_stage = 11 WHERE id = ?`, [applicant_id]);

        // Notify the applicant
        await db.query(
            `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
            [applicant_id, 'Your appointment has been officially issued.']
        );

        // Log the activity
        await db.query(
            'INSERT INTO activity_log (vacancy_id, applicant_id, actor_id, action_description) VALUES (?, ?, ?, ?)',
            [vacancy_id, applicant_id, req.user.id, `Appointment issued for ${vac[0].position_title}`]
        );

        // --- STEP 4: SOCKET.IO BROADCAST ---
        const io = req.app.get('socketio');
        if (io) {
            console.log("📢 Broadcasting: Final Appointment Issued");
            io.emit('rsp:dashboard:update'); // Refresh Dashboard counts
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
    getDocuments,
    verifyDocument,
    uploadDocument,
    issueAppointment
};