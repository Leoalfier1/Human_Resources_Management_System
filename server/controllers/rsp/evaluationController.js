const db = require('../../db');

/**
 * 1. GET EVALUATION QUEUE
 * Fetches all applicants for a vacancy who need screening.
 */
exports.getQueue = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) return res.status(400).json({ message: 'vacancy_id is required' });

        // Fetch applicants who are submitted, under_review, or already decided
        const [rows] = await db.query(`
            SELECT a.id, a.full_name, a.ref_no, a.ref_no AS applicant_code, a.status, a.submitted_at,
            (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id AND is_verified = 1) as verified_docs,
            (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id) as total_docs
            FROM applications a
            WHERE a.vacancy_id = ? AND a.status != 'draft'
            ORDER BY a.submitted_at ASC
        `, [vacancy_id]);

        // Get Vacancy progress info
        const [vacancy] = await db.query('SELECT position_title, ref_no, current_stage FROM vacancies WHERE id = ?', [vacancy_id]);

        // SLA: 1 working day per 30 applicants (same convention used elsewhere, e.g. results posting)
        const slaDays = Math.max(1, Math.ceil(rows.length / 30));

        res.json({ 
            queue: rows, 
            vacancy: vacancy[0],
            processing_time_label: `${slaDays} WD for ${rows.length} applicant${rows.length === 1 ? '' : 's'}`
        });
    } catch (err) {
        console.error('❌ GET QUEUE ERROR:', err);
        res.status(500).json({ message: 'Server error fetching evaluation queue' });
    }
};

/**
 * 2. GET APPLICANT DETAILS
 * Aggregates personal info, documents, and MQ criteria results.
 */
exports.getApplicantDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [appRows] = await db.query(`
            SELECT a.*, v.position_title 
            FROM applications a 
            JOIN vacancies v ON a.vacancy_id = v.id
            WHERE a.id = ?
        `, [id]);

        if (appRows.length === 0) return res.status(404).json({ message: 'Application not found' });
        const application = appRows[0];

        // Full required-document checklist for this vacancy, joined against whatever
        // the applicant has actually uploaded. Required docs with no matching upload
        // come back with file_path/id = NULL, which the frontend renders as "Not yet uploaded".
        //
        // UNION branch below is a safety net: if a vacancy has no rows in
        // vacancy_required_documents yet (nobody's configured a checklist for it),
        // this still surfaces whatever the applicant actually uploaded instead of
        // showing an empty panel.
        const [documents] = await db.query(`
            SELECT 
                vrd.id AS required_doc_id,
                vrd.document_type,
                vrd.is_mandatory,
                ad.id,
                ad.file_name,
                ad.file_path,
                ad.is_verified,
                ad.uploaded_at
            FROM vacancy_required_documents vrd
            LEFT JOIN application_documents ad 
                ON ad.document_type = vrd.document_type AND ad.application_id = ?
            WHERE vrd.vacancy_id = ?

            UNION ALL

            SELECT 
                NULL AS required_doc_id,
                ad.document_type,
                1 AS is_mandatory,
                ad.id,
                ad.file_name,
                ad.file_path,
                ad.is_verified,
                ad.uploaded_at
            FROM application_documents ad
            WHERE ad.application_id = ?
              AND ad.document_type NOT IN (
                  SELECT document_type FROM vacancy_required_documents WHERE vacancy_id = ?
              )

            ORDER BY is_mandatory DESC, document_type ASC
        `, [id, application.vacancy_id, id, application.vacancy_id]);

        // Fetch standard criteria for this vacancy and join with applicant's pass/fail status
        const [criteria] = await db.query(`
            SELECT m.id as criterion_id, m.criterion_label, m.is_required, r.passed
            FROM minimum_qualifications_checklist m
            LEFT JOIN applicant_qualification_results r ON m.id = r.criterion_id AND r.applicant_id = ?
            WHERE m.vacancy_id = ?
        `, [id, application.vacancy_id]);

        res.json({ application, documents, criteria });
    } catch (err) {
        console.error('❌ GET DETAILS ERROR:', err);
        res.status(500).json({ message: 'Server error fetching details' });
    }
};

/**
 * 3. VERIFY INDIVIDUAL DOCUMENT
 */
exports.verifyDocument = async (req, res) => {
    try {
        const { docId } = req.params;
        const is_verified = req.body?.is_verified !== undefined ? req.body.is_verified : 1;
        const [result] = await db.query(`UPDATE application_documents SET is_verified = ? WHERE id = ?`, [is_verified, docId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `No document found with id ${docId}` });
        }

        res.json({ message: 'Document verification updated' });
    } catch (err) {
        console.error('❌ VERIFY DOCUMENT ERROR:', err);
        res.status(500).json({ message: 'Failed to verify document', details: err.message });
    }
};

