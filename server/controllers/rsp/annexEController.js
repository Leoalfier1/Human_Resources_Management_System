const db = require('../../db');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { sendAnnexEEmail } = require('../../utils/mailer');

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseJson(val) {
    if (!val) return [];
    if (typeof val === 'object') return Array.isArray(val) ? val : [val];
    try { return JSON.parse(val); } catch { return []; }
}

function summariseEducation(pds) {
    if (!pds) return 'None';
    const college = parseJson(pds.college);
    const grad = parseJson(pds.graduate_studies);
    const all = [...college, ...grad].filter(Boolean);
    if (all.length === 0) return 'None';
    return all.map(e => {
        const parts = [];
        if (e.degree_course || e.degree) parts.push(e.degree_course || e.degree);
        if (e.name_of_school || e.school) parts.push(e.name_of_school || e.school);
        return parts.join(' — ');
    }).filter(Boolean).join('\n') || 'None';
}

function summariseExperience(pds) {
    if (!pds) return 'None';
    const exp = parseJson(pds.work_experience);
    if (exp.length === 0) return 'None';
    return exp.map(e => {
        const parts = [];
        if (e.position_title || e.position) parts.push(e.position_title || e.position);
        if (e.name_of_company || e.company) parts.push(e.name_of_company || e.company);
        const dates = [];
        if (e.inclusive_dates_from || e.date_from) dates.push(e.inclusive_dates_from || e.date_from);
        if (e.inclusive_dates_to || e.date_to) dates.push(e.inclusive_dates_to || e.date_to);
        if (dates.length > 0) parts.push(`(${dates.join(' – ')})`);
        return parts.join(', ');
    }).filter(Boolean).join('\n') || 'None';
}

function summariseTraining(pds) {
    if (!pds) return 'None';
    const tr = parseJson(pds.ld_training);
    if (tr.length === 0) return 'None';
    return tr.map(t => {
        const title = t.title || t.program || t.learning_and_development_interventions_seminars_attended || '';
        const hours = t.duration_hours || t.hours || '';
        const issuing = t.officing_office || t.sponsoring_agency || t.issuing_office || '';
        const location = t.location || '';
        const parts = [];
        if (title) parts.push(title);
        const meta = [];
        if (hours) meta.push(`${hours} hrs`);
        if (issuing) meta.push(issuing);
        if (location) meta.push(location);
        if (meta.length > 0) parts.push(`(${meta.join(', ')})`);
        return parts.join(' ');
    }).filter(Boolean).join('\n') || 'None';
}

function summariseEligibility(pds) {
    if (!pds) return 'None';
    const elig = parseJson(pds.civil_service_eligibility);
    if (elig.length === 0) return 'None';
    return elig.map(e => {
        const parts = [];
        const type = e.career_service || e.eligibility || e.type || '';
        if (type) parts.push(type);
        if (e.rating) parts.push(`Rating: ${e.rating}`);
        if (e.date_of_examination || e.date) parts.push(`Date: ${e.date_of_examination || e.date}`);
        if (e.place_of_examination || e.place) parts.push(`Place: ${e.place_of_examination || e.place}`);
        return parts.join(' — ');
    }).filter(Boolean).join('\n') || 'None';
}

function getPdsValue(label, pds) {
    const l = (label || '').toLowerCase();
    if (l.includes('degree') || l.includes('education') || l.includes('beed') || l.includes('bsed') || l.includes('bachelor') || l.includes('college')) return summariseEducation(pds);
    if (l.includes('experience') || l.includes('work')) return summariseExperience(pds);
    if (l.includes('training') || l.includes('seminar') || l.includes('hours')) return summariseTraining(pds);
    if (l.includes('eligib') || l.includes('license') || l.includes('let') || l.includes('prc') || l.includes('csc')) return summariseEligibility(pds);
    return summariseEducation(pds);
}

function mapMqsToCriterion(label, mqs) {
    if (!mqs) return null;
    const l = (label || '').toLowerCase();
    if (l.includes('degree') || l.includes('education') || l.includes('beed') || l.includes('bsed') || l.includes('bachelor') || l.includes('college')) return mqs.education || null;
    if (l.includes('training') || l.includes('seminar') || l.includes('hours')) return mqs.training || null;
    if (l.includes('experience') || l.includes('work')) return mqs.experience || null;
    if (l.includes('eligib') || l.includes('license') || l.includes('let') || l.includes('prc') || l.includes('csc')) return mqs.eligibility || null;
    return null;
}

