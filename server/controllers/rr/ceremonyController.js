const db = require('../../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const PHOTO_DIR = './uploads/rr/ceremony-photos/';
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
        else cb(new Error('Only JPG/PNG images are allowed'), false);
    }
}).array('photos', 20);

/**
 * GET /api/rr/ceremony/:cycleId
 * Returns: event details, photos, awardee checklist, 3 stat values.
 * Auto-creates rr_ceremonies row + per-awardee status rows if missing.
 */
exports.getceremony = async (req, res) => {
    try {
        const { cycleId } = req.params;

        // Ensure ceremony row exists
        let [cerRows] = await db.query(
            'SELECT * FROM rr_ceremonies WHERE nomination_call_id = ?', [cycleId]
        );

        if (cerRows.length === 0) {
            await db.query(
                'INSERT INTO rr_ceremonies (nomination_call_id) VALUES (?)', [cycleId]
            );
            [cerRows] = await db.query(
                'SELECT * FROM rr_ceremonies WHERE nomination_call_id = ?', [cycleId]
            );
        }

        const ceremony = cerRows[0];

        // Get committee members + users for MOC dropdown
        const [committeeMembers] = await db.query(`
            SELECT pcm.id, pcm.user_id, pcm.role_label, u.full_name
            FROM rr_praise_committee_members pcm
            JOIN users u ON pcm.user_id = u.id
            WHERE pcm.is_active = 1
            ORDER BY u.full_name
        `);

        // Get approved awardees for this cycle
        const [awardees] = await db.query(`
            SELECT
                cn.id AS nomination_id,
                cn.nominee_name,
                cn.nominee_category,
                cn.nominee_user_id,
                at.id AS award_type_id,
                at.name AS award_type_name
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON nc.id = cn.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            WHERE cn.call_id = ? AND cn.deliberation_status = 'approved'
            ORDER BY at.name, cn.nominee_name
        `, [cycleId]);

        // Auto-create missing status rows for each awardee
        for (const aw of awardees) {
            await db.query(`
                INSERT IGNORE INTO rr_awardee_ceremony_status (nomination_id, ceremony_id)
                VALUES (?, ?)
            `, [aw.nomination_id, ceremony.id]);
        }

        // Fetch awardee statuses
        const nominationIds = awardees.map(a => a.nomination_id);
        let statuses = [];
        if (nominationIds.length > 0) {
            const ph = nominationIds.map(() => '?').join(',');
            [statuses] = await db.query(`
                SELECT * FROM rr_awardee_ceremony_status WHERE nomination_id IN (${ph})
            `, nominationIds);
        }

        const statusMap = {};
        for (const s of statuses) statusMap[s.nomination_id] = s;

        const enrichedAwardees = awardees.map(a => ({
            ...a,
            attendance_confirmed: !!(statusMap[a.nomination_id]?.attendance_confirmed),
            certificate_status: statusMap[a.nomination_id]?.certificate_status || 'pending',
            plaque_status: statusMap[a.nomination_id]?.plaque_status || 'pending'
        }));

        // Photos
        const [photos] = await db.query(
            'SELECT * FROM rr_ceremony_photos WHERE ceremony_id = ? ORDER BY uploaded_at DESC',
            [ceremony.id]
        );

        // Stats
        const totalAwardees = awardees.length;
        const attendanceConfirmed = enrichedAwardees.filter(a => a.attendance_confirmed).length;
        const certsDistributed = enrichedAwardees.filter(a => a.certificate_status === 'distributed').length;

        res.json({
            ceremony,
            committeeMembers,
            awardees: enrichedAwardees,
            photos,
            stats: { totalAwardees, attendanceConfirmed, certsDistributed }
        });
    } catch (err) {
        console.error('❌ GET CEREMONY ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch ceremony data' });
    }
};

/**
 * PUT /api/rr/ceremony/:cycleId
 * Upserts event details: ceremonyDatetime, venue, programTheme, masterOfCeremoniesId
 */
