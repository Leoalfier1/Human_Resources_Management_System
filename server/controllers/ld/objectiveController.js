const db = require('../../db');

exports.getObjectives = async (req, res) => {
    try {
        const { school_year, target_position_type, tna_form_id } = req.query;
        let sql = `SELECT o.*, u.full_name AS created_by_name,
                   f.title AS tna_form_title
                   FROM ld_objectives o
                   LEFT JOIN users u ON o.created_by = u.id
                   LEFT JOIN tna_forms f ON o.tna_form_id = f.id
                   WHERE 1=1`;
        const params = [];
        if (school_year) { sql += ' AND o.school_year = ?'; params.push(school_year); }
        if (target_position_type) { sql += ' AND (o.target_position_type = ? OR o.target_position_type = \'all\')'; params.push(target_position_type); }
        if (tna_form_id) { sql += ' AND o.tna_form_id = ?'; params.push(tna_form_id); }
        sql += ' ORDER BY FIELD(o.priority_level,\'high\',\'medium\',\'low\'), o.created_at DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) { console.error('getObjectives Error:', error); res.status(500).json({ message: error.message }); }
};

exports.createObjective = async (req, res) => {
    try {
        const { title, description, school_year, target_position_type, professional_standard, priority_level, tna_form_id } = req.body;
        if (!title || !school_year) return res.status(400).json({ message: 'Title and school year are required' });
        const [result] = await db.query(
            `INSERT INTO ld_objectives (title, description, school_year, target_position_type, professional_standard, priority_level, tna_form_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description || '', school_year, target_position_type || 'all',
             professional_standard || null, priority_level || 'medium', tna_form_id || null, req.user.id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `New L&D objective created: ${title}`, type: 'ld' });
        }
        res.status(201).json({ id: result.insertId, message: 'Objective created' });
    } catch (error) { console.error('createObjective Error:', error); res.status(500).json({ message: error.message }); }
};

exports.updateObjective = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, school_year, target_position_type, professional_standard, priority_level, tna_form_id } = req.body;
        await db.query(
            `UPDATE ld_objectives SET
             title=COALESCE(?,title), description=COALESCE(?,description),
             school_year=COALESCE(?,school_year), target_position_type=COALESCE(?,target_position_type),
             professional_standard=COALESCE(?,professional_standard), priority_level=COALESCE(?,priority_level),
             tna_form_id=COALESCE(?,tna_form_id) WHERE id=?`,
            [title, description, school_year, target_position_type, professional_standard, priority_level, tna_form_id, id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `L&D objective updated (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Objective updated' });
    } catch (error) { console.error('updateObjective Error:', error); res.status(500).json({ message: error.message }); }
};

exports.approveObjective = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE ld_objectives SET status = ? WHERE id = ?', ['approved', id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `L&D objective approved (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Objective approved' });
    } catch (error) { console.error('approveObjective Error:', error); res.status(500).json({ message: error.message }); }
};

exports.deleteObjective = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM ld_objectives WHERE id = ?', [id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `L&D objective deleted (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Objective deleted' });
    } catch (error) { console.error('deleteObjective Error:', error); res.status(500).json({ message: error.message }); }
};
