const db = require('../../db');
const syncApplicationsStage = require('../../utils/syncApplicationsStage');

const SALARY_GRADE_BANDS = Object.freeze({
    GENERAL_SERVICES: 'general_services',
    SG1_9: 'sg1_9',
    SG10_22_27: 'sg10_22_27',
    SG24_CHIEF: 'sg24_chief',
    SG11_15: 'sg11_15',
    SG16_23_27: 'sg16_23_27',
    TEACHING_FLAT: 'teaching_flat'
});

const BRACKET_LABELS = Object.freeze({
    teaching_related: {
        SG_11_15: 'SG 11-15',
        SG_16_23_27: 'SG 16-23 & SG-27',
        SG_24_CHIEF: 'SG 24 (Chief)'
    },
    non_teaching: {
        GENERAL_SERVICES: 'General Services',
        SG_1_9_NON_GS: 'SG 1-9 (Non-GS)',
        SG_10_22_27: 'SG 10-22 & SG-27',
        SG_24_CHIEF: 'SG 24 (Chief)'
    }
});

const isTeacherIPosition = (positionTitle = '') => {
    const normalized = String(positionTitle).trim().toLowerCase();
    return /\bteacher\s*(i|1)\b/.test(normalized) && !/\b(master|head|principal|supervisor)\b/.test(normalized);
};

const isGeneralServicesPosition = (positionTitle = '') => {
    const normalized = String(positionTitle).trim().toLowerCase();
    return [
        'general services',
        'utility worker',
        'security guard',
        'driver',
        'administrative aide',
        'clerk',
        'messenger',
        'janitor'
    ].some(keyword => normalized.includes(keyword));
};

const resolveCaBracket = ({ position_type, position_title, salary_grade }) => {
    const positionType = position_type || 'teaching';
    const sg = Number(salary_grade);

    if (positionType === 'teaching') {
        if (!isTeacherIPosition(position_title)) {
            throw new Error('DepEd Order No. 007, s. 2023 Enclosure No. 2 rubric is configured for Teacher I positions only. No official rubric is configured for this teaching position.');
        }
        return { positionCategory: 'teacher_i', bracketKey: null, salaryGradeBand: SALARY_GRADE_BANDS.TEACHING_FLAT };
    }

    if (!Number.isInteger(sg)) {
        throw new Error('A valid numeric salary grade is required to select the official comparative assessment rubric.');
    }

    if (positionType === 'non_teaching') {
        if (isGeneralServicesPosition(position_title)) return { positionCategory: 'non_teaching', bracketKey: 'GENERAL_SERVICES', salaryGradeBand: SALARY_GRADE_BANDS.GENERAL_SERVICES };
        if (sg >= 1 && sg <= 9) return { positionCategory: 'non_teaching', bracketKey: 'SG_1_9_NON_GS', salaryGradeBand: SALARY_GRADE_BANDS.SG1_9 };
        if ((sg >= 10 && sg <= 22) || sg === 27) return { positionCategory: 'non_teaching', bracketKey: 'SG_10_22_27', salaryGradeBand: SALARY_GRADE_BANDS.SG10_22_27 };
        if (sg === 24) return { positionCategory: 'non_teaching', bracketKey: 'SG_24_CHIEF', salaryGradeBand: SALARY_GRADE_BANDS.SG24_CHIEF };
    }

    if (positionType === 'teaching_related') {
        if (sg >= 11 && sg <= 15) return { positionCategory: 'teaching_related', bracketKey: 'SG_11_15', salaryGradeBand: SALARY_GRADE_BANDS.SG11_15 };
        if ((sg >= 16 && sg <= 23) || sg === 27) return { positionCategory: 'teaching_related', bracketKey: 'SG_16_23_27', salaryGradeBand: SALARY_GRADE_BANDS.SG16_23_27 };
        if (sg === 24) return { positionCategory: 'teaching_related', bracketKey: 'SG_24_CHIEF', salaryGradeBand: SALARY_GRADE_BANDS.SG24_CHIEF };
    }

throw new Error(`No official DO 007 s. 2023 rubric is configured for position type "${positionType}" with salary grade "${salary_grade || 'N/A'}".`);
};

