const db = require('../../db');

const TEACHING_CRITERIA = [
    { label: 'Classroom Performance', weight: 30, sort: 1 },
    { label: 'Community Involvement', weight: 20, sort: 2 },
    { label: 'Professional Development', weight: 20, sort: 3 },
    { label: 'Leadership and Innovation', weight: 20, sort: 4 },
    { label: 'Professional Appearance and Ethics', weight: 10, sort: 5 },
];

const NON_TEACHING_CRITERIA = [
    { label: 'Work Performance and Output', weight: 30, sort: 1 },
    { label: 'Administrative Competence', weight: 25, sort: 2 },
    { label: 'Teamwork and Collaboration', weight: 20, sort: 3 },
    { label: 'Professional Growth', weight: 15, sort: 4 },
    { label: 'Service Delivery and Customer Focus', weight: 10, sort: 5 },
];

exports.getSearches = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*,
                (SELECT COUNT(*) FROM rr_nominations WHERE search_id = s.id) as nominee_count,
                (SELECT COUNT(*) FROM rr_awards WHERE search_id = s.id) as awardee_count
            FROM rr_searches s
            ORDER BY s.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('❌ GET SEARCHES ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch searches' });
    }
};

exports.getSearchById = async (req, res) => {
    try {
        const { id } = req.params;
        const [searchRows] = await db.query('SELECT * FROM rr_searches WHERE id = ?', [id]);
        if (searchRows.length === 0) return res.status(404).json({ message: 'Search not found' });
        const search = searchRows[0];

        const [categories] = await db.query('SELECT * FROM rr_award_categories WHERE search_id = ?', [id]);
        const [criteria] = await db.query('SELECT * FROM rr_evaluation_criteria WHERE search_id = ?', [id]);

        res.json({ ...search, categories, criteria });
    } catch (err) {
        console.error('❌ GET SEARCH ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch search' });
    }
};

exports.createSearch = async (req, res) => {
    try {
        const {
            title, description, school_year, search_type, target_position_type,
            nomination_start, nomination_end, evaluation_start, evaluation_end,
            ceremony_date, categories, criteria
        } = req.body;

        const [result] = await db.query(`
            INSERT INTO rr_searches (title, description, school_year, search_type, target_position_type,
                nomination_start, nomination_end, evaluation_start, evaluation_end, ceremony_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, description, school_year, search_type, target_position_type || 'all',
            nomination_start, nomination_end, evaluation_start, evaluation_end, ceremony_date, req.user.id]);

        const searchId = result.insertId;

        if (categories && Array.isArray(categories)) {
            for (const cat of categories) {
                await db.query(`
                    INSERT INTO rr_award_categories (search_id, category_name, category_level, position_type, max_awardees, description)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [searchId, cat.category_name, cat.category_level || 'division', cat.position_type || 'all', cat.max_awardees || 1, cat.description || null]);
            }
        }

        // TODO(product-owner): confirm whether teaching_related R&R criteria
        // should be distinct or reuse NON_TEACHING_CRITERIA.
        const posType = target_position_type === 'all' ? ['teaching', 'non_teaching', 'teaching_related'] : [target_position_type];
        for (const pt of posType) {
            const seedCriteria = pt === 'teaching' ? TEACHING_CRITERIA : NON_TEACHING_CRITERIA;
            for (const c of seedCriteria) {
                await db.query(`
                    INSERT INTO rr_evaluation_criteria (search_id, position_type, criterion_label, weight_percent, max_score, sort_order)
                    VALUES (?, ?, ?, ?, 100, ?)
                `, [searchId, pt, c.label, c.weight, c.sort]);
            }
        }

        if (criteria && Array.isArray(criteria)) {
            for (const c of criteria) {
                await db.query(`
                    INSERT INTO rr_evaluation_criteria (search_id, position_type, criterion_label, weight_percent, max_score, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [searchId, c.position_type, c.criterion_label, c.weight_percent, c.max_score || 100, c.sort_order || 0]);
            }
        }

        const io = req.app.get('socketio');
        if (io) io.emit('rr:dashboard:update');

        res.status(201).json({ message: 'Search created', id: searchId });
    } catch (err) {
        console.error('❌ CREATE SEARCH ERROR:', err);
        res.status(500).json({ message: 'Failed to create search' });
    }
};

exports.updateSearch = async (req, res) => {
    try {
        const { id } = req.params;
        const fields = [];
        const values = [];

        const allowed = ['title', 'description', 'school_year', 'search_type', 'target_position_type',
            'nomination_start', 'nomination_end', 'evaluation_start', 'evaluation_end', 'ceremony_date'];

        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

        values.push(id);
        await db.query(`UPDATE rr_searches SET ${fields.join(', ')} WHERE id = ?`, values);

        const io = req.app.get('socketio');
        if (io) io.emit('rr:dashboard:update');

        res.json({ message: 'Search updated' });
    } catch (err) {
        console.error('❌ UPDATE SEARCH ERROR:', err);
        res.status(500).json({ message: 'Failed to update search' });
    }
};

exports.advanceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT status FROM rr_searches WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Search not found' });

        const statusFlow = ['draft', 'open', 'evaluation', 'deliberation', 'announced', 'completed'];
        const currentIdx = statusFlow.indexOf(rows[0].status);
        if (currentIdx === -1 || currentIdx >= statusFlow.length - 1) {
            return res.status(400).json({ message: 'Cannot advance further' });
        }

        const nextStatus = statusFlow[currentIdx + 1];
        await db.query('UPDATE rr_searches SET status = ? WHERE id = ?', [nextStatus, id]);

        await db.query(
            'INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (NULL, ?, ?)',
            [req.user.id, `R&R Search #${id} advanced to status: ${nextStatus}`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:dashboard:update');
            io.emit(`rr:search:${id}:status`, { status: nextStatus });
        }

        res.json({ message: `Search advanced to ${nextStatus}`, status: nextStatus });
    } catch (err) {
        console.error('❌ ADVANCE STATUS ERROR:', err);
        res.status(500).json({ message: 'Failed to advance status' });
    }
};

exports.deleteSearch = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT status FROM rr_searches WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Search not found' });
        if (rows[0].status !== 'draft') return res.status(400).json({ message: 'Only draft searches can be deleted' });

        await db.query('DELETE FROM rr_searches WHERE id = ?', [id]);

        const io = req.app.get('socketio');
        if (io) io.emit('rr:dashboard:update');

        res.json({ message: 'Search deleted' });
    } catch (err) {
        console.error('❌ DELETE SEARCH ERROR:', err);
        res.status(500).json({ message: 'Failed to delete search' });
    }
};
