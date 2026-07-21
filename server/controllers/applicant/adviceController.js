const db = require('../../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Multer config for appointment document uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../../uploads/applications/appointment-docs');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `APPT-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('file');


// ─────────────────────────────────────────────
// GET /api/applications/:id/advice
// Returns the congratulatory letter + required appointment docs + settings
// Only accessible if application is at Stage 9+ (status = selected/appointed)
// ─────────────────────────────────────────────
exports.getAdvice = async (req, res) => {
    try {
        const { id } = req.params;
        const applicant_id = req.user.id;

        // 1. Security: Verify ownership and stage gate
        const [appRows] = await db.query(
            `SELECT a.*, v.position_title, v.subject, v.item_number, v.assigned_school,
                    s.name as school_name, v.ref_no as vacancy_ref, v.id as vacancy_id
             FROM applications a
             JOIN vacancies v ON a.vacancy_id = v.id
             LEFT JOIN schools_offices s ON (
                 s.name = v.assigned_school OR
                 (v.assigned_school REGEXP '^TR[0-9]+$' AND s.id = CAST(SUBSTRING(v.assigned_school, 3) AS UNSIGNED))
             )
             WHERE a.id = ? AND a.applicant_id = ?`,
            [id, applicant_id]
        );

        if (appRows.length === 0) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        const app = appRows[0];

        // 1b. Fetch congratulatory advice letter details — must exist to proceed
        const [adviceRows] = await db.query(
            `SELECT ca.*
             FROM congratulatory_advices ca
             WHERE ca.applicant_id = ?
             ORDER BY ca.id DESC LIMIT 1`,
            [id]
        );

        // Stage gate: only applicants at Stage 9+ (current_stage >= 8) AND an actual
        // congratulatory_advices record exists (prevents showing empty advice content
        // before the Stage 8 "Send" action triggers the real advice issuance).
        if (adviceRows.length === 0) {
            return res.status(403).json({
                message: 'Congratulatory advice has not yet been issued. Please wait until the appointing authority completes the selection process.'
            });
        }

        // 3. Fetch appointment documents (seeded list + upload status)
        const [docRows] = await db.query(
            `SELECT * FROM appointment_documents WHERE applicant_id = ? ORDER BY id ASC`,
            [id]
        );

        // If no docs seeded yet, return the standard list as "not uploaded"
        const REQUIRED_DOCS = [
            "Original/Authenticated Transcript of Records",
            "Original/Authenticated BSEd/BSE Diploma",
            "Updated Personal Data Sheet (CS Form 212)",
            "NBI Clearance (issued within 6 months)",
            "Medical Certificate (from government hospital)",
            "Dental Certificate",
            "4 pcs. Passport-size ID photos (white background)",
            "Marriage Certificate (for married female)",
            "Authenticated Service Record",
            "Certificate of No Pending Administrative Case"
        ];

        let documents = docRows;
        if (docRows.length === 0) {
            // Seed the list for this applicant
            const seedData = REQUIRED_DOCS.map(docType => [id, docType, 'not_uploaded']);
            await db.query(
                `INSERT INTO appointment_documents (applicant_id, document_type, verification_status) VALUES ?`,
                [seedData]
            );
            const [newDocs] = await db.query(
                'SELECT * FROM appointment_documents WHERE applicant_id = ? ORDER BY id ASC',
                [id]
            );
            documents = newDocs;
        }

        // 4. Fetch office settings for letterhead
        const [settingsRows] = await db.query('SELECT * FROM settings LIMIT 1');
        const settings = settingsRows[0] || {
            office_name: 'Schools Division Office of Dapitan City',
            region: 'Region IX – Zamboanga Peninsula'
        };

        // 5. Resolve signatory name and title
        const [sigRows] = await db.query(
            `SELECT full_name, position FROM signatories
             WHERE is_active = 1
             ORDER BY FIELD(position, 'Schools Division Superintendent') DESC
             LIMIT 1`
        );
        const dbSigName = sigRows.length > 0 ? sigRows[0].full_name : '[Signatory Not Configured]';
        const dbSigTitle = sigRows.length > 0 ? sigRows[0].position : 'Schools Division Superintendent';

        const advice = adviceRows[0] || {};
        let resolvedSigName = advice.appointing_authority_name;
        let resolvedSigTitle = 'Schools Division Superintendent';
        if (!resolvedSigName || !resolvedSigName.trim() || resolvedSigName === 'Schools Division Superintendent') {
            resolvedSigName = dbSigName;
            resolvedSigTitle = dbSigTitle;
        }

        // 6. Build letter object
        const letter = {
            full_name:            app.full_name,
            position_title:       app.position_title,
            subject:              app.subject,
            item_number:          app.item_number,
            school_name:          app.school_name || app.assigned_school,
            assigned_school:      app.assigned_school,
            effective_date:       advice.report_date || null,
            superintendent_name:  resolvedSigName,
            superintendent_title: resolvedSigTitle,
            salutation:           app.letter_salutation || 'Mr./Ms.'
        };

        res.json({
            letter,
            documents,
            deadline:      advice.document_submission_deadline || null,
            required_docs: REQUIRED_DOCS,
            settings
        });

    } catch (error) {
        console.error('getAdvice Error:', error);
        res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
};

// ─────────────────────────────────────────────
// GET /api/applications/:id/appointment
// Returns the applicant's own appointment confirmation, details, and
// completed-stage timeline once an appointment record exists.
// ─────────────────────────────────────────────
exports.getMyAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const applicant_id = req.user.id;

        const [appRows] = await db.query(
            `SELECT a.*, v.position_title, v.subject, v.assigned_school, v.salary_grade,
                    v.monthly_salary, v.posting_date, s.name as school_name
             FROM applications a
             JOIN vacancies v ON a.vacancy_id = v.id
             LEFT JOIN schools s ON s.name = v.assigned_school
             WHERE a.id = ? AND a.applicant_id = ?`,
            [id, applicant_id]
        );
        if (appRows.length === 0) return res.status(404).json({ message: 'Application not found.' });
        const app = appRows[0];

        const [apptRows] = await db.query(
            `SELECT * FROM appointments WHERE applicant_id = ? ORDER BY id DESC LIMIT 1`,
            [id]
        );
        if (apptRows.length === 0) {
            return res.status(403).json({ message: 'Appointment has not been issued yet.' });
        }
        const appt = apptRows[0];

        const [history] = await db.query(
            `SELECT stage_number, completed_at FROM stage_history WHERE application_id = ? AND status = 'completed' ORDER BY stage_number ASC`,
            [id]
        );

        const STAGE_NAMES = {
            1: 'Application Submitted', 3: 'Initial Evaluation', 6: 'Comparative Assessment',
            7: 'CA Results Posted', 8: 'HRMPSB Deliberation', 9: 'Appointment Issued'
        };
        const timeline = history
            .filter(h => STAGE_NAMES[h.stage_number])
            .map(h => ({ label: STAGE_NAMES[h.stage_number], date: h.completed_at }));

        // Total turnaround: working days between posting_date and appointment issued_at
        const getWorkingDays = (start, end) => {
            let count = 0;
            let cur = new Date(start);
            const last = new Date(end);
            while (cur <= last) {
                const d = cur.getDay();
                if (d !== 0 && d !== 6) count++;
                cur.setDate(cur.getDate() + 1);
            }
            return count;
        };
        const totalTAT = getWorkingDays(app.posting_date, appt.issued_at);

        res.json({
            appointee_first_name: app.full_name?.split(' ')[0] || 'Applicant',
            position_title: app.position_title,
            subject: app.subject,
            station: app.school_name || app.assigned_school,
            nature: appt.nature_of_appointment || 'Permanent',
            salary_grade: app.salary_grade,
            monthly_salary: app.monthly_salary,
            effectivity_date: appt.issued_at,
            notice_posted: appt.notice_posted_at || null,
            timeline,
            total_tat: totalTAT,
            target_tat: 26
        });
    } catch (error) {
        console.error('getMyAppointment Error:', error);
        res.status(500).json({ message: error.message });
    }
};


// ─────────────────────────────────────────────
// POST /api/applications/:id/appointment-documents
// Upload an appointment document for the applicant
// ─────────────────────────────────────────────
exports.uploadAppointmentDocument = (req, res) => {
    upload(req, res, async function (err) {
        if (err) return res.status(400).json({ message: err.message });
        if (!req.file) return res.status(400).json({ message: 'No file selected.' });

        try {
            const { id } = req.params;
            const { document_type } = req.body;
            const applicant_id = req.user.id;

            const file_path = `/uploads/applications/appointment-docs/${req.file.filename}`;

            // Upsert: update if document_type already exists for this applicant
            const [existing] = await db.query(
                `SELECT id FROM appointment_documents WHERE applicant_id = ? AND document_type = ?`,
                [id, document_type]
            );

            if (existing.length > 0) {
                await db.query(
                    `UPDATE appointment_documents 
                     SET file_path = ?, file_name = ?, verification_status = 'uploaded_pending_review', uploaded_at = NOW()
                     WHERE applicant_id = ? AND document_type = ?`,
                    [file_path, req.file.originalname, id, document_type]
                );
            } else {
                await db.query(
                    `INSERT INTO appointment_documents 
                     (applicant_id, document_type, file_name, file_path, verification_status, uploaded_at)
                     VALUES (?, ?, ?, ?, 'uploaded_pending_review', NOW())`,
                    [id, document_type, req.file.originalname, file_path]
                );
            }

            // Notify HR via socket
            const io = req.app.get('socketio');
            if (io) {
                io.emit('rsp:dashboard:update');
                io.to(`application-${id}`).emit('application:document-update', {
                    applicationId: id,
                    document_type
                });
            }

            res.json({ message: 'Document uploaded successfully.', file_name: req.file.originalname });
        } catch (error) {
            console.error('uploadAppointmentDocument Error:', error);
            res.status(500).json({ message: 'Database error saving document.' });
        }
    });
};


// ─────────────────────────────────────────────
// GET /api/applications/:id/advice/pdf
// Generates and streams a PDF of the congratulatory advice letter
// ─────────────────────────────────────────────
exports.getAdvicePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const applicant_id = req.user.id;

        // Verify ownership and resolve school name
        const [appRows] = await db.query(
            `SELECT a.*, v.position_title, v.subject, v.item_number, v.assigned_school,
                    s.name as school_name
             FROM applications a
             JOIN vacancies v ON a.vacancy_id = v.id
             LEFT JOIN schools_offices s ON (
                 s.name = v.assigned_school OR
                 (v.assigned_school REGEXP '^TR[0-9]+$' AND s.id = CAST(SUBSTRING(v.assigned_school, 3) AS UNSIGNED))
             )
             WHERE a.id = ? AND a.applicant_id = ?`,
            [id, applicant_id]
        );
        if (appRows.length === 0) return res.status(404).json({ message: 'Not found.' });

        const app = appRows[0];

        // 2. Fetch congratulatory advice letter details — must exist
        const [adviceRows] = await db.query(
            `SELECT ca.*
             FROM congratulatory_advices ca
             WHERE ca.applicant_id = ?
             ORDER BY ca.id DESC LIMIT 1`,
            [id]
        );
        if (adviceRows.length === 0) {
            return res.status(403).json({ message: 'Congratulatory advice has not yet been issued.' });
        }
        const advice = adviceRows[0];

        // 3. Fetch appointment documents (same source as portal)
        const [docRows] = await db.query(
            `SELECT document_type FROM appointment_documents WHERE applicant_id = ? ORDER BY id`,
            [id]
        );
        const REQUIRED_DOCS = [
            "Original/Authenticated Transcript of Records",
            "Original/Authenticated BSEd/BSE Diploma",
            "Updated Personal Data Sheet (CS Form 212)",
            "NBI Clearance (issued within 6 months)",
            "Medical Certificate (from government hospital)",
            "Dental Certificate",
            "4 pcs. Passport-size ID photos (white background)",
            "Marriage Certificate (for married female)",
            "Authenticated Service Record",
            "Certificate of No Pending Administrative Case"
        ];
        const pdfDocs = docRows.length > 0
            ? docRows.map(r => r.document_type)
            : REQUIRED_DOCS;

        const [settingsRows] = await db.query('SELECT * FROM settings LIMIT 1');
        const settings = settingsRows[0] || { office_name: 'Schools Division Office of Dapitan City' };

        // Resolve signatory from signatories table
        const [sigRows] = await db.query(
            `SELECT full_name, position FROM signatories
             WHERE is_active = 1
             ORDER BY FIELD(position, 'Schools Division Superintendent') DESC
             LIMIT 1`
        );
        const dbSigName = sigRows.length > 0 ? sigRows[0].full_name : '[Signatory Not Configured]';
        const dbSigTitle = sigRows.length > 0 ? sigRows[0].position : 'Schools Division Superintendent';

        let resolvedSigName = advice.appointing_authority_name;
        let resolvedSigTitle = 'Schools Division Superintendent';
        if (!resolvedSigName || !resolvedSigName.trim() || resolvedSigName === 'Schools Division Superintendent') {
            resolvedSigName = dbSigName;
            resolvedSigTitle = dbSigTitle;
        }

        // Helper: title-case a string (first letter of each word capitalized)
        const toTitleCase = (str) =>
            (str || '').trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

        // Dates
        const deadlineDate = advice.document_submission_deadline
            ? new Date(advice.document_submission_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : null;
        const effectiveDate = advice.report_date
            ? new Date(advice.report_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : '[To Be Determined]';

        // Build PDF using pdfkit
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 72, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Congratulatory_Advice_${app.ref_no || id}.pdf"`
        );
        doc.pipe(res);

        // Layout constants — match Annex E convention exactly
        const L = 72;
        const R = doc.page.width - 72;
        const W = R - L;
        const SI = 'Times-Italic';
        const SB = 'Times-Bold';
        const S  = 'Times-Roman';

        // ── DepEd Seal (80px wide, centered — matches Annex E) ──────────────────
        const sealPath = path.join(__dirname, '../../assets/deped-seal.png');
        if (fs.existsSync(sealPath)) {
            const sealW = 80;
            const sealX = (doc.page.width - sealW) / 2;
            doc.image(sealPath, sealX, doc.y || 72, { width: sealW });
            doc.y = (doc.y || 72) + sealW + 4;
        }

        // ── Letterhead (matches Annex E fonts/sizes exactly) ────────────────────
        doc.fillColor('#000000');
        doc.font(SI).fontSize(12).text('Republic of the Philippines', L, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.1);
        doc.font(SB).fontSize(16).text('Department of Education', L, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.1);
        doc.font(S).fontSize(10).text('REGION IX, ZAMBOANGA PENINSULA', L, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.05);
        doc.font(SB).fontSize(10.5).text(settings.office_name || 'SCHOOLS DIVISION OF DAPITAN CITY', L, doc.y, { width: W, align: 'center' });
        doc.moveDown(0.3);
        doc.moveTo(L, doc.y).lineTo(R, doc.y).lineWidth(1.5).stroke('#1B3A6B');
        doc.moveDown(1.5);

        // ── Date ────────────────────────────────────────────────────────────────
        doc.font(S).fontSize(11)
           .text(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                 L, doc.y, { width: W, align: 'right' });
        doc.moveDown(1.5);

        // ── Addressee ───────────────────────────────────────────────────────────
        doc.font(SB).fontSize(12).text(app.full_name.trim().toUpperCase(), L, doc.y, { width: W });
        doc.font(S).fontSize(11).text(advice.place_of_assignment || app.school_name || app.assigned_school, L, doc.y, { width: W });
        doc.moveDown(1.5);

        // ── Salutation with honorific ──
        const salutation = app.letter_salutation || 'Mr./Ms.';
        const rawLastName = app.full_name.trim().split(/\s+/).pop();
        const lastName = toTitleCase(rawLastName);
        doc.font(S).fontSize(11).text(`Dear ${salutation} ${lastName},`, L, doc.y, { width: W });
        doc.moveDown();

        // ── Body ──
        const subjectPart = app.subject ? ` (${app.subject})` : '';
        const itemNoPart = app.item_number ? ` under Item No. ${app.item_number}` : '';
        const stationPart = advice.place_of_assignment || app.school_name || app.assigned_school || '[Station TBD]';
        const datePart = advice.report_date ? effectiveDate : '[To Be Determined]';

        doc.font(SB).fontSize(11).text('Congratulations! ', L, doc.y, { width: W, continued: true })
           .font(S)
           .text(
               `It is with great pleasure that I inform you of your selection for ` +
               `appointment to the position of ${app.position_title}${subjectPart}${itemNoPart} at ` +
               `${stationPart}, effective ${datePart}.`,
               { align: 'justify' }
           );
        doc.moveDown(0.8);

        doc.font(S).fontSize(11).text(
            `You are hereby required to report to your assigned station on the said date. ` +
            `Please submit the following documents to the Human Resource Management Division${deadlineDate ? ` on or before ${deadlineDate}` : ''}:`,
            L, doc.y, { width: W, align: 'justify' }
        );
        doc.moveDown(0.5);

        // ── Pursuant-to clause ──
        doc.font(SI).fontSize(9).text(
            'This appointment is made pursuant to Section 9, Article X of the Civil Service Rules on ' +
            'Personnel Actions, and is in accordance with DepEd Order No. 007, s. 2023 and relevant ' +
            'PRIME-HRM guidelines.',
            L, doc.y, { width: W, align: 'justify' }
        );
        doc.moveDown(0.5);

        // ── Documents checklist in two columns ──
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
        doc.moveDown(1);

        // ── Signature block ──
        const sigY = doc.y;
        const leftX  = L;
        const rightX = R - 200;

        doc.font(SB).fontSize(11)
           .text(resolvedSigName.toUpperCase(), leftX, sigY, { width: 240 });
        doc.font(S).fontSize(9).text(resolvedSigTitle, leftX, doc.y, { width: 240 });

        const ackY = sigY + 20;
        doc.moveTo(rightX, ackY + 25).lineTo(rightX + 200, ackY + 25).lineWidth(0.5).stroke('#333333');
        doc.font(S).fontSize(9)
           .text('Appointee\'s Signature over Printed Name', rightX, ackY + 28, { width: 200, align: 'center' });

        doc.end();

    } catch (error) {
        console.error('getAdvicePDF Error:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Could not generate PDF.' });
    }
};

