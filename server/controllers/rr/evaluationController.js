const db = require('../../db');

exports.getEvaluationWorkspace = async (req, res) => {
    try {
        const { search_id } = req.query;
        if (!search_id) return res.status(400).json({ message: 'search_id is required' });

        const [nominees] = await db.query(`
            SELECT n.id as nomination_id, n.nominee_id, n.position_type, n.justification,
                u.full_name as nominee_name, u.email as nominee_email,
                ac.category_name,
                COALESCE(ROUND((SELECT SUM((es.score_given / ec.max_score) * ec.weight_percent)
                    FROM rr_evaluation_scores es
                    JOIN rr_evaluation_criteria ec ON es.criterion_id = ec.id
                    WHERE es.nomination_id = n.id), 2), 0) as total_score
            FROM rr_nominations n
            JOIN users u ON n.nominee_id = u.id
            JOIN rr_award_categories ac ON n.category_id = ac.id
            WHERE n.search_id = ? AND n.eligibility_status = 'eligible'
            ORDER BY total_score DESC
        `, [search_id]);

        res.json(nominees);
    } catch (err) {
        console.error('❌ GET EVAL WORKSPACE ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch evaluation workspace' });
    }
};

exports.getCriteria = async (req, res) => {
    try {
        const { search_id, position_type } = req.query;
        if (!search_id) return res.status(400).json({ message: 'search_id is required' });

        let sql = 'SELECT * FROM rr_evaluation_criteria WHERE search_id = ?';
        const params = [search_id];
        if (position_type) { sql += ' AND position_type = ?'; params.push(position_type); }
        sql += ' ORDER BY sort_order ASC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('❌ GET CRITERIA ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch criteria' });
    }
};

exports.submitScore = async (req, res) => {
    try {
        const { nomination_id, criterion_id, score_given } = req.body;
        if (!nomination_id || !criterion_id || score_given === undefined) {
            return res.status(400).json({ message: 'nomination_id, criterion_id, and score_given are required' });
        }

        await db.query(`
            INSERT INTO rr_evaluation_scores (nomination_id, criterion_id, score_given, scored_by)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE score_given = VALUES(score_given), scored_by = VALUES(scored_by)
        `, [nomination_id, criterion_id, score_given, req.user.id]);

        const [nomRows] = await db.query('SELECT search_id FROM rr_nominations WHERE id = ?', [nomination_id]);
        const searchId = nomRows[0]?.search_id;

        const io = req.app.get('socketio');
        if (io && searchId) io.emit(`rr:ca:scoreUpdate:${searchId}`);

        res.json({ message: 'Score saved' });
    } catch (err) {
        console.error('❌ SUBMIT SCORE ERROR:', err);
        res.status(500).json({ message: 'Failed to save score' });
    }
};

exports.getScores = async (req, res) => {
    try {
        const { nomination_id } = req.query;
        if (!nomination_id) return res.status(400).json({ message: 'nomination_id is required' });

        const [rows] = await db.query(`
            SELECT es.*, ec.criterion_label, ec.weight_percent, ec.max_score
            FROM rr_evaluation_scores es
            JOIN rr_evaluation_criteria ec ON es.criterion_id = ec.id
            WHERE es.nomination_id = ?
        `, [nomination_id]);

        const scoresMap = {};
        rows.forEach(r => { scoresMap[r.criterion_id] = r.score_given; });
        res.json(scoresMap);
    } catch (err) {
        console.error('❌ GET SCORES ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch scores' });
    }
};

exports.bulkSubmitScores = async (req, res) => {
    try {
        const { nomination_id, scores } = req.body;
        if (!nomination_id || !scores) return res.status(400).json({ message: 'nomination_id and scores are required' });

        for (const item of scores) {
            await db.query(`
                INSERT INTO rr_evaluation_scores (nomination_id, criterion_id, score_given, scored_by)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE score_given = VALUES(score_given), scored_by = VALUES(scored_by)
            `, [nomination_id, item.criterion_id, item.score_given, req.user.id]);
        }

        const [nomRows] = await db.query('SELECT search_id FROM rr_nominations WHERE id = ?', [nomination_id]);
        const searchId = nomRows[0]?.search_id;

        const io = req.app.get('socketio');
        if (io && searchId) io.emit(`rr:ca:scoreUpdate:${searchId}`);

        res.json({ message: `${scores.length} scores saved` });
    } catch (err) {
        console.error('❌ BULK SCORES ERROR:', err);
        res.status(500).json({ message: 'Failed to save scores' });
    }
};

exports.getScoresSummary = async (req, res) => {
    try {
        const { search_id } = req.query;
        if (!search_id) return res.status(400).json({ message: 'search_id is required' });

        const [rows] = await db.query(`
            SELECT n.id as nomination_id, n.nominee_id, n.position_type,
                u.full_name as nominee_name,
                ac.category_name,
                ROUND((SELECT SUM((es.score_given / ec.max_score) * ec.weight_percent)
                    FROM rr_evaluation_scores es
                    JOIN rr_evaluation_criteria ec ON es.criterion_id = ec.id
                    WHERE es.nomination_id = n.id), 2) as total_score
            FROM rr_nominations n
            JOIN users u ON n.nominee_id = u.id
            JOIN rr_award_categories ac ON n.category_id = ac.id
            WHERE n.search_id = ? AND n.eligibility_status = 'eligible'
            ORDER BY total_score DESC
        `, [search_id]);

        const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));
        res.json(ranked);
    } catch (err) {
        console.error('❌ SCORES SUMMARY ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch scores summary' });
    }
};
