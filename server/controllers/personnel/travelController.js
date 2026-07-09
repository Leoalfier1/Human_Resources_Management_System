const db = require('../../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/personnel/travel');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'TRAVEL-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).single('file');

exports.getMyTravelRequests = async (req, res) => {
    try {
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });
        const [rows] = await db.query('SELECT * FROM travel_authority_requests WHERE employee_id = ? ORDER BY created_at DESC', [emp[0].id]);
        res.json(rows);
    } catch (error) {
        console.error('getMyTravelRequests Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.submitTravelRequest = (req, res) => {
    upload(req, res, async function (err) {
        if (err) return res.status(400).json({ message: err.message });
        try {
            const { purpose, destination, date_from, date_to, transport_mode, estimated_expense } = req.body;
            if (!purpose || !destination || !date_from || !date_to) {
                return res.status(400).json({ message: 'purpose, destination, date_from, and date_to are required.' });
            }
            const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
            if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });

            const file_path = req.file ? '/uploads/personnel/travel/' + req.file.filename : null;

            const [result] = await db.query(
                'INSERT INTO travel_authority_requests (employee_id, purpose, destination, date_from, date_to, transport_mode, estimated_expense, supporting_file_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [emp[0].id, purpose, destination, date_from, date_to, transport_mode || null, estimated_expense || null, file_path, 'pending']
            );

            await db.query(
                'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
                [emp[0].id, 'travel', result.insertId, 'Travel authority request submitted.']
            );

            const io = req.app.get('socketio');
            if (io) io.emit('personnel:update');

            res.status(201).json({ message: 'Travel request submitted.', id: result.insertId });
        } catch (error) {
            console.error('submitTravelRequest Error:', error);
            res.status(500).json({ message: error.message });
        }
    });
};

exports.cancelTravelRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });

        const [travel] = await db.query('SELECT id FROM travel_authority_requests WHERE id = ? AND employee_id = ? AND status = ?', [id, emp[0].id, 'pending']);
        if (travel.length === 0) return res.status(403).json({ message: 'Only pending travel requests can be cancelled.' });

        await db.query('UPDATE travel_authority_requests SET status = ? WHERE id = ?', ['cancelled', id]);
        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Travel request cancelled.' });
    } catch (error) {
        console.error('cancelTravelRequest Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllTravelRequests = async (req, res) => {
    try {
        const { status, employee_id, date_from, date_to, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let where = ['1=1'];
        let params = [];

        if (status) { where.push('tr.status = ?'); params.push(status); }
        if (employee_id) { where.push('tr.employee_id = ?'); params.push(employee_id); }
        if (date_from) { where.push('tr.date_from >= ?'); params.push(date_from); }
        if (date_to) { where.push('tr.date_to <= ?'); params.push(date_to); }

        const whereClause = where.join(' AND ');

        const [count] = await db.query(`SELECT COUNT(*) as total FROM travel_authority_requests tr WHERE ${whereClause}`, params);
        const [rows] = await db.query(
            `SELECT tr.*, e.first_name, e.last_name, e.employee_no, e.position_title, e.assigned_school
             FROM travel_authority_requests tr
             JOIN employees e ON e.id = tr.employee_id
             WHERE ${whereClause}
             ORDER BY tr.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({ requests: rows, total: count[0].total, page: parseInt(page), totalPages: Math.ceil(count[0].total / parseInt(limit)) });
    } catch (error) {
        console.error('getAllTravelRequests Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.approveTravel = async (req, res) => {
    try {
        const { id } = req.params;
        const [travel] = await db.query('SELECT * FROM travel_authority_requests WHERE id = ? AND status = ?', [id, 'pending']);
        if (travel.length === 0) return res.status(400).json({ message: 'Travel request not found or already processed.' });

        // Generate travel order PDF
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 72, size: 'LETTER' });

        const dir = path.join(__dirname, '../../uploads/personnel/travel-orders');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const pdfPath = path.join(dir, `TRAVEL_ORDER_${id}_${Date.now()}.pdf`);

        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        doc.fontSize(10).text('Republic of the Philippines', { align: 'center' });
        doc.text('Department of Education', { align: 'center' });
        doc.text('Region IX – Zamboanga Peninsula', { align: 'center' });
        doc.font('Helvetica-Bold').text('Schools Division Office of Dapitan City', { align: 'center' });
        doc.moveDown();
        doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).stroke();
        doc.moveDown();

        const t = travel[0];
        doc.fontSize(14).font('Helvetica-Bold').text('TRAVEL ORDER', { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).font('Helvetica');
        doc.text(`Pursuant to the request of ${t.employee_id}, you are hereby authorized to travel as follows:`, { align: 'justify' });
        doc.moveDown();
        doc.font('Helvetica-Bold').text(`Purpose: `, { continued: true }).font('Helvetica').text(t.purpose);
        doc.font('Helvetica-Bold').text(`Destination: `, { continued: true }).font('Helvetica').text(t.destination);
        doc.font('Helvetica-Bold').text(`Date: `, { continued: true }).font('Helvetica').text(`${t.date_from} to ${t.date_to}`);
        if (t.transport_mode) {
            doc.font('Helvetica-Bold').text('Transport: ', { continued: true }).font('Helvetica').text(t.transport_mode);
        }
        doc.moveDown(2);
        doc.font('Helvetica').text('Signed:', { align: 'right' });
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Schools Division Superintendent', { align: 'right' });
        doc.end();

        await new Promise(resolve => writeStream.on('finish', resolve));

        const travel_order_path = '/uploads/personnel/travel-orders/' + path.basename(pdfPath);

        await db.query(
            'UPDATE travel_authority_requests SET status = ?, approved_by = ?, approved_at = NOW(), travel_order_path = ? WHERE id = ?',
            ['approved', req.user.id, travel_order_path, id]
        );

        await db.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [t.employee_id, 'travel', id, 'Your travel authority request has been approved.']
        );

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, t.employee_id, 'travel_approved', `Travel #${id} approved`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Travel request approved.', travel_order_path });
    } catch (error) {
        console.error('approveTravel Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.rejectTravel = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const [travel] = await db.query('SELECT * FROM travel_authority_requests WHERE id = ? AND status = ?', [id, 'pending']);
        if (travel.length === 0) return res.status(400).json({ message: 'Travel request not found or already processed.' });

        await db.query(
            'UPDATE travel_authority_requests SET status = ?, rejection_reason = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
            ['rejected', rejection_reason || null, req.user.id, id]
        );

        await db.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [travel[0].employee_id, 'travel', id, `Your travel request has been rejected.${rejection_reason ? ' Reason: ' + rejection_reason : ''}`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Travel request rejected.' });
    } catch (error) {
        console.error('rejectTravel Error:', error);
        res.status(500).json({ message: error.message });
    }
};