exports.putceremony = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const { ceremonyDatetime, venue, programTheme, masterOfCeremoniesId } = req.body;

        // Ensure row exists
        let [existing] = await db.query(
            'SELECT id FROM rr_ceremonies WHERE nomination_call_id = ?', [cycleId]
        );
        if (existing.length === 0) {
            await db.query('INSERT INTO rr_ceremonies (nomination_call_id) VALUES (?)', [cycleId]);
            [existing] = await db.query(
                'SELECT id FROM rr_ceremonies WHERE nomination_call_id = ?', [cycleId]
            );
        }

        await db.query(`
            UPDATE rr_ceremonies
            SET ceremony_datetime = ?, venue = ?, program_theme = ?, master_of_ceremonies_id = ?, updated_at = NOW()
            WHERE nomination_call_id = ?
        `, [ceremonyDatetime || null, venue || null, programTheme || null, masterOfCeremoniesId || null, cycleId]);

        const [rows] = await db.query(
            'SELECT * FROM rr_ceremonies WHERE nomination_call_id = ?', [cycleId]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('rr:ceremony-status-updated', { cycleId: Number(cycleId) });

        res.json({ ceremony: rows[0] || null });
    } catch (err) {
        console.error('❌ PUT CEREMONY ERROR:', err);
        res.status(500).json({ message: 'Failed to save ceremony details' });
    }
};

/**
 * POST /api/rr/ceremony/:cycleId/photos
 * Multer multi-file upload. Creates rr_ceremony_photos rows.
 */
exports.postPhotos = async (req, res) => {
    uploadPhotos(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });
        try {
            const { cycleId } = req.params;
            const files = req.files || [];
            if (files.length === 0) return res.status(400).json({ message: 'No photos uploaded' });

            const [cerRows] = await db.query(
                'SELECT id FROM rr_ceremonies WHERE nomination_call_id = ?', [cycleId]
            );
            if (cerRows.length === 0) {
                return res.status(404).json({ message: 'Ceremony not found' });
            }
            const ceremonyId = cerRows[0].id;

            for (const f of files) {
                const filePath = f.path.replace(/\\/g, '/');
                await db.query(
                    'INSERT INTO rr_ceremony_photos (ceremony_id, file_path, uploaded_by) VALUES (?, ?, ?)',
                    [ceremonyId, filePath, req.user.id]
                );
            }

            const [photos] = await db.query(
                'SELECT * FROM rr_ceremony_photos WHERE ceremony_id = ? ORDER BY uploaded_at DESC',
                [ceremonyId]
            );

            const io = req.app.get('socketio');
            if (io) io.emit('rr:ceremony-status-updated', { cycleId: Number(cycleId) });

            res.json({ photos, uploaded: files.length });
        } catch (e) {
            console.error('❌ POST CEREMONY PHOTOS ERROR:', e);
            res.status(500).json({ message: 'Failed to upload photos' });
        }
    });
};

/**
 * DELETE /api/rr/ceremony/photos/:photoId
 * Removes photo file + DB row.
 */