const seedTeachingRubric = async (vacancyId, sgBand) => {
    const rows = [
        [vacancyId, null, sgBand, 'Education', 10, 10],
        [vacancyId, null, sgBand, 'Training', 10, 10],
        [vacancyId, null, sgBand, 'Experience', 10, 10],
        [vacancyId, null, sgBand, 'PBET/LET/LEPT Rating', 10, 10],
        [vacancyId, null, sgBand, 'PPST COIs (Classroom Observation)', 35, 35],
        [vacancyId, null, sgBand, 'PPST NCOIs (Teacher Reflection)', 25, 25]
    ];
    await db.query(
        'INSERT INTO comparative_assessment_criteria (vacancy_id, category, salary_grade_band, sub_criterion_label, weight_percent, max_score) VALUES ?',
        [rows]
    );
};

const seedDefaultRubric = async (vacancyId) => {
    const [vacancies] = await db.query(
        'SELECT id, position_type, position_title, salary_grade FROM vacancies WHERE id = ?',
        [vacancyId]
    );
    if (vacancies.length === 0) throw new Error('Vacancy not found.');

    const vacancy = vacancies[0];
    const { positionCategory, bracketKey, salaryGradeBand } = resolveCaBracket(vacancy);
    
    const [existing] = await db.query(
        'SELECT id FROM comparative_assessment_criteria WHERE vacancy_id = ? AND salary_grade_band = ? LIMIT 1',
        [vacancyId, salaryGradeBand]
    );
    if (existing.length > 0) return { positionCategory, salaryGradeBand, bracketKey };

    try {
        if (vacancy.position_type === 'non_teaching' || vacancy.position_type === 'teaching_related') {
            await seedFlatRubricFromIes(vacancyId, vacancy.position_type, bracketKey, salaryGradeBand);
        } else {
            await seedTeachingRubric(vacancyId, salaryGradeBand);
        }
        return { positionCategory, salaryGradeBand, bracketKey };
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.log(`Rubric already seeded for vacancy ${vacancyId} (race condition caught safely)`);
            return { positionCategory, salaryGradeBand, bracketKey };
        }
        throw err;
    }
};

const seedFlatRubricFromIes = async (vacancyId, positionCategory, bracketKey, salaryGradeBand) => {
    const [templates] = await db.query(
        `SELECT criteria_key, max_points, display_order
         FROM ies_weight_templates
         WHERE position_category = ? AND ${bracketKey === null ? 'bracket_key IS NULL' : 'bracket_key = ?'}
           AND max_points > 0
         ORDER BY display_order ASC`,
        bracketKey === null ? [positionCategory] : [positionCategory, bracketKey]
    );

    if (templates.length === 0) {
        throw new Error(`No IES weight template found for ${positionCategory} / ${bracketKey}`);
    }

    const rows = templates.map(t => [
        vacancyId,
        'comparative_flat',
        salaryGradeBand,
        null,
        null,
        null,
        t.criteria_key,
        t.max_points,
        t.max_points,
        t.display_order
    ]);

    await db.query(
        `INSERT INTO comparative_assessment_criteria 
         (vacancy_id, category, salary_grade_band, section_key, section_label, section_weight_percent,
          sub_criterion_label, weight_percent, max_score, display_order) 
         VALUES ?`,
        [rows]
    );
};

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
    ppst_coi: 'PPST COIs (Classroom Observation)',
    ppst_ncoi: 'PPST NCOIs (Teacher Reflection)'
});

const SECTION_LABELS = Object.freeze({
    A: 'A. Classroom Observable Indicators',
    B: 'B. Non-Classroom Observable Indicators',
    C: 'C. Document Evaluation'
});

