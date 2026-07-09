const db = require('../../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const NOMINATION_DIR = './uploads/rr/nominations/';
if (!fs.existsSync(NOMINATION_DIR)) fs.mkdirSync(NOMINATION_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, NOMINATION_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'NOM-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF and image files are allowed'), false);
    }
}).array('documents', 10);

exports.getNominations = async (req, res) => {
    try {
        const { search_id, category_id, eligibility_status, position_type } = req.query;
        let sql = `
            SELECT n.*, 
                u.full_name as nominee_name, u.email as nominee_email,
                nu.full_name as nominator_name,
                ac.category_name,
                s.title as search_title
            FROM rr_nominations n
            JOIN users u ON n.nominee_id = u.id
            LEFT JOIN users nu ON n.nominator_id = nu.id
            JOIN rr_award_categories ac ON n.category_id = ac.id
            JOIN rr_searches s ON n.search_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (search_id) { sql += ' AND n.search_id = ?'; params.push(search_id); }
        if (category_id) { sql += ' AND n.category_id = ?'; params.push(category_id); }
        if (eligibility_status) { sql += ' AND n.eligibility_status = ?'; params.push(eligibility_status); }
        if (position_type) { sql += ' AND n.position_type = ?'; params.push(position_type); }

        sql += ' ORDER BY n.created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('❌ GET NOMINATIONS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch nominations' });
    }
};

exports.getNominationById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT n.*, u.full_name as nominee_name, u.email as nominee_email,
                nu.full_name as nominator_name, ac.category_name, s.title as search_title
            FROM rr_nominations n
            JOIN users u ON n.nominee_id = u.id
            LEFT JOIN users nu ON n.nominator_id = nu.id
            JOIN rr_award_categories ac ON n.category_id = ac.id
            JOIN rr_searches s ON n.search_id = s.id
            WHERE n.id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Nomination not found' });

        const [documents] = await db.query('SELECT * FROM rr_nomination_documents WHERE nomination_id = ?', [id]);
        const [scores] = await db.query(`
            SELECT es.*, ec.criterion_label, ec.weight_percent, ec.max_score
            FROM rr_evaluation_scores es
            JOIN rr_evaluation_criteria ec ON es.criterion_id = ec.id
            WHERE es.nomination_id = ?
        `, [id]);

        res.json({ ...rows[0], documents, scores });
    } catch (err) {
        console.error('❌ GET NOMINATION ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch nomination' });
    }
};

exports.createNomination = async (req, res) => {
    try {
        const { search_id, category_id, nominee_id, position_type, justification, is_self_nomination } = req.body;
        const nominator_id = is_self_nomination ? nominee_id : req.user.id;

        const [searchRows] = await db.query('SELECT * FROM rr_searches WHERE id = ?', [search_id]);
        if (searchRows.length === 0) return res.status(404).json({ message: 'Search not found' });

        const search = searchRows[0];
        if (search.status !== 'open') return res.status(400).json({ message: 'Nomination period is not open' });

        const now = new Date();
        if (search.nomination_end && new Date(search.nomination_end) < now) {
            return res.status(400).json({ message: 'Nomination deadline has passed' });
        }

        const [existing] = await db.query(
            'SELECT id FROM rr_nominations WHERE nominee_id = ? AND category_id = ?',
            [nominee_id, category_id]
        );
        if (existing.length > 0) return res.status(400).json({ message: 'Nominee already nominated for this category' });

        const [result] = await db.query(`
            INSERT INTO rr_nominations (search_id, category_id, nominee_id, nominator_id, position_type, justification, is_self_nomination)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [search_id, category_id, nominee_id, nominator_id, position_type, justification, is_self_nomination ? 1 : 0]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:dashboard:update');
            io.emit('rr:nomination:new', { search_id, nomination_id: result.insertId });
        }

        res.status(201).json({ message: 'Nomination submitted', id: result.insertId });
    } catch (err) {
        console.error('❌ CREATE NOMINATION ERROR:', err);
        res.status(500).json({ message: 'Failed to create nomination' });
    }
};

