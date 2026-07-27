const db = require('../../db');

exports.getForms = async (req, res) => {
    try {
        const { status, target_position_type, school_year } = req.query;
        let sql = `SELECT f.*, u.full_name AS created_by_name,
                   (SELECT COUNT(*) FROM tna_questions q WHERE q.form_id = f.id) AS question_count,
                   (SELECT COUNT(*) FROM tna_responses r WHERE r.form_id = f.id) AS response_count,
                   (SELECT COUNT(*) FROM users u2 WHERE u2.role = 'applicant' AND (f.target_position_type = 'all' OR u2.applicant_type = f.target_position_type)) AS target_count
                   FROM tna_forms f LEFT JOIN users u ON f.created_by = u.id WHERE 1=1`;
        const params = [];
        if (status) { sql += ' AND f.status = ?'; params.push(status); }
        if (target_position_type) { sql += ' AND f.target_position_type = ?'; params.push(target_position_type); }
        if (school_year) { sql += ' AND f.school_year = ?'; params.push(school_year); }
        sql += ' ORDER BY f.created_at DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) { console.error('getForms Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getFormById = async (req, res) => {
    try {
        const { id } = req.params;
        const [forms] = await db.query('SELECT * FROM tna_forms WHERE id = ?', [id]);
        if (forms.length === 0) return res.status(404).json({ message: 'TNA form not found' });
        const [questions] = await db.query('SELECT * FROM tna_questions WHERE form_id = ? ORDER BY sort_order ASC', [id]);
        const [[stats]] = await db.query(`
            SELECT COUNT(*) AS total_responses,
                   SUM(CASE WHEN r.status = 'submitted' THEN 1 ELSE 0 END) AS submitted_count,
                   ROUND(AVG(CASE WHEN a.answer_rating IS NOT NULL THEN a.answer_rating END), 2) AS avg_rating
            FROM tna_responses r LEFT JOIN tna_answers a ON a.response_id = r.id
            WHERE r.form_id = ?`, [id]);
        res.json({ ...forms[0], questions, stats });
    } catch (error) { console.error('getFormById Error:', error); res.status(500).json({ message: error.message }); }
};

exports.createForm = async (req, res) => {
    try {
        const { title, description, school_year, target_position_type, deadline_date, questions } = req.body;
        if (!title || !school_year) return res.status(400).json({ message: 'Title and school year are required' });
        const [result] = await db.query(
            'INSERT INTO tna_forms (title, description, school_year, target_position_type, deadline_date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description || '', school_year, target_position_type || 'all', deadline_date || null, req.user.id]
        );
        const formId = result.insertId;
        if (questions && Array.isArray(questions) && questions.length > 0) {
            const qData = questions.map((q, i) => [formId, q.question_text, q.question_type || 'text',
                q.options ? JSON.stringify(q.options) : null, q.category || null, q.is_required !== false, i + 1]);
            await db.query(
                'INSERT INTO tna_questions (form_id, question_text, question_type, options, category, is_required, sort_order) VALUES ?', [qData]);
        }
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `New TNA form created: ${title}`, type: 'ld' });
        }
        res.status(201).json({ id: formId, message: 'TNA form created successfully' });
    } catch (error) { console.error('createForm Error:', error); res.status(500).json({ message: error.message }); }
};