// 1. GET RUBRIC CRITERIA
const getCriteria = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) return res.status(400).json({ message: "Vacancy ID is required" });

        const [vac] = await db.query(
            'SELECT id, position_type, position_title, salary_grade FROM vacancies WHERE id = ?',
            [vacancy_id]
        );
        if (vac.length === 0) return res.status(404).json({ message: 'Vacancy not found.' });

        const { positionCategory, salaryGradeBand, bracketKey } = await seedDefaultRubric(vacancy_id);
        
        if (positionCategory === 'teacher_i') {
            // Sectioned format for Teacher I
            const [rows] = await db.query(
                `SELECT id, sub_criterion_label, weight_percent, max_score
                 FROM comparative_assessment_criteria
                 WHERE vacancy_id = ? AND salary_grade_band = ?
                 ORDER BY id ASC`,
                [vacancy_id, salaryGradeBand]
            );
            
            // Group by section (A, B, C) - for Teacher I the labels imply section
            const sections = [
                { key: 'A', label: SECTION_LABELS.A, criteria: [] },
                { key: 'B', label: SECTION_LABELS.B, criteria: [] },
                { key: 'C', label: SECTION_LABELS.C, criteria: [] }
            ];
            
            rows.forEach(row => {
                const sectionKey = row.sub_criterion_label.toLowerCase().includes('ppst') || 
                                  row.sub_criterion_label.toLowerCase().includes('classroom') ? 'A' :
                                  row.sub_criterion_label.toLowerCase().includes('ncoi') ? 'B' : 'C';
                const section = sections.find(s => s.key === sectionKey);
                if (section) section.criteria.push(row);
            });
            
            // Calculate section weights
            sections.forEach(section => {
                section.weightPercent = section.criteria.reduce((sum, c) => sum + Number(c.weight_percent || 0), 0);
            });
            
            res.json({
                layoutMode: 'sectioned',
                positionCategory,
                criteria: rows,
                sections
            });
        } else {
            // Flat format for teaching_related and non_teaching
            const [rows] = await db.query(
                `SELECT id, sub_criterion_label, weight_percent, max_score, display_order
                 FROM comparative_assessment_criteria
                 WHERE vacancy_id = ? AND salary_grade_band = ?
                 ORDER BY display_order ASC`,
                [vacancy_id, salaryGradeBand]
            );
            
            // Map raw criteria_key to human-readable label via CRITERION_LABELS
            const criteria = rows.map(r => ({
                ...r,
                sub_criterion_label: CRITERION_LABELS[r.sub_criterion_label] || r.sub_criterion_label
            }));
            
            const bracketLabel = BRACKET_LABELS[positionCategory]?.[bracketKey] || bracketKey;
            
            res.json({
                layoutMode: 'flat',
                positionCategory,
                bracketLabel,
                criteria
            });
        }
    } catch (error) {
        console.error("getCriteria Error:", error);
        res.status(400).json({ message: error.message });
    }
};

