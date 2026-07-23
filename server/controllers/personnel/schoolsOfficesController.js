const db = require('../../db');

exports.getAll = async (req, res) => {
    try {
        const { search, type, active_only } = req.query;
        let where = ['1=1'];
        let params = [];

        if (search) {
            where.push('(so.name LIKE ? OR so.district LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        if (type) { where.push('so.type = ?'); params.push(type); }
        if (active_only === '1') { where.push('so.is_active = 1'); }

        const whereClause = where.join(' AND ');
        const [rows] = await db.query(
            `SELECT so.*,
                (SELECT COUNT(*) FROM employees e WHERE e.school_office_id = so.id) as employee_count
             FROM schools_offices so
             WHERE ${whereClause}
             ORDER BY so.type ASC, so.district ASC, so.name ASC`,
            params
        );
        res.json(rows);
    } catch (error) {
        console.error('schoolsOffices.getAll Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM schools_offices WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Record not found.' });
        res.json(rows[0]);
    } catch (error) {
        console.error('schoolsOffices.getById Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, type, district } = req.body;
        if (!name || !type) {
            return res.status(400).json({ message: 'name and type are required.' });
        }
        if (!['school', 'office'].includes(type)) {
            return res.status(400).json({ message: 'type must be school or office.' });
        }
        const districtVal = type === 'school' ? (district || null) : null;
        const [result] = await db.query(
            'INSERT INTO schools_offices (name, type, district) VALUES (?, ?, ?)',
            [name.trim(), type, districtVal]
        );
        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:schools-offices:update');
        }
        res.status(201).json({ message: 'Created.', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A record with this name already exists.' });
        }
        console.error('schoolsOffices.create Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, type, district } = req.body;
        const { id } = req.params;
        if (!name || !type) {
            return res.status(400).json({ message: 'name and type are required.' });
        }
        if (!['school', 'office'].includes(type)) {
            return res.status(400).json({ message: 'type must be school or office.' });
        }
        const districtVal = type === 'school' ? (district || null) : null;
        await db.query(
            'UPDATE schools_offices SET name = ?, type = ?, district = ? WHERE id = ?',
            [name.trim(), type, districtVal, id]
        );
        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:schools-offices:update');
        }
        res.json({ message: 'Updated.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A record with this name already exists.' });
        }
        console.error('schoolsOffices.update Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.toggleActive = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT id, is_active, name FROM schools_offices WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Record not found.' });

        const currentActive = rows[0].is_active;

        if (currentActive === 1) {
            const [empCount] = await db.query(
                'SELECT COUNT(*) as cnt FROM employees WHERE school_office_id = ?',
                [id]
            );
            if (empCount[0].cnt > 0) {
                return res.status(409).json({
                    message: `Cannot deactivate "${rows[0].name}" — ${empCount[0].cnt} employee(s) are assigned to it. Reassign them first.`
                });
            }
        }

        await db.query('UPDATE schools_offices SET is_active = ? WHERE id = ?', [currentActive ? 0 : 1, id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:schools-offices:update');
        }
        res.json({ message: currentActive ? 'Deactivated.' : 'Reactivated.', is_active: currentActive ? 0 : 1 });
    } catch (error) {
        console.error('schoolsOffices.toggleActive Error:', error);
        res.status(500).json({ message: error.message });
    }
};
