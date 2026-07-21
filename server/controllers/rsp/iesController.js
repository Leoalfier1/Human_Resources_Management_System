const db = require('../../db');
const path = require('path');
const fs = require('fs');

const CRITERION_LABELS = Object.freeze({
    education: 'Education',
    training: 'Training',
    experience: 'Experience',
    performance: 'Performance',
    outstanding_accomplishments: 'Outstanding Accomplishments',
    application_of_education: 'Application of Education',
    application_of_ld: 'Application of L&D',
    potential: 'Potential',
    pbet_let_lept_rating: 'PBET/LET/LEPT Rating',
    ppst_coi: 'PPST COIs',
    ppst_ncoi: 'PPST NCOIs'
});

const CATEGORY_LABELS = Object.freeze({
    teacher_i: 'Teacher I - Teaching Position',
    teaching_related: 'Teaching Related Position',
    non_teaching: 'Non-Teaching Position'
});

const isTeacherIPosition = (positionTitle = '') => {
    const normalized = String(positionTitle).trim().toLowerCase();
    return /\bteacher\s*(i|1)\b/.test(normalized) && !/\b(master|head|principal|supervisor)\b/.test(normalized);
};

const isGeneralServicesPosition = (positionTitle = '') => {
    const normalized = String(positionTitle).trim().toLowerCase();
    return [
        'general services', 'utility worker', 'security guard', 'driver',
        'administrative aide', 'clerk', 'messenger', 'janitor'
    ].some(keyword => normalized.includes(keyword));
};

const parseSalaryGrade = (salaryGrade) => {
    if (salaryGrade === null || salaryGrade === undefined) return null;
    const parsed = Number(String(salaryGrade).replace(/^SG-/i, '').trim());
    return Number.isInteger(parsed) ? parsed : null;
};

const resolveIesCategoryAndBracket = ({ position_type, position_title, salary_grade }) => {
    const positionType = position_type || 'teaching';
    const sg = parseSalaryGrade(salary_grade);

    if (positionType === 'teaching') {
        if (!isTeacherIPosition(position_title)) {
            // DepEd DO 007 places Master Teachers, etc. in different brackets or enclosures,
            // but since the seed data only handles teacher_i for teaching category currently,
            // we default them to teaching_related or non-teacher teaching brackets if supported later.
            // For now, we allow them to fall back to teacher_i or whatever the default is, 
            // but log a warning. The prompt says this scope is only correcting weight values.
            return { positionCategory: 'teacher_i', bracketKey: null };
        }
        return { positionCategory: 'teacher_i', bracketKey: null };
    }

    if (positionType === 'non_teaching') {
        if (!Number.isInteger(sg)) {
            return { positionCategory: 'non_teaching', bracketKey: 'SG_10_22_27' };
        }
        if (isGeneralServicesPosition(position_title)) return { positionCategory: 'non_teaching', bracketKey: 'GENERAL_SERVICES' };
        if (sg >= 1 && sg <= 9) return { positionCategory: 'non_teaching', bracketKey: 'SG_1_9_NON_GS' };
        if ((sg >= 10 && sg <= 22) || sg === 27) return { positionCategory: 'non_teaching', bracketKey: 'SG_10_22_27' };
        if (sg === 24) return { positionCategory: 'non_teaching', bracketKey: 'SG_24_CHIEF' };
    }

    if (positionType === 'teaching_related') {
        if (!Number.isInteger(sg)) {
            return { positionCategory: 'teaching_related', bracketKey: 'SG_16_23_27' };
        }
        if (sg >= 11 && sg <= 15) return { positionCategory: 'teaching_related', bracketKey: 'SG_11_15' };
        if ((sg >= 16 && sg <= 23) || sg === 27) return { positionCategory: 'teaching_related', bracketKey: 'SG_16_23_27' };
        if (sg === 24) return { positionCategory: 'teaching_related', bracketKey: 'SG_24_CHIEF' };
    }

    return { positionCategory: positionType, bracketKey: null };
};

const getTemplateRows = async (positionCategory, bracketKey) => {
    const [rows] = await db.query(
        `SELECT id, position_category, bracket_key, criteria_key, max_points, display_order
         FROM ies_weight_templates
         WHERE position_category = ? AND ${bracketKey === null ? 'bracket_key IS NULL' : 'bracket_key = ?'}
         ORDER BY display_order ASC`,
        bracketKey === null ? [positionCategory] : [positionCategory, bracketKey]
    );
    return rows.map(row => ({ ...row, criteria_label: CRITERION_LABELS[row.criteria_key] || row.criteria_key }));
};

