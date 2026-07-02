const db = require('../../db');

/**
 * SEEDING LOGIC: Ensures every vacancy has the standard DepEd Rubric
 * Teaching: Category A 60%, Category B 20%, Category C 20%
 * Non-Teaching: Category A 40%, Category B 30%, Category C 30%
 */
const seedDefaultRubric = async (vacancyId, positionType = 'teaching') => {
    const [existing] = await db.query('SELECT id FROM comparative_assessment_criteria WHERE vacancy_id = ?', [vacancyId]);
    if (existing.length > 0) return;

    let defaults;

    if (positionType === 'non_teaching') {
        // Category A: Technical / Skills Interview (40% of total)
        defaults = [
            ['Technical Knowledge & Expertise',         30.00, 5, 'classroom_observable', vacancyId],
            ['Process & Systems Thinking',              20.00, 5, 'classroom_observable', vacancyId],
            ['Data Management & Reporting',             20.00, 5, 'classroom_observable', vacancyId],
            ['Tools & Technology Proficiency',          15.00, 5, 'classroom_observable', vacancyId],
            ['Regulatory & Policy Compliance',          15.00, 5, 'classroom_observable', vacancyId],

            // Category B: Behavioral Event Interview (30% of total)
            ['Behavioral Event Interview – Leadership',     25.00, 5, 'non_classroom_observable', vacancyId],
            ['Behavioral Event Interview – Communication',  25.00, 5, 'non_classroom_observable', vacancyId],
            ['Written Reflection – Self-Awareness',          15.00, 5, 'non_classroom_observable', vacancyId],
            ['Written Reflection – Problem-Solving',         15.00, 5, 'non_classroom_observable', vacancyId],
            ['Interpersonal Skills & Professionalism',      20.00, 5, 'non_classroom_observable', vacancyId],

            // Category C: Document Evaluation (30% of total)
            ['Education (Degree & Relevant Training)',       25.00, 10, 'document_evaluation', vacancyId],
            ['Relevant Work Experience',                    25.00, 50, 'document_evaluation', vacancyId],
            ['Performance Rating (last 3 ratings)',          20.00, 10, 'document_evaluation', vacancyId],
            ['Outstanding Accomplishments / Awards',         15.00, 5,  'document_evaluation', vacancyId],
            ['CSC Eligibility / Relevant Certifications',    15.00, 5,  'document_evaluation', vacancyId],
        ];
    } else {
        // Teaching rubric (original)
        defaults = [
            // Category A: Classroom Observable Indicators (60% of total)
            ['Content Knowledge and Pedagogy',         20.00, 5, 'classroom_observable', vacancyId],
            ['Learning Environment and Management',    15.00, 5, 'classroom_observable', vacancyId],
            ['Learner Diversity and Inclusion',         10.00, 5, 'classroom_observable', vacancyId],
            ['Curriculum and Planning',                 15.00, 5, 'classroom_observable', vacancyId],
            ['Assessment and Reporting',                15.00, 5, 'classroom_observable', vacancyId],
            ['Community Linkages and Professional',     12.50, 5, 'classroom_observable', vacancyId],
            ['Personal Growth and Professional Dev.',   12.50, 5, 'classroom_observable', vacancyId],

            // Category B: Non-Classroom Observable Indicators (20% of total)
            ['Behavioral Event Interview – Leadership',     25.00, 5, 'non_classroom_observable', vacancyId],
            ['Behavioral Event Interview – Communication',  25.00, 5, 'non_classroom_observable', vacancyId],
            ['Written Reflection – Self-Awareness',          15.00, 5, 'non_classroom_observable', vacancyId],
            ['Written Reflection – Problem-Solving',         15.00, 5, 'non_classroom_observable', vacancyId],
            ['Interpersonal Skills & Professionalism',      20.00, 5, 'non_classroom_observable', vacancyId],

            // Category C: Document Evaluation (20% of total)
            ['Education (Master\'s / Doctor\'s Degree)',       25.00, 10, 'document_evaluation', vacancyId],
            ['Training / Seminars (hrs)',                      20.00, 50, 'document_evaluation', vacancyId],
            ['Experience (years in service)',                  20.00, 30, 'document_evaluation', vacancyId],
            ['Performance Rating (last 3 ratings)',             20.00, 10, 'document_evaluation', vacancyId],
            ['Outstanding Accomplishments / Awards',            15.00, 5,  'document_evaluation', vacancyId],
        ];
    }

    try {
        await db.query(
            'INSERT INTO comparative_assessment_criteria (sub_criterion_label, weight_percent, max_score, category, vacancy_id) VALUES ?',
            [defaults]
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.log(`Rubric already seeded for vacancy ${vacancyId} (race condition caught safely)`);
        } else {
            throw err;
        }
    }
};
// 1. GET RUBRIC CRITERIA
const getCriteria = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) return res.status(400).json({ message: "Vacancy ID is required" });

        const [vac] = await db.query('SELECT position_type FROM vacancies WHERE id = ?', [vacancy_id]);
        const positionType = vac.length > 0 ? (vac[0].position_type || 'teaching') : 'teaching';

        await seedDefaultRubric(vacancy_id, positionType);
        const [rows] = await db.query('SELECT * FROM comparative_assessment_criteria WHERE vacancy_id = ?', [vacancy_id]);
        res.json(rows);
    } catch (error) {
        console.error("getCriteria Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 2. UPDATE SCORE & RECOMPUTE TOTALS (Real-time)
const updateScore = async (req, res) => {
    try {
        const { applicant_id, criterion_id, score_given, vacancy_id } = req.body;
        const userId = req.user.id;

        // A. Upsert the individual score
        await db.query(`
            INSERT INTO comparative_assessment_scores (applicant_id, criterion_id, score_given, scored_by) 
            VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE score_given = VALUES(score_given), scored_at = CURRENT_TIMESTAMP`,
            [applicant_id, criterion_id, score_given, userId]
        );

        // B. Fetch ALL current scores for this applicant to recalculate totals
        const [allScores] = await db.query(`
            SELECT s.score_given, c.max_score, c.weight_percent, c.category 
            FROM comparative_assessment_scores s
            JOIN comparative_assessment_criteria c ON s.criterion_id = c.id
            WHERE s.applicant_id = ?`, [applicant_id]);

        // C. Determine category weights based on vacancy position_type
        const [appVac] = await db.query(
            `SELECT v.position_type FROM applications a
             JOIN vacancies v ON a.vacancy_id = v.id
             WHERE a.id = ?`, [applicant_id]
        );
        const posType = appVac.length > 0 ? (appVac[0].position_type || 'teaching') : 'teaching';

        let weightA, weightB, weightC;
        if (posType === 'non_teaching') {
            weightA = 0.4; weightB = 0.3; weightC = 0.3;
        } else {
            weightA = 0.6; weightB = 0.2; weightC = 0.2;
        }

        // D. Scoring Math (Weighted Averages)
        const calculateSubscore = (categoryName, totalCategoryWeight) => {
            const filtered = allScores.filter(s => s.category === categoryName);
            if (filtered.length === 0) return 0;

            // Formula: Sum of (Score / Max * Weight%)
            const rawSum = filtered.reduce((acc, curr) => {
                return acc + ((curr.score_given / curr.max_score) * curr.weight_percent);
            }, 0);

            // Scale to the category's total share (e.g., 60 for teaching, 40 for non-teaching)
            return (rawSum / 100) * (totalCategoryWeight * 100); 
        };

        const subA = calculateSubscore('classroom_observable', weightA);
        const subB = calculateSubscore('non_classroom_observable', weightB);
        const subC = calculateSubscore('document_evaluation', weightC);
        const total = subA + subB + subC;

        // D. Update the results summary table
        await db.query(`
            INSERT INTO comparative_assessment_results 
            (applicant_id, category_subscore_classroom, category_subscore_nonclassroom, category_subscore_document, total_score) 
            VALUES (?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            category_subscore_classroom=?, category_subscore_nonclassroom=?, category_subscore_document=?, total_score=?, computed_at=CURRENT_TIMESTAMP`,
            [applicant_id, subA, subB, subC, total, subA, subB, subC, total]
        );

        // E. SOCKET.IO LIVE BROADCAST
        const io = req.app.get('socketio');
        if (io) {
            console.log(`📢 Live Score Update: AppID ${applicant_id} -> Total ${total.toFixed(2)}`);
            // Update the general dashboard
            io.emit('rsp:dashboard:update'); 
            // Update the specific rankings panel for anyone viewing this vacancy
            io.emit(`rsp:ca:scoreUpdate:${vacancy_id}`); 
        }

        res.json({ total, subscores: { A: subA, B: subB, C: subC } });

    } catch (error) {
        console.error("updateScore Error:", error);
        res.status(500).json({ message: "Failed to update score." });
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

        // Notify Dashboard
        const io = req.app.get('socketio');
        if (io) io.emit('rsp:dashboard:update');

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

module.exports = { getCriteria, updateScore, getRankings, submitAssessment, getScores, resetScores };