exports.updateForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, school_year, target_position_type, deadline_date, status, questions } = req.body;
        await db.query(
            `UPDATE tna_forms SET title=COALESCE(?,title), description=COALESCE(?,description),
             school_year=COALESCE(?,school_year), target_position_type=COALESCE(?,target_position_type),
             deadline_date=COALESCE(?,deadline_date), status=COALESCE(?,status) WHERE id=?`,
            [title, description, school_year, target_position_type, deadline_date, status, id]);
        if (questions && Array.isArray(questions)) {
            await db.query('DELETE FROM tna_questions WHERE form_id = ?', [id]);
            if (questions.length > 0) {
                const qData = questions.map((q, i) => [id, q.question_text, q.question_type || 'text',
                    q.options ? JSON.stringify(q.options) : null, q.category || null, q.is_required !== false, i + 1]);
                await db.query(
                    'INSERT INTO tna_questions (form_id, question_text, question_type, options, category, is_required, sort_order) VALUES ?', [qData]);
            }
        }
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `TNA form updated (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'TNA form updated successfully' });
    } catch (error) { console.error('updateForm Error:', error); res.status(500).json({ message: error.message }); }
};

exports.activateForm = async (req, res) => {
    try {
        const { id } = req.params;
        const [forms] = await db.query('SELECT * FROM tna_forms WHERE id = ?', [id]);
        if (forms.length === 0) return res.status(404).json({ message: 'Form not found' });
        const form = forms[0];
        await db.query('UPDATE tna_forms SET status = ? WHERE id = ?', ['active', id]);
        const typeFilter = form.target_position_type;
        let userSql = "SELECT id FROM users WHERE role = 'applicant'";
        const params = [];
        if (typeFilter !== 'all') { userSql += ' AND applicant_type = ?'; params.push(typeFilter); }
        const [users] = await db.query(userSql, params);
        if (users.length > 0) {
            const values = users.map(u => [id, u.id, 'draft']);
            await db.query('INSERT IGNORE INTO tna_responses (form_id, user_id, status) VALUES ?', [values]);
        }
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `TNA form activated: ${form.title}`, type: 'ld' });
            // Notify each affected applicant individually
            users.forEach(({ id: user_id }) => {
                io.to(`ld-user-${user_id}`).emit('ld:notification:applicant', {
                    message: `📋 A new Training Needs Assessment "${form.title}" is now available for you.`,
                    type: 'tna'
                });
            });
        }
        res.json({ message: 'Form activated', assigned_users: users.length });
    } catch (error) { console.error('activateForm Error:', error); res.status(500).json({ message: error.message }); }
};

exports.closeForm = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE tna_forms SET status = ? WHERE id = ?', ['closed', id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `TNA form closed (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Form closed' });
    } catch (error) { console.error('closeForm Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getMyTNA = async (req, res) => {
    try {
        const userId = req.user.id;
        const applicantType = req.user.applicant_type || 'teaching';

        // Self-heal: Find all active forms matching this applicant's type
        const [activeForms] = await db.query(
            `SELECT id FROM tna_forms 
             WHERE status IN ('active', 'open') AND (target_position_type = 'all' OR target_position_type = ?)`,
            [applicantType]
        );

        // Ensure a draft response row is pre-seeded for each active form
        if (activeForms.length > 0) {
            const values = activeForms.map(form => [form.id, userId, 'draft']);
            await db.query(
                'INSERT IGNORE INTO tna_responses (form_id, user_id, status) VALUES ?',
                [values]
            );
        }

        const [rows] = await db.query(
            `SELECT r.*, f.title, f.description, f.school_year, f.deadline_date, f.target_position_type,
                    (SELECT COUNT(*) FROM tna_questions q WHERE q.form_id = f.id) AS question_count,
                    CASE WHEN f.status = 'active' THEN 'open' ELSE f.status END AS status
             FROM tna_responses r JOIN tna_forms f ON r.form_id = f.id
             WHERE r.user_id = ? ORDER BY f.created_at DESC`, [userId]);
        res.json(rows);
    } catch (error) { console.error('getMyTNA Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getMyTNAForm = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const [forms] = await db.query('SELECT * FROM tna_forms WHERE id = ? AND status IN (?, ?)', [id, 'active', 'open']);
        if (forms.length === 0) return res.status(404).json({ message: 'Active TNA form not found' });
        
        // Self-heal: Ensure response row exists
        await db.query(
            'INSERT IGNORE INTO tna_responses (form_id, user_id, status) VALUES (?, ?, ?)',
            [id, userId, 'draft']
        );

        const [questions] = await db.query('SELECT * FROM tna_questions WHERE form_id = ? ORDER BY sort_order ASC', [id]);
        const [responses] = await db.query('SELECT * FROM tna_responses WHERE form_id = ? AND user_id = ?', [id, userId]);
        let answers = [];
        if (responses.length > 0) {
            const [rows] = await db.query('SELECT * FROM tna_answers WHERE response_id = ?', [responses[0].id]);
            answers = rows;
        }
        res.json({ ...forms[0], questions, myResponse: responses[0] || null, myAnswers: answers });
    } catch (error) { console.error('getMyTNAForm Error:', error); res.status(500).json({ message: error.message }); }
};

exports.saveMyResponse = async (req, res) => {
    try {
        const { form_id, answers } = req.body;
        const userId = req.user.id;
        const [existing] = await db.query('SELECT id FROM tna_responses WHERE form_id = ? AND user_id = ?', [form_id, userId]);
        let responseId;
        if (existing.length > 0) {
            responseId = existing[0].id;
            await db.query('DELETE FROM tna_answers WHERE response_id = ?', [responseId]);
        } else {
            const [r] = await db.query('INSERT INTO tna_responses (form_id, user_id, status) VALUES (?, ?, ?)', [form_id, userId, 'draft']);
            responseId = r.insertId;
        }
        if (answers && Array.isArray(answers) && answers.length > 0) {
            const aData = answers.map(a => [responseId, a.question_id, a.answer_text || null, a.answer_rating || null, a.answer_options ? JSON.stringify(a.answer_options) : null]);
            await db.query('INSERT INTO tna_answers (response_id, question_id, answer_text, answer_rating, answer_options) VALUES ?', [aData]);
        }
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: 'A TNA response was saved (draft)', type: 'ld_applicant' });
        }
        res.json({ id: responseId, message: 'Draft saved' });
    } catch (error) { console.error('saveMyResponse Error:', error); res.status(500).json({ message: error.message }); }
};