exports.deletePhoto = async (req, res) => {
    try {
        const { photoId } = req.params;

        const [rows] = await db.query('SELECT * FROM rr_ceremony_photos WHERE id = ?', [photoId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Photo not found' });

        const photo = rows[0];
        const fullPath = path.resolve(photo.file_path);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

        await db.query('DELETE FROM rr_ceremony_photos WHERE id = ?', [photoId]);

        const io = req.app.get('socketio');
        if (io) io.emit('rr:ceremony-status-updated', {});

        res.json({ message: 'Photo deleted' });
    } catch (err) {
        console.error('❌ DELETE CEREMONY PHOTO ERROR:', err);
        res.status(500).json({ message: 'Failed to delete photo' });
    }
};

/**
 * PATCH /api/rr/ceremony/awardee/:nominationId/attendance
 * Body: { confirmed: boolean }
 */
exports.patchAttendance = async (req, res) => {
    try {
        const { nominationId } = req.params;
        const { confirmed } = req.body;

        const [cerRows] = await db.query(`
            SELECT c.id AS ceremony_id, c.nomination_call_id
            FROM rr_awardee_ceremony_status acs
            JOIN rr_ceremonies c ON c.id = acs.ceremony_id
            WHERE acs.nomination_id = ?
        `, [nominationId]);

        if (cerRows.length === 0) return res.status(404).json({ message: 'Awardee status record not found' });

        await db.query(
            'UPDATE rr_awardee_ceremony_status SET attendance_confirmed = ? WHERE nomination_id = ?',
            [confirmed ? 1 : 0, nominationId]
        );

        // Recompute stats
        const ceremonyId = cerRows[0].ceremony_id;
        const [statRow] = await db.query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN attendance_confirmed = 1 THEN 1 ELSE 0 END) AS confirmed,
                SUM(CASE WHEN certificate_status = 'distributed' THEN 1 ELSE 0 END) AS certs_distributed
            FROM rr_awardee_ceremony_status WHERE ceremony_id = ?
        `, [ceremonyId]);

        const io = req.app.get('socketio');
        if (io) io.emit('rr:ceremony-status-updated', {
            cycleId: cerRows[0].nomination_call_id,
            stats: {
                totalAwardees: Number(statRow[0]?.total) || 0,
                attendanceConfirmed: Number(statRow[0]?.confirmed) || 0,
                certsDistributed: Number(statRow[0]?.certs_distributed) || 0
            }
        });

        res.json({
            attendance_confirmed: !!confirmed,
            stats: {
                totalAwardees: Number(statRow[0]?.total) || 0,
                attendanceConfirmed: Number(statRow[0]?.confirmed) || 0,
                certsDistributed: Number(statRow[0]?.certs_distributed) || 0
            }
        });
    } catch (err) {
        console.error('❌ PATCH ATTENDANCE ERROR:', err);
        res.status(500).json({ message: 'Failed to update attendance' });
    }
};

/**
 * PATCH /api/rr/ceremony/awardee/:nominationId/certificate
 * Body: { status: 'pending' | 'printed' | 'distributed' }
 */
exports.patchCertificate = async (req, res) => {
    try {
        const { nominationId } = req.params;
        const { status } = req.body;

        if (!['pending', 'printed', 'distributed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const [cerRows] = await db.query(`
            SELECT c.id AS ceremony_id, c.nomination_call_id
            FROM rr_awardee_ceremony_status acs
            JOIN rr_ceremonies c ON c.id = acs.ceremony_id
            WHERE acs.nomination_id = ?
        `, [nominationId]);

        if (cerRows.length === 0) return res.status(404).json({ message: 'Awardee status record not found' });

        await db.query(
            'UPDATE rr_awardee_ceremony_status SET certificate_status = ? WHERE nomination_id = ?',
            [status, nominationId]
        );

        const ceremonyId = cerRows[0].ceremony_id;
        const [statRow] = await db.query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN attendance_confirmed = 1 THEN 1 ELSE 0 END) AS confirmed,
                SUM(CASE WHEN certificate_status = 'distributed' THEN 1 ELSE 0 END) AS certs_distributed
            FROM rr_awardee_ceremony_status WHERE ceremony_id = ?
        `, [ceremonyId]);

        const io = req.app.get('socketio');
        if (io) io.emit('rr:ceremony-status-updated', {
            cycleId: cerRows[0].nomination_call_id,
            stats: {
                totalAwardees: Number(statRow[0]?.total) || 0,
                attendanceConfirmed: Number(statRow[0]?.confirmed) || 0,
                certsDistributed: Number(statRow[0]?.certs_distributed) || 0
            }
        });

        res.json({ certificate_status: status });
    } catch (err) {
        console.error('❌ PATCH CERTIFICATE ERROR:', err);
        res.status(500).json({ message: 'Failed to update certificate status' });
    }
};

/**
 * PATCH /api/rr/ceremony/awardee/:nominationId/plaque
 * Body: { status: 'pending' | 'printed' | 'distributed' }
 */
exports.patchPlaque = async (req, res) => {
    try {
        const { nominationId } = req.params;
        const { status } = req.body;

        if (!['pending', 'printed', 'distributed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        await db.query(
            'UPDATE rr_awardee_ceremony_status SET plaque_status = ? WHERE nomination_id = ?',
            [status, nominationId]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('rr:ceremony-status-updated', {});

        res.json({ plaque_status: status });
    } catch (err) {
        console.error('❌ PATCH PLAQUE ERROR:', err);
        res.status(500).json({ message: 'Failed to update plaque status' });
    }
};
