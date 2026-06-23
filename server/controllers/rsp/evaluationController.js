const db = require('../../db');

const getQueue = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) return res.status(400).json({ message: "Vacancy ID required" });

        const [rows] = await db.query(
            `SELECT id, applicant_code, full_name, status 
             FROM applicants 
             WHERE vacancy_id = ? AND status IN ('submitted', 'under_evaluation', 'qualified', 'disqualified')
             ORDER BY date_submitted ASC`, 
            [vacancy_id]
        );

        const [vacancy] = await db.query(`SELECT position_title, ref_no FROM vacancies WHERE id = ?`, [vacancy_id]);
        
        const count = rows.length;
        const wd = Math.ceil(count / 30); // DepEd Rule: 1 WD per 30 applicants

        res.json({
            vacancy: vacancy[0],
            queue: rows,
            processing_time_label: `${wd} WD for ${count} applicants`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getApplicantDetails = async (req, res) => {
    try {
        const { applicantId } = req.params;

        // 1. Get Checklist Results
        const [criteria] = await db.query(`
            SELECT mqc.id as criterion_id, mqc.criterion_label, mqc.is_required, aqr.passed
            FROM minimum_qualifications_checklist mqc
            JOIN applicants a ON a.vacancy_id = mqc.vacancy_id
            LEFT JOIN applicant_qualification_results aqr ON aqr.criterion_id = mqc.id AND aqr.applicant_id = a.id
            WHERE a.id = ?`, [applicantId]);

        // 2. Get Documents
        const [docs] = await db.query(`
            SELECT id, document_type, is_required, file_path, verification_status 
            FROM applicant_documents 
            WHERE applicant_id = ?`, [applicantId]);

        res.json({ criteria, documents: docs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const finalizeDecision = async (req, res) => {
    try {
        const { applicantId } = req.params;
        const { decision } = req.body; // 'qualified' or 'disqualified'

        if (decision === 'qualified') {
            // Check Required Criteria
            const [failedCriteria] = await db.query(`
                SELECT mqc.criterion_label FROM minimum_qualifications_checklist mqc
                JOIN applicants a ON a.vacancy_id = mqc.vacancy_id
                LEFT JOIN applicant_qualification_results aqr ON aqr.criterion_id = mqc.id AND aqr.applicant_id = a.id
                WHERE a.id = ? AND mqc.is_required = TRUE AND (aqr.passed IS NULL OR aqr.passed = FALSE)
            `, [applicantId]);

            // Check Required Documents
            const [unverifiedDocs] = await db.query(`
                SELECT document_type FROM applicant_documents 
                WHERE applicant_id = ? AND is_required = TRUE AND verification_status != 'verified'
            `, [applicantId]);

            if (failedCriteria.length > 0 || unverifiedDocs.length > 0) {
                const criteriaNames = failedCriteria.map(c => c.criterion_label).join(', ');
                const docNames = unverifiedDocs.map(d => d.document_type).join(', ');
                let msg = "Cannot mark as qualified: ";
                if (criteriaNames) msg += `Failed criteria: (${criteriaNames}). `;
                if (docNames) msg += `Unverified documents: (${docNames}).`;
                return res.status(400).json({ message: msg });
            }
        }

        // Update Status
        await db.query(`UPDATE applicants SET status = ? WHERE id = ?`, [decision, applicantId]);
        
        // Log Activity
        await db.query(`INSERT INTO activity_log (applicant_id, actor_id, action_description) VALUES (?, ?, ?)`, 
            [applicantId, req.user.id, `Initial Evaluation: Marked as ${decision}`]);

        req.app.get('socketio').emit('rsp:dashboard:update');
        res.json({ message: `Applicant successfully marked as ${decision}` });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getQueue, getApplicantDetails, finalizeDecision };