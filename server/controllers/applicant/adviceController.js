const db = require('../../db');
const path = require('path');
const fs = require('fs');


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

        // Stage gate: only applicants at Stage 9+ AND an actual
        // congratulatory_advices record exists (prevents showing empty advice content
        // before the Congratulatory Advice stage triggers the real advice issuance).
        if (adviceRows.length === 0) {
            return res.status(403).json({
                message: 'Congratulatory advice has not yet been issued. Please wait until the appointing authority completes the selection process.'
            });
        }

        // 3. Fetch office settings for letterhead
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
            settings
        });

    } catch (error) {
        console.error('getAdvice Error:', error);
        res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
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
            'You are hereby required to report to your assigned station on the said date.',
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
