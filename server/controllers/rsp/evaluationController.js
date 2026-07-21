const db = require('../../db');
const syncApplicationsStage = require('../../utils/syncApplicationsStage');

const MIN_REVISION_REASON_LENGTH = 10;

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
            SELECT a.*, v.position_title, v.position_type
            FROM applications a 
            JOIN vacancies v ON a.vacancy_id = v.id
            WHERE a.id = ?
        `, [id]);

        if (appRows.length === 0) return res.status(404).json({ message: 'Application not found' });
        const application = appRows[0];

        // Check if verification_status column exists (migration 020)
        const [colCheck] = await db.query(`
            SELECT COUNT(*) AS has_col FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'application_documents'
              AND COLUMN_NAME = 'verification_status'
        `);
        const hasVS = colCheck[0]?.has_col > 0;

        // Build dynamic extra columns so the query works before and after migration 020
        const vsCols = hasVS
            ? `ad.verification_status, ad.verification_note,
               ad.verified_by, ad.verified_at,
               ad.revision_note, ad.revision_requested_by, ad.revision_requested_at,`
            : '';
        const vsFilter1 = hasVS ? "AND (ad.verification_status IS NULL OR ad.verification_status != 'superseded')" : '';
        const vsFilter2 = hasVS ? "AND ad.verification_status != 'superseded'" : '';

        const [documents] = await db.query(`
            SELECT 
                vrd.id AS required_doc_id,
                vrd.document_type,
                vrd.is_mandatory,
                ${vsCols}
                ad.id, ad.file_name, ad.file_path, ad.is_verified, ad.uploaded_at
            FROM vacancy_required_documents vrd
            LEFT JOIN application_documents ad 
                ON ad.document_type = vrd.document_type AND ad.application_id = ?
            WHERE vrd.vacancy_id = ?
            ${vsFilter1}

            UNION ALL

            SELECT 
                NULL AS required_doc_id,
                ad.document_type,
                1 AS is_mandatory,
                ${vsCols}
                ad.id, ad.file_name, ad.file_path, ad.is_verified, ad.uploaded_at
            FROM application_documents ad
            WHERE ad.application_id = ?
              ${vsFilter2}
              AND ad.document_type NOT IN (
                  SELECT document_type FROM vacancy_required_documents WHERE vacancy_id = ?
              )

            ORDER BY is_mandatory DESC, document_type ASC
        `, [id, application.vacancy_id, id, application.vacancy_id]);

        const [criteria] = await db.query(`
            SELECT m.id as criterion_id, m.criterion_label, m.is_required, r.passed,
                   r.evaluated_by, r.evaluated_at
            FROM minimum_qualifications_checklist m
            LEFT JOIN applicant_qualification_results r ON m.id = r.criterion_id AND r.applicant_id = ?
            WHERE m.vacancy_id = ?
        `, [id, application.vacancy_id]);

        const requiredCriteriaTotal = criteria.filter(c => c.is_required).length;
        const requiredCriteriaMet = criteria.filter(c => c.is_required && c.passed === 1).length;
        const requiredDocsTotal = documents.filter(d => d.is_mandatory).length;
        // A doc counts as verified only if is_verified=1 AND verification_status='verified'
        // Falls back to just is_verified if verification_status column doesn't exist yet (pre-migration)
        const requiredDocsVerified = documents.filter(d =>
            d.is_mandatory && d.is_verified && (hasVS ? d.verification_status === 'verified' : true)
        ).length;
        const allRequiredMet = requiredCriteriaTotal === 0 || requiredCriteriaMet === requiredCriteriaTotal;
        const allRequiredDocsVerified = requiredDocsTotal === 0 || requiredDocsVerified === requiredDocsTotal;

        res.json({
            application, documents, criteria,
            readiness: {
                allCriteriaMet: allRequiredMet,
                requiredCriteriaMet,
                requiredCriteriaTotal,
                allDocsVerified: allRequiredDocsVerified,
                requiredDocsVerified,
                requiredDocsTotal,
                canQualify: allRequiredMet && allRequiredDocsVerified
            }
        });
    } catch (err) {
        console.error('❌ GET DETAILS ERROR:', err);
        res.status(500).json({ message: 'Server error fetching details' });
    }
};

/**
 * 3. VERIFY INDIVIDUAL DOCUMENT
 * Sets verification_status='verified', records verified_by/verified_at, optional note.
 * Emits application:notification to the applicant.
 */
exports.verifyDocument = async (req, res) => {
    try {
        const { docId } = req.params;
        const userId = req.user.id;
        const { note } = req.body || {};

        // Fetch the document + application_id for the notification
        const [docRows] = await db.query(
            `SELECT ad.id, ad.document_type, ad.application_id
             FROM application_documents ad WHERE ad.id = ?`, [docId]
        );
        if (docRows.length === 0) {
            return res.status(404).json({ message: `No document found with id ${docId}` });
        }
        const doc = docRows[0];

        const [result] = await db.query(
            `UPDATE application_documents
             SET is_verified = 1,
                 verification_status = 'verified',
                 verification_note = ?,
                 verified_by = ?,
                 verified_at = NOW()
             WHERE id = ?`,
            [note || null, userId, docId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `No document found with id ${docId}` });
        }

        // Notify the applicant
        const notifMessage = note
            ? `Your ${doc.document_type} has been verified. Note: ${note}`
            : `Your ${doc.document_type} has been verified.`;

        const [notifResult] = await db.query(
            `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
            [doc.application_id, notifMessage]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.to(`application-${doc.application_id}`).emit('application:document-update', {
                document_type: doc.document_type,
                verification_status: 'verified'
            });
            io.to(`application-${doc.application_id}`).emit('application:notification', {
                id: notifResult.insertId,
                message: notifMessage,
                created_at: new Date()
            });
        }

        res.json({ message: 'Document verified', verification_status: 'verified' });
    } catch (err) {
        console.error('❌ VERIFY DOCUMENT ERROR:', err);
        res.status(500).json({ message: 'Failed to verify document', details: err.message });
    }
};

