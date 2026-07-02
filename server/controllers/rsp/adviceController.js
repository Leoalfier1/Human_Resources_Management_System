const db = require('../../db');

const getRequiredDocs = (positionType = 'teaching') => {
    const common = [
        "Original/Authenticated Transcript of Records",
        "Updated Personal Data Sheet (CS Form 212)",
        "NBI Clearance (issued within 6 months)",
        "Medical Certificate (from government hospital)",
        "Dental Certificate",
        "4 pcs. Passport-size ID photos (white background)",
        "Marriage Certificate (for married female)",
        "Authenticated Service Record",
        "Certificate of No Pending Administrative Case"
    ];

    if (positionType === 'non_teaching') {
        return [
            common[0],
            "Original/Authenticated Diploma (relevant degree)",
            ...common.slice(1, 9),
            "CSC Eligibility / Professional Civil Service Eligibility"
        ];
    }

    return [
        common[0],
        "Original/Authenticated BSEd/BEEd Diploma",
        ...common.slice(1, 10)
    ];
};

// GET /api/rsp/congratulatory-advice/eligible-appointees?vacancy_id=X
const getEligible = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) return res.status(400).json({ message: 'vacancy_id is required' });

        const [rows] = await db.query(`
            SELECT 
                a.id,
                a.full_name,
                RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) AS rank_val,
                IFNULL(r.total_score, 0) AS total_score,
                (SELECT COUNT(*) FROM congratulatory_advices 
                 WHERE applicant_id = a.id) AS already_sent
            FROM applications a
            LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
            LEFT JOIN deliberation_notes n ON a.id = n.applicant_id
            WHERE a.vacancy_id = ?
              AND a.status IN ('shortlisted', 'selected', 'appointed')
            ORDER BY rank_val ASC
        `, [vacancy_id]);

        res.json(rows);
    } catch (error) {
        console.error('getEligible Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// GET /api/rsp/congratulatory-advice/:applicantId
const getAdviceDetail = async (req, res) => {
    try {
        const { applicantId } = req.params;

        const [info] = await db.query(`
            SELECT 
                a.id,
                a.full_name,
                a.vacancy_id,
                v.position_title,
                v.assigned_school,
                v.ref_no,
                v.item_number,
                IFNULL(r.total_score, 0)  AS total_score,
                RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) AS rank_val,
                ca.place_of_assignment,
                ca.report_date,
                ca.document_submission_deadline,
                ca.appointing_authority_name
            FROM applications a
            JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
            LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
            WHERE a.id = ?
        `, [applicantId]);

        if (info.length === 0) return res.status(404).json({ message: 'Applicant not found' });

        const detail = info[0];

        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);

        const docDeadline = new Date();
        docDeadline.setDate(docDeadline.getDate() + 7);

        // Determine position_type for dynamic doc list
        const [vacType] = await db.query('SELECT position_type FROM vacancies WHERE id = ?', [detail.vacancy_id]);
        const posType = vacType.length > 0 ? (vacType[0].position_type || 'teaching') : 'teaching';
        const docs = getRequiredDocs(posType);

        res.json({
            ...detail,
            place_of_assignment:          detail.place_of_assignment          || detail.assigned_school,
            report_date:                  detail.report_date                  || nextMonth.toISOString().split('T')[0],
            document_submission_deadline: detail.document_submission_deadline || docDeadline.toISOString().split('T')[0],
            appointing_authority_name:    detail.appointing_authority_name    || 'Schools Division Superintendent',
            required_docs: docs
        });
    } catch (error) {
        console.error('getAdviceDetail Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// POST /api/rsp/congratulatory-advice
// POST /api/rsp/congratulatory-advice
const saveAndGenerate = async (req, res) => {
    try {
        const {
            id: applicant_id,
            vacancy_id,
            full_name,
            position_title,
            place_of_assignment,
            report_date,
            document_submission_deadline,
            appointing_authority_name
        } = req.body;

        if (!applicant_id || !vacancy_id) {
            return res.status(400).json({ message: 'applicant_id and vacancy_id are required.' });
        }

        const effectiveDate = new Date(report_date).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });

        const letter_content =
            `Congratulations! It is with great pleasure that I inform you of your selection ` +
            `for appointment to the position of ${position_title} at ${place_of_assignment}, ` +
            `effective ${effectiveDate}.`;

        await db.query(`
            INSERT INTO congratulatory_advices
                (applicant_id, vacancy_id, place_of_assignment, report_date,
                 document_submission_deadline, appointing_authority_name,
                 letter_content, sent_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                place_of_assignment          = VALUES(place_of_assignment),
                report_date                  = VALUES(report_date),
                document_submission_deadline = VALUES(document_submission_deadline),
                appointing_authority_name    = VALUES(appointing_authority_name),
                letter_content               = VALUES(letter_content),
                sent_by                      = VALUES(sent_by)
        `, [
            applicant_id, vacancy_id, place_of_assignment, report_date,
            document_submission_deadline, appointing_authority_name,
            letter_content, req.user.id
        ]);

        // Advance applicant to 'selected'
        await db.query(
            `UPDATE applications SET status = 'selected' WHERE id = ? AND status NOT IN ('appointed')`,
            [applicant_id]
        );

        // Advance vacancy to Stage 9
        await db.query(
            `UPDATE vacancies SET current_stage = GREATEST(current_stage, 9) WHERE id = ?`,
            [vacancy_id]
        );

        // Per-applicant stage tracking: this applicant has now completed Stage 9
        // (Selection and Congratulatory Advice)
        await db.query(
            `INSERT INTO stage_history (application_id, stage_number, status, completed_at)
             VALUES (?, 9, 'completed', NOW()) ON DUPLICATE KEY UPDATE status='completed', completed_at=NOW()`,
            [applicant_id]
        );
        await db.query(`UPDATE applications SET current_stage = 9 WHERE id = ?`, [applicant_id]);

        // Notify the applicant
        await db.query(
            `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
            [applicant_id, `Congratulations! You have been selected for ${position_title}. Please review your appointment requirements.`]
        );

        // Activity log
        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [vacancy_id, req.user.id,
             `Congratulatory Advice issued to ${full_name} for ${position_title}`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rsp:dashboard:update');
            io.to(`application-${applicant_id}`).emit('application:stage-update', {
                applicationId: applicant_id, status: 'selected'
            });
        }

        res.json({ message: 'Congratulatory Advice saved successfully.', letter_content });
    } catch (error) {
        console.error('saveAndGenerate Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// GET /api/rsp/congratulatory-advice/:applicantId/pdf
const generatePDF = async (req, res) => {
    try {
        const { applicantId } = req.params;

        const [info] = await db.query(`
            SELECT a.full_name, v.position_title, v.assigned_school,
                   ca.place_of_assignment, ca.report_date,
                   ca.document_submission_deadline, ca.appointing_authority_name
            FROM applications a
            JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
            WHERE a.id = ?
        `, [applicantId]);

        if (info.length === 0) return res.status(404).json({ message: 'Not found' });
        const d = info[0];

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 72, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="Congratulatory_Advice_${d.full_name.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        // Letterhead
        doc.fontSize(10).font('Helvetica').text('Republic of the Philippines', { align: 'center' });
        doc.text('Department of Education', { align: 'center' });
        doc.text('Region IX – Zamboanga Peninsula', { align: 'center' });
        doc.font('Helvetica-Bold').text('Schools Division Office of Dapitan City', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).lineWidth(1.5).stroke('#1B3A6B');
        doc.moveDown(1.5);

        doc.font('Helvetica').fontSize(11)
           .text(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                 { align: 'right' });
        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').fontSize(12).text(d.full_name.toUpperCase());
        doc.font('Helvetica').fontSize(11).text(d.assigned_school);
        doc.moveDown(1.5);

        const lastName = d.full_name.trim().split(' ').pop();
        doc.text(`Dear ${lastName},`);
        doc.moveDown();

        const effectiveDate = d.report_date
            ? new Date(d.report_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : '[To Be Determined]';
        const deadlineDate = d.document_submission_deadline
            ? new Date(d.document_submission_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : '[To Be Determined]';

        doc.font('Helvetica-Bold').text('Congratulations! ', { continued: true })
           .font('Helvetica')
           .text(`It is with great pleasure that I inform you of your selection for appointment to the position of ${d.position_title} at ${d.place_of_assignment || d.assigned_school}, effective ${effectiveDate}.`,
                 { align: 'justify' });

        doc.moveDown();
        doc.text(
            `You are hereby required to report to your assigned station on the said date. ` +
            `Please submit the following documents to the Human Resource Management Division on or before ${deadlineDate}:`,
            { align: 'justify' }
        );
        doc.moveDown();

        // Look up position_type for dynamic doc list
        const [vacRow] = await db.query(
            `SELECT v.position_type FROM applications a
             JOIN vacancies v ON a.vacancy_id = v.id WHERE a.id = ?`,
            [applicantId]
        );
        const pdfPosType = vacRow.length > 0 ? (vacRow[0].position_type || 'teaching') : 'teaching';
        const pdfDocs = getRequiredDocs(pdfPosType);

        pdfDocs.forEach((item, i) => {
            doc.fontSize(10).text(`${i + 1}. ${item}`, { indent: 20 });
        });

        doc.moveDown();
        doc.fontSize(11).text(
            'Failure to submit the required documents within the prescribed period may result in the withdrawal of this advice.',
            { align: 'justify' }
        );
        doc.moveDown(2);
        doc.text('Congratulations once again!');
        doc.moveDown(3);

        doc.font('Helvetica-Bold').text(d.appointing_authority_name || 'Schools Division Superintendent');
        doc.font('Helvetica').fontSize(10).text('Schools Division Superintendent');

        doc.end();
    } catch (error) {
        console.error('generatePDF Error:', error);
        res.status(500).json({ message: 'Could not generate PDF.' });
    }
};

module.exports = { getEligible, getAdviceDetail, saveAndGenerate, generatePDF };