const db = require('../../db');
const syncApplicationsStage = require('../../utils/syncApplicationsStage');
const path = require('path');
const fs = require('fs');

/**
 * TODO(product-owner): Confirm required docs for teaching_related.
 * Currently reuses the non_teaching doc list as a starting point.
 * Teaching-related roles (registrar, librarian, guidance, ADAS) typically
 * require a relevant degree diploma + CSC eligibility rather than a
 * BSEd/BEEd diploma.
 */
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

    if (positionType === 'non_teaching' || positionType === 'teaching_related') {
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
              AND a.status IN ('qualified', 'shortlisted', 'selected', 'appointed')
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
        await syncApplicationsStage(vacancy_id, 9, req.app.get('socketio'));

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
            io.emit('notification:admin', {
                message: `Congratulatory Advice issued to ${full_name} for ${position_title}`,
                type: 'rsp'
            });
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

        // Fetch applicant + vacancy data; left-join advice so PDF can be generated
        // even before an advice record has been saved (preview mode).
        const [rows] = await db.query(`
            SELECT
                a.id AS application_id,
                a.full_name,
                a.letter_salutation,
                a.vacancy_id,
                v.position_title,
                v.item_number,
                v.assigned_school,
                v.position_type,
                v.subject,
                IFNULL(ca.place_of_assignment, v.assigned_school) AS place_of_assignment,
                ca.report_date,
                ca.document_submission_deadline,
                ca.appointing_authority_name
            FROM applications a
            JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
            WHERE a.id = ?
        `, [applicantId]);

        if (rows.length === 0) return res.status(404).json({ message: 'Applicant not found.' });
        const d = rows[0];

        // Compute sensible defaults when no advice has been saved yet
        const defaultReportDate = (() => {
            const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(1); return d;
        })();
        const defaultDeadline = (() => {
            const d = new Date(); d.setDate(d.getDate() + 7); return d;
        })();

        const effectiveDate = d.report_date
            ? new Date(d.report_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : defaultReportDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const deadlineDate = d.document_submission_deadline
            ? new Date(d.document_submission_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : defaultDeadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        // Fetch required docs from appointment_documents (same source as applicant portal)
        const [apptDocs] = await db.query(
            `SELECT document_type, verification_status
             FROM appointment_documents
             WHERE applicant_id = ?
             ORDER BY id`,
            [d.application_id]
        );
        const pdfDocs = apptDocs.length > 0
            ? apptDocs.map(r => r.document_type)
            : getRequiredDocs(d.position_type || 'teaching');

        // Resolve signatory from signatories table (prefer Schools Division Superintendent)
        // Do NOT use the raw appointing_authority_name text as a display name
        const [sigRows] = await db.query(
            `SELECT full_name, position, designation FROM signatories
             WHERE is_active = 1
             ORDER BY FIELD(position, 'Schools Division Superintendent') DESC
             LIMIT 1`
        );
        const signatoryName  = sigRows.length > 0 ? sigRows[0].full_name : '[Signatory Not Configured]';
        const signatoryTitle = sigRows.length > 0 ? sigRows[0].position  : 'Schools Division Superintendent';

        // Helper: title-case a string (first letter of each word capitalized)
        const toTitleCase = (str) =>
            (str || '').trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 72, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="Congratulatory_Advice_${d.full_name.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        // Layout constants — match Annex E convention exactly
        const L  = 72;                  // left margin
        const R  = doc.page.width - 72; // right margin
        const W  = R - L;               // usable content width
        const SI = 'Times-Italic';
        const SB = 'Times-Bold';
        const S  = 'Times-Roman';

        // ── DepEd Seal (80px wide, centered — matches Annex E) ─────────────────
        const sealPath = path.join(__dirname, '../../assets/deped-seal.png');
        if (fs.existsSync(sealPath)) {
            const sealW = 80;
            const sealX = (doc.page.width - sealW) / 2;
            doc.image(sealPath, sealX, doc.y || 72, { width: sealW });
            doc.y = (doc.y || 72) + sealW + 4;
        }

        // ── LETTERHEAD (matches Annex E fonts/sizes exactly) ────────────────────
        doc.fillColor('#000000');
        doc.font(SI).fontSize(12).text('Republic of the Philippines', L, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.1);
        doc.font(SB).fontSize(16).text('Department of Education', L, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.1);
        doc.font(S).fontSize(10).text('REGION IX, ZAMBOANGA PENINSULA', L, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.05);
        doc.font(SB).fontSize(10.5).text('SCHOOLS DIVISION OF DAPITAN CITY', L, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.3);
        doc.moveTo(L, doc.y).lineTo(R, doc.y).lineWidth(1.5).stroke('#1B3A6B');
        doc.moveDown(1.5);

        // ── DATE ───────────────────────────────────────────────────────────────
        doc.font(S).fontSize(11)
           .text(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                 L, doc.y, { width: W, align: 'right' });
        doc.moveDown(1.5);

        // ── ADDRESSEE ──────────────────────────────────────────────────────────
        // Header line: full UPPERCASE as per convention
        doc.font(SB).fontSize(12).text(d.full_name.trim().toUpperCase(), L, doc.y, { width: W });
        doc.font(S).fontSize(11).text(d.place_of_assignment || d.assigned_school, L, doc.y, { width: W });
        doc.moveDown(1.5);

        const salutation  = d.letter_salutation || 'Mr./Ms.';
        // Title-case the last name to fix lowercase names like "jhustyn" → "Jhustyn"
        const rawLastName = d.full_name.trim().split(/\s+/).pop();
        const lastName    = toTitleCase(rawLastName);
        doc.font(S).fontSize(11).text(`Dear ${salutation} ${lastName},`, L, doc.y, { width: W });
        doc.moveDown();

        // ── BODY ───────────────────────────────────────────────────────────────
        const subjectPart = d.subject ? ` (${d.subject})` : '';
        const itemNoPart  = d.item_number ? ` under Item No. ${d.item_number}` : '';
        const stationPart = d.place_of_assignment || d.assigned_school || '[Station TBD]';
        const datePart    = d.report_date ? effectiveDate : '[To Be Determined]';

        doc.font(SB).fontSize(11).text('Congratulations! ', L, doc.y, { width: W, continued: true })
           .font(S)
           .text(
               `It is with great pleasure that I inform you of your selection for ` +
               `appointment to the position of ${d.position_title}${subjectPart}${itemNoPart} at ` +
               `${stationPart}, effective ${datePart}.`,
               { align: 'justify' }
           );

        doc.moveDown(0.8);
        doc.font(S).fontSize(11).text(
            `You are hereby required to report to your assigned station on the said date. ` +
            `Please submit the following documents to the Human Resource Management Division ` +
            `on or before ${deadlineDate}:`,
            L, doc.y, { width: W, align: 'justify' }
        );
        doc.moveDown(0.5);

        // ── PURSUANT-TO CLAUSE ──────────────────────────────────────────────────
        doc.font(SI).fontSize(9).text(
            'This appointment is made pursuant to Section 9, Article X of the Civil Service Rules on ' +
            'Personnel Actions, and is in accordance with DepEd Order No. 007, s. 2023 and relevant ' +
            'PRIME-HRM guidelines.',
            L, doc.y, { width: W, align: 'justify' }
        );
        doc.moveDown(0.5);

        // ── DOCUMENT CHECKLIST: two-column grid with equal row heights ──────────
        // Split docs into two equal columns; both columns share the same Y baseline.
        // We pre-measure item heights so each row has a consistent height regardless
        // of whether text wraps.
        const docFontSize = 9;
        const colW        = (W - 20) / 2;   // equal column width with 20pt gutter
        const col1X       = L;
        const col2X       = L + colW + 20;
        const mid         = Math.ceil(pdfDocs.length / 2);
        const col1        = pdfDocs.slice(0, mid);
        const col2        = pdfDocs.slice(mid);

        doc.font(S).fontSize(docFontSize);

        // Pre-measure row heights: for each row index, take the max of both column items
        const rowCount = Math.max(col1.length, col2.length);
        const rowHeights = [];
        for (let i = 0; i < rowCount; i++) {
            const h1 = col1[i] ? doc.heightOfString(`${i + 1}. ${col1[i]}`, { width: colW }) : 0;
            const h2 = col2[i] ? doc.heightOfString(`${mid + i + 1}. ${col2[i]}`, { width: colW }) : 0;
            rowHeights.push(Math.max(h1, h2) + 2); // +2pt inter-row padding
        }

        // Render both columns row by row, sharing the same Y per row
        let rowY = doc.y;
        for (let i = 0; i < rowCount; i++) {
            if (col1[i]) {
                doc.text(`${i + 1}. ${col1[i]}`, col1X, rowY, { width: colW });
            }
            if (col2[i]) {
                doc.text(`${mid + i + 1}. ${col2[i]}`, col2X, rowY, { width: colW });
            }
            rowY += rowHeights[i];
        }

        // Advance cursor past the checklist
        doc.y = rowY;

        doc.moveDown(0.8);
        doc.font(S).fontSize(11).text(
            'Failure to submit the required documents within the prescribed period may result ' +
            'in the withdrawal of this advice. Please acknowledge receipt of this letter by signing below.',
            L, doc.y, { width: W, align: 'justify' }
        );
        doc.moveDown(0.8);
        doc.font(SB).fontSize(11).text('Congratulations once again!', L, doc.y, { width: W });
        doc.moveDown(1);  // compact gap before signature (was moveDown(3))

        // ── SIGNATURE BLOCK ────────────────────────────────────────────────────
        const sigY   = doc.y;
        const leftX  = L;
        const rightX = R - 200;

        // Left — Appointing Authority (resolved from signatories table)
        doc.font(SB).fontSize(11)
           .text(signatoryName.toUpperCase(), leftX, sigY, { width: 240 });
        doc.font(S).fontSize(9).text(signatoryTitle, leftX, doc.y, { width: 240 });

        // Right — Appointee Acknowledgement
        const ackY = sigY + 20;
        doc.moveTo(rightX, ackY + 25).lineTo(rightX + 200, ackY + 25).lineWidth(0.5).stroke('#333333');
        doc.font(S).fontSize(9)
           .text("Appointee's Signature over Printed Name", rightX, ackY + 28, { width: 200, align: 'center' });

        // ── FOOTER ─────────────────────────────────────────────────────────────
        const footerY = doc.y + 20;
        doc.moveTo(L, footerY).lineTo(R, footerY).lineWidth(0.5).stroke('#CCCCCC');
        doc.font(S).fontSize(8).fillColor('#888888')
           .text(
               `This is a system-generated document. Digitally attested via PRIME-HRM on ` +
               `${new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
               L, footerY + 5, { align: 'center', width: W }
           );

        doc.end();
    } catch (error) {
        console.error('generatePDF Error:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Could not generate PDF.' });
    }
};

module.exports = { getEligible, getAdviceDetail, saveAndGenerate, generatePDF };