/**
 * 3b. REQUEST DOCUMENT REVISION
 * Sets verification_status='needs_revision', records revision reason, who/when.
 * Emits application:notification with the specific reason to the applicant.
 */
exports.requestRevision = async (req, res) => {
    try {
        const { docId } = req.params;
        const userId = req.user.id;
        const { reason } = req.body || {};

        if (!reason || typeof reason !== 'string' || reason.trim().length < MIN_REVISION_REASON_LENGTH) {
            return res.status(422).json({
                message: `Reason for revision is required (minimum ${MIN_REVISION_REASON_LENGTH} characters).`
            });
        }

        // Fetch document + application_id
        const [docRows] = await db.query(
            `SELECT ad.id, ad.document_type, ad.application_id
             FROM application_documents ad WHERE ad.id = ?`, [docId]
        );
        if (docRows.length === 0) {
            return res.status(404).json({ message: `No document found with id ${docId}` });
        }
        const doc = docRows[0];

        const [result] = await db.query(
            `UPDATE application_documents
             SET is_verified = 0,
                 verification_status = 'needs_revision',
                 revision_note = ?,
                 revision_requested_by = ?,
                 revision_requested_at = NOW()
             WHERE id = ?`,
            [reason.trim(), userId, docId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `No document found with id ${docId}` });
        }

        // Notify the applicant
        const notifMessage = `Your ${doc.document_type} needs revision: ${reason.trim()}. Please resubmit the corrected document.`;

        const [notifResult] = await db.query(
            `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
            [doc.application_id, notifMessage]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.to(`application-${doc.application_id}`).emit('application:document-update', {
                document_type: doc.document_type,
                verification_status: 'needs_revision',
                revision_note: reason.trim()
            });
            io.to(`application-${doc.application_id}`).emit('application:notification', {
                id: notifResult.insertId,
                message: notifMessage,
                created_at: new Date()
            });
        }

        res.json({ message: 'Revision requested', verification_status: 'needs_revision' });
    } catch (err) {
        console.error('❌ REQUEST REVISION ERROR:', err);
        res.status(500).json({ message: 'Failed to request revision', details: err.message });
    }
};
exports.updateCriterion = async (req, res) => {
    try {
        const { id, criterionId } = req.params;
        const { passed, reason } = req.body;
        const userId = req.user.id;

        await db.query(`
            INSERT INTO applicant_qualification_results (applicant_id, criterion_id, passed, evaluated_by, evaluated_at, criterion_reason)
            VALUES (?, ?, ?, ?, NOW(), ?)
            ON DUPLICATE KEY UPDATE passed = VALUES(passed), evaluated_by = VALUES(evaluated_by), evaluated_at = NOW(), criterion_reason = VALUES(criterion_reason)
        `, [id, criterionId, passed ? 1 : 0, userId, reason || null]);

        res.json({ message: 'Criterion updated' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update criterion' });
    }
};

/**
 * 5. SUBMIT INDIVIDUAL DECISION (Qualify/Disqualify)
 * Server-side validation: 'qualified' requires all required criteria met + all required docs verified.
 */
exports.submitDecision = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, remarks } = req.body;
        const userId = req.user.id;

        if (!['qualified', 'disqualified'].includes(decision)) {
            return res.status(400).json({ message: 'Invalid decision type' });
        }

        if (decision === 'disqualified') {
            if (!remarks || typeof remarks !== 'string' || remarks.trim().length < 10) {
                return res.status(422).json({
                    message: 'Remarks are required for disqualification (minimum 10 characters).'
                });
            }
        }

        if (decision === 'qualified') {
            const [appRows] = await db.query(
                "SELECT vacancy_id FROM applications WHERE id = ?", [id]
            );
            if (appRows.length === 0) return res.status(404).json({ message: 'Application not found' });
            const vacancyId = appRows[0].vacancy_id;

            const [criteria] = await db.query(`
                SELECT m.id, m.is_required, r.passed
                FROM minimum_qualifications_checklist m
                LEFT JOIN applicant_qualification_results r ON m.id = r.criterion_id AND r.applicant_id = ?
                WHERE m.vacancy_id = ? AND m.is_required = 1
            `, [id, vacancyId]);

            const unmetCriteria = criteria.filter(c => c.passed !== 1);
            if (unmetCriteria.length > 0) {
                return res.status(422).json({
                    message: `Cannot qualify: ${unmetCriteria.length} required criteria not met`,
                    missing_criteria: unmetCriteria.map(c => c.id)
                });
            }

            // Check if verification_status column exists (migration 020)
            const [vsCol] = await db.query(`
                SELECT COUNT(*) AS has_col FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'application_documents'
                  AND COLUMN_NAME = 'verification_status'
            `);
            const hasVSCol = vsCol[0]?.has_col > 0;

            const docStatusCol = hasVSCol ? ', ad.verification_status' : '';
            const [docs] = await db.query(`
                SELECT vrd.id, vrd.is_mandatory, ad.is_verified${docStatusCol}
                FROM vacancy_required_documents vrd
                LEFT JOIN application_documents ad ON ad.document_type = vrd.document_type AND ad.application_id = ?
                WHERE vrd.vacancy_id = ? AND vrd.is_mandatory = 1
            `, [id, vacancyId]);

            const unverifiedDocs = docs.filter(d =>
                !d.is_verified || (hasVSCol && d.verification_status !== 'verified')
            );
            if (unverifiedDocs.length > 0) {
                return res.status(422).json({
                    message: `Cannot qualify: ${unverifiedDocs.length} required documents not verified`,
                    missing_docs: unverifiedDocs.map(d => d.id)
                });
            }
        }

        if (decision === 'disqualified') {
            await db.query(
                `UPDATE applications SET status = ?, current_stage = 3, evaluated_at = NOW(), evaluated_by = ?, initial_evaluation_remarks = ?, disqualification_recorded_by = ?, disqualification_recorded_at = NOW() WHERE id = ?`,
                [decision, userId, remarks.trim(), userId, id]
            );
            await db.query(
                `INSERT INTO application_disqualification_history (application_id, reason, recorded_by, recorded_at) VALUES (?, ?, ?, NOW())`,
                [id, remarks.trim(), userId]
            );
        } else {
            await db.query(
                `UPDATE applications SET status = ?, evaluated_at = NOW(), evaluated_by = ? WHERE id = ?`,
                [decision, userId, id]
            );
        }

        await db.query(`
            INSERT INTO stage_history (application_id, stage_number, status, completed_at, updated_by)
            VALUES (?, 3, 'completed', NOW(), ?)
            ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW(), updated_by = VALUES(updated_by)
        `, [id, userId]);

        const [appRows] = await db.query(
            `SELECT a.full_name, v.position_title FROM applications a JOIN vacancies v ON a.vacancy_id = v.id WHERE a.id = ?`,
            [id]
        );
        const posTitle = appRows[0]?.position_title || 'this position';
        const appFullName = appRows[0]?.full_name || 'Applicant';
        const notifMessage = decision === 'qualified'
            ? `Your application for ${posTitle} has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.`
            : `Your application for ${posTitle} has been evaluated. Unfortunately, you did not meet the minimum qualification standards required for this position.${remarks ? ' Reason: ' + remarks.trim() : ''}`;

        const [notifResult] = await db.query(
            `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
            [id, notifMessage]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.to(`application-${id}`).emit('application:stage-update', { status: decision });
            io.to(`application-${id}`).emit('application:notification', {
                id: notifResult.insertId,
                message: notifMessage,
                created_at: new Date()
            });
            io.emit('rsp:initial-evaluation-decided', {
                applicationId: id,
                applicantName: appFullName,
                positionTitle: posTitle,
                decision,
                remarks: decision === 'disqualified' ? remarks.trim() : null,
                decidedBy: userId,
                decidedAt: new Date()
            });
            io.emit('rsp:dashboard:update');
            io.emit('notification:admin', {
                message: `Applicant ${appFullName} marked as ${decision} for ${posTitle}`,
                type: 'rsp'
            });
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
        await syncApplicationsStage(vacancy_id, 5, req.app.get('socketio'));

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