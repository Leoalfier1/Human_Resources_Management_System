const db = require('../../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { findOrCreateEmployee } = require('../../utils/employeeHelper');

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
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF and image files are allowed'), false);
    }
}).single('file');

const CHECKLIST_ALIASES = {
    'Transcript of Records / S.O.': ['Transcript of Records'],
    'Marriage Contract': ['Marriage Contract', 'Marriage Certificate'],
    'CSC Form 211': ['CSC Form 211'],
    'SALN': ['SALN'],
    'NBI Clearance': ['NBI Clearance'],
    'Police Clearance': ['Police Clearance'],
    'BIR Form 1902/2305': ['BIR Form 1902/2305'],
    'DBP ATM Application': ['DBP ATM Application'],
    'PhilHealth No. (PEN)': ['PhilHealth No. (PEN)'],
    'Pag-IBIG MID No.': ['Pag-IBIG MID No.'],
};

exports.getMyDocuments = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
        const [rows] = await db.query(
            'SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY created_at DESC',
            [empRow.id]
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
            const empRow = await findOrCreateEmployee(req.user.id);
            if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });

            const file_path = '/uploads/personnel/201/' + req.file.filename;
            await db.query(
                'INSERT INTO employee_documents (employee_id, document_type, file_name, file_path, file_size_kb, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
                [empRow.id, req.body.document_type || 'General', req.file.originalname, file_path, Math.round(req.file.size / 1024), req.user.id]
            );

            const io = req.app.get('socketio');
            if (io) {
                io.emit('personnel:update');
                io.emit('personnel:document:update');
            }

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
            'UPDATE employee_documents SET is_verified = 1, status = \'approved\', verified_by = ?, verified_at = NOW() WHERE id = ?',
            [req.user.id, id]
        );
        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:document:update');
        }
        res.json({ message: 'Document verified.' });
    } catch (error) {
        console.error('verifyDocument Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.rejectDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        await db.query(
            'UPDATE employee_documents SET is_verified = 0, status = \'rejected\', remarks = ?, verified_by = ?, verified_at = NOW() WHERE id = ?',
            [rejection_reason || null, req.user.id, id]
        );
        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:document:update');
        }
        res.json({ message: 'Document rejected.' });
    } catch (error) {
        console.error('rejectDocument Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.get201Summary = async (req, res) => {
    try {
        const [employees] = await db.query(
            'SELECT id, employee_no, CONCAT(first_name, \' \', last_name) AS employee_name FROM employees ORDER BY last_name, first_name'
        );

        const aliasValues = Object.values(CHECKLIST_ALIASES).flat();
        const placeholders = aliasValues.map(() => '?').join(',');
        const [docs] = await db.query(
            `SELECT employee_id, document_type, status, is_verified
             FROM employee_documents
             WHERE document_type IN (${placeholders})`,
            aliasValues
        );

        const summary = employees.map(emp => {
            const empDocs = docs.filter(d => d.employee_id === emp.id);
            let completedCount = 0;

            for (const [, aliases] of Object.entries(CHECKLIST_ALIASES)) {
                const matched = empDocs.filter(doc =>
                    aliases.some(a => a.toLowerCase() === (doc.document_type || '').toLowerCase())
                );
                if (matched.length > 0) {
                    const isApproved = matched.some(d => d.status === 'approved' || d.is_verified);
                    if (isApproved) completedCount++;
                }
            }

            return {
                employee_id: emp.id,
                employee_no: emp.employee_no,
                employee_name: emp.employee_name,
                completed_count: completedCount,
            };
        });

        summary.sort((a, b) => b.completed_count - a.completed_count);

        res.json(summary);
    } catch (error) {
        console.error('get201Summary Error:', error);
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
                'INSERT INTO employee_documents (employee_id, document_type, file_name, file_path, file_size_kb, uploaded_by, is_verified, status) VALUES (?, ?, ?, ?, ?, ?, 1, \'approved\')',
                [employee_id, document_type || 'General', req.file.originalname, file_path, Math.round(req.file.size / 1024), req.user.id]
            );

            const io = req.app.get('socketio');
            if (io) {
                io.emit('personnel:update');
                io.emit('personnel:document:update');
            }

            res.json({ message: 'Document uploaded successfully.' });
        } catch (error) {
            console.error('uploadHRDocument Error:', error);
            res.status(500).json({ message: error.message });
        }
    });
};
