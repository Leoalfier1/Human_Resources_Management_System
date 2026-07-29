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
            io.to('ld-admin').emit('ld:notification:admin', { message: `New LDP created: ${title}`, type: 'ld' });
        }
        res.status(201).json({ id: result.insertId, message: 'Plan created' });
    } catch (error) { console.error('createPlan Error:', error); res.status(500).json({ message: error.message }); }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, school_year, schoolYear, division, prepared_by, preparedBy, description, division_priorities, priorities } = req.body;
        const sy = school_year || schoolYear;
        const prepBy = prepared_by || preparedBy;
        const divPrio = division_priorities || priorities;

        await db.query(
            `UPDATE ld_plans SET
             title=COALESCE(?,title), school_year=COALESCE(?,school_year), division=COALESCE(?,division),
             prepared_by=COALESCE(?,prepared_by), description=COALESCE(?,description),
             division_priorities=COALESCE(?,division_priorities) WHERE id=?`,
            [title || null, sy || null, division || null, prepBy || null, description || null, divPrio || null, id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `LDP updated (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Plan updated successfully' });
    } catch (error) { console.error('updatePlan Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getActivePlan = async (req, res) => {
    try {
        let [plans] = await db.query(
            `SELECT p.* FROM ld_plans p ORDER BY p.created_at DESC LIMIT 1`
        );
        if (plans.length === 0) {
            const defaultPreparedBy = req.user?.full_name ? `${req.user.full_name}, HRMO` : 'Ma. Rosa Santos, HRMO-II';
            const [result] = await db.query(
                `INSERT INTO ld_plans (title, school_year, division, prepared_by, division_priorities, status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Division L&D Master Plan SY 2025–2026', '2025–2026', 'Dapitan City', defaultPreparedBy,
                 'Alignment with National Learning Recovery Program, MATATAG Curriculum rollout, and SDO Strategic Plan SY 2025–2028.', 'approved']
            );
            [plans] = await db.query(`SELECT * FROM ld_plans WHERE id = ?`, [result.insertId]);
        }

        const plan = plans[0];

        const [programs] = await db.query(
            `SELECT pr.id, pr.title, pr.budget_estimate AS budget,
                    (SELECT COUNT(*) FROM ld_attendance a WHERE a.program_id = pr.id) AS pax_actual,
                    COALESCE(pr.target_participants, '80 Teaching Personnel') AS target_participants
             FROM ld_programs pr
             WHERE pr.plan_id = ? AND pr.status != 'cancelled'
             ORDER BY pr.created_at ASC`, [plan.id]
        );

        res.json({
            id: plan.id,
            schoolYear: plan.school_year || '2025–2026',
            division: plan.division || 'Dapitan City',
            preparedBy: plan.prepared_by || (req.user?.full_name ? `${req.user.full_name}, HRMO` : 'Ma. Rosa Santos, HRMO-II'),
            priorities: plan.division_priorities || 'Alignment with National Learning Recovery Program, MATATAG Curriculum rollout, and SDO Strategic Plan SY 2025–2028.',
            programs: programs.map(p => {
                const paxMatch = (p.target_participants || '').match(/\d+/);
                const paxVal = paxMatch ? parseInt(paxMatch[0], 10) : (p.pax_actual || 80);
                return {
                    id: p.id,
                    title: p.title,
                    budget: Number(p.budget) || 0,
                    pax: paxVal,
                };
            }),
        });
    } catch (error) {
        console.error('getActivePlan Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.addWFPProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, budget, pax } = req.body;
        if (!title) return res.status(400).json({ message: 'Program title is required' });

        const [result] = await db.query(
            `INSERT INTO ld_programs (plan_id, title, budget_estimate, target_participants, methodology, status)
             VALUES (?, ?, ?, ?, 'Seminar', 'upcoming')`,
            [id, title, budget || 0, `${pax || 80} Teaching Personnel`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('ld:dashboard:update');

        res.status(201).json({ id: result.insertId, title, budget: Number(budget) || 0, pax: Number(pax) || 80, message: 'WFP Program added' });
    } catch (error) {
        console.error('addWFPProgram Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteWFPProgram = async (req, res) => {
    try {
        const { progId } = req.params;
        await db.query(`DELETE FROM ld_programs WHERE id = ?`, [progId]);
        const io = req.app.get('socketio');
        if (io) io.emit('ld:dashboard:update');
        res.json({ message: 'Program removed from WFP' });
    } catch (error) {
        console.error('deleteWFPProgram Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.submitPlan = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE ld_plans SET status = ? WHERE id = ?', ['submitted', id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `LDP submitted for approval (ID: ${id})`, type: 'ld' });
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
            io.to('ld-admin').emit('ld:notification:admin', { message: `LDP approved (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Plan approved' });
    } catch (error) { console.error('approvePlan Error:', error); res.status(500).json({ message: error.message }); }
};