async function buildAnnexEPayload(applicationId) {
    const [appRows] = await db.query(`
        SELECT a.id, a.full_name, a.ref_no, a.status, a.initial_evaluation_remarks,
               a.evaluated_at, a.vacancy_id, a.letter_type, a.advice_sent_at,
               a.letter_salutation, a.letter_last_name, a.letter_first_name,
               a.letter_address, a.letter_date, a.table_rows_override,
               v.position_title, v.position_type, v.assigned_school, v.subject,
               u.full_name AS evaluated_by_name,
               (SELECT sent_at FROM congratulatory_advices WHERE applicant_id = a.id ORDER BY id DESC LIMIT 1) AS congratulatory_advice_sent_at
        FROM applications a
        JOIN vacancies v ON a.vacancy_id = v.id
        LEFT JOIN users u ON a.evaluated_by = u.id
        WHERE a.id = ?
    `, [applicationId]);

    if (appRows.length === 0) throw { status: 404, message: 'Application not found.' };
    const app = appRows[0];

    const isQualifiedStatus = ['qualified', 'shortlisted', 'selected', 'appointed'].includes(app.status);
    const isDisqualifiedStatus = app.status === 'disqualified';

    if (!isQualifiedStatus && !isDisqualifiedStatus) {
        throw { status: 409, message: 'Annex E cannot be generated yet — the initial evaluation decision for this applicant is still pending.' };
    }

    let [criteria] = await db.query(`
        SELECT m.id AS criterion_id, m.criterion_label, m.is_required,
               r.passed, r.evaluated_at AS criterion_evaluated_at, r.criterion_reason
        FROM minimum_qualifications_checklist m
        LEFT JOIN applicant_qualification_results r ON m.id = r.criterion_id AND r.applicant_id = ?
        WHERE m.vacancy_id = ?
        ORDER BY m.id ASC
    `, [applicationId, app.vacancy_id]);

    const [pdsRows] = await db.query(`
        SELECT college, graduate_studies, work_experience, ld_training, civil_service_eligibility,
               perm_house_block_lot, perm_street, perm_subdivision_village, perm_barangay,
               perm_city_municipality, perm_province, perm_zip_code,
               res_house_block_lot, res_street, res_subdivision_village, res_barangay,
               res_city_municipality, res_province, perm_same_as_residential
        FROM personal_data_sheets
        WHERE user_id = (SELECT user_id FROM applications WHERE id = ? LIMIT 1)
        LIMIT 1
    `, [applicationId]);
    const pds = pdsRows[0] || null;

    // Pull rsp_mqs_criteria for CSC-approved standard text per criterion
    const [mqsRows] = await db.query(
        'SELECT education, training, experience, eligibility FROM rsp_mqs_criteria WHERE vacancy_id = ? LIMIT 1',
        [app.vacancy_id]
    );
    const mqsCriteria = mqsRows[0] || null;

    let address = '';
    if (pds) {
        const parts = pds.perm_same_as_residential
            ? [pds.res_house_block_lot, pds.res_street, pds.res_barangay, pds.res_city_municipality, pds.res_province]
            : [pds.perm_house_block_lot, pds.perm_street, pds.perm_barangay, pds.perm_city_municipality, pds.perm_province];
        address = parts.filter(Boolean).join(', ');
    }
    if (!address) address = app.assigned_school || 'Dapitan City';

    const [disqHistory] = await db.query(
        'SELECT reason FROM application_disqualification_history WHERE application_id = ? ORDER BY recorded_at DESC LIMIT 1',
        [applicationId]
    );
    const disqualificationReason = disqHistory[0]?.reason || app.initial_evaluation_remarks || null;

    const [settingsRows] = await db.query('SELECT * FROM settings LIMIT 1');
    const settings = settingsRows[0] || {};

    const [signatoryRows] = await db.query(
        "SELECT full_name, position, designation, signature_path FROM signatories WHERE is_active = 1 ORDER BY FIELD(position, 'Schools Division Superintendent') ASC LIMIT 1"
    );
    const signatory = signatoryRows[0] || {
        full_name: 'Schools Division Superintendent',
        position: 'Schools Division Superintendent',
        designation: null,
        signature_path: null
    };

    // Admin can override the outcome via letter_type column
    const defaultVariant = isQualifiedStatus ? 'qualified' : 'disqualified';
    const effectiveVariant = app.letter_type || defaultVariant;
    const isQualified = effectiveVariant === 'qualified';

    // Letter-instance overrides: use if set, else fall back to master record / PDS
    const salutation = app.letter_salutation || 'Mr.';
    const lastName = app.letter_last_name || app.full_name.trim().split(/\s+/).pop();
    const firstName = app.letter_first_name || app.full_name.trim().split(/\s+/).slice(0, -1).join(' ') || lastName;
    const recipientFullName = `${firstName} ${lastName}`;
    const letterAddress = app.letter_address || address;
    const letterDate = app.letter_date
        ? new Date(app.letter_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const evalDate = app.evaluated_at
        ? new Date(app.evaluated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : letterDate;

    // If admin has saved overrides, use those directly
    if (app.table_rows_override) {
        const overrides = parseJson(app.table_rows_override);
        if (overrides.length > 0) {
            return {
                variant: effectiveVariant,
                letter_type: app.letter_type,
                advice_sent_at: app.advice_sent_at,
                congratulatory_advice_sent_at: app.congratulatory_advice_sent_at,
                applicant: {
                    id: app.id,
                    full_name: app.full_name,
                    ref_no: app.ref_no,
                    address,
                    status: app.status,
                    evaluated_at: app.evaluated_at,
                    disqualification_reason: disqualificationReason
                },
                letter: {
                    salutation,
                    last_name: lastName,
                    first_name: firstName,
                    recipient_full_name: recipientFullName,
                    address: letterAddress,
                    letter_date: app.letter_date || null,
                    letter_date_display: letterDate,
                    eval_date_display: evalDate
                },
                vacancy: {
                    id: app.vacancy_id,
                    position_title: app.position_title,
                    position_type: app.position_type,
                    assigned_school: app.assigned_school,
                    subject: app.subject,
                    office_abbreviation: 'SDO-Dapitan'
                },
                table_rows: overrides,
                signatory: {
                    name: signatory.full_name,
                    position: signatory.position || 'Schools Division Superintendent',
                    designation: signatory.designation || null,
                    signature_path: signatory.signature_path || null
                },
                office: {
                    name: settings.office_name || 'Schools Division Office of Dapitan City',
                    address: settings.office_address || 'Sunset Boulevard, Dawo, Dapitan City',
                    contact: settings.contact_number || '065-908-1234',
                    email: settings.email || 'sdo.dapitancity@deped.gov.ph',
                    website: settings.office_website || 'www.depeddapitancity.net',
                    facebook: settings.office_facebook || 'DepEd Dapitan City',
                    doc_ref_code: settings.doc_ref_code || 'SDO-OSDS-F001',
                    doc_rev: settings.doc_rev || '00',
                    doc_effectivity: settings.doc_effectivity || '2026-03-18'
                }
            };
        }
    }

    // Fallback: if no MQ checklist rows for this vacancy, generate the 4 standard MQS criteria
    // (Education, Experience, Training, Eligibility) so the Annex E table is never blank
    if (criteria.length === 0) {
        const standardLabels = [
            { label: 'Education', mqsKey: 'education' },
            { label: 'Experience', mqsKey: 'experience' },
            { label: 'Training', mqsKey: 'training' },
            { label: 'Eligibility', mqsKey: 'eligibility' }
        ];
        criteria = standardLabels.map(sc => ({
            criterion_id: null,
            criterion_label: sc.label,
            is_required: true,
            passed: isQualifiedStatus ? 1 : null,
            criterion_evaluated_at: null,
            criterion_reason: null
        }));
    }

    // Auto-derive from MQ checklist + AQR + PDS + rsp_mqs_criteria
    const tableRows = criteria.map(c => {
        let remarks;
        if (isQualified) {
            remarks = 'QUALIFIED';
        } else {
            if (c.passed === 1) remarks = 'QUALIFIED';
            else if (c.passed === 0) {
                remarks = c.criterion_reason
                    ? `DISQUALIFIED – ${c.criterion_reason}`
                    : 'DISQUALIFIED';
            }
            else remarks = 'PENDING EVALUATION';
        }

        const mqsStandard = mapMqsToCriterion(c.criterion_label, mqsCriteria);
        const csQs = mqsStandard || c.criterion_label;

        return {
            criterion_id: c.criterion_id,
            criterion_label: c.criterion_label,
            is_required: !!c.is_required,
            cs_qs: csQs,
            your_qualifications: getPdsValue(c.criterion_label, pds),
            remarks,
            reason: c.passed === 0 ? (c.criterion_reason || null) : null,
            passed: c.passed
        };
    });

    return {
        variant: effectiveVariant,
        letter_type: app.letter_type,
        advice_sent_at: app.advice_sent_at,
        congratulatory_advice_sent_at: app.congratulatory_advice_sent_at,
        applicant: {
            id: app.id,
            full_name: app.full_name,
            ref_no: app.ref_no,
            address,
            status: app.status,
            evaluated_at: app.evaluated_at,
            disqualification_reason: disqualificationReason
        },
        letter: {
            salutation,
            last_name: lastName,
            first_name: firstName,
            recipient_full_name: recipientFullName,
            address: letterAddress,
            letter_date: app.letter_date || null,
            letter_date_display: letterDate,
            eval_date_display: evalDate
        },
        vacancy: {
            id: app.vacancy_id,
            position_title: app.position_title,
            position_type: app.position_type,
            assigned_school: app.assigned_school,
            subject: app.subject,
            office_abbreviation: 'SDO-Dapitan'
        },
        table_rows: tableRows,
        signatory: {
            name: signatory.full_name,
            position: signatory.position || 'Schools Division Superintendent',
            designation: signatory.designation || null,
            signature_path: signatory.signature_path || null
        },
        office: {
            name: settings.office_name || 'Schools Division Office of Dapitan City',
            address: settings.office_address || 'Sunset Boulevard, Dawo, Dapitan City',
            contact: settings.contact_number || '065-908-1234',
            email: settings.email || 'sdo.dapitancity@deped.gov.ph',
            website: settings.office_website || 'www.depeddapitancity.net',
            facebook: settings.office_facebook || 'DepEd Dapitan City',
            doc_ref_code: settings.doc_ref_code || 'SDO-OSDS-F001',
            doc_rev: settings.doc_rev || '00',
            doc_effectivity: settings.doc_effectivity || '2026-03-18'
        }
    };
}

// ─── PDF text measurement helper ──────────────────────────────────────────────

function measureTextHeight(doc, text, fontName, fontSize, maxWidth) {
    if (!text) return 0;
    return doc.font(fontName).fontSize(fontSize).heightOfString(text, { width: maxWidth, lineGap: 1.5 });
}

// ─── GET /api/rsp/initial-evaluation/:applicationId/annex-e ──────────────────

exports.getAnnexEData = async (req, res) => {
    try {
        const data = await buildAnnexEPayload(req.params.applicationId);
        res.json(data);
    } catch (err) {
        console.error('getAnnexEData Error:', err);
        if (err.status) return res.status(err.status).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// ─── Shared PDF rendering function (used by both stream and buffer paths) ─────

function renderAnnexEContent(doc, data) {
    const { variant, applicant, vacancy, table_rows, signatory, office, letter } = data;
    const isQualified = variant === 'qualified';

    const recipientName = letter?.recipient_full_name || applicant.full_name;
    const recipientAddress = letter?.address || applicant.address;
    const salutation = letter?.salutation || 'Mr.';
    const nameParts = recipientName.trim().split(/\s+/);
    const lastName = nameParts.pop();

    const letterDate = letter?.letter_date_display
        || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const evalDate = letter?.eval_date_display || letterDate;

    const docEffectivity = office.doc_effectivity
        ? new Date(office.doc_effectivity).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
        : '03/18/2026';

    const L = 72, R = doc.page.width - 72, W = R - L;
    const PAGE_H = doc.page.height;
    const S = 'Times-Roman', SB = 'Times-Bold', SI = 'Times-Italic', SBI = 'Times-BoldItalic';
    const CELL_FONT = 'Times-Roman', CELL_FONT_BOLD = 'Times-Bold';

    // ═══ CONTENT HEIGHT ESTIMATION & SPACING COMPRESSION ══════════════════════════
    // Pre-calculate all content heights to determine if spacing must be compressed
    // so the signature block never overlaps the footer zone.
    const FOOTER_ZONE_TOP = PAGE_H - 105;
    const FOOTER_HEIGHT = 55;
    const MIN_GAP = 14;
    const CONTENT_CEILING = PAGE_H - MIN_GAP - FOOTER_HEIGHT;

    const colW = [W * 0.16, W * 0.24, W * 0.30, W * 0.30];
    const hdrs = ['Position Applied for:', 'CSC approved QS of the Position', 'Applicant\'s Qualifications', 'Remarks / Details'];
    const HEADER_H = 24, CELL_PAD = 8, LINE_GAP = 2, CELL_FS = 8.5;

    const rowHeights = table_rows.map(row => {
        const cells = [row.cs_qs, row.your_qualifications, row.remarks];
        let maxH = 0;
        cells.forEach((cell, ci) => {
            const h = measureTextHeight(doc, cell || 'None', CELL_FONT, CELL_FS, colW[ci + 1] - CELL_PAD * 2);
            if (h > maxH) maxH = h;
        });
        return Math.max(maxH + CELL_PAD * 2, 36);
    });
    const totalTableH = HEADER_H + rowHeights.reduce((a, b) => a + b, 0);

    const bodyTextQ = `We are pleased to inform you that based on the initial evaluation, we have found your ` +
        `qualifications to be substantial vis-à-vis the Civil Service Commission (CSC) approved ` +
        `Qualification Standards (QS) of the ${vacancy.position_title} position ` +
        `under (${vacancy.office_abbreviation}). Below are the results of the initial evaluation ` +
        `conducted by the undersigned dated ${evalDate}.`;
    const bodyTextD = `Please be informed of the results of the initial evaluation of your qualifications vis-à-vis ` +
        `the Civil Service Commission (CSC) approved Qualification Standards (QS) of ` +
        `${vacancy.position_title} position under (${vacancy.office_abbreviation}), as follows:`;
    const bodyText = isQualified ? bodyTextQ : bodyTextD;
    const bodyTitleH = isQualified ? measureTextHeight(doc, 'Congratulations!', SB, 12, W) : 0;
    const bodyTextH = measureTextHeight(doc, bodyText, S, 12, W);

    const closingTextQ = `Please be advised of your assigned application code (${applicant.ref_no}) which shall be used as you ` +
        `proceed with the next stage of the selection process. You may refer to the official issuances of ` +
        `DepEd ${office.name} for the additional announcements in this regard. For inquiries, you may communicate ` +
        `with the office number: ${office.contact} and email address: ${office.email}. Thank you.`;
    const closingTextD1 = `While your qualifications made a favorable impression, we regret to inform you that you did not meet the ` +
        `minimum QS set for the ${vacancy.position_title} position. You may, however, continue to submit job ` +
        `applications in response to other vacancy announcements that we publish at www.csc.gov.ph/careers, ` +
        `DepEd ${office.name} bulletin boards, and official website.`;
    const closingTextD2 = `The results of the initial evaluation shall be released and posted for transparency purposes. You may ` +
        `refer to your assigned application code (${applicant.ref_no}) in the official posting of the results.`;
    const closingTextD3 = 'Thank you and we wish you the best of luck in your future success.';
    const closingH = isQualified
        ? measureTextHeight(doc, closingTextQ, S, 12, W)
        : measureTextHeight(doc, closingTextD1, S, 12, W) + measureTextHeight(doc, closingTextD2, S, 12, W) + measureTextHeight(doc, closingTextD3, S, 12, W);

    // Text heights only — add generous padding for pdfkit internal leading/lineGap
    const contentH = 80 + 70 + 35 + 55 + bodyTitleH + bodyTextH + totalTableH + closingH + 48;

    const LDG = 12 * 1.2;
    const disqExtra = isQualified ? 0 : 2 * 0.4 * LDG;
    const spacingH = 4 + (0.1 + 0.1 + 0.05 + 0.3 + 0.5) * LDG + 14 + 0.2 * LDG + 16 + 0.5 * LDG
        + (0.1 + 0.5 + 0.5) * LDG + (0.3 + 0.6) * LDG + 8 + 0.6 * LDG
        + (isQualified ? 1.0 : 1.0) * LDG + disqExtra
        + (0.3 + 2.0 + 0.1) * LDG;

    let spacingScale = 1;
    if (contentH + spacingH > CONTENT_CEILING - 72) {
        spacingScale = Math.max(0.5, (CONTENT_CEILING - 72 - contentH) / spacingH);
    }
    const sp = (v) => v * spacingScale;

    // NOTE: Do NOT monkey-patch doc.moveDown — pdfkit uses it internally for
    // text flow. Instead, apply sp() to each explicit moveDown call via md().
    const md = (n) => doc.moveDown(sp(n));

    // ═══ DEPED SEAL ═══════════════════════════════════════════════════════════
    const sealPath = path.join(__dirname, '../../assets/deped-seal.png');
    if (fs.existsSync(sealPath)) {
        const sealW = 80;
        const sealX = (doc.page.width - sealW) / 2;
        doc.image(sealPath, sealX, doc.y || 50, { width: sealW });
        doc.y = (doc.y || 50) + sealW + 4;
    } else {
        const sealR = 30, sealCX = doc.page.width / 2, sealCY = (doc.y || 50) + sealR;
        doc.save();
        doc.circle(sealCX, sealCY, sealR).lineWidth(1.5).stroke('#1B3A6B');
        doc.font(SB).fontSize(6).fillColor('#1B3A6B').text('DEPED', sealCX - 18, sealCY - 5, { width: 36, align: 'center' });
        doc.font(S).fontSize(5).text('SEAL', sealCX - 18, sealCY + 3, { width: 36, align: 'center' });
        doc.restore();
        doc.y = sealCY + sealR + 6;
    }

    // ═══ LETTERHEAD TEXT ══════════════════════════════════════════════════════
    doc.fillColor('#000000');
    doc.font(SI).fontSize(12).text('Republic of the Philippines', L, doc.y, { width: W, align: 'center' });
    md(0.1);
    doc.font(SB).fontSize(16).text('Department of Education', { align: 'center' });
    md(0.1);
    doc.font(S).fontSize(10).text('REGION IX, ZAMBOANGA PENINSULA', { align: 'center' });
    md(0.05);
    doc.font(SB).fontSize(10.5).text('SCHOOLS DIVISION OF DAPITAN CITY', { align: 'center' });
    md(0.3);
    doc.moveTo(L, doc.y).lineTo(R, doc.y).lineWidth(1.5).stroke('#1B3A6B');
    md(0.5);

    // ═══ ANNEX E + DATE ══════════════════════════════════════════════════════
    const annexY = doc.y;
    doc.font(SBI).fontSize(12).fillColor('#000000').text('ANNEX E', L, annexY, { width: W, align: 'right' });
    doc.y = annexY + sp(14);
    md(0.2);
    const dateY = doc.y;
    doc.font(S).fontSize(12).text(letterDate, L, dateY, { width: W * 0.5 });
    doc.y = dateY + sp(16);
    md(0.5);

    // ═══ RECIPIENT BLOCK ═════════════════════════════════════════════════════
    doc.font(SB).fontSize(12).text(`${salutation} ${recipientName}`, L, doc.y, { width: W });
    md(0.1);
    doc.font(S).fontSize(12).text(recipientAddress, L, doc.y, { width: W });
    md(0.5);
    doc.font(S).fontSize(12).text(`Dear ${salutation} ${lastName}:`, L, doc.y, { width: W });
    md(0.5);

    // ═══ BODY TEXT ════════════════════════════════════════════════════════════
    if (isQualified) {
        doc.font(SB).fontSize(12).fillColor('#000000').text('Congratulations!', L, doc.y, { width: W });
        md(0.3);
        doc.font(S).fontSize(12).text(
            `We are pleased to inform you that based on the initial evaluation, we have found your ` +
            `qualifications to be substantial vis-à-vis the Civil Service Commission (CSC) approved ` +
            `Qualification Standards (QS) of the ${vacancy.position_title} position ` +
            `under (${vacancy.office_abbreviation}). Below are the results of the initial evaluation ` +
            `conducted by the undersigned dated ${evalDate}.`,
            L, doc.y, { width: W, align: 'justify', lineGap: 2 }
        );
    } else {
        doc.font(S).fontSize(12).fillColor('#000000').text(
            `Please be informed of the results of the initial evaluation of your qualifications vis-à-vis ` +
            `the Civil Service Commission (CSC) approved Qualification Standards (QS) of ` +
            `${vacancy.position_title} position under (${vacancy.office_abbreviation}), as follows:`,
            L, doc.y, { width: W, align: 'justify', lineGap: 2 }
        );
    }
    md(0.6);

    // ═══ QS TABLE (merged Position column) ═══════════════════════════════════
    if (doc.y + totalTableH > PAGE_H - 140) doc.addPage();

    let tableY = doc.y;
    // Header row
    let cx = L;
    hdrs.forEach((h, i) => {
        doc.rect(cx, tableY, colW[i], HEADER_H).fill('#1B3A6B');
        doc.fillColor('white').font(CELL_FONT_BOLD).fontSize(8)
           .text(h, cx + 3, tableY + 7, { width: colW[i] - 6, align: 'center', lineGap: 1 });
        doc.fillColor('#000000');
        cx += colW[i];
    });

    // Data rows — Position column merged via rowSpan
    let rowY = tableY + HEADER_H;
    const totalDataH = rowHeights.reduce((a, b) => a + b, 0);

    // Draw merged Position cell (spans all rows) — only if there are data rows
    if (totalDataH > 0) {
        doc.save();
        doc.rect(L, rowY, colW[0], totalDataH).fill('#f0f4fa');
        doc.rect(L, rowY, colW[0], totalDataH).lineWidth(0.5).stroke('#CBD5E1');
        doc.fillColor('#1B3A6B').font(CELL_FONT_BOLD).fontSize(9);
        const posTextH = measureTextHeight(doc, vacancy.position_title, CELL_FONT_BOLD, 9, colW[0] - CELL_PAD * 2);
        doc.text(vacancy.position_title, L + CELL_PAD, rowY + (totalDataH - posTextH) / 2, {
            width: colW[0] - CELL_PAD * 2, align: 'center', lineGap: LINE_GAP
        });
        doc.restore();
    }

    // Draw other 3 columns per row
    table_rows.forEach((row, ri) => {
        const rh = rowHeights[ri];
        const isDisq = row.remarks.startsWith('DISQUALIFIED');
        const bg = ri % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
        const cells = [row.cs_qs, row.your_qualifications, row.remarks];

        cx = L + colW[0];
        cells.forEach((cell, ci) => {
            doc.rect(cx, rowY, colW[ci + 1], rh).fill(bg);
            doc.rect(cx, rowY, colW[ci + 1], rh).lineWidth(0.5).stroke('#CBD5E1');

            const isRemarks = ci === 2;
            const textColor = isRemarks ? (isDisq ? '#DC2626' : '#059669') : '#334155';
            const fn = isRemarks ? CELL_FONT_BOLD : CELL_FONT;

            doc.fillColor(textColor).font(fn).fontSize(CELL_FS)
               .text(cell || 'None', cx + CELL_PAD, rowY + CELL_PAD, {
                   width: colW[ci + 1] - CELL_PAD * 2, lineGap: LINE_GAP, align: 'left'
               });

            // Draw reason sub-text below DISQUALIFIED remarks
            if (isRemarks && isDisq && row.reason) {
                const mainH = measureTextHeight(doc, row.remarks, CELL_FONT_BOLD, CELL_FS, colW[ci + 1] - CELL_PAD * 2);
                doc.fillColor('#991B1B').font(SI).fontSize(7)
                   .text(row.reason, cx + CELL_PAD, rowY + CELL_PAD + mainH + 2, {
                       width: colW[ci + 1] - CELL_PAD * 2, lineGap: 1
                   });
            }

            doc.fillColor('#000000');
            cx += colW[ci + 1];
        });
        rowY += rh;
    });

    doc.y = rowY + sp(8);
    md(0.6);

    // ═══ CLOSING TEXT ═════════════════════════════════════════════════════════
    if (isQualified) {
        doc.font(S).fontSize(12).fillColor('#000000').text(
            `Please be advised of your assigned application code (${applicant.ref_no}) which shall be used as you ` +
            `proceed with the next stage of the selection process. You may refer to the official issuances of ` +
            `DepEd ${office.name} for the additional announcements in this regard. For inquiries, you may communicate ` +
            `with the office number: ${office.contact} and email address: ${office.email}. Thank you.`,
            L, doc.y, { width: W, align: 'justify', lineGap: 2 }
        );
    } else {
        doc.font(S).fontSize(12).fillColor('#000000').text(
            `While your qualifications made a favorable impression, we regret to inform you that you did not meet the ` +
            `minimum QS set for the ${vacancy.position_title} position. You may, however, continue to submit job ` +
            `applications in response to other vacancy announcements that we publish at www.csc.gov.ph/careers, ` +
            `DepEd ${office.name} bulletin boards, and official website.`,
            L, doc.y, { width: W, align: 'justify', lineGap: 2 }
        );
        md(0.4);
        doc.text(
            `The results of the initial evaluation shall be released and posted for transparency purposes. You may ` +
            `refer to your assigned application code (${applicant.ref_no}) in the official posting of the results.`,
            L, doc.y, { width: W, align: 'justify', lineGap: 2 }
        );
        md(0.4);
        doc.text('Thank you and we wish you the best of luck in your future success.', L, doc.y, { width: W, align: 'justify' });
    }
    md(1.0);

    // ═══ SIGNATURE BLOCK ═════════════════════════════════════════════════════
    doc.font(S).fontSize(12).fillColor('#000000').text('Very truly yours,', L, doc.y, { width: W });
    md(0.3);

    const sigPath = signatory.signature_path
        ? path.join(__dirname, '../..', signatory.signature_path) : null;
    if (sigPath && fs.existsSync(sigPath)) {
        md(0.4);
        doc.image(sigPath, L + 20, doc.y, { width: 120, height: 50 });
        md(1.8);
    } else {
        md(2.0);
    }

    doc.font(SB).fontSize(12).fillColor('#000000')
       .text(signatory.name.toUpperCase(), L, doc.y, { width: W });
    md(0.1);
    doc.font(S).fontSize(10).fillColor('#000000')
       .text(signatory.position, L, doc.y, { width: W });
    if (signatory.designation) {
        md(0.05);
        doc.font(S).fontSize(10).text(signatory.designation, L, doc.y, { width: W });
    }

    // ═══ FOOTER (buffered, every page) ═══════════════════════════════════════
    const contentEndY = doc.y;
    const range = doc.bufferedPageRange();
    for (let i = range.start, end = range.start + range.count, pageIndex = 1; i < end; i++, pageIndex++) {
        doc.switchToPage(i);
        const footerY = Math.max(contentEndY + MIN_GAP, FOOTER_ZONE_TOP);

        doc.moveTo(L, footerY).lineTo(R, footerY).lineWidth(1).stroke('#1B3A6B');

        // Logos row (left) — use actual images where available, labeled fallbacks otherwise
        const logoW = 22, logoGap = 4;
        let logoX = L;
        const logoEntries = [
            { label: 'DepEd',           file: path.join(__dirname, '../../assets/deped-seal.png') },
            { label: 'Bagong\nPilipinas', file: path.join(__dirname, '../../assets/bagong-pilipinas.png') },
            { label: 'Division\nSeal',   file: path.join(__dirname, '../../assets/division-seal.png') },
            { label: 'PRIME-\nHRM',     file: path.join(__dirname, '../../assets/prime-hrm.png') }
        ];
        logoEntries.forEach(lp => {
            doc.save();
            doc.roundedRect(logoX, footerY + 8, logoW, logoW, 2).lineWidth(0.5).stroke('#CCCCCC');
            if (lp.file && fs.existsSync(lp.file)) {
                try {
                    doc.image(lp.file, logoX + 1, footerY + 9, { width: logoW - 2, height: logoW - 2 });
                } catch (e) {
                    doc.font('Helvetica-Bold').fontSize(3.5).fillColor('#1B3A6B')
                       .text(lp.label, logoX + 2, footerY + 14, { width: logoW - 4, align: 'center', lineGap: 0.5 });
                }
            } else {
                doc.font('Helvetica-Bold').fontSize(3.5).fillColor('#1B3A6B')
                   .text(lp.label, logoX + 2, footerY + 14, { width: logoW - 4, align: 'center', lineGap: 0.5 });
            }
            doc.restore();
            logoX += logoW + logoGap;
        });

        // Contact info (center)
        const infoX = L + 118, infoW = 195;
        const infoLines = [
            ['Address:', office.address],
            ['Telephone No.:', office.contact],
            ['Website:', office.website],
            ['Email Address:', office.email],
        ];
        if (office.facebook) infoLines.push(['Facebook:', office.facebook]);
        infoLines.forEach(([label, val], idx) => {
            doc.font('Helvetica-Bold').fontSize(6).fillColor('#1B3A6B')
               .text(label, infoX, footerY + 8 + idx * 9, { width: 42 });
            doc.font('Helvetica').fontSize(6).fillColor('#333333')
               .text(val || '', infoX + 44, footerY + 8 + idx * 9, { width: infoW - 44 });
        });

        // Doc-ref table (right)
        const dtX = R - 140, dtY = footerY + 8;
        const cw = [46, 15, 36, 43];
        doc.rect(dtX, dtY, 140, 10).fill('#1B3A6B');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(5.5);
        ['Doc. Ref. Code', 'Rev', 'Effectivity', 'Page'].forEach((h, i) => {
            const x = dtX + cw.slice(0, i).reduce((a, b) => a + b, 0) + 1;
            doc.text(h, x, dtY + 3, { width: cw[i], align: 'center' });
        });
        doc.rect(dtX, dtY + 10, 140, 10).fill('#FFFFFF');
        doc.rect(dtX, dtY, 140, 20).lineWidth(0.5).stroke('#1B3A6B');
        let sepX = dtX;
        cw.forEach((c, i) => { sepX += c; if (i < 3) doc.moveTo(sepX, dtY).lineTo(sepX, dtY + 20).lineWidth(0.5).stroke('#1B3A6B'); });
        doc.fillColor('#333333').font('Helvetica').fontSize(5.5);
        [office.doc_ref_code, office.doc_rev, docEffectivity, `${pageIndex} of ${range.count}`].forEach((v, i) => {
            const x = dtX + cw.slice(0, i).reduce((a, b) => a + b, 0) + 1;
            doc.text(v || '', x, dtY + 13, { width: cw[i], align: 'center' });
        });
    }
}

// ─── GET /api/rsp/initial-evaluation/:applicationId/annex-e/pdf ──────────────

exports.generateAnnexEPdf = async (req, res) => {
    try {
        const data = await buildAnnexEPayload(req.params.applicationId);
        const { applicant, office } = data;
        const recipientName = data.letter?.recipient_full_name || applicant.full_name;
        const lastName = recipientName.trim().split(/\s+/).pop();

        const doc = new PDFDocument({
            margin: { top: 72, left: 72, right: 72, bottom: 10 }, size: 'LETTER', bufferPages: true,
            info: {
                Title: `Annex E – ${data.variant === 'qualified' ? 'Congratulatory' : 'Disqualification'} – ${applicant.full_name}`,
                Author: office.name, Subject: 'Initial Evaluation Result'
            }
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="AnnexE_${applicant.ref_no.replace(/[^A-Za-z0-9-]/g, '_')}_${lastName.replace(/[^A-Za-z]/g, '')}.pdf"`);
        doc.pipe(res);

        renderAnnexEContent(doc, data);
        doc.end();
    } catch (err) {
        console.error('generateAnnexEPdf Error:', err);
        if (!res.headersSent) {
            if (err.status) return res.status(err.status).json({ message: err.message });
            res.status(500).json({ message: 'Could not generate Annex E PDF.' });
        }
    }
};

// ─── PATCH /api/rsp/initial-evaluation/:applicationId/annex-e/letter-type ────

exports.updateLetterType = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { letter_type } = req.body;
        if (!['qualified', 'disqualified'].includes(letter_type)) {
            return res.status(400).json({ message: 'letter_type must be "qualified" or "disqualified".' });
        }
        const [result] = await db.query('UPDATE applications SET letter_type = ? WHERE id = ?', [letter_type, applicationId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Application not found.' });
        res.json({ message: 'Letter type updated.', letter_type });
    } catch (err) {
        console.error('updateLetterType Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// ─── PATCH /api/rsp/evaluation/:applicationId/annex-e/overrides ──────────────

exports.updateLetterOverrides = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { letter_salutation, letter_last_name, letter_first_name, letter_address, letter_date } = req.body;
        if (letter_salutation && !['Mr.', 'Ms.', 'Mrs.'].includes(letter_salutation)) {
            return res.status(400).json({ message: 'letter_salutation must be "Mr.", "Ms.", or "Mrs."' });
        }
        const [result] = await db.query(
            `UPDATE applications SET letter_salutation=?, letter_last_name=?, letter_first_name=?, letter_address=?, letter_date=? WHERE id=?`,
            [letter_salutation || null, letter_last_name || null, letter_first_name || null, letter_address || null, letter_date || null, applicationId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Application not found.' });
        res.json({ message: 'Letter overrides saved.' });
    } catch (err) {
        console.error('updateLetterOverrides Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// ─── PATCH /api/rsp/evaluation/:applicationId/annex-e/table-rows ──────────────

exports.saveTableRows = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { table_rows } = req.body;
        if (!Array.isArray(table_rows)) {
            return res.status(400).json({ message: 'table_rows must be an array.' });
        }
        // Validate each row has required fields
        for (const row of table_rows) {
            if (!row.cs_qs || !row.remarks) {
                return res.status(400).json({ message: 'Each row must have cs_qs and remarks.' });
            }
        }
        const jsonStr = JSON.stringify(table_rows);
        const [result] = await db.query(
            'UPDATE applications SET table_rows_override = ? WHERE id = ?',
            [jsonStr, applicationId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Application not found.' });
        res.json({ message: 'QS evaluation table rows saved.', count: table_rows.length });
    } catch (err) {
        console.error('saveTableRows Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// ─── DELETE /api/rsp/evaluation/:applicationId/annex-e/table-rows ─────────────
// Clears overrides so auto-derived data is used again

exports.clearTableRows = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const [result] = await db.query(
            'UPDATE applications SET table_rows_override = NULL WHERE id = ?',
            [applicationId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Application not found.' });
        res.json({ message: 'QS evaluation overrides cleared. Using auto-derived data.' });
    } catch (err) {
        console.error('clearTableRows Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// ─── POST /api/rsp/initial-evaluation/:applicationId/annex-e/send ────────────

exports.sendAnnexEAdvice = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const data = await buildAnnexEPayload(applicationId);
        const { applicant, vacancy, letter } = data;
        const letterType = data.variant;
        const recipientName = letter?.recipient_full_name || applicant.full_name;

        const [userRows] = await db.query(
            'SELECT email FROM applications WHERE id = ? LIMIT 1', [applicationId]
        );
        if (userRows.length === 0 || !userRows[0].email) {
            return res.status(400).json({ message: 'Applicant has no registered email address. Cannot send.' });
        }
        const applicantEmail = userRows[0].email;
        const pdfBuffer = await generateAnnexEBuffer(data);

        try {
            await sendAnnexEEmail(applicantEmail, recipientName, vacancy.position_title, letterType, pdfBuffer, applicant.ref_no);
        } catch (emailErr) {
            console.error('⚠️ Could not send Annex E email:', emailErr.message);
        }
        await db.query('UPDATE applications SET advice_sent_at = NOW() WHERE id = ?', [applicationId]);
        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [data.vacancy_id || null, req.user.id, `Annex E (${letterType}) advice letter emailed to ${recipientName} at ${applicantEmail}`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.to(`application-${applicationId}`).emit('application:notification', {
                message: `Your Initial Evaluation Advice Letter for ${vacancy.position_title} has been sent to your registered email.`,
                created_at: new Date()
            });
            io.emit('rsp:dashboard:update');
        }
        res.json({ message: 'Advice letter sent successfully.', sent_to: applicantEmail });
    } catch (err) {
        console.error('sendAnnexEAdvice Error:', err);
        if (!res.headersSent) res.status(500).json({ message: err.message || 'Failed to send advice letter.' });
    }
};

// ─── Helper: generate Annex E PDF as a Buffer (for email attachment) ──────────

function generateAnnexEBuffer(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: { top: 72, left: 72, right: 72, bottom: 10 }, size: 'LETTER', bufferPages: true });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        renderAnnexEContent(doc, data);
        doc.end();
    });
}
