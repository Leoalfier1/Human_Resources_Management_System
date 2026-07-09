const db = require('../../db');

exports.createEvalForm = async (req, res) => {
    try {
        const { program_id, title, instructions, questions } = req.body;
        if (!program_id || !title) return res.status(400).json({ message: 'Program ID and title are required' });
        const [existing] = await db.query('SELECT id FROM ld_evaluation_forms WHERE program_id = ?', [program_id]);
        if (existing.length > 0) return res.status(400).json({ message: 'Evaluation form already exists for this program' });
        const [result] = await db.query(
            'INSERT INTO ld_evaluation_forms (program_id, title, instructions, created_by) VALUES (?, ?, ?, ?)',
            [program_id, title, instructions || null, req.user.id]);
        const evalFormId = result.insertId;
        if (questions && Array.isArray(questions) && questions.length > 0) {
            const qData = questions.map((q, i) => [evalFormId, q.question_text, q.question_type || 'rating', q.category || 'overall', i + 1]);
            await db.query(
                'INSERT INTO ld_evaluation_questions (eval_form_id, question_text, question_type, category, sort_order) VALUES ?', [qData]);
        }
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `Evaluation form created for program ${program_id}`, type: 'ld' });
        }
        res.status(201).json({ id: evalFormId, message: 'Evaluation form created' });
    } catch (error) { console.error('createEvalForm Error:', error); res.status(500).json({ message: error.message }); }
};