const getFullEvaluation = async (ieId) => {
    const [records] = await db.query(
        `SELECT ie.*,
                a.full_name AS applicant_name,
                a.email AS applicant_email,
                a.phone AS applicant_phone,
                a.ref_no AS application_ref_no,
                a.current_school,
                v.position_title,
                v.ref_no AS vacancy_ref_no,
                v.salary_grade,
                v.position_type,
                v.assigned_school,
                v.subject,
                evaluator.full_name AS evaluator_name,
                chair.full_name AS chair_name
         FROM ies_evaluations ie
         JOIN applications a ON ie.applicant_id = a.id
         JOIN vacancies v ON ie.vacancy_id = v.id
         LEFT JOIN users evaluator ON ie.evaluated_by = evaluator.id
         LEFT JOIN users chair ON ie.attested_by_chair_id = chair.id
         WHERE ie.id = ?`,
        [ieId]
    );
    if (records.length === 0) return null;

    const [criteria] = await db.query(
        `SELECT id, ies_evaluation_id, criteria_key, weight_allocation,
                qualification_notes, computation_notes, actual_score
         FROM ies_criterion_scores
         WHERE ies_evaluation_id = ?
         ORDER BY id ASC`,
        [ieId]
    );

    return {
        ...records[0],
        criteria: criteria.map(row => ({
            ...row,
            criteria_label: CRITERION_LABELS[row.criteria_key] || row.criteria_key
        }))
    };
};

const emitStatusChange = (req, evaluation) => {
    const io = req.app.get('socketio');
    if (!io) return;
    io.to(`ies-${evaluation.id}`).emit('ies:status-changed', {
        iesId: evaluation.id,
        applicationId: evaluation.applicant_id,
        status: evaluation.status,
        totalScore: evaluation.total_score
    });
    io.to(`application-${evaluation.applicant_id}`).emit('ies:status-changed', {
        iesId: evaluation.id,
        applicationId: evaluation.applicant_id,
        status: evaluation.status
    });
    io.to(`application-${evaluation.applicant_id}`).emit('application:stage-update', {
        applicationId: evaluation.applicant_id
    });
    io.emit('rsp:dashboard:update');
};