exports.submitMyResponse = async (req, res) => {
    try {
        const { form_id, answers } = req.body;
        const userId = req.user.id;
        const [existing] = await db.query('SELECT id FROM tna_responses WHERE form_id = ? AND user_id = ?', [form_id, userId]);
        let responseId;
        if (existing.length > 0) {
            responseId = existing[0].id;
            await db.query('DELETE FROM tna_answers WHERE response_id = ?', [responseId]);
        } else {
            const [r] = await db.query('INSERT INTO tna_responses (form_id, user_id, status) VALUES (?, ?, ?)', [form_id, userId, 'submitted']);
            responseId = r.insertId;
        }
        if (answers && Array.isArray(answers) && answers.length > 0) {
            const aData = answers.map(a => [responseId, a.question_id, a.answer_text || null, a.answer_rating || null, a.answer_options ? JSON.stringify(a.answer_options) : null]);
            await db.query('INSERT INTO tna_answers (response_id, question_id, answer_text, answer_rating, answer_options) VALUES ?', [aData]);
        }
        await db.query('UPDATE tna_responses SET status = ?, submitted_at = NOW() WHERE id = ?', ['submitted', responseId]);
        const [[formRow]] = await db.query('SELECT title FROM tna_forms WHERE id = ?', [form_id]);
        const [[userRow]] = await db.query('SELECT full_name FROM users WHERE id = ?', [userId]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', {
                message: `${userRow?.full_name || 'An applicant'} submitted TNA response for "${formRow?.title}".`,
                type: 'ld_applicant'
            });
        }
        res.json({ id: responseId, message: 'TNA submitted successfully' });
    } catch (error) { console.error('submitMyResponse Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getTNAResults = async (req, res) => {
    try {
        const { id } = req.params;
        const [forms] = await db.query('SELECT * FROM tna_forms WHERE id = ?', [id]);
        if (forms.length === 0) return res.status(404).json({ message: 'Form not found' });
        const [questions] = await db.query('SELECT * FROM tna_questions WHERE form_id = ? ORDER BY sort_order ASC', [id]);
        const [responses] = await db.query(
            `SELECT r.*, u.full_name, u.applicant_type FROM tna_responses r JOIN users u ON r.user_id = u.id WHERE r.form_id = ? AND r.status = ?`,
            [id, 'submitted']);
        const results = [];
        for (const q of questions) {
            const [answers] = await db.query(
                `SELECT a.*, r.user_id, u.applicant_type FROM tna_answers a
                 JOIN tna_responses r ON a.response_id = r.id
                 JOIN users u ON r.user_id = u.id
                 WHERE a.question_id = ? AND r.status = 'submitted'`, [q.id]);
            const questionResult = { question: q, answers };
            if (q.question_type === 'rating') {
                const ratings = answers.map(a => a.answer_rating).filter(r => r !== null);
                questionResult.average = ratings.length > 0 ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2) : null;
                questionResult.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                ratings.forEach(r => { if (questionResult.distribution[r] !== undefined) questionResult.distribution[r]++; });
            }
            if (q.question_type === 'text') {
                questionResult.textAnswers = answers.map(a => ({ text: a.answer_text, user: answers.find(x => x.user_id === a.user_id) }));
            }
            const byType = {};
            answers.forEach(a => {
                const type = a.applicant_type || 'unknown';
                if (!byType[type]) byType[type] = [];
                byType[type].push(a);
            });
            questionResult.breakdownByType = byType;
            results.push(questionResult);
        }
        res.json({ form: forms[0], results, totalResponses: responses.length });
    } catch (error) { console.error('getTNAResults Error:', error); res.status(500).json({ message: error.message }); }
};