exports.activateEvalForm = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE ld_evaluation_forms SET status = ? WHERE id = ?', ['active', id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `Evaluation form activated (ID: ${id})`, type: 'ld' });
            // Notify present attendees of the program that the eval form is live
            const [rows] = await db.query(
                `SELECT DISTINCT a.user_id, pr.title AS program_title
                 FROM ld_evaluation_forms ef
                 JOIN ld_programs pr ON ef.program_id = pr.id
                 JOIN ld_attendance a ON a.program_id = pr.id AND a.status = 'present'
                 WHERE ef.id = ?`, [id]);
            rows.forEach(({ user_id, program_title }) => {
                io.to(`ld-user-${user_id}`).emit('ld:notification:applicant', {
                    message: `⭐ An evaluation form for "${program_title}" is now open. Please complete it in your L&D dashboard.`,
                    type: 'evaluation'
                });
            });
        }
        res.json({ message: 'Evaluation form activated' });
    } catch (error) { console.error('activateEvalForm Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getEvalForm = async (req, res) => {
    try {
        const { id } = req.params;
        const [forms] = await db.query('SELECT * FROM ld_evaluation_forms WHERE id = ?', [id]);
        if (forms.length === 0) return res.status(404).json({ message: 'Evaluation form not found' });
        const [questions] = await db.query(
            'SELECT * FROM ld_evaluation_questions WHERE eval_form_id = ? ORDER BY sort_order ASC', [id]);
        res.json({ ...forms[0], questions });
    } catch (error) { console.error('getEvalForm Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getMyEvalForms = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            `SELECT ef.*, pr.title AS program_title,
                    (SELECT COUNT(*) FROM ld_evaluation_responses er WHERE er.eval_form_id = ef.id AND er.user_id = ?) AS has_submitted
             FROM ld_evaluation_forms ef
             JOIN ld_programs pr ON ef.program_id = pr.id
             JOIN ld_attendance a ON a.program_id = pr.id AND a.user_id = ? AND a.status = 'present'
             WHERE ef.status = 'active'
             ORDER BY ef.created_at DESC`, [userId, userId]);
        res.json(rows);
    } catch (error) { console.error('getMyEvalForms Error:', error); res.status(500).json({ message: error.message }); }
};

exports.submitEvalResponse = async (req, res) => {
    try {
        const { eval_form_id, answers } = req.body;
        const userId = req.user.id;
        const [existing] = await db.query('SELECT id FROM ld_evaluation_responses WHERE eval_form_id = ? AND user_id = ?', [eval_form_id, userId]);
        if (existing.length > 0) return res.status(400).json({ message: 'You have already submitted this evaluation' });
        let totalRating = 0;
        let ratingCount = 0;
        if (answers && Array.isArray(answers)) {
            answers.forEach(a => { if (a.rating_value) { totalRating += a.rating_value; ratingCount++; } });
        }
        const overallRating = ratingCount > 0 ? (totalRating / ratingCount) : null;
        const [result] = await db.query(
            'INSERT INTO ld_evaluation_responses (eval_form_id, user_id, submitted_at, overall_rating) VALUES (?, ?, NOW(), ?)',
            [eval_form_id, userId, overallRating]);
        const responseId = result.insertId;
        if (answers && Array.isArray(answers) && answers.length > 0) {
            const aData = answers.map(a => [responseId, a.question_id, a.rating_value || null, a.text_answer || null]);
            await db.query('INSERT INTO ld_evaluation_answers (response_id, question_id, rating_value, text_answer) VALUES ?', [aData]);
        }
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `Evaluation submitted for form ID: ${eval_form_id}`, type: 'ld_applicant' });
            // Notify the ld-admin room with the submitter's name and program title
            const [metaRows] = await db.query(
                `SELECT u.full_name, pr.title AS program_title
                 FROM ld_evaluation_forms ef
                 JOIN ld_programs pr ON ef.program_id = pr.id
                 JOIN users u ON u.id = ?
                 WHERE ef.id = ?`, [userId, eval_form_id]);
            if (metaRows.length > 0) {
                const { full_name, program_title } = metaRows[0];
                io.to('ld-admin').emit('ld:notification:admin', {
                    message: `⭐ ${full_name} submitted their training evaluation for "${program_title}".`,
                    type: 'ld_applicant'
                });
            }
        }
        res.status(201).json({ id: responseId, message: 'Evaluation submitted' });
    } catch (error) { console.error('submitEvalResponse Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getEvalResults = async (req, res) => {
    try {
        const { eval_form_id } = req.params;
        const [forms] = await db.query('SELECT * FROM ld_evaluation_forms WHERE id = ?', [eval_form_id]);
        if (forms.length === 0) return res.status(404).json({ message: 'Evaluation form not found' });
        const [questions] = await db.query(
            'SELECT * FROM ld_evaluation_questions WHERE eval_form_id = ? ORDER BY sort_order ASC', [eval_form_id]);
        const [responses] = await db.query(
            `SELECT er.*, u.full_name, u.applicant_type FROM ld_evaluation_responses er
             JOIN users u ON er.user_id = u.id WHERE er.eval_form_id = ? ORDER BY er.submitted_at DESC`, [eval_form_id]);
        const questionResults = [];
        for (const q of questions) {
            const [answers] = await db.query(
                `SELECT ea.*, er.user_id, u.applicant_type FROM ld_evaluation_answers ea
                 JOIN ld_evaluation_responses er ON ea.response_id = er.id
                 JOIN users u ON er.user_id = u.id
                 WHERE ea.question_id = ?`, [q.id]);
            const result = { question: q, answers };
            if (q.question_type === 'rating') {
                const ratings = answers.map(a => a.rating_value).filter(r => r !== null);
                result.average = ratings.length > 0 ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2) : null;
                result.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                ratings.forEach(r => { if (result.distribution[r] !== undefined) result.distribution[r]++; });
            }
            if (q.question_type === 'text') {
                result.textAnswers = answers.map(a => a.text_answer).filter(Boolean);
            }
            questionResults.push(result);
        }
        const avgByCategory = {};
        for (const q of questions) {
            if (q.question_type === 'rating') {
                const qr = questionResults.find(r => r.question.id === q.id);
                if (qr && qr.average) {
                    if (!avgByCategory[q.category]) avgByCategory[q.category] = [];
                    avgByCategory[q.category].push(parseFloat(qr.average));
                }
            }
        }
        Object.keys(avgByCategory).forEach(cat => {
            const vals = avgByCategory[cat];
            avgByCategory[cat] = vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) : null;
        });
        const overallAvg = responses.length > 0
            ? (responses.filter(r => r.overall_rating).reduce((s, r) => s + parseFloat(r.overall_rating), 0) / responses.filter(r => r.overall_rating).length).toFixed(2)
            : null;
        const [[program]] = await db.query(
            `SELECT pr.id AS program_id, pr.title AS program_title, p.school_year,
                    (SELECT COUNT(*) FROM ld_attendance WHERE program_id = pr.id AND status = 'present') AS total_attendees
             FROM ld_evaluation_forms ef
             JOIN ld_programs pr ON ef.program_id = pr.id
             LEFT JOIN ld_plans p ON pr.plan_id = p.id
             WHERE ef.id = ?`, [eval_form_id]);
        res.json({
            form: forms[0],
            program,
            questions: questionResults,
            avgByCategory,
            overallAvg,
            totalResponses: responses.length,
            responseRate: program?.total_attendees > 0 ? ((responses.length / program.total_attendees) * 100).toFixed(1) : 0
        });
    } catch (error) { console.error('getEvalResults Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getLDImpactReport = async (req, res) => {
    try {
        const { school_year } = req.query;
        let sql = `SELECT f.id AS tna_form_id, f.title AS tna_title,
                   o.id AS objective_id, o.title AS objective_title,
                   pr.id AS program_id, pr.title AS program_title, pr.status AS program_status,
                   (SELECT COUNT(*) FROM ld_attendance a WHERE a.program_id = pr.id AND a.status = 'present') AS completed_count,
                   (SELECT COUNT(*) FROM ld_attendance a WHERE a.program_id = pr.id) AS total_enrolled,
                   ef.id AS eval_form_id,
                   (SELECT ROUND(AVG(er.overall_rating), 2) FROM ld_evaluation_responses er WHERE er.eval_form_id = ef.id) AS avg_eval_score
                   FROM tna_forms f
                   LEFT JOIN ld_objectives o ON o.tna_form_id = f.id
                   LEFT JOIN ld_programs pr ON pr.objective_id = o.id
                   LEFT JOIN ld_evaluation_forms ef ON ef.program_id = pr.id
                   WHERE 1=1`;
        const params = [];
        if (school_year) { sql += ' AND f.school_year = ?'; params.push(school_year); }
        sql += ' ORDER BY f.created_at DESC';
        const [rows] = await db.query(sql, params);
        const report = rows.map(r => ({
            ...r,
            completion_rate: r.total_enrolled > 0 ? ((r.completed_count / r.total_enrolled) * 100).toFixed(1) : 0
        }));
        res.json(report);
    } catch (error) { console.error('getLDImpactReport Error:', error); res.status(500).json({ message: error.message }); }
};