exports.getAppointmentPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const applicant_id = req.user.id;

        // Security: verify ownership
        const [appCheck] = await db.query(
            'SELECT id FROM applications WHERE id = ? AND applicant_id = ?',
            [id, applicant_id]
        );
        if (appCheck.length === 0) return res.status(403).json({ message: 'Forbidden.' });

        // Fetch all data needed for the PDF
        const [rows] = await db.query(`
            SELECT
                a.full_name, v.position_title, v.subject, v.salary_grade,
                v.assigned_school, ap.issued_at, ap.nature_of_appointment,
                ap.monthly_salary, ca.report_date, ca.appointing_authority_name,
                ca.place_of_assignment
            FROM applications a
            JOIN vacancies v ON a.vacancy_id = v.id
            JOIN appointments ap ON ap.applicant_id = a.id
            LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
            WHERE a.id = ?
            LIMIT 1
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Appointment not found.' });
        const d = rows[0];

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 72, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="Appointment_Notice_${d.full_name.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        // Letterhead
        doc.fontSize(10).font('Helvetica')
           .text('Republic of the Philippines', { align: 'center' })
           .text('Department of Education', { align: 'center' })
           .text('Region IX – Zamboanga Peninsula', { align: 'center' });
        doc.font('Helvetica-Bold')
           .text('Schools Division Office of Dapitan City', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).lineWidth(2).stroke('#1B3A6B');
        doc.moveDown(1.5);

        // Title
        doc.fontSize(16).font('Helvetica-Bold')
           .text('NOTICE OF APPOINTMENT', { align: 'center', underline: true });
        doc.moveDown(1.5);

        // Details
        const details = [
            ['Name',             d.full_name.toUpperCase()],
            ['Position Title',   d.position_title + (d.subject ? ` (${d.subject})` : '')],
            ['Salary Grade',     d.salary_grade ? `SG-${d.salary_grade}` : '—'],
            ['Station',          d.place_of_assignment || d.assigned_school],
            ['Nature',           d.nature_of_appointment || 'Original Appointment'],
            ['Effectivity Date', d.report_date
                ? new Date(d.report_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : '—'],
        ];

        doc.fontSize(11).font('Helvetica');
        details.forEach(([label, val]) => {
            doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
               .font('Helvetica').text(val || '—');
        });

        doc.moveDown(1.5);
        doc.font('Helvetica').fontSize(10)
           .text('"This appointment is made pursuant to Section 9, Article B of the Civil Service Rules on Personnel Actions, and in accordance with DepEd Order No. 007, s. 2015 and relevant PRIME-HRM guidelines."',
                 { align: 'justify' });

        doc.moveDown(3);

        // Signatories
        const sigY = doc.y;
        const leftX = 72;
        const rightX = doc.page.width / 2 + 36;

        doc.font('Helvetica-Bold').fontSize(11)
           .text(d.appointing_authority_name || 'Schools Division Superintendent', leftX, sigY);
        doc.font('Helvetica').fontSize(9)
           .text('Schools Division Superintendent', leftX);
        doc.text(`Date: ${new Date(d.issued_at).toLocaleDateString()}`, leftX);

        doc.font('Helvetica-Bold').fontSize(11)
           .text(d.full_name.toUpperCase(), rightX, sigY);
        doc.font('Helvetica').fontSize(9)
           .text("Appointee's Signature", rightX);
        doc.text('Date: ___________________', rightX);

        doc.end();
    } catch (e) {
        console.error('getAppointmentPDF Error:', e);
        res.status(500).json({ message: 'Could not generate PDF.' });
    }
};