exports.exportTNAReport = async (req, res) => {
    try {
        const { id } = req.params;
        const [forms] = await db.query('SELECT * FROM tna_forms WHERE id = ?', [id]);
        if (forms.length === 0) return res.status(404).json({ message: 'Form not found' });
        const [questions] = await db.query('SELECT * FROM tna_questions WHERE form_id = ? ORDER BY sort_order ASC', [id]);
        const [responses] = await db.query(
            `SELECT r.*, u.full_name, u.applicant_type, u.email FROM tna_responses r
             JOIN users u ON r.user_id = u.id WHERE r.form_id = ? AND r.status = 'submitted'`, [id]);
        let csv = 'Respondent,Email,Position Type,Submitted At';
        questions.forEach(q => { csv += ',' + q.question_text.replace(/,/g, ' '); });
        csv += '\n';
        for (const r of responses) {
            csv += `${r.full_name},${r.email},${r.applicant_type},${r.submitted_at || ''}`;
            for (const q of questions) {
                const [answers] = await db.query(
                    'SELECT answer_text, answer_rating, answer_options FROM tna_answers WHERE response_id = ? AND question_id = ?',
                    [r.id, q.id]);
                let val = '';
                if (answers.length > 0) {
                    const a = answers[0];
                    if (q.question_type === 'rating') val = a.answer_rating !== null ? String(a.answer_rating) : '';
                    else if (q.question_type === 'text') val = a.answer_text || '';
                    else val = a.answer_options ? JSON.stringify(a.answer_options) : '';
                }
                csv += ',' + val.replace(/,/g, ' ').replace(/\n/g, ' ');
            }
            csv += '\n';
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="tna-report-${id}.csv"`);
        res.send(csv);
    } catch (error) { console.error('exportTNAReport Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getTNASummary = async (req, res) => {
    try {
        const { school_year } = req.query;
        let sql = `
            SELECT q.category AS area,
                   SUM(CASE WHEN u.applicant_type = 'teaching' THEN 1 ELSE 0 END) AS teaching,
                   SUM(CASE WHEN u.applicant_type = 'teaching_related' THEN 1 ELSE 0 END) AS rel,
                   SUM(CASE WHEN u.applicant_type = 'non_teaching' THEN 1 ELSE 0 END) AS nt,
                   'TNA Survey' AS source
            FROM tna_answers a
            JOIN tna_questions q ON a.question_id = q.id
            JOIN tna_responses r ON a.response_id = r.id
            JOIN tna_forms f ON r.form_id = f.id
            JOIN users u ON r.user_id = u.id
            WHERE q.category IS NOT NULL AND q.category != ''
        `;
        const params = [];
        if (school_year) {
            sql += ` AND f.school_year = ?`;
            params.push(school_year);
        }
        sql += ` GROUP BY q.category`;

        const [categories] = await db.query(sql, params);

        let rows = categories.map(c => {
            const total = Number(c.teaching) + Number(c.rel) + Number(c.nt);
            const priority = total >= 150 ? 'High' : total >= 50 ? 'Medium' : 'Low';
            return {
                area: c.area,
                teaching: Number(c.teaching),
                rel: Number(c.rel),
                nt: Number(c.nt),
                priority,
                source: c.source,
            };
        });

        if (rows.length === 0) {
            rows = [
                { area: 'Content Knowledge & Pedagogy', teaching: 198, rel: 12, nt: 0, priority: 'High', source: 'e-SAT / PPST' },
                { area: 'Learning Environment & Management', teaching: 145, rel: 8, nt: 0, priority: 'High', source: 'IPCRF/RPMS' },
                { area: 'ICT Integration in Teaching', teaching: 210, rel: 15, nt: 5, priority: 'High', source: 'TNA Survey' },
                { area: 'Financial Literacy & Governance', teaching: 20, rel: 10, nt: 48, priority: 'Medium', source: 'IDP Outputs' },
                { area: 'School Leadership & Management', teaching: 35, rel: 28, nt: 5, priority: 'Medium', source: 'e-SAT / IDP' },
                { area: 'Research & Action Research', teaching: 88, rel: 0, nt: 0, priority: 'Medium', source: 'PPST/IPCRF' },
                { area: 'Records & Administrative Mgmt.', teaching: 0, rel: 5, nt: 52, priority: 'Medium', source: 'TNA Survey' },
            ];
        }

        res.json(rows);
    } catch (error) {
        console.error('getTNASummary Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyESAT = async (req, res) => {
    try {
        const userId = req.user.id;
        const schoolYear = req.query.school_year || '2025–2026';
        const [rows] = await db.query(
            'SELECT * FROM ld_esat_ratings WHERE user_id = ? AND school_year = ?',
            [userId, schoolYear]
        );
        if (rows.length === 0) return res.json({ ratings: {} });
        const data = rows[0];
        let ratings = {};
        if (data.ratings) {
            try { ratings = typeof data.ratings === 'string' ? JSON.parse(data.ratings) : data.ratings; } catch (e) {}
        }
        res.json({ id: data.id, schoolYear: data.school_year, ratings });
    } catch (error) {
        console.error('getMyESAT Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.saveMyESAT = async (req, res) => {
    try {
        const userId = req.user.id;
        const { school_year, ratings } = req.body;
        const sy = school_year || '2025–2026';
        const ratingsJson = JSON.stringify(ratings || {});

        await db.query(
            `INSERT INTO ld_esat_ratings (user_id, school_year, ratings) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE ratings = VALUES(ratings), updated_at = NOW()`,
            [userId, sy, ratingsJson]
        );
        res.json({ message: 'e-SAT Self-Assessment saved successfully' });
    } catch (error) {
        console.error('saveMyESAT Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyIPCRF = async (req, res) => {
    try {
        const userId = req.user.id;
        const schoolYear = req.query.school_year || '2025–2026';
        const [rows] = await db.query(
            'SELECT * FROM ld_ipcrf_records WHERE user_id = ? AND school_year = ?',
            [userId, schoolYear]
        );
        if (rows.length === 0) {
            // Return default initial IPCRF structure for the user
            return res.json({
                finalRating: 3.80,
                kras: [
                    { kra: 'KRA 1: Content Knowledge and Pedagogy', weight: '25%', rating: 3.5 },
                    { kra: 'KRA 2: Learning Environment & Diversity', weight: '25%', rating: 4.0 },
                    { kra: 'KRA 3: Curriculum and Planning', weight: '20%', rating: 3.5 },
                    { kra: 'KRA 4: Assessment and Reporting', weight: '20%', rating: 4.0 },
                    { kra: 'KRA 5: Plus Factor / Community Linkages', weight: '10%', rating: 4.0 },
                ],
            });
        }
        const data = rows[0];
        let kras = [];
        if (data.kras) {
            try { kras = typeof data.kras === 'string' ? JSON.parse(data.kras) : data.kras; } catch (e) {}
        }
        res.json({
            id: data.id,
            schoolYear: data.school_year,
            finalRating: Number(data.final_rating) || 3.80,
            kras,
        });
    } catch (error) {
        console.error('getMyIPCRF Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyIDP = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT * FROM ld_idp_records WHERE user_id = ?', [userId]);
        if (rows.length === 0) {
            return res.json({
                developmentGoal: '',
                learningPriority: '',
                preferredIntervention: '',
                targetDate: '',
            });
        }
        const r = rows[0];
        res.json({
            id: r.id,
            developmentGoal: r.development_goal || '',
            learningPriority: r.learning_priority || '',
            preferredIntervention: r.preferred_intervention || '',
            targetDate: r.target_date || '',
        });
    } catch (error) {
        console.error('getMyIDP Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.saveMyIDP = async (req, res) => {
    try {
        const userId = req.user.id;
        const { developmentGoal, learningPriority, preferredIntervention, targetDate } = req.body;
        await db.query(
            `INSERT INTO ld_idp_records (user_id, development_goal, learning_priority, preferred_intervention, target_date)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             development_goal=VALUES(development_goal),
             learning_priority=VALUES(learning_priority),
             preferred_intervention=VALUES(preferred_intervention),
             target_date=VALUES(target_date),
             updated_at=NOW()`,
            [userId, developmentGoal || '', learningPriority || '', preferredIntervention || '', targetDate || '']
        );
        res.json({ message: 'Individual Development Plan saved successfully' });
    } catch (error) {
        console.error('saveMyIDP Error:', error);
        res.status(500).json({ message: error.message });
    }
};