exports.uploadNominationDocument = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });
        try {
            const { id } = req.params;
            const files = req.files || [];
            if (files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

            for (const file of files) {
                const docType = req.body.document_type || file.fieldname || 'supporting_document';
                await db.query(`
                    INSERT INTO rr_nomination_documents (nomination_id, document_type, file_path, file_name, uploaded_by)
                    VALUES (?, ?, ?, ?, ?)
                `, [id, docType, file.path.replace(/\\/g, '/'), file.originalname, req.user.id]);
            }

            res.json({ message: `${files.length} document(s) uploaded` });
        } catch (err) {
            console.error('❌ UPLOAD NOMINATION DOC ERROR:', err);
            res.status(500).json({ message: 'Failed to upload documents' });
        }
    });
};

exports.updateEligibility = async (req, res) => {
    try {
        const { id } = req.params;
        const { eligibility_status, ineligibility_reason } = req.body;

        if (!['eligible', 'ineligible'].includes(eligibility_status)) {
            return res.status(400).json({ message: 'Invalid eligibility status' });
        }

        await db.query(`
            UPDATE rr_nominations SET eligibility_status = ?, ineligibility_reason = ? WHERE id = ?
        `, [eligibility_status, eligibility_status === 'ineligible' ? ineligibility_reason : null, id]);

        const [nomRows] = await db.query(
            'SELECT nominee_id, search_id FROM rr_nominations WHERE id = ?', [id]
        );

        const io = req.app.get('socketio');
        if (io && nomRows.length > 0) {
            io.emit('rr:dashboard:update');
            io.to(`rr-user-${nomRows[0].nominee_id}`).emit('rr:eligibility:update', {
                nomination_id: parseInt(id),
                eligibility_status
            });
        }

        res.json({ message: `Nomination marked as ${eligibility_status}` });
    } catch (err) {
        console.error('❌ UPDATE ELIGIBILITY ERROR:', err);
        res.status(500).json({ message: 'Failed to update eligibility' });
    }
};

exports.getMyNominations = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT n.*, ac.category_name, s.title as search_title, s.status as search_status,
                (SELECT COUNT(*) FROM rr_awards WHERE nomination_id = n.id) as is_awarded
            FROM rr_nominations n
            JOIN rr_award_categories ac ON n.category_id = ac.id
            JOIN rr_searches s ON n.search_id = s.id
            WHERE n.nominee_id = ?
            ORDER BY n.created_at DESC
        `, [userId]);
        res.json(rows);
    } catch (err) {
        console.error('❌ GET MY NOMINATIONS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch my nominations' });
    }
};

exports.canNominate = async (req, res) => {
    try {
        const { search_id } = req.body;
        if (!search_id) return res.status(400).json({ message: 'search_id required' });

        const [searchRows] = await db.query('SELECT * FROM rr_searches WHERE id = ?', [search_id]);
        if (searchRows.length === 0) return res.json({ canNominate: false, reason: 'Search not found' });

        const search = searchRows[0];
        if (search.status !== 'open') return res.json({ canNominate: false, reason: 'Nomination period is not open' });

        const now = new Date();
        if (search.nomination_end && new Date(search.nomination_end) < now) {
            return res.json({ canNominate: false, reason: 'Nomination deadline has passed' });
        }

        if (search.target_position_type !== 'all') {
            const [userRows] = await db.query('SELECT applicant_type FROM users WHERE id = ?', [req.user.id]);
            const userType = userRows[0]?.applicant_type || '';
            const matches = (search.target_position_type === 'teaching' && userType === 'teaching') ||
                (search.target_position_type === 'non_teaching' && userType === 'non_teaching') ||
                (search.target_position_type === 'teaching_related' && userType === 'teaching_related');
            if (!matches) return res.json({ canNominate: false, reason: 'Position type does not match' });
        }

        res.json({ canNominate: true });
    } catch (err) {
        console.error('❌ CAN NOMINATE ERROR:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
