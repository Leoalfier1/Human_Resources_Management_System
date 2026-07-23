const db = require('../../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/signatories');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'SIG-' + uniqueSuffix + path.extname(file.originalname));
    }
});

exports.upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
        cb(null, allowed.includes(file.mimetype));
    }
}).single('signature');

exports.getAll = async (req, res) => {
    try {
        const { active_only } = req.query;
        let sql = 'SELECT * FROM signatories';
        if (active_only === '1') sql += ' WHERE is_active = 1';
        sql += ' ORDER BY is_active DESC, full_name ASC';
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('signatoryController.getAll Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM signatories WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Signatory not found.' });
        res.json(rows[0]);
    } catch (error) {
        console.error('signatoryController.getById Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { full_name, position, designation, is_active } = req.body;
        if (!full_name || !position) return res.status(400).json({ message: 'full_name and position are required.' });

        const signaturePath = req.file ? '/uploads/signatories/' + req.file.filename : null;

        const [result] = await db.query(
            'INSERT INTO signatories (full_name, position, designation, signature_path, is_active) VALUES (?, ?, ?, ?, ?)',
            [full_name, position, designation || null, signaturePath, is_active !== undefined ? is_active : 1]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:signatory:update');
        }
        res.status(201).json({ message: 'Signatory created.', id: result.insertId });
    } catch (error) {
        console.error('signatoryController.create Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.query('SELECT * FROM signatories WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Signatory not found.' });

        const { full_name, position, designation, is_active } = req.body;
        const signaturePath = req.file ? '/uploads/signatories/' + req.file.filename : existing[0].signature_path;

        // If uploading a new signature, remove the old file
        if (req.file && existing[0].signature_path) {
            const oldFile = path.join(__dirname, '../..', existing[0].signature_path);
            if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        }

        await db.query(
            'UPDATE signatories SET full_name = ?, position = ?, designation = ?, signature_path = ?, is_active = ? WHERE id = ?',
            [
                full_name || existing[0].full_name,
                position || existing[0].position,
                designation !== undefined ? designation : existing[0].designation,
                signaturePath,
                is_active !== undefined ? is_active : existing[0].is_active,
                id
            ]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:signatory:update');
        }
        res.json({ message: 'Signatory updated.' });
    } catch (error) {
        console.error('signatoryController.update Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [existing] = await db.query('SELECT * FROM signatories WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Signatory not found.' });

        // Delete the signature file from disk
        if (existing[0].signature_path) {
            const filePath = path.join(__dirname, '../..', existing[0].signature_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await db.query('DELETE FROM signatories WHERE id = ?', [req.params.id]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:signatory:update');
        }
        res.json({ message: 'Signatory deleted.' });
    } catch (error) {
        console.error('signatoryController.remove Error:', error);
        res.status(500).json({ message: error.message });
    }
};