/**
 * 4. UPDATE QUALIFICATION CRITERION (Pass/Fail)
 */
exports.updateCriterion = async (req, res) => {
    try {
        const { id, criterionId } = req.params;
        const { passed } = req.body; // true or false

        await db.query(`
            INSERT INTO applicant_qualification_results (applicant_id, criterion_id, passed)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE passed = VALUES(passed)
        `, [id, criterionId, passed ? 1 : 0]);

        res.json({ message: 'Criterion updated' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update criterion' });
    }
};

/**
 * 5. SUBMIT INDIVIDUAL DECISION (Qualify/Disqualify)
 * This logs the individual progress for the applicant.
 */
exports.submitDecision = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision } = req.body; // 'qualified' or 'disqualified'
        const userId = req.user.id;

        if (!['qualified', 'disqualified'].includes(decision)) {
            return res.status(400).json({ message: 'Invalid decision type' });
        }

        // 1. Update Application Status
        await db.query(`UPDATE applications SET status = ?, evaluated_at = NOW(), evaluated_by = ? WHERE id = ?`, 
            [decision, userId, id]);

        // 2. Add to Stage History (Stage 3)
        await db.query(`
            INSERT INTO stage_history (application_id, stage_number, status, completed_at, updated_by)
            VALUES (?, 3, 'completed', NOW(), ?)
            ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW(), updated_by = VALUES(updated_by)
        `, [id, userId]);

        // 3. Applicant-facing notification
        const [appRows] = await db.query(
            `SELECT v.position_title FROM applications a JOIN vacancies v ON a.vacancy_id = v.id WHERE a.id = ?`,
            [id]
        );
        const posTitle = appRows[0]?.position_title || 'this position';
        const notifMessage = decision === 'qualified'
            ? `Your application for ${posTitle} has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.`
            : `Your application for ${posTitle} has been evaluated. Unfortunately, you did not meet the minimum qualification standards required for this position.`;

        const [notifResult] = await db.query(
            `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
            [id, notifMessage]
        );

        // 4. Notify Applicant via Socket
        const io = req.app.get('socketio');
        if (io) {
            io.to(`application-${id}`).emit('application:stage-update', { status: decision });
            io.to(`application-${id}`).emit('application:notification', {
                id: notifResult.insertId,
                message: notifMessage,
                created_at: new Date()
            });
            io.emit('rsp:dashboard:update'); // Refresh Admin stats
        }

        res.json({ message: `Applicant marked as ${decision}` });
    } catch (err) {
        console.error('❌ SUBMIT DECISION ERROR:', err);
        res.status(500).json({ message: 'Database error while saving decision.' });
    }
};

/**
 * 6. FINALIZE EVALUATION (THE HARD GATE)
 * Advances the entire Vacancy to the next stage once all applicants are processed.
 */
exports.finalizeInitialEvaluation = async (req, res) => {
    try {
        const { vacancy_id } = req.body;
        const userId = req.user.id;

        // A. VALIDATION: Check if any applicants are still just "submitted" (unprocessed)
        const [pending] = await db.query(
            "SELECT COUNT(*) as count FROM applications WHERE vacancy_id = ? AND status = 'submitted'",
            [vacancy_id]
        );

        if (pending[0].count > 0) {
            return res.status(400).json({ 
                message: `Action Blocked: ${pending[0].count} applicants have not been evaluated yet. Please qualify or disqualify all candidates first.` 
            });
        }

        // B. ADVANCE VACANCY: Move from Stage 3 -> Stage 5 (Posting of Qualified List)
        // (Stage 4 is usually internal validation, often skipped or merged into 3/5 in digital workflows)
        await db.query('UPDATE vacancies SET current_stage = 5, updated_at = NOW() WHERE id = ?', [vacancy_id]);

        // C. LOG AUDIT TRAIL
        await db.query(
            'INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)',
            [vacancy_id, userId, `Initial Evaluation finalized. Process advanced to Stage 5.`]
        );

        // D. BROADCAST UPDATE
        const io = req.app.get('socketio');
        if (io) io.emit('rsp:dashboard:update');

        res.json({ message: "Initial Evaluation Phase Complete. Vacancy advanced to Stage 5." });

    } catch (error) {
        console.error('❌ FINALIZE ERROR:', error);
        res.status(500).json({ message: "Server error during finalization." });
    }
};