// 2. UPDATE SCORE & RECOMPUTE TOTALS (Real-time)
const updateScore = async (req, res) => {
    try {
        const { applicant_id, criterion_id, score_given, vacancy_id } = req.body;
        const userId = req.user.id;
        const numericScore = Number(score_given);

        if (!applicant_id || !criterion_id || !vacancy_id) {
            return res.status(400).json({ message: 'applicant_id, criterion_id, and vacancy_id are required.' });
        }
        if (!Number.isFinite(numericScore)) {
            return res.status(400).json({ message: 'score_given must be numeric.' });
        }

        const [appVac] = await db.query(
            `SELECT v.id AS vacancy_id, v.position_type, v.position_title, v.salary_grade
             FROM applications a
             JOIN vacancies v ON a.vacancy_id = v.id
             WHERE a.id = ? AND v.id = ?`,
            [applicant_id, vacancy_id]
        );
        if (appVac.length === 0) {
            return res.status(404).json({ message: 'Applicant/vacancy not found.' });
        }

        const { salaryGradeBand } = await seedDefaultRubric(vacancy_id);
        const [criteria] = await db.query(
            `SELECT id, max_score, weight_percent
             FROM comparative_assessment_criteria
             WHERE id = ? AND vacancy_id = ? AND salary_grade_band = ?`,
            [criterion_id, vacancy_id, salaryGradeBand]
        );
        if (criteria.length === 0) {
            return res.status(400).json({ message: 'Criterion does not belong to the official rubric for this vacancy.' });
        }

        const criterion = criteria[0];
        const maxScore = Number(criterion.max_score);
        if (numericScore < 0 || numericScore > maxScore) {
            return res.status(400).json({ message: `Score must be between 0 and ${maxScore}.` });
        }

        // A. Upsert the individual score
        await db.query(`
            INSERT INTO comparative_assessment_scores (applicant_id, criterion_id, score_given, scored_by) 
            VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE score_given = VALUES(score_given), scored_at = CURRENT_TIMESTAMP`,
            [applicant_id, criterion_id, numericScore, userId]
        );

        // B. Fetch ALL current scores for this applicant to recalculate totals
        const [allScores] = await db.query(`
            SELECT s.score_given, c.max_score, c.weight_percent, c.section_key
            FROM comparative_assessment_scores s
            JOIN comparative_assessment_criteria c ON s.criterion_id = c.id
            WHERE s.applicant_id = ?
              AND c.vacancy_id = ?
              AND c.salary_grade_band = ?`, [applicant_id, vacancy_id, salaryGradeBand]);

        // C. Official DO 007 scoring: each criterion already carries its final point weight.
        const sectionScores = {};
        let total = 0;
        allScores.forEach(curr => {
            const max = Number(curr.max_score);
            if (!max) return;
            const weighted = (Number(curr.score_given) / max) * Number(curr.weight_percent);
            total += weighted;
            const key = curr.section_key || '_unsectioned';
            sectionScores[key] = (sectionScores[key] || 0) + weighted;
        });

        // D. Update the results summary table (map dynamic sections to legacy columns)
        await db.query(`
            INSERT INTO comparative_assessment_results 
            (applicant_id, category_subscore_classroom, category_subscore_nonclassroom, category_subscore_document, total_score) 
            VALUES (?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            category_subscore_classroom=?, category_subscore_nonclassroom=?, category_subscore_document=?, total_score=?, computed_at=CURRENT_TIMESTAMP`,
            [applicant_id, sectionScores.A || null, sectionScores.B || null, sectionScores.C || null, total,
             sectionScores.A || null, sectionScores.B || null, sectionScores.C || null, total]
        );

        // E. SOCKET.IO LIVE BROADCAST
        const io = req.app.get('socketio');
        if (io) {
            console.log(`Live Score Update: AppID ${applicant_id} -> Total ${total.toFixed(2)}`);
            io.emit('rsp:dashboard:update'); 
            io.emit(`rsp:ca:scoreUpdate:${vacancy_id}`); 
        }

        res.json({ total, salary_grade_band: salaryGradeBand });

    } catch (error) {
        console.error("updateScore Error:", error);
        res.status(500).json({ message: error.message || "Failed to update score." });
    }
};

