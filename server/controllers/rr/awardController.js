const db = require('../../db');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const multer = require('multer');

const CERT_DIR = './uploads/rr/certificates/';
const PHOTO_DIR = './uploads/rr/ceremony/';
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });
if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });

const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, PHOTO_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'CEREMONY-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadPhotos = multer({
    storage: photoStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    }
}).array('photos', 20);

exports.getAwards = async (req, res) => {
    try {
        const { search_id } = req.query;
        let sql = `
            SELECT a.*, u.full_name as user_name, u.email as user_email,
                ac.category_name, s.title as search_title
            FROM rr_awards a
            JOIN users u ON a.user_id = u.id
            JOIN rr_award_categories ac ON a.category_id = ac.id
            JOIN rr_searches s ON a.search_id = s.id
        `;
        const params = [];
        if (search_id) { sql += ' WHERE a.search_id = ?'; params.push(search_id); }
        sql += ' ORDER BY a.created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('❌ GET AWARDS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch awards' });
    }
};

exports.announceResults = async (req, res) => {
    try {
        const { search_id } = req.body;
        if (!search_id) return res.status(400).json({ message: 'search_id is required' });

        const [awards] = await db.query('SELECT * FROM rr_awards WHERE search_id = ?', [search_id]);
        if (awards.length === 0) return res.status(400).json({ message: 'No awards to announce' });

        await db.query('UPDATE rr_searches SET status = ? WHERE id = ?', ['announced', search_id]);
        await db.query('UPDATE rr_awards SET announced_at = NOW() WHERE search_id = ?', [search_id]);

        for (const award of awards) {
            await db.query(
                'INSERT INTO notifications (application_id, message) VALUES (NULL, ?)',
                [`Congratulations! You have been awarded "${award.award_title}" in the R&R Search.`]
            );
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:dashboard:update');
            io.emit('rr:award:announced', { search_id });
            for (const award of awards) {
                io.to(`rr-user-${award.user_id}`).emit('rr:award:announced', {
                    award_id: award.id,
                    award_title: award.award_title,
                    search_id
                });
            }
        }

        res.json({ message: 'Results announced', count: awards.length });
    } catch (err) {
        console.error('❌ ANNOUNCE RESULTS ERROR:', err);
        res.status(500).json({ message: 'Failed to announce results' });
    }
};

exports.markAwarded = async (req, res) => {
    try {
        const { id } = req.params;
        const { awarded_at } = req.body;

        await db.query('UPDATE rr_awards SET is_awarded = 1, awarded_at = ? WHERE id = ?',
            [awarded_at || new Date(), id]);

        const io = req.app.get('socketio');
        if (io) io.emit('rr:dashboard:update');

        res.json({ message: 'Awardee marked as awarded' });
    } catch (err) {
        console.error('❌ MARK AWARDED ERROR:', err);
        res.status(500).json({ message: 'Failed to mark awarded' });
    }
};

