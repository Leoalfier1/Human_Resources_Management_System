const db = require('../../db');

exports.getPlans = async (req, res) => {
    try {
        const { school_year, status } = req.query;
        let sql = `SELECT p.*, u.full_name AS created_by_name,
                   au.full_name AS approved_by_name,
                   (SELECT COUNT(*) FROM ld_programs pr WHERE pr.plan_id = p.id) AS program_count,
                   (SELECT COALESCE(SUM(pr.duration_hours), 0) FROM ld_programs pr WHERE pr.plan_id = p.id) AS total_hours,
                   (SELECT COALESCE(SUM(pr.budget_estimate), 0) FROM ld_programs pr WHERE pr.plan_id = p.id) AS total_budget
                   FROM ld_plans p
                   LEFT JOIN users u ON p.created_by = u.id
                   LEFT JOIN users au ON p.approved_by = au.id
                   WHERE 1=1`;
        const params = [];
        if (school_year) { sql += ' AND p.school_year = ?'; params.push(school_year); }
        if (status) { sql += ' AND p.status = ?'; params.push(status); }
        sql += ' ORDER BY p.created_at DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) { console.error('getPlans Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const [plans] = await db.query(
            `SELECT p.*, u.full_name AS created_by_name, au.full_name AS approved_by_name
             FROM ld_plans p
             LEFT JOIN users u ON p.created_by = u.id
             LEFT JOIN users au ON p.approved_by = au.id
             WHERE p.id = ?`, [id]);
        if (plans.length === 0) return res.status(404).json({ message: 'Plan not found' });
        const [programs] = await db.query(
            `SELECT pr.*, o.title AS objective_title FROM ld_programs pr
             LEFT JOIN ld_objectives o ON pr.objective_id = o.id
             WHERE pr.plan_id = ? ORDER BY pr.start_date ASC`, [id]);
        res.json({ ...plans[0], programs });
    } catch (error) { console.error('getPlanById Error:', error); res.status(500).json({ message: error.message }); }
};

exports.createPlan = async (req, res) => {
    try {
        const { title, school_year, description } = req.body;
        if (!title || !school_year) return res.status(400).json({ message: 'Title and school year are required' });
        const [result] = await db.query(
            'INSERT INTO ld_plans (title, school_year, description, created_by) VALUES (?, ?, ?, ?)',
            [title, school_year, description || '', req.user.id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `New LDP created: ${title}`, type: 'ld' });
        }
        res.status(201).json({ id: result.insertId, message: 'Plan created' });
    } catch (error) { console.error('createPlan Error:', error); res.status(500).json({ message: error.message }); }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, school_year, description } = req.body;
        await db.query(
            'UPDATE ld_plans SET title=COALESCE(?,title), school_year=COALESCE(?,school_year), description=COALESCE(?,description) WHERE id=?',
            [title, school_year, description, id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `LDP updated (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Plan updated' });
    } catch (error) { console.error('updatePlan Error:', error); res.status(500).json({ message: error.message }); }
};

exports.submitPlan = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE ld_plans SET status = ? WHERE id = ?', ['submitted', id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `LDP submitted for approval (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Plan submitted for approval' });
    } catch (error) { console.error('submitPlan Error:', error); res.status(500).json({ message: error.message }); }
};

exports.approvePlan = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE ld_plans SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
            ['approved', req.user.id, id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `LDP approved (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Plan approved' });
    } catch (error) { console.error('approvePlan Error:', error); res.status(500).json({ message: error.message }); }
};