// 3. GET LIVE RANKINGS
const getRankings = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        
        const query = `
            SELECT a.id, a.id as applicant_id, a.full_name, a.ref_no as applicant_code, 
            r.category_subscore_classroom, r.category_subscore_nonclassroom, r.category_subscore_document,
            IFNULL(r.total_score, 0) as total_score,
            RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) as rank_val
            FROM applications a
            LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
            WHERE a.vacancy_id = ? AND a.status IN ('qualified', 'shortlisted', 'selected', 'appointed')
            ORDER BY rank_val ASC`;

        const [rows] = await db.query(query, [vacancy_id]);
        res.json(rows);
    } catch (error) {
        console.error("getRankings Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 4. SUBMIT FINAL ASSESSMENT
// 4. SUBMIT FINAL ASSESSMENT
const submitAssessment = async (req, res) => {
    try {
        const { vacancy_id } = req.body;

        // Advance Vacancy to Stage 7 (Results Posting)
        await db.query('UPDATE vacancies SET current_stage = 7, assessment_submitted_at = CURRENT_TIMESTAMP WHERE id = ?', [vacancy_id]);
        await syncApplicationsStage(vacancy_id, 7, req.app.get('socketio'));

        // Log Activity
        await db.query('INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)', 
            [vacancy_id, req.user.id, `Comparative Assessment finalized and submitted to SDS.`]);

        // Per-applicant stage tracking: every non-draft, non-disqualified applicant under
        // this vacancy has now completed Stage 6 (Comparative Assessment)
        const [apps] = await db.query(
            `SELECT id FROM applications WHERE vacancy_id = ? AND status NOT IN ('draft','disqualified')`,
            [vacancy_id]
        );
        for (const app of apps) {
            await db.query(
                `INSERT INTO stage_history (application_id, stage_number, status, completed_at)
                 VALUES (?, 6, 'completed', NOW())
                 ON DUPLICATE KEY UPDATE status='completed', completed_at=NOW()`,
                [app.id]
            );
            await db.query(`UPDATE applications SET current_stage = 6 WHERE id = ?`, [app.id]);
        }

        // Notify Dashboard and Admin
        const [[vacRef]] = await db.query('SELECT ref_no FROM vacancies WHERE id = ?', [vacancy_id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('rsp:dashboard:update');
            io.emit('notification:admin', {
                message: `Comparative Assessment submitted for ${vacRef?.ref_no || vacancy_id}`,
                type: 'rsp'
            });
        }

        res.json({ message: "Assessment submitted successfully. Moving to Stage 7." });
    } catch (error) {
        console.error("submitAssessment Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 5. GET SCORES FOR A SPECIFIC APPLICANT
const getScores = async (req, res) => {
    try {
        const { applicant_id } = req.query;
        const [rows] = await db.query(
            'SELECT criterion_id, score_given FROM comparative_assessment_scores WHERE applicant_id = ?',
            [applicant_id]
        );
        // Return as a map {criterion_id: score_given}
        const scoreMap = {};
        rows.forEach(r => { scoreMap[r.criterion_id] = parseFloat(r.score_given); });
        res.json(scoreMap);
    } catch (error) {
        console.error("getScores Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 6. RESET SCORES FOR A VACANCY
// Clears all CA scores + computed results for every applicant under this vacancy
// so HRMPSB can re-run the assessment from scratch. (This was referenced by
// routes/rsp/comparative-assessment.js but never implemented — its absence was
// crashing the route file at require() time and silently preventing every route
// registered after it in index.js from loading.)
const resetScores = async (req, res) => {
    try {
        const { vacancy_id } = req.body;
        if (!vacancy_id) return res.status(400).json({ message: 'vacancy_id is required' });

        await db.query(`
            DELETE s FROM comparative_assessment_scores s
            JOIN applications a ON s.applicant_id = a.id
            WHERE a.vacancy_id = ?
        `, [vacancy_id]);

        await db.query(`
            DELETE r FROM comparative_assessment_results r
            JOIN applications a ON r.applicant_id = a.id
            WHERE a.vacancy_id = ?
        `, [vacancy_id]);

        await db.query(
            'INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)',
            [vacancy_id, req.user.id, 'Comparative Assessment scores reset for re-evaluation.']
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rsp:dashboard:update');
            io.emit(`rsp:ca:scoreUpdate:${vacancy_id}`);
        }

        res.json({ message: 'All scores have been reset for this vacancy.' });
    } catch (error) {
        console.error('resetScores Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getRelevantQualificationDetails = (criterionLabel, documents, notes) => {
    const label = String(criterionLabel || '').toLowerCase();
    const keywordMap = [
        { key: 'education', words: ['education', 'transcript', 'tor', 'diploma', 'degree'] },
        { key: 'training', words: ['training', 'seminar', 'certificate'] },
        { key: 'experience', words: ['experience', 'service record', 'employment'] },
        { key: 'performance', words: ['performance', 'ipcr', 'opcr', 'rating'] },
        { key: 'pbet', words: ['pbet', 'let', 'lept', 'eligibility', 'license'] },
        { key: 'outstanding', words: ['award', 'accomplishment', 'recognition', 'citation'] },
        { key: 'application of l&d', words: ['learning', 'development', 'l&d', 'ld'] },
        { key: 'potential', words: ['written test', 'bei', 'work sample', 'potential'] },
        { key: 'ppst', words: ['ppst', 'classroom observation', 'teacher reflection', 'coi', 'ncoi'] }
    ];

    const config = keywordMap.find(item => label.includes(item.key)) ||
        keywordMap.find(item => item.words.some(word => label.includes(word)));
    const relevantDocs = config
        ? documents.filter(doc => config.words.some(word => `${doc.document_type} ${doc.file_name}`.toLowerCase().includes(word)))
        : [];

    const docText = relevantDocs.length > 0
        ? relevantDocs.map(doc => `${doc.document_type}${doc.is_verified ? ' (verified)' : ''}`).join('; ')
        : 'Relevant documents/requirements: ______________________________';

    return notes ? `${docText}\nHRMPSB notes: ${notes}` : docText;
};

const drawIESRow = (doc, columns, row, options = {}) => {
    const padding = 4;
    const minHeight = options.header ? 24 : 54;
    const heights = columns.map((col, index) => doc.heightOfString(String(row[index] || ''), {
        width: col.width - padding * 2,
        align: col.align || 'left'
    }) + padding * 2);
    const rowHeight = Math.max(minHeight, ...heights);

    if (doc.y + rowHeight > doc.page.height - 92) {
        doc.addPage({ size: 'LETTER', layout: 'landscape', margin: 36 });
    }

    const y = doc.y;
    let x = doc.page.margins.left;
    columns.forEach((col, index) => {
        doc.rect(x, y, col.width, rowHeight).stroke('#94a3b8');
        doc.font(options.header ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(options.header ? 8 : 7)
            .fillColor(options.header ? '#1B3A6B' : '#0f172a')
            .text(String(row[index] || ''), x + padding, y + padding, {
                width: col.width - padding * 2,
                align: col.align || 'left'
            });
        x += col.width;
    });
    doc.fillColor('#0f172a');
    doc.y = y + rowHeight;
};

const generateIES = async (req, res) => {
    try {
        const { applicantId } = req.params;

        const [info] = await db.query(`
            SELECT
                a.id AS applicant_id,
                a.full_name,
                a.ref_no AS application_code,
                a.email,
                a.phone,
                u.mobile,
                v.id AS vacancy_id,
                v.position_type,
                v.position_title,
                v.assigned_school,
                v.salary_grade,
                dn.background_investigation_notes,
                IFNULL(r.total_score, 0) AS total_score
            FROM applications a
            JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN users u ON a.applicant_id = u.id
            LEFT JOIN deliberation_notes dn ON dn.applicant_id = a.id
            LEFT JOIN comparative_assessment_results r ON r.applicant_id = a.id
            WHERE a.id = ?
            LIMIT 1
        `, [applicantId]);

if (info.length === 0) return res.status(404).json({ message: 'Applicant not found.' });
        const d = info[0];
        const { salaryGradeBand } = await seedDefaultRubric(d.vacancy_id);

        const [criteria] = await db.query(`
            SELECT c.id, c.sub_criterion_label, c.weight_percent, c.max_score,
                   IFNULL(s.score_given, 0) AS score_given
            FROM comparative_assessment_criteria c
            LEFT JOIN comparative_assessment_scores s
              ON s.criterion_id = c.id AND s.applicant_id = ?
            WHERE c.vacancy_id = ? AND c.salary_grade_band = ?
            ORDER BY c.id ASC
        `, [applicantId, d.vacancy_id, salaryGradeBand]);

        // Map raw criteria_key to human-readable label via CRITERION_LABELS
        criteria.forEach(c => {
            c.sub_criterion_label = CRITERION_LABELS[c.sub_criterion_label] || c.sub_criterion_label;
        });

        const [documents] = await db.query(
            'SELECT document_type, file_name, is_verified FROM application_documents WHERE application_id = ? AND verification_status != ? ORDER BY document_type ASC',
            [applicantId, 'superseded']
        );

        const [chairRows] = await db.query('SELECT full_name FROM users WHERE id = ? LIMIT 1', [req.user.id]);
        const chairName = chairRows[0]?.full_name || '____________________________';

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 36, size: 'LETTER', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="Individual_Evaluation_Sheet_${String(d.full_name || applicantId).replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        doc.fontSize(9).font('Helvetica').text('Republic of the Philippines', { align: 'center' });
        doc.text('Department of Education', { align: 'center' });
        doc.text('Region IX - Zamboanga Peninsula', { align: 'center' });
        doc.font('Helvetica-Bold').text('Schools Division Office of Dapitan City', { align: 'center' });
        doc.moveDown(0.4);
        doc.moveTo(36, doc.y).lineTo(doc.page.width - 36, doc.y).lineWidth(1.5).stroke('#1B3A6B');
        doc.moveDown(0.8);

        doc.font('Helvetica-Bold').fontSize(13).text('INDIVIDUAL EVALUATION SHEET', { align: 'center' });
        doc.font('Helvetica').fontSize(8).text('Annex G - DepEd Order No. 007, s. 2023', { align: 'center' });
        doc.moveDown(0.8);

        const leftX = 36;
        const midX = 390;
        const headerY = doc.y;
        doc.fontSize(8).font('Helvetica-Bold').text('Name of Applicant: ', leftX, headerY, { continued: true })
            .font('Helvetica').text(d.full_name || '-');
        doc.font('Helvetica-Bold').text('Application Code: ', leftX, doc.y, { continued: true })
            .font('Helvetica').text(d.application_code || '-');
        doc.font('Helvetica-Bold').text('Position Applied for: ', leftX, doc.y, { continued: true })
            .font('Helvetica').text(d.position_title || '-');

        doc.font('Helvetica-Bold').text('Office: ', midX, headerY, { continued: true })
            .font('Helvetica').text(d.assigned_school || '-');
        doc.font('Helvetica-Bold').text('Contact Number: ', midX, doc.y, { continued: true })
            .font('Helvetica').text(d.phone || d.mobile || '-');
        doc.font('Helvetica-Bold').text('Job Group/SG-Level: ', midX, doc.y, { continued: true })
            .font('Helvetica').text(`${d.position_type || '-'} / SG-${d.salary_grade || '-'}`);
        doc.moveDown(1);

        const columns = [
            { width: 120 },
            { width: 78, align: 'center' },
            { width: 282 },
            { width: 140 },
            { width: 100, align: 'center' }
        ];

        drawIESRow(doc, columns, [
            'Criteria',
            'Weight Allocation',
            "Details of Applicant's Actual Qualifications (relevant documents submitted; additional requirements, notes of HRMPSB members)",
            'Computation',
            'Actual Score'
        ], { header: true });

        let iesTotal = 0;
        criteria.forEach(c => {
            const score = Number(c.score_given || 0);
            const max = Number(c.max_score || 0);
            const weight = Number(c.weight_percent || 0);
            const actual = max ? (score / max) * weight : 0;
            iesTotal += actual;
            drawIESRow(doc, columns, [
                c.sub_criterion_label,
                weight.toFixed(2),
                getRelevantQualificationDetails(c.sub_criterion_label, documents, d.background_investigation_notes),
                `${score.toFixed(2)} / ${max.toFixed(2)} x ${weight.toFixed(2)}`,
                actual.toFixed(2)
            ]);
        });

        drawIESRow(doc, columns, ['', '', '', 'Total', iesTotal.toFixed(2)], { header: true });

        doc.moveDown(1);
        if (doc.y > doc.page.height - 140) doc.addPage({ size: 'LETTER', layout: 'landscape', margin: 36 });

        doc.font('Helvetica').fontSize(8).text(
            'I hereby attest to the conduct of the evaluation and the accuracy of the information reflected in this Individual Evaluation Sheet.',
            { align: 'justify' }
        );
        doc.moveDown(2);

        const sigY = doc.y + 18;
        doc.moveTo(70, sigY).lineTo(270, sigY).stroke('#0f172a');
        doc.font('Helvetica-Bold').fontSize(8).text(d.full_name || 'Applicant', 70, sigY + 4, { width: 200, align: 'center' });
        doc.font('Helvetica').text('Name and Signature of Applicant', 70, sigY + 16, { width: 200, align: 'center' });
        doc.text('Date: ___________________', 70, sigY + 29, { width: 200, align: 'center' });

        doc.moveTo(500, sigY).lineTo(700, sigY).stroke('#0f172a');
        doc.font('Helvetica-Bold').text(`Attested: ${chairName}`, 500, sigY + 4, { width: 200, align: 'center' });
        doc.font('Helvetica').text('HRMPSB Chair', 500, sigY + 16, { width: 200, align: 'center' });

        doc.end();
    } catch (error) {
        console.error('generateIES Error:', error);
        res.status(500).json({ message: error.message || 'Could not generate Individual Evaluation Sheet.' });
    }
};

module.exports = { getCriteria, updateScore, getRankings, submitAssessment, getScores, resetScores, generateIES, _seedDefaultRubric: seedDefaultRubric, _resolveCaBracket: resolveCaBracket, _BRACKET_LABELS: BRACKET_LABELS };
