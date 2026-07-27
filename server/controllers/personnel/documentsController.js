const db = require('../../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/personnel/201');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'DOC-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }
}).single('file');

exports.getMyDocuments = async (req, res) => {
    try {
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });
        const [rows] = await db.query(
            'SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY created_at DESC',
            [emp[0].id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getMyDocuments Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.uploadMyDocument = (req, res) => {
    upload(req, res, async function (err) {
        if (err) return res.status(400).json({ message: err.message });
        if (!req.file) return res.status(400).json({ message: 'No file selected.' });
        try {
            const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
            if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });

            const file_path = '/uploads/personnel/201/' + req.file.filename;
            await db.query(
                'INSERT INTO employee_documents (employee_id, document_type, file_name, file_path, file_size_kb, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
                [emp[0].id, req.body.document_type || 'General', req.file.originalname, file_path, Math.round(req.file.size / 1024), req.user.id]
            );

            const io = req.app.get('socketio');
            if (io) io.emit('personnel:update');

            res.json({ message: 'Document uploaded successfully.', file_name: req.file.originalname });
        } catch (error) {
            console.error('uploadMyDocument Error:', error);
            res.status(500).json({ message: error.message });
        }
    });
};

exports.getAllEmployeeDocuments = async (req, res) => {
    try {
        const { employee_id } = req.query;
        let query = 'SELECT ed.*, u.full_name as uploaded_by_name FROM employee_documents ed LEFT JOIN users u ON u.id = ed.uploaded_by';
        let params = [];
        if (employee_id) {
            query += ' WHERE ed.employee_id = ?';
            params.push(employee_id);
        }
        query += ' ORDER BY ed.created_at DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('getAllEmployeeDocuments Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.verifyDocument = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(
            'UPDATE employee_documents SET is_verified = 1, verified_by = ?, verified_at = NOW() WHERE id = ?',
            [req.user.id, id]
        );
        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Document verified.' });
    } catch (error) {
        console.error('verifyDocument Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.uploadHRDocument = (req, res) => {
    upload(req, res, async function (err) {
        if (err) return res.status(400).json({ message: err.message });
        if (!req.file) return res.status(400).json({ message: 'No file selected.' });
        try {
            const { employee_id, document_type } = req.body;
            if (!employee_id) return res.status(400).json({ message: 'employee_id is required.' });

            const file_path = '/uploads/personnel/201/' + req.file.filename;
            await db.query(
                'INSERT INTO employee_documents (employee_id, document_type, file_name, file_path, file_size_kb, uploaded_by, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [employee_id, document_type || 'General', req.file.originalname, file_path, Math.round(req.file.size / 1024), req.user.id]
            );

            const io = req.app.get('socketio');
            if (io) io.emit('personnel:update');

            res.json({ message: 'Document uploaded successfully.' });
        } catch (error) {
            console.error('uploadHRDocument Error:', error);
            res.status(500).json({ message: error.message });
        }
    });
};
