const db = require('../../db');
const path = require('path');
const fs = require('fs');
const { findOrCreateEmployee } = require('../../utils/employeeHelper');

exports.getMyRequests = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
        const [rows] = await db.query('SELECT * FROM document_requests WHERE employee_id = ? ORDER BY created_at DESC', [empRow.id]);
        res.json(rows);
    } catch (error) {
        console.error('getMyRequests Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.submitRequest = async (req, res) => {
    try {
        const {
            request_category, request_subtype, contact_no, purpose, details,
            position_applied, date_applied, esignature_consented
        } = req.body;

        if (!request_category) return res.status(400).json({ message: 'request_category is required.' });
        if (!purpose || !purpose.trim()) return res.status(400).json({ message: 'Purpose is required.' });
        if (!esignature_consented) return res.status(400).json({ message: 'E-signature consent is required.' });

        if (request_category === 'retrieval_of_folders') {
            if (!position_applied || !date_applied) {
                return res.status(400).json({ message: 'Position Applied and Date Applied are required for Retrieval of Application Folders.' });
            }
        }

        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });

        const [result] = await db.query(
            `INSERT INTO document_requests
             (employee_id, request_category, request_subtype, contact_no, purpose, details,
              position_applied, date_applied, esignature_consented, esignature_ip, esignature_timestamp, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
                empRow.id,
                request_category,
                request_subtype || null,
                contact_no || null,
                purpose.trim(),
                details || null,
                position_applied || null,
                date_applied || null,
                esignature_consented ? 1 : 0,
                req.ip || req.connection?.remoteAddress || null,
                'pending'
            ]
        );

        const categoryLabels = {
            service_record: 'Service Record',
            retrieval_of_folders: 'Retrieval of Application Folders',
            certificate_of_employment: 'Certificate of Employment',
            service_credits: 'Service Credits',
            personnel_forms: 'Copy of Personnel Forms/Documents',
            other: 'Other'
        };

        await db.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [empRow.id, 'document', result.insertId, `Document request submitted: ${categoryLabels[request_category] || request_category}`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:certificate:update');
            io.emit('personnel:notification:update');
        }

        res.status(201).json({ message: 'Document request submitted.', id: result.insertId });
    } catch (error) {
        console.error('submitRequest Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const { status, request_category, employee_id, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let where = ['1=1'];
        let params = [];

        if (status) { where.push('dr.status = ?'); params.push(status); }
        if (request_category) { where.push('dr.request_category = ?'); params.push(request_category); }
        if (employee_id) { where.push('dr.employee_id = ?'); params.push(employee_id); }

        const whereClause = where.join(' AND ');

        const [count] = await db.query(`SELECT COUNT(*) as total FROM document_requests dr WHERE ${whereClause}`, params);
        const [rows] = await db.query(
            `SELECT dr.*, e.first_name, e.last_name, e.employee_no, e.position_title
             FROM document_requests dr
             JOIN employees e ON e.id = dr.employee_id
             WHERE ${whereClause}
             ORDER BY dr.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({ requests: rows, total: count[0].total, page: parseInt(page), totalPages: Math.ceil(count[0].total / parseInt(limit)) });
    } catch (error) {
        console.error('getAllRequests Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.processRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE document_requests SET status = ?, processed_by = ?, processed_at = NOW() WHERE id = ?', ['processing', req.user.id, id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:certificate:update');
        }
        res.json({ message: 'Request marked as processing.' });
    } catch (error) {
        console.error('processRequest Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        await db.query(
            'UPDATE document_requests SET status = ?, rejection_reason = ?, processed_by = ?, processed_at = NOW() WHERE id = ?',
            ['rejected', rejection_reason || null, req.user.id, id]
        );

        const [doc] = await db.query('SELECT * FROM document_requests WHERE id = ?', [id]);
        if (doc.length > 0) {
            await db.query(
                'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
                [doc[0].employee_id, 'document', id, `Your document request was rejected.${rejection_reason ? ' Reason: ' + rejection_reason : ''}`]
            );
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:certificate:update');
            io.emit('personnel:notification:update');
        }
        res.json({ message: 'Request rejected.' });
    } catch (error) {
        console.error('rejectRequest Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.releaseDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { released_file_path } = req.body;

        await db.query(
            'UPDATE document_requests SET status = ?, released_file_path = ?, processed_by = ?, processed_at = NOW() WHERE id = ?',
            ['released', released_file_path || null, req.user.id, id]
        );

        const [doc] = await db.query('SELECT * FROM document_requests WHERE id = ?', [id]);
        if (doc.length > 0) {
            const categoryLabels = {
                service_record: 'Service Record',
                retrieval_of_folders: 'Retrieval of Application Folders',
                certificate_of_employment: 'Certificate of Employment',
                service_credits: 'Service Credits',
                personnel_forms: 'Copy of Personnel Forms/Documents',
                other: 'Other'
            };
            await db.query(
                'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
                [doc[0].employee_id, 'document', id, `Your ${categoryLabels[doc[0].request_category] || 'document'} request is ready.`]
            );
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:certificate:update');
            io.emit('personnel:notification:update');
        }
        res.json({ message: 'Document released.' });
    } catch (error) {
        console.error('releaseDocument Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.generateServiceRecord = async (req, res) => {
    try {
        let employee_id;
        if (req.user.role === 'applicant') {
            const empRow = await findOrCreateEmployee(req.user.id);
            if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
            employee_id = empRow.id;
        } else {
            employee_id = req.params.employee_id;
        }

        const [emp] = await db.query(
            `SELECT e.*, pds.work_experience FROM employees e
             LEFT JOIN personal_data_sheets pds ON pds.user_id = e.user_id
             WHERE e.id = ?`,
            [employee_id]
        );
        if (emp.length === 0) return res.status(404).json({ message: 'Employee not found.' });

        const e = emp[0];
        let workExp = [];
        try { workExp = typeof e.work_experience === 'string' ? JSON.parse(e.work_experience) : (e.work_experience || []); } catch { workExp = []; }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 72, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Service_Record_${e.first_name}_${e.last_name}.pdf"`);
        doc.pipe(res);

        // ── DepEd Seal ──
        const sealPath = path.join(__dirname, '../../assets/deped-seal.png');
        if (fs.existsSync(sealPath)) {
            const sealWidth = 50;
            const sealX = (doc.page.width - sealWidth) / 2;
            doc.image(sealPath, sealX, doc.y, { width: sealWidth });
            doc.y += sealWidth + 3;
        }

        doc.fontSize(10).text('Republic of the Philippines', { align: 'center' });
        doc.text('Department of Education', { align: 'center' });
        doc.text('Region IX – Zamboanga Peninsula', { align: 'center' });
        doc.font('Helvetica-Bold').text('Schools Division Office of Dapitan City', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('SERVICE RECORD', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).font('Helvetica-Bold').text(`Name: `, { continued: true }).font('Helvetica').text(`${e.first_name || ''} ${e.middle_name || ''} ${e.last_name || ''} ${e.name_extension || ''}`);
        doc.font('Helvetica-Bold').text('Date of Birth: ', { continued: true }).font('Helvetica').text(e.date_of_birth || '—');
        doc.font('Helvetica-Bold').text('Place of Birth: ', { continued: true }).font('Helvetica').text(e.place_of_birth || '—');
        doc.font('Helvetica-Bold').text('Civil Status: ', { continued: true }).font('Helvetica').text(e.civil_status || '—');
        doc.moveDown();

        const tableTop = doc.y;
        const cols = [
            { label: 'From', x: 72, w: 80 },
            { label: 'To', x: 155, w: 80 },
            { label: 'Position', x: 238, w: 120 },
            { label: 'Department', x: 361, w: 80 },
            { label: 'Salary', x: 444, w: 60 },
            { label: 'SG', x: 507, w: 30 },
        ];

        doc.font('Helvetica-Bold').fontSize(8);
        cols.forEach(c => doc.text(c.label, c.x, tableTop, { width: c.w }));
        doc.moveTo(72, doc.y + 4).lineTo(doc.page.width - 72, doc.y + 4).stroke();
        doc.moveDown();

        doc.font('Helvetica').fontSize(8);
        if (workExp.length === 0) {
            doc.text('No work experience recorded.', 72, doc.y, { width: 500 });
        } else {
            workExp.forEach((w) => {
                const y = doc.y;
                doc.text(w.date_from || '—', 72, y, { width: 80 });
                doc.text(w.date_to || '—', 155, y, { width: 80 });
                doc.text(w.position_title || w.position || '—', 238, y, { width: 120 });
                doc.text(w.department || w.agency || '—', 361, y, { width: 80 });
                doc.text(w.monthly_salary ? String(w.monthly_salary) : '—', 444, y, { width: 60 });
                doc.text(w.salary_grade || w.sg || '—', 507, y, { width: 30 });
                doc.moveDown(0.8);
            });
        }

        doc.moveDown(2);
        doc.font('Helvetica').fontSize(9)
            .text('Certified Correct:', { align: 'left' });
        doc.moveDown(2);
        doc.font('Helvetica-Bold').text('Records Officer', { align: 'left' });

        doc.end();
    } catch (error) {
        console.error('generateServiceRecord Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.generateCOE = async (req, res) => {
    try {
        let employee_id;
        if (req.user.role === 'applicant') {
            const empRow = await findOrCreateEmployee(req.user.id);
            if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
            employee_id = empRow.id;
        } else {
            employee_id = req.params.employee_id;
        }

        const [emp] = await db.query('SELECT * FROM employees WHERE id = ?', [employee_id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee not found.' });

        const e = emp[0];

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 72, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="COE_${e.first_name}_${e.last_name}.pdf"`);
        doc.pipe(res);

        // ── DepEd Seal ──
        const sealPath2 = path.join(__dirname, '../../assets/deped-seal.png');
        if (fs.existsSync(sealPath2)) {
            const sealWidth = 50;
            const sealX = (doc.page.width - sealWidth) / 2;
            doc.image(sealPath2, sealX, doc.y, { width: sealWidth });
            doc.y += sealWidth + 3;
        }

        doc.fontSize(10).text('Republic of the Philippines', { align: 'center' });
        doc.text('Department of Education', { align: 'center' });
        doc.text('Region IX – Zamboanga Peninsula', { align: 'center' });
        doc.font('Helvetica-Bold').text('Schools Division Office of Dapitan City', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).stroke();
        doc.moveDown(2);

        doc.fontSize(14).font('Helvetica-Bold').text('CERTIFICATE OF EMPLOYMENT', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(11).font('Helvetica');
        doc.text('TO WHOM IT MAY CONCERN:', { align: 'center' });
        doc.moveDown();

        const fullName = `${e.first_name || ''} ${e.middle_name || ''} ${e.last_name || ''} ${e.name_extension || ''}`.trim();
        doc.text(
            `This is to certify that ${fullName} has been employed by the Schools Division Office of Dapitan City with the following details:`,
            { align: 'justify' }
        );
        doc.moveDown();

        const details = [
            ['Name:', fullName],
            ['Position:', e.position_title || '—'],
            ['Salary Grade:', e.salary_grade || '—'],
            ['Employment Status:', e.employment_status || '—'],
            ['Date Hired:', e.date_hired || '—'],
            ['Station:', e.assigned_school || '—'],
        ];

        details.forEach(([label, val]) => {
            doc.font('Helvetica-Bold').text(`${label} `, { continued: true }).font('Helvetica').text(val);
        });

        doc.moveDown(2);
        doc.text(
            'This certification is issued upon the request of the employee for whatever legal purpose it may serve.',
            { align: 'justify' }
        );
        doc.moveDown(3);

        doc.text(`Issued this ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at DepEd SDO Dapitan City.`, { align: 'left' });
        doc.moveDown(3);

        doc.font('Helvetica-Bold').text('Schools Division Superintendent', { align: 'right' });

        doc.end();
    } catch (error) {
        console.error('generateCOE Error:', error);
        res.status(500).json({ message: error.message });
    }
};
