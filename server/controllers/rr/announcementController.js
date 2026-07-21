const db = require('../../db');
const path = require('path');
const fs = require('fs');

/**
 * GET /api/rr/announcement/winners
 * Returns finalized nominees with scores/rank, grouped by award type.
 */
exports.getWinnersPreview = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                cn.id                AS nomination_id,
                cn.nominee_name,
                cn.nominee_category,
                cn.deliberation_status,
                cn.final_rank,
                at.id                AS award_type_id,
                at.name              AS award_type_name,
                vi.weighted_total,
                nc.id                AS call_id,
                CONCAT(at.name, ' (', UPPER(REPLACE(nc.eligible_category, '_', ' ')), ')') AS call_title
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON nc.id = cn.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            LEFT JOIN rr_validation_interviews vi ON vi.nomination_id = cn.id
            WHERE cn.deliberation_status = 'approved'
            ORDER BY at.name, cn.final_rank ASC
        `);

        const grouped = {};
        for (const r of rows) {
            if (!grouped[r.award_type_id]) {
                grouped[r.award_type_id] = {
                    award_type_id: r.award_type_id,
                    award_type_name: r.award_type_name,
                    call_id: r.call_id,
                    call_title: r.call_title,
                    winners: []
                };
            }
            grouped[r.award_type_id].winners.push(r);
        }

        res.json({ groups: Object.values(grouped) });
    } catch (err) {
        console.error('❌ GET ANNOUNCEMENT WINNERS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch winners preview' });
    }
};

/**
 * GET /api/rr/announcement/settings
 * Returns announcement settings for all active calls (or most recent).
 */
exports.getSettings = async (req, res) => {
    try {
        const [calls] = await db.query(`
            SELECT nc.id, CONCAT(at.name, ' (', UPPER(REPLACE(nc.eligible_category, '_', ' ')), ')') AS title
            FROM rr_nomination_calls nc
            JOIN rr_award_types at ON at.id = nc.award_type_id
            ORDER BY nc.id DESC
            LIMIT 10
        `);

        const callIds = calls.map(c => c.id);
        let announcements = [];
        if (callIds.length > 0) {
            const ph = callIds.map(() => '?').join(',');
            [announcements] = await db.query(`
                SELECT ra.*
                FROM rr_announcements ra
                WHERE ra.nomination_call_id IN (${ph})
            `, callIds);
        }

        const announceByCall = {};
        for (const a of announcements) announceByCall[a.nomination_call_id] = a;

        res.json({
            calls,
            announcements: announceByCall
        });
    } catch (err) {
        console.error('❌ GET ANNOUNCEMENT SETTINGS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch announcement settings' });
    }
};

/**
 * PUT /api/rr/announcement/:callId/settings
 * Body: { notify_all_nominees, notify_awardees_only, notify_dept_heads, notify_all_personnel }
 */
exports.putSettings = async (req, res) => {
    try {
        const { callId } = req.params;
        const { notify_all_nominees, notify_awardees_only, notify_dept_heads, notify_all_personnel } = req.body;

        await db.query(`
            INSERT INTO rr_announcements
                (nomination_call_id, notify_all_nominees, notify_awardees_only, notify_dept_heads, notify_all_personnel, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                notify_all_nominees  = VALUES(notify_all_nominees),
                notify_awardees_only = VALUES(notify_awardees_only),
                notify_dept_heads    = VALUES(notify_dept_heads),
                notify_all_personnel = VALUES(notify_all_personnel),
                updated_at           = NOW()
        `, [callId, notify_all_nominees ? 1 : 0, notify_awardees_only ? 1 : 0, notify_dept_heads ? 1 : 0, notify_all_personnel ? 1 : 0]);

        const [row] = await db.query('SELECT * FROM rr_announcements WHERE nomination_call_id = ?', [callId]);
        res.json({ announcement: row[0] || null });
    } catch (err) {
        console.error('❌ PUT ANNOUNCEMENT SETTINGS ERROR:', err);
        res.status(500).json({ message: 'Failed to save announcement settings' });
    }
};

/**
 * POST /api/rr/announcement/:callId/memo
 * Multipart: file (PDF). Saves memo_file_path to rr_announcements.
 */
exports.postMemo = async (req, res) => {
    try {
        const { callId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded. Only PDF files are allowed.' });
        }

        const filePath = req.file.path.replace(/\\/g, '/');

        await db.query(`
            INSERT INTO rr_announcements (nomination_call_id, memo_file_path, updated_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE memo_file_path = VALUES(memo_file_path), updated_at = NOW()
        `, [callId, filePath]);

        const [row] = await db.query('SELECT * FROM rr_announcements WHERE nomination_call_id = ?', [callId]);
        res.json({ announcement: row[0] || null, filePath });
    } catch (err) {
        console.error('❌ POST ANNOUNCEMENT MEMO ERROR:', err);
        res.status(500).json({ message: 'Failed to upload memo' });
    }
};

/**
 * PATCH /api/rr/announcement/:callId/publish
 * Final action: sets status='published', logs notifications, emits Socket.IO event.
 */
exports.patchPublish = async (req, res) => {
    try {
        const { callId } = req.params;

        const [existing] = await db.query(
            'SELECT * FROM rr_announcements WHERE nomination_call_id = ?',
            [callId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'No announcement settings found for this call. Configure settings first.' });
        }

        if (existing[0].status === 'published') {
            return res.status(409).json({ message: 'This announcement has already been published.' });
        }

        const ann = existing[0];

        // Build recipient groups based on settings
        const notifications = [];

        if (ann.notify_awardees_only || ann.notify_all_nominees) {
            const [awardees] = await db.query(`
                SELECT DISTINCT cn.id, cn.nominee_user_id, cn.nominated_by_user_id
                FROM rr_call_nominations cn
                WHERE cn.call_id = ? AND cn.deliberation_status = 'approved'
            `, [callId]);
            for (const a of awardees) {
                if (a.nominee_user_id) {
                    notifications.push({ recipient_user_id: a.nominee_user_id, recipient_group: 'nominees' });
                }
                if (a.nominated_by_user_id && a.nominated_by_user_id !== a.nominee_user_id) {
                    notifications.push({ recipient_user_id: a.nominated_by_user_id, recipient_group: 'nominators' });
                }
            }
        }

        if (ann.notify_dept_heads) {
            const [heads] = await db.query(`
                SELECT DISTINCT u.id AS user_id
                FROM users u
                JOIN employees e ON e.user_id = u.id
                WHERE e.position_title LIKE '%Head%' OR e.position_title LIKE '%Director%'
            `);
            for (const h of heads) {
                notifications.push({ recipient_user_id: h.user_id, recipient_group: 'dept_heads' });
            }
        }

        if (ann.notify_all_personnel) {
            const [all] = await db.query('SELECT id AS user_id FROM users WHERE is_active = 1');
            for (const u of all) {
                notifications.push({ recipient_user_id: u.user_id, recipient_group: 'all_personnel' });
            }
        }

        // De-duplicate by user_id
        const seen = new Set();
        const deduped = notifications.filter(n => {
            if (!n.recipient_user_id || seen.has(n.recipient_user_id)) return false;
            seen.add(n.recipient_user_id);
            return true;
        });

        // Insert notification log entries
        for (const n of deduped) {
            await db.query(`
                INSERT INTO rr_announcement_notifications_log (announcement_id, recipient_user_id, recipient_group, sent_at)
                VALUES (?, ?, ?, NOW())
            `, [ann.id, n.recipient_user_id, n.recipient_group]);
        }

        // Mark as published
        await db.query(`
            UPDATE rr_announcements
            SET status = 'published', published_at = NOW(), published_by = ?, updated_at = NOW()
            WHERE id = ?
        `, [req.user.id, ann.id]);

        // Emit Socket.IO
        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:announcement-published', { callId: Number(callId), announcementId: ann.id });
            io.emit('rr:dashboard:update');
        }

        res.json({
            message: 'Announcement published successfully',
            notifications_sent: deduped.length,
            published_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('❌ PATCH ANNOUNCEMENT PUBLISH ERROR:', err);
        res.status(500).json({ message: 'Failed to publish announcement' });
    }
};
