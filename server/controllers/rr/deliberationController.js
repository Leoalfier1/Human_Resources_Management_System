const db = require('../../db');

exports.getRankedList = async (req, res) => {
    try {
        const { search_id } = req.query;
        if (!search_id) return res.status(400).json({ message: 'search_id is required' });

        const [rows] = await db.query(`
            SELECT n.id as nomination_id, n.nominee_id, n.position_type,
                u.full_name as nominee_name, u.email as nominee_email,
                ac.category_name, ac.max_awardees,
                ROUND((SELECT SUM((es.score_given / ec.max_score) * ec.weight_percent)
                    FROM rr_evaluation_scores es
                    JOIN rr_evaluation_criteria ec ON es.criterion_id = ec.id
                    WHERE es.nomination_id = n.id), 2) as total_score,
                dn.notes as deliberation_notes,
                dn.is_selected,
                dn.selected_at
            FROM rr_nominations n
            JOIN users u ON n.nominee_id = u.id
            JOIN rr_award_categories ac ON n.category_id = ac.id
            LEFT JOIN rr_deliberation_notes dn ON dn.nomination_id = n.id
            WHERE n.search_id = ? AND n.eligibility_status = 'eligible'
            ORDER BY ac.category_name, total_score DESC
        `, [search_id]);

        res.json(rows);
    } catch (err) {
        console.error('❌ GET RANKED LIST ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch ranked list' });
    }
};

exports.saveNotes = async (req, res) => {
    try {
        const { nomination_id, notes } = req.body;
        if (!nomination_id) return res.status(400).json({ message: 'nomination_id is required' });

        await db.query(`
            INSERT INTO rr_deliberation_notes (nomination_id, notes)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE notes = VALUES(notes)
        `, [nomination_id, notes]);

        res.json({ message: 'Notes saved' });
    } catch (err) {
        console.error('❌ SAVE NOTES ERROR:', err);
        res.status(500).json({ message: 'Failed to save notes' });
    }
};

exports.selectAwardee = async (req, res) => {
    try {
        const { nomination_id } = req.body;
        if (!nomination_id) return res.status(400).json({ message: 'nomination_id is required' });

        const [nomRows] = await db.query(`
            SELECT n.*, ac.category_name, ac.category_level, ac.max_awardees, s.title as search_title
            FROM rr_nominations n
            JOIN rr_award_categories ac ON n.category_id = ac.id
            JOIN rr_searches s ON n.search_id = s.id
            WHERE n.id = ?
        `, [nomination_id]);

        if (nomRows.length === 0) return res.status(404).json({ message: 'Nomination not found' });
        const nom = nomRows[0];

        const [existingAwardees] = await db.query(`
            SELECT COUNT(*) as count FROM rr_awards WHERE search_id = ? AND category_id = ?
        `, [nom.search_id, nom.category_id]);

        if (existingAwardees[0].count >= nom.max_awardees) {
            return res.status(400).json({ message: `Maximum ${nom.max_awardees} awardee(s) already selected for this category` });
        }

        await db.query(`
            INSERT INTO rr_deliberation_notes (nomination_id, is_selected, selected_by, selected_at)
            VALUES (?, 1, ?, NOW())
            ON DUPLICATE KEY UPDATE is_selected = 1, selected_by = VALUES(selected_by), selected_at = NOW()
        `, [nomination_id, req.user.id]);

        await db.query(`
            INSERT INTO rr_awards (nomination_id, search_id, user_id, category_id, award_title, award_level, position_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE award_title = VALUES(award_title)
        `, [nomination_id, nom.search_id, nom.nominee_id, nom.category_id, nom.category_name, nom.category_level, nom.position_type]);

        const io = req.app.get('socketio');
        if (io) io.emit('rr:dashboard:update');

        res.json({ message: 'Awardee selected' });
    } catch (err) {
        console.error('❌ SELECT AWARDEE ERROR:', err);
        res.status(500).json({ message: 'Failed to select awardee' });
    }
};

exports.deselectAwardee = async (req, res) => {
    try {
        const { nomination_id } = req.body;
        if (!nomination_id) return res.status(400).json({ message: 'nomination_id is required' });

        await db.query(`
            INSERT INTO rr_deliberation_notes (nomination_id, is_selected, selected_by, selected_at)
            VALUES (?, 0, NULL, NULL)
            ON DUPLICATE KEY UPDATE is_selected = 0, selected_by = NULL, selected_at = NULL
        `, [nomination_id]);

        await db.query('DELETE FROM rr_awards WHERE nomination_id = ?', [nomination_id]);

        const io = req.app.get('socketio');
        if (io) io.emit('rr:dashboard:update');

        res.json({ message: 'Awardee deselected' });
    } catch (err) {
        console.error('❌ DESELECT AWARDEE ERROR:', err);
        res.status(500).json({ message: 'Failed to deselect awardee' });
    }
};

exports.lockResults = async (req, res) => {
    try {
        const { search_id } = req.body;
        if (!search_id) return res.status(400).json({ message: 'search_id is required' });

        const [categories] = await db.query(
            'SELECT id, category_name FROM rr_award_categories WHERE search_id = ?', [search_id]
        );

        for (const cat of categories) {
            const [awards] = await db.query(
                'SELECT COUNT(*) as count FROM rr_awards WHERE search_id = ? AND category_id = ?',
                [search_id, cat.id]
            );
            if (awards[0].count === 0) {
                return res.status(400).json({ message: `No awardee selected for category: ${cat.category_name}` });
            }
        }

        await db.query('UPDATE rr_searches SET status = ? WHERE id = ?', ['deliberation', search_id]);

        await db.query(
            'INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (NULL, ?, ?)',
            [req.user.id, `R&R Search #${search_id} deliberation locked`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:dashboard:update');
            io.emit(`rr:search:${search_id}:status`, { status: 'deliberation' });
        }

        res.json({ message: 'Results locked for deliberation' });
    } catch (err) {
        console.error('❌ LOCK RESULTS ERROR:', err);
        res.status(500).json({ message: 'Failed to lock results' });
    }
};