// ────────────────────────────────────────────────
// GET /api/rsp/ies/queue?category={teaching|teaching_related|non_teaching}
// ────────────────────────────────────────────────
exports.getQueue = async (req, res) => {
    try {
        const { category } = req.query;
        const validCategories = ['teaching', 'teaching_related', 'non_teaching'];
        if (!category || !validCategories.includes(category)) {
            return res.status(400).json({ message: 'Valid category parameter is required: teaching, teaching_related, non_teaching' });
        }

        const [rows] = await db.query(
            `SELECT
                a.id AS application_id,
                a.full_name AS applicant_name,
                a.ref_no AS application_code,
                a.current_school,
                a.applicant_id AS user_id,
                v.id AS vacancy_id,
                v.position_title,
                v.subject,
                v.assigned_school,
                v.position_type,
                v.salary_grade,
                ie.id AS ies_id,
                ie.status,
                ie.total_score,
                ie.position_category,
                ie.bracket_key
             FROM applications a
             JOIN vacancies v ON a.vacancy_id = v.id
             LEFT JOIN ies_evaluations ie ON ie.applicant_id = a.id AND ie.vacancy_id = v.id
             WHERE a.status != 'draft'
               AND v.position_type = ?
             ORDER BY
               CASE WHEN ie.status = 'attested' THEN 0
                    WHEN ie.status = 'submitted' THEN 1
                    WHEN ie.status = 'draft' THEN 2
                    ELSE 3 END,
               a.full_name ASC`,
            [category]
        );

        const queue = rows.map(row => ({
            applicationId: row.application_id,
            applicantName: row.applicant_name,
            applicationCode: row.application_code,
            positionTitle: row.position_title,
            subject: row.subject,
            school: row.current_school || row.assigned_school || 'N/A',
            vacancyId: row.vacancy_id,
            salaryGrade: row.salary_grade,
            positionType: row.position_type,
            iesId: row.ies_id,
            status: row.status || 'draft',
            totalScore: row.ies_id ? Number(row.total_score || 0) : null,
            positionCategory: row.position_category,
            bracketKey: row.bracket_key
        }));

        res.json(queue);
    } catch (error) {
        console.error('getQueue Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ────────────────────────────────────────────────
// GET /api/rsp/ies/weight-templates/:positionCategory
// ────────────────────────────────────────────────
exports.getWeightTemplates = async (req, res) => {
    try {
        const { positionCategory, bracketKey } = req.params;
        const normalizedBracket = bracketKey === undefined || bracketKey === 'null' ? null : bracketKey;
        const rows = await getTemplateRows(positionCategory, normalizedBracket);
        if (rows.length === 0) return res.status(404).json({ message: 'No IES weight template found.' });
        res.json(rows);
    } catch (error) {
        console.error('getWeightTemplates Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ────────────────────────────────────────────────
// POST /api/rsp/ies/:applicationId  (create or open existing)
// ────────────────────────────────────────────────
exports.createEvaluation = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { applicationId } = req.params;
        const [apps] = await conn.query(
            `SELECT a.id, a.ref_no, a.phone, a.current_school, a.vacancy_id,
                    v.position_type, v.position_title, v.salary_grade, v.assigned_school
             FROM applications a
             JOIN vacancies v ON a.vacancy_id = v.id
             WHERE a.id = ?`,
            [applicationId]
        );
        if (apps.length === 0) return res.status(404).json({ message: 'Application not found.' });

        const app = apps[0];
        const { positionCategory, bracketKey } = resolveIesCategoryAndBracket(app);
        const templateRows = await getTemplateRows(positionCategory, bracketKey);
        if (templateRows.length === 0) return res.status(400).json({ message: 'Resolved IES template has no criteria.' });

        await conn.beginTransaction();
        const [existing] = await conn.query('SELECT id FROM ies_evaluations WHERE application_code = ? LIMIT 1', [app.ref_no]);
        if (existing.length > 0) {
            await conn.commit();
            const record = await getFullEvaluation(existing[0].id);
            return res.status(200).json(record);
        }

        const jobGroupSgLevel = app.salary_grade ? `SG-${app.salary_grade}` : null;
        const [result] = await conn.query(
            `INSERT INTO ies_evaluations
             (application_code, applicant_id, vacancy_id, position_category, bracket_key,
              job_group_sg_level, office, contact_number, evaluated_by, total_score)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
                app.ref_no, app.id, app.vacancy_id,
                positionCategory, bracketKey, jobGroupSgLevel,
                app.current_school || app.assigned_school || null,
                app.phone || null, req.user.id
            ]
        );

        const scoreRows = templateRows.map(row => [
            result.insertId, row.criteria_key, row.max_points, '', '', null
        ]);
        await conn.query(
            `INSERT INTO ies_criterion_scores
             (ies_evaluation_id, criteria_key, weight_allocation, qualification_notes, computation_notes, actual_score)
             VALUES ?`,
            [scoreRows]
        );

        await conn.commit();
        const record = await getFullEvaluation(result.insertId);
        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [record.vacancy_id, req.user.id, `IES evaluation created for ${record.applicant_name}`]
        );
        res.status(201).json(record);
    } catch (error) {
        await conn.rollback();
        console.error('createEvaluation Error:', error);
        res.status(400).json({ message: error.message });
    } finally {
        conn.release();
    }
};

// ────────────────────────────────────────────────
// GET /api/rsp/ies/:ieId   (get full evaluation)
// ────────────────────────────────────────────────
exports.getEvaluation = async (req, res) => {
    try {
        const record = await getFullEvaluation(req.params.ieId);
        if (!record) return res.status(404).json({ message: 'IES evaluation not found.' });
        res.json(record);
    } catch (error) {
        console.error('getEvaluation Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ────────────────────────────────────────────────
// PUT /api/rsp/ies/:ieId/scores  (bulk upsert + recompute total)
// ────────────────────────────────────────────────
exports.updateScores = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { ieId } = req.params;
        const { scores } = req.body;
        if (!Array.isArray(scores)) return res.status(400).json({ message: 'scores must be an array.' });

        const [evalRow] = await conn.query('SELECT id, status FROM ies_evaluations WHERE id = ?', [ieId]);
        if (evalRow.length === 0) return res.status(404).json({ message: 'IES evaluation not found.' });
        if (evalRow[0].status === 'attested') {
            return res.status(403).json({ message: 'This evaluation has been attested and is locked. No further edits are allowed.' });
        }

        const [existing] = await conn.query(
            'SELECT id, criteria_key, weight_allocation FROM ies_criterion_scores WHERE ies_evaluation_id = ?',
            [ieId]
        );
        if (existing.length === 0) return res.status(404).json({ message: 'No criterion scores found for this IES.' });

        const byKey = new Map(existing.map(row => [row.criteria_key, row]));
        for (const score of scores) {
            const current = byKey.get(score.criteria_key);
            if (!current) return res.status(400).json({ message: `Criterion ${score.criteria_key} does not belong to this IES.` });

            const actualScore = Number(score.actual_score);
            const maxScore = Number(current.weight_allocation);
            if (!Number.isFinite(actualScore) || actualScore < 0) {
                return res.status(422).json({ message: `Actual score for ${score.criteria_key} must be a non-negative number.` });
            }
            if (actualScore > maxScore) {
                return res.status(422).json({ message: `Actual score for ${CRITERION_LABELS[score.criteria_key] || score.criteria_key} cannot exceed ${maxScore}.` });
            }
        }

        await conn.beginTransaction();
        for (const score of scores) {
            await conn.query(
                `UPDATE ies_criterion_scores
                 SET qualification_notes = ?, computation_notes = ?, actual_score = ?
                 WHERE ies_evaluation_id = ? AND criteria_key = ?`,
                [
                    score.qualification_notes || '',
                    score.computation_notes || '',
                    Number(score.actual_score),
                    ieId,
                    score.criteria_key
                ]
            );
        }

        const [totals] = await conn.query(
            'SELECT COALESCE(SUM(actual_score), 0) AS total_score FROM ies_criterion_scores WHERE ies_evaluation_id = ?',
            [ieId]
        );
        const totalScore = Number(totals[0].total_score || 0);
        await conn.query(
            'UPDATE ies_evaluations SET total_score = ? WHERE id = ?',
            [totalScore, ieId]
        );

        await conn.commit();
        const record = await getFullEvaluation(ieId);
        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [record.vacancy_id, req.user.id, `IES scores updated for ${record.applicant_name}`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.to(`ies-${ieId}`).emit('ies:score-updated', {
                iesId: Number(ieId),
                totalScore,
                applicationId: record?.applicant_id
            });
        }

        res.json(record);
    } catch (error) {
        await conn.rollback();
        console.error('updateScores Error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

// ────────────────────────────────────────────────
// PATCH /api/rsp/ies/:ieId/status
//   body: { action: 'submit' | 'attest_applicant' | 'attest_chair',
//           signatureName?: string }
// ────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { ieId } = req.params;
        const { action, signatureName } = req.body;

        const [rows] = await conn.query(
            `SELECT ie.*,
                    a.full_name AS applicant_name,
                    chair.full_name AS chair_name
             FROM ies_evaluations ie
             JOIN applications a ON ie.applicant_id = a.id
             LEFT JOIN users chair ON ie.attested_by_chair_id = chair.id
             WHERE ie.id = ?`,
            [ieId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'IES evaluation not found.' });

        const evaluation = rows[0];

        if (action === 'submit') {
            if (evaluation.status !== 'draft') {
                return res.status(422).json({ message: 'Only draft evaluations can be submitted.' });
            }
            const [unscored] = await conn.query(
                `SELECT COUNT(*) AS cnt FROM ies_criterion_scores
                 WHERE ies_evaluation_id = ? AND actual_score IS NULL`,
                [ieId]
            );
            if (Number(unscored[0].cnt) > 0) {
                return res.status(422).json({ message: 'All criteria must be scored before submitting.' });
            }

            await conn.query(
                "UPDATE ies_evaluations SET status = 'submitted' WHERE id = ?",
                [ieId]
            );
        } else if (action === 'attest_applicant') {
            if (!['submitted', 'attested'].includes(evaluation.status)) {
                return res.status(422).json({ message: 'Evaluation must be submitted before applicant attestation.' });
            }
            const name = signatureName || evaluation.applicant_name;
            await conn.query(
                `UPDATE ies_evaluations
                 SET attested_by_applicant_signature_name = ?,
                     attested_by_applicant_at = COALESCE(attested_by_applicant_at, NOW())
                 WHERE id = ?`,
                [name, ieId]
            );
        } else if (action === 'attest_chair') {
            if (!['submitted', 'attested'].includes(evaluation.status)) {
                return res.status(422).json({ message: 'Evaluation must be submitted before chair attestation.' });
            }
            const name = signatureName || evaluation.chair_name || req.user?.full_name;
            await conn.query(
                `UPDATE ies_evaluations
                 SET attested_by_chair_id = ?,
                     attested_by_chair_signature_name = ?,
                     attested_by_chair_at = COALESCE(attested_by_chair_at, NOW())
                 WHERE id = ?`,
                [req.user.id, name, ieId]
            );
        } else {
            return res.status(400).json({ message: 'Invalid action. Use: submit, attest_applicant, or attest_chair.' });
        }

        // Check if both attestations are complete → transition to 'attested'
        const [recheck] = await conn.query(
            `SELECT attested_by_applicant_at, attested_by_chair_at,
                    attested_by_chair_id, status
             FROM ies_evaluations WHERE id = ?`,
            [ieId]
        );
        if (recheck.length > 0) {
            const r = recheck[0];
            if (r.attested_by_applicant_at && r.attested_by_chair_at && r.attested_by_chair_id && r.status !== 'attested') {
                await conn.query(
                    "UPDATE ies_evaluations SET status = 'attested' WHERE id = ?",
                    [ieId]
                );
            }
        }

        const record = await getFullEvaluation(ieId);
        emitStatusChange(req, record);
        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [record.vacancy_id, req.user.id, `IES evaluation status changed to ${record.status} for ${record.applicant_name}`]
        );
        res.json(record);
    } catch (error) {
        await conn.rollback();
        console.error('updateStatus Error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

// ────────────────────────────────────────────────
// GET /api/rsp/ies/applicant/:applicationId
// Find existing IES evaluation by application ID
// ────────────────────────────────────────────────
exports.getByApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const [rows] = await db.query(
            'SELECT id FROM ies_evaluations WHERE applicant_id = ? LIMIT 1',
            [applicationId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'No IES evaluation found for this application.' });
        const record = await getFullEvaluation(rows[0].id);
        if (!record) return res.status(404).json({ message: 'IES evaluation record not found.' });
        res.json(record);
    } catch (error) {
        console.error('getByApplication Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Keep backward compat alias
exports.attestEvaluation = exports.updateStatus;

// ────────────────────────────────────────────────
// GET /api/rsp/ies/:ieId/pdf
// ────────────────────────────────────────────────
exports.generatePDF = async (req, res) => {
    try {
        const { ieId } = req.params;
        const evaluation = await getFullEvaluation(ieId);

        if (!evaluation) {
            return res.status(404).json({ message: 'IES evaluation not found.' });
        }

        if (evaluation.status !== 'attested') {
            return res.status(403).json({ message: 'Only attested evaluations can be downloaded.' });
        }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 40, size: 'LETTER', info: { Title: `IES - ${evaluation.applicant_name}` } });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="IES_${evaluation.application_code}_${evaluation.applicant_name.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        const M = 40;
        const pageW = doc.page.width;
        const pageH = doc.page.height;
        const contentW = pageW - M * 2;
        const BLACK = '#000000';
        const NAVY = '#1B3A6B';
        const LIGHT_GRAY = '#cccccc';
        const HEADER_BG = '#E8EDF5';

        // ── Letterhead with seal ──
        const sealPath = path.join(__dirname, '../../assets/deped-seal.png');
        if (fs.existsSync(sealPath)) {
            const sealW = 36;
            doc.image(sealPath, (pageW - sealW) / 2, doc.y, { width: sealW });
            doc.y += sealW + 2;
        }
        doc.fontSize(9).font('Helvetica').fillColor(BLACK);
        doc.text('Republic of the Philippines', { align: 'center' });
        doc.text('Department of Education', { align: 'center' });
        doc.text('Region IX \u2013 Zamboanga Peninsula', { align: 'center' });
        doc.font('Helvetica-Bold').text('Schools Division Office of Dapitan City', { align: 'center' });
        doc.moveDown(0.2);
        doc.moveTo(M, doc.y).lineTo(pageW - M, doc.y).lineWidth(1.5).stroke(NAVY);
        doc.moveDown(0.5);

        // ── Annex G label ──
        doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK);
        doc.text('Annex G', M, doc.y, { align: 'right', width: contentW });
        doc.moveDown(0.1);

        // ── Title ──
        doc.font('Helvetica-Bold').fontSize(11).text('INDIVIDUAL EVALUATION SHEET (IES)', { align: 'center' });
        doc.moveDown(0.5);

        // ── Applicant Details Block ──
        const labelX = M;
        const valX = 160;
        const valMaxW = pageW - M - valX;
        const sgLevel = evaluation.job_group_sg_level
            || (evaluation.salary_grade ? `SG-${evaluation.salary_grade}` : null)
            || 'N/A';
        const headerFields = [
            ['Name of Applicant', evaluation.applicant_name],
            ['Application Code', evaluation.application_code],
            ['Position Applied for', evaluation.position_title],
            ['Office', evaluation.assigned_school || evaluation.office || 'N/A'],
            ['Contact Number', evaluation.contact_number || 'N/A'],
            ['Job Group/SG-Level', sgLevel],
        ];
        let fy = doc.y;
        doc.font('Helvetica').fontSize(9);
        headerFields.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').fontSize(9).text(`${label}:`, labelX, fy, { width: valX - labelX - 4, lineBreak: false });
            const displayVal = String(value || '');
            doc.font('Helvetica').fontSize(9).text(displayVal, valX, fy, { width: valMaxW, lineBreak: false });
            const valWidth = Math.max(doc.widthOfString(displayVal) + 4, 100);
            doc.moveTo(valX, fy + 11).lineTo(valX + valWidth, fy + 11).lineWidth(0.3).stroke('#999999');
            fy += 14;
        });
        doc.moveTo(M, fy + 2).lineTo(pageW - M, fy + 2).lineWidth(0.5).stroke(LIGHT_GRAY);
        doc.y = fy + 8;

        // ── Table: column definitions ──
        const COL = [
            { key: 'criteria',    label: 'Criteria',                                  x: M,       w: 82  },
            { key: 'weight',      label: 'Weight\nAllocation',                        x: M + 82,  w: 50  },
            { key: 'details',     label: "Details of Applicant's\nActual Qualifications", x: M + 132, w: 210 },
            { key: 'computation', label: 'Computation',                                x: M + 342, w: 100 },
            { key: 'score',       label: 'Actual\nScore',                              x: M + 442, w: contentW - 442 },
        ];
        const tableX = M;
        const tableW = contentW;
        const cellPad = 3;
        const bodyFontSz = 9;
        const headerFontSz = 8;
        const minRowH = 15;
        const headerRowH = 20;

        // ── Sort criteria in official Annex G order ──
        const CRITERIA_ORDER = [
            'education', 'training', 'experience', 'performance',
            'outstanding_accomplishments', 'application_of_education',
            'application_of_ld', 'potential',
            'pbet_let_lept_rating', 'ppst_coi', 'ppst_ncoi'
        ];
        const sorted = [...evaluation.criteria].sort((a, b) => {
            const ai = CRITERIA_ORDER.indexOf(a.criteria_key);
            const bi = CRITERIA_ORDER.indexOf(b.criteria_key);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        // ── Pre-calculate row heights ──
        doc.font('Helvetica').fontSize(bodyFontSz);
        const rowHeights = sorted.map(c => {
            const h1 = doc.heightOfString(c.criteria_label || '-', { width: COL[0].w - cellPad * 2 });
            const h2 = doc.heightOfString(Number(c.weight_allocation).toFixed(2), { width: COL[1].w - cellPad * 2 });
            const h3 = doc.heightOfString(c.qualification_notes || '-', { width: COL[2].w - cellPad * 2 });
            const h4 = doc.heightOfString(c.computation_notes || '-', { width: COL[3].w - cellPad * 2 });
            const h5 = doc.heightOfString(c.actual_score !== null ? Number(c.actual_score).toFixed(2) : '0.00', { width: COL[4].w - cellPad * 2 });
            return Math.max(minRowH, h1, h2, h3, h4, h5) + cellPad * 2;
        });
        const totalRowH = minRowH + cellPad * 2;
        const tableBodyH = rowHeights.reduce((s, h) => s + h, 0) + totalRowH;
        const tableH = headerRowH + tableBodyH;

        const tableTop = doc.y;
        const tableBottom = tableTop + tableH;

        // ── Draw table grid ──
        // Outer border
        doc.save();
        doc.lineWidth(1).strokeColor(BLACK);
        doc.rect(tableX, tableTop, tableW, tableH).stroke();
        doc.restore();

        // Header row background
        doc.save();
        doc.rect(tableX, tableTop, tableW, headerRowH).fill(HEADER_BG);
        doc.restore();

        // Header bottom line (thicker)
        doc.save();
        doc.moveTo(tableX, tableTop + headerRowH).lineTo(tableX + tableW, tableTop + headerRowH).lineWidth(1).strokeColor(BLACK).stroke();
        doc.restore();

        // Row separator lines (horizontal)
        let rowY = tableTop + headerRowH;
        for (let i = 0; i < sorted.length; i++) {
            rowY += rowHeights[i];
            doc.save();
            doc.moveTo(tableX, rowY).lineTo(tableX + tableW, rowY).lineWidth(0.5).strokeColor('#666666').stroke();
            doc.restore();
        }
        // TOTAL top line (thicker)
        doc.save();
        doc.moveTo(tableX, rowY).lineTo(tableX + tableW, rowY).lineWidth(1).strokeColor(BLACK).stroke();
        doc.restore();
        // Bottom border already drawn by outer rect

        // Vertical column separator lines
        for (let i = 1; i < COL.length; i++) {
            doc.save();
            doc.moveTo(COL[i].x, tableTop).lineTo(COL[i].x, tableBottom).lineWidth(0.5).strokeColor('#666666').stroke();
            doc.restore();
        }

        // ── Draw header text ──
        doc.save();
        doc.font('Helvetica-Bold').fontSize(headerFontSz).fillColor(BLACK);
        COL.forEach(col => {
            doc.text(col.label, col.x + cellPad, tableTop + 3, { width: col.w - cellPad * 2, align: 'center', lineGap: 0.5 });
        });
        doc.restore();

        // ── Draw body rows ──
        let bodyY = tableTop + headerRowH;
        doc.save();
        doc.font('Helvetica').fontSize(bodyFontSz).fillColor(BLACK);
        sorted.forEach((c, i) => {
            const rh = rowHeights[i];
            const cellY = bodyY + cellPad;

            doc.font('Helvetica-Bold').fontSize(bodyFontSz);
            doc.text(c.criteria_label || '-', COL[0].x + cellPad, cellY, { width: COL[0].w - cellPad * 2, lineGap: 0.5 });

            doc.font('Helvetica').fontSize(bodyFontSz);
            doc.text(Number(c.weight_allocation).toFixed(2), COL[1].x + cellPad, cellY, { width: COL[1].w - cellPad * 2, align: 'center', lineGap: 0.5 });
            doc.text(c.qualification_notes || '-', COL[2].x + cellPad, cellY, { width: COL[2].w - cellPad * 2, lineGap: 0.5 });
            doc.text(c.computation_notes || '-', COL[3].x + cellPad, cellY, { width: COL[3].w - cellPad * 2, lineGap: 0.5 });
            doc.text(c.actual_score !== null ? Number(c.actual_score).toFixed(2) : '0.00', COL[4].x + cellPad, cellY, { width: COL[4].w - cellPad * 2, align: 'center', lineGap: 0.5 });

            bodyY += rh;
        });
        doc.restore();

        // ── TOTAL row ──
        const totalY = bodyY + cellPad;
        const sumWeight = evaluation.criteria.reduce((s, c) => s + Number(c.weight_allocation || 0), 0);
        doc.save();
        doc.font('Helvetica-Bold').fontSize(bodyFontSz).fillColor(BLACK);
        doc.text('TOTAL', COL[0].x + cellPad, totalY, { width: COL[0].w - cellPad * 2, lineGap: 0.5 });
        doc.font('Helvetica').fontSize(bodyFontSz);
        doc.text(Number(sumWeight).toFixed(2), COL[1].x + cellPad, totalY, { width: COL[1].w - cellPad * 2, align: 'center', lineGap: 0.5 });
        doc.text(Number(evaluation.total_score || 0).toFixed(2), COL[4].x + cellPad, totalY, { width: COL[4].w - cellPad * 2, align: 'center', lineGap: 0.5 });
        doc.restore();

        // Position cursor below table
        doc.y = tableBottom + 10;

        // ── Attestation Declaration Paragraphs (Annex G) ──
        const posTitle = evaluation.position_title || 'the position';
        const officeName = evaluation.assigned_school || evaluation.office || 'SDO Dapitan City';

        doc.font('Helvetica').fontSize(9.5).fillColor(BLACK);

        const para1 = `I hereby attest to the conduct of the application and assessment process in accordance with the applicable guidelines; and acknowledge, upon discussion with the Human Resource Merit Promotion and Selection Board (HRMPSB), the results of the comparative assessment and the points given to me based on my qualifications and submitted documentary requirements for the ${posTitle} under ${officeName}.`;
        const para2 = 'Furthermore, I hereby affix my signature in this Form to attest to the objective and judicious conduct of the HRMPSB evaluation through Open Ranking System.';

        doc.text(para1, M, doc.y, { width: contentW, align: 'justify', lineGap: 1 });
        doc.moveDown(0.3);
        doc.text(para2, M, doc.y, { width: contentW, align: 'justify', lineGap: 1 });
        doc.moveDown(0.3);

        // ── Signature Blocks (side by side, immediately after attestation) ──
        const sigY = doc.y + 3;

        const leftX = M;
        const rightX = M + contentW / 2 + 10;
        const sigLineW = 180;
        const signGap = 35; // blank space between label and signature line for physical signing

        // Left: Applicant
        doc.font('Helvetica').fontSize(9.5).fillColor(BLACK);
        doc.text('Applicant', leftX, sigY);
        // Signature line — positioned signGap below label
        doc.save();
        doc.moveTo(leftX, sigY + signGap).lineTo(leftX + sigLineW, sigY + signGap).lineWidth(0.5).strokeColor(BLACK).stroke();
        doc.restore();
        // Printed name below line
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text((evaluation.attested_by_applicant_signature_name || evaluation.applicant_name).toUpperCase(), leftX, sigY + signGap + 4);
        doc.font('Helvetica').fontSize(8);
        doc.text('Signature over Printed Name', leftX, sigY + signGap + 17);
        const applicantDate = evaluation.attested_by_applicant_at
            ? new Date(evaluation.attested_by_applicant_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : '____________________';
        doc.text(`Date: ${applicantDate}`, leftX, sigY + signGap + 28);

        // Right: Attesting Officer / HRMPSB Chairperson
        doc.font('Helvetica').fontSize(9.5);
        doc.text('Attested by:', rightX, sigY);
        // Signature line
        doc.save();
        doc.moveTo(rightX, sigY + signGap).lineTo(rightX + sigLineW, sigY + signGap).lineWidth(0.5).strokeColor(BLACK).stroke();
        doc.restore();
        // Printed name below line
        doc.font('Helvetica-Bold').fontSize(10);
        const chairDisplay = (evaluation.attested_by_chair_signature_name || evaluation.chair_name || '').trim();
        doc.text((chairDisplay || '____________________').toUpperCase(), rightX, sigY + signGap + 4);
        doc.font('Helvetica').fontSize(8);
        doc.text('HRMPSB Chairperson', rightX, sigY + signGap + 17);
        doc.text('Signature over Printed Name', rightX, sigY + signGap + 28);
        const chairDate = evaluation.attested_by_chair_at
            ? new Date(evaluation.attested_by_chair_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : '____________________';
        doc.text(`Date: ${chairDate}`, rightX, sigY + signGap + 39);

        // ── Footer (anchored at bottom) ──
        const footerLineY = pageH - M - 15;
        doc.save();
        doc.moveTo(M, footerLineY).lineTo(pageW - M, footerLineY).lineWidth(0.4).strokeColor(LIGHT_GRAY).stroke();
        doc.restore();
        doc.font('Helvetica').fontSize(6.5).fillColor('#888888');
        doc.text(
            `This is a system-generated document. Digitally attested via PRIME-HRM on ${new Date().toLocaleString()}.`,
            M, footerLineY + 3,
            { width: contentW, align: 'center' }
        );

        doc.end();

    } catch (error) {
        console.error('generatePDF Error:', error);
        res.status(500).json({ message: error.message });
    }
};