exports.generateCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const [awardRows] = await db.query(`
            SELECT a.*, u.full_name as user_name,
                ac.category_name, s.title as search_title, s.school_year
            FROM rr_awards a
            JOIN users u ON a.user_id = u.id
            JOIN rr_award_categories ac ON a.category_id = ac.id
            JOIN rr_searches s ON a.search_id = s.id
            WHERE a.id = ?
        `, [id]);

        if (awardRows.length === 0) return res.status(404).json({ message: 'Award not found' });
        const award = awardRows[0];

        const filename = `CERT-RR-${award.id}-${Date.now()}.pdf`;
        const filePath = path.join(CERT_DIR, filename);
        const doc = new PDFDocument({ size: 'LETTER', margins: { top: 72, bottom: 72, left: 72, right: 72 } });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        const navy = [27, 58, 107];
        const gold = [245, 158, 11];
        const gray = [100, 116, 139];

        doc.rect(0, 0, doc.page.width, 20).fill(navy[0], navy[1], navy[2]);

        doc.fontSize(16).font('Helvetica-Bold');
        doc.fillColor(navy[0], navy[1], navy[2]);
        doc.text('Republic of the Philippines', { align: 'center' });
        doc.fontSize(13).font('Helvetica');
        doc.text('Department of Education', { align: 'center' });
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('Schools Division Office of Dapitan City', { align: 'center' });
        doc.moveDown(0.5);

        doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).strokeColor(gold[0], gold[1], gold[2]).stroke();

        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica-Oblique').fillColor(gray[0], gray[1], gray[2]);
        doc.text('Region IX – Zamboanga Peninsula', { align: 'center' });
        doc.moveDown(1.5);

        doc.fontSize(24).font('Helvetica-Bold').fillColor(gold[0], gold[1], gold[2]);
        doc.text('CERTIFICATE OF RECOGNITION', { align: 'center' });
        doc.moveDown(1.5);

        doc.fontSize(12).font('Helvetica').fillColor(gray[0], gray[1], gray[2]);
        doc.text('This certifies that', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(28).font('Helvetica-Bold').fillColor(navy[0], navy[1], navy[2]);
        doc.text(award.user_name.toUpperCase(), { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(12).font('Helvetica').fillColor(gray[0], gray[1], gray[2]);
        doc.text('has been recognized as', { align: 'center' });
        doc.moveDown(0.3);

        doc.fontSize(18).font('Helvetica-Bold').fillColor(gold[0], gold[1], gold[2]);
        doc.text(award.award_title, { align: 'center' });
        doc.moveDown(0.3);

        doc.fontSize(11).font('Helvetica').fillColor(gray[0], gray[1], gray[2]);
        doc.text(award.search_title, { align: 'center' });
        doc.text(`School Year ${award.school_year}`, { align: 'center' });
        doc.moveDown(1);

        doc.fontSize(10).font('Helvetica-Oblique').fillColor(gray[0], gray[1], gray[2]);
        doc.text('In recognition of outstanding performance and dedication to public service', { align: 'center' });
        doc.moveDown(1.5);

        doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).strokeColor(navy[0], navy[1], navy[2]).stroke();
        doc.moveDown(1.5);

        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fontSize(10).font('Helvetica').fillColor(navy[0], navy[1], navy[2]);
        doc.text(`Issued on ${dateStr}`, { align: 'center' });
        doc.moveDown(2);

        const lineY = doc.y;
        const leftX = 120;
        const rightX = doc.page.width - 120;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('__________________________________', leftX, lineY, { align: 'center' });
        doc.text('__________________________________', rightX, lineY, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(navy[0], navy[1], navy[2]);
        doc.text('Schools Division Superintendent', leftX - 20, doc.y, { align: 'center', width: 200 });
        doc.text('HR Officer', rightX - 20, doc.y, { align: 'center', width: 200 });

        doc.rect(0, doc.page.height - 20, doc.page.width, 20).fill(navy[0], navy[1], navy[2]);
        doc.fontSize(8).font('Helvetica').fillColor('white');
        doc.text('DepEd SDO Dapitan City · PRIME-HRM R&R', 0, doc.page.height - 14, { align: 'center' });

        doc.end();

        await new Promise(resolve => writeStream.on('finish', resolve));

        const dbPath = filePath.replace(/\\/g, '/');
        await db.query('UPDATE rr_awards SET certificate_path = ? WHERE id = ?', [dbPath, id]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:certificate:ready', { award_id: id, certificate_path: dbPath });
            io.to(`rr-user-${award.user_id}`).emit('rr:certificate:ready', { award_id: id });
        }

        res.json({ message: 'Certificate generated', certificate_path: dbPath });
    } catch (err) {
        console.error('❌ GENERATE CERTIFICATE ERROR:', err);
        res.status(500).json({ message: 'Failed to generate certificate' });
    }
};

exports.getMyAwards = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT a.*, ac.category_name, s.title as search_title, s.school_year, s.status as search_status
            FROM rr_awards a
            JOIN rr_award_categories ac ON a.category_id = ac.id
            JOIN rr_searches s ON a.search_id = s.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
        `, [userId]);
        res.json(rows);
    } catch (err) {
        console.error('❌ GET MY AWARDS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch my awards' });
    }
};

exports.downloadMyCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM rr_awards WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Award not found' });

        if (rows[0].user_id !== req.user.id && !['admin', 'hr_staff'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (!rows[0].certificate_path) return res.status(404).json({ message: 'Certificate not yet generated' });

        const filePath = rows[0].certificate_path;
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Certificate file not found' });

        res.download(filePath, `Certificate_${rows[0].award_title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
        console.error('❌ DOWNLOAD CERT ERROR:', err);
        res.status(500).json({ message: 'Failed to download certificate' });
    }
};

exports.recordCeremony = async (req, res) => {
    try {
        const { search_id, ceremony_date, venue, program_of_activities, guest_of_honor } = req.body;

        await db.query(`
            INSERT INTO rr_ceremony (search_id, ceremony_date, venue, program_of_activities, guest_of_honor)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ceremony_date = VALUES(ceremony_date), venue = VALUES(venue),
                program_of_activities = VALUES(program_of_activities), guest_of_honor = VALUES(guest_of_honor)
        `, [search_id, ceremony_date, venue, program_of_activities, guest_of_honor]);

        const io = req.app.get('socketio');
        if (io) io.emit('rr:dashboard:update');

        res.json({ message: 'Ceremony details saved' });
    } catch (err) {
        console.error('❌ RECORD CEREMONY ERROR:', err);
        res.status(500).json({ message: 'Failed to save ceremony details' });
    }
};

exports.uploadCeremonyPhotos = async (req, res) => {
    uploadPhotos(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });
        try {
            const { search_id } = req.body;
            const files = req.files || [];
            if (files.length === 0) return res.status(400).json({ message: 'No photos uploaded' });

            const photoPaths = files.map(f => f.path.replace(/\\/g, '/'));

            await db.query(`
                INSERT INTO rr_ceremony (search_id, photos_path)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE photos_path = VALUES(photos_path)
            `, [search_id, photoPaths.join(',')]);

            res.json({ message: `${files.length} photo(s) uploaded`, photos: photoPaths });
        } catch (err) {
            console.error('❌ UPLOAD CEREMONY PHOTOS ERROR:', err);
            res.status(500).json({ message: 'Failed to upload photos' });
        }
    });
};
