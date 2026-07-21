const db = require('../../db');

exports.getCommitteeMembers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT pcm.id, pcm.user_id, pcm.role_label, pcm.is_active,
                   u.full_name, u.email
            FROM rr_praise_committee_members pcm
            JOIN users u ON u.id = pcm.user_id
            WHERE pcm.is_active = 1
            ORDER BY pcm.role_label, u.full_name
        `);
        res.json(rows);
    } catch (err) {
        console.error('❌ GET COMMITTEE MEMBERS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch committee members' });
    }
};

exports.getLatestMeeting = async (req, res) => {
    try {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            let [meetings] = await conn.query(
                'SELECT * FROM rr_praise_meetings ORDER BY id DESC LIMIT 1'
            );

            if (meetings.length === 0) {
                const [result] = await conn.query(
                    'INSERT INTO rr_praise_meetings (status) VALUES (?)',
                    ['draft']
                );
                const [newMeeting] = await conn.query(
                    'SELECT * FROM rr_praise_meetings WHERE id = ?',
                    [result.insertId]
                );
                meetings = newMeeting;
            }

            const meeting = meetings[0];

            let presidingOfficerName = meeting.presiding_officer_other || null;
            if (meeting.presiding_officer_id) {
                const [officerRows] = await conn.query(
                    'SELECT u.full_name FROM users u WHERE u.id = ?',
                    [meeting.presiding_officer_id]
                );
                if (officerRows.length > 0) presidingOfficerName = officerRows[0].full_name;
            }

            const [committee] = await conn.query(`
                SELECT pcm.id, pcm.user_id, pcm.role_label, pcm.is_active,
                       u.full_name, u.email
                FROM rr_praise_committee_members pcm
                JOIN users u ON u.id = pcm.user_id
                WHERE pcm.is_active = 1
                ORDER BY pcm.role_label, u.full_name
            `);

            const [agendaItems] = await conn.query(
                'SELECT * FROM rr_meeting_agenda_items WHERE meeting_id = ? ORDER BY display_order, id',
                [meeting.id]
            );

            const [attendance] = await conn.query(
                'SELECT * FROM rr_meeting_attendance WHERE meeting_id = ?',
                [meeting.id]
            );

            await conn.commit();

            const attendanceMap = {};
            for (const a of attendance) {
                attendanceMap[a.committee_member_id] = a.is_present;
            }

            const membersWithAttendance = committee.map(m => ({
                ...m,
                is_present: !!attendanceMap[m.id]
            }));

            const presentCount = membersWithAttendance.filter(m => m.is_present).length;
            const openAgendaCount = agendaItems.filter(a => !a.is_resolved).length;

            res.json({
                meeting: {
                    ...meeting,
                    presiding_officer_name: presidingOfficerName
                },
                committee: membersWithAttendance,
                agendaItems,
                stats: {
                    committeeMemberCount: committee.length,
                    presentTodayCount: presentCount,
                    openAgendaCount: openAgendaCount
                }
            });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('❌ GET LATEST MEETING ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch meeting' });
    }
};

exports.updateMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const [rows] = await db.query('SELECT status FROM rr_praise_meetings WHERE id = ?', [meetingId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Meeting not found' });
        if (rows[0].status === 'finalized') return res.status(403).json({ message: 'Meeting is finalized and cannot be edited' });

        const fields = [];
        const values = [];

        const allowed = ['meeting_date', 'venue', 'presiding_officer_id', 'presiding_officer_other', 'minutes'];
        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        // Mutual exclusivity: if presiding_officer_id is set, clear presiding_officer_other and vice versa
        if (req.body.presiding_officer_id !== undefined && req.body.presiding_officer_id !== null) {
            fields.push('presiding_officer_other = NULL');
        } else if (req.body.presiding_officer_other !== undefined && req.body.presiding_officer_other !== null) {
            fields.push('presiding_officer_id = NULL');
        }

        if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

        values.push(meetingId);
        await db.query(`UPDATE rr_praise_meetings SET ${fields.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Meeting updated' });
    } catch (err) {
        console.error('❌ UPDATE MEETING ERROR:', err);
        res.status(500).json({ message: 'Failed to update meeting' });
    }
};

exports.toggleAgendaItem = async (req, res) => {
    try {
        const { meetingId, itemId } = req.params;
        const [meetingRows] = await db.query('SELECT status FROM rr_praise_meetings WHERE id = ?', [meetingId]);
        if (meetingRows.length === 0) return res.status(404).json({ message: 'Meeting not found' });
        if (meetingRows[0].status === 'finalized') return res.status(403).json({ message: 'Meeting is finalized' });

        const [rows] = await db.query(
            'SELECT id, is_resolved FROM rr_meeting_agenda_items WHERE id = ? AND meeting_id = ?',
            [itemId, meetingId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Agenda item not found' });

        const newVal = !rows[0].is_resolved;
        await db.query('UPDATE rr_meeting_agenda_items SET is_resolved = ? WHERE id = ?', [newVal, itemId]);

        const [meeting] = await db.query(
            'SELECT COUNT(*) AS open_count FROM rr_meeting_agenda_items WHERE meeting_id = ? AND is_resolved = 0',
            [meetingId]
        );

        res.json({ is_resolved: newVal, openAgendaCount: meeting[0].open_count });
    } catch (err) {
        console.error('❌ TOGGLE AGENDA ITEM ERROR:', err);
        res.status(500).json({ message: 'Failed to toggle agenda item' });
    }
};

exports.addAgendaItem = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { itemText } = req.body;

        const [meetingRows] = await db.query('SELECT status FROM rr_praise_meetings WHERE id = ?', [meetingId]);
        if (meetingRows.length === 0) return res.status(404).json({ message: 'Meeting not found' });
        if (meetingRows[0].status === 'finalized') return res.status(403).json({ message: 'Meeting is finalized' });

        if (!itemText || !itemText.trim()) return res.status(400).json({ message: 'Item text is required' });

        const [maxOrder] = await db.query(
            'SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM rr_meeting_agenda_items WHERE meeting_id = ?',
            [meetingId]
        );

        const [result] = await db.query(
            'INSERT INTO rr_meeting_agenda_items (meeting_id, item_text, display_order) VALUES (?, ?, ?)',
            [meetingId, itemText.trim(), maxOrder[0].next_order]
        );

        const [item] = await db.query('SELECT * FROM rr_meeting_agenda_items WHERE id = ?', [result.insertId]);
        res.status(201).json(item[0]);
    } catch (err) {
        console.error('❌ ADD AGENDA ITEM ERROR:', err);
        res.status(500).json({ message: 'Failed to add agenda item' });
    }
};

exports.toggleAttendance = async (req, res) => {
    try {
        const { meetingId, committeeMemberId } = req.params;
        const [meetingRows] = await db.query('SELECT status FROM rr_praise_meetings WHERE id = ?', [meetingId]);
        if (meetingRows.length === 0) return res.status(404).json({ message: 'Meeting not found' });
        if (meetingRows[0].status === 'finalized') return res.status(403).json({ message: 'Meeting is finalized' });

        const { isPresent } = req.body;

        await db.query(`
            INSERT INTO rr_meeting_attendance (meeting_id, committee_member_id, is_present)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE is_present = VALUES(is_present)
        `, [meetingId, committeeMemberId, isPresent ? 1 : 0]);

        const [meeting] = await db.query(`
            SELECT COUNT(*) AS present_count
            FROM rr_meeting_attendance
            WHERE meeting_id = ? AND is_present = 1
        `, [meetingId]);

        res.json({ is_present: !!isPresent, presentTodayCount: meeting[0].present_count });
    } catch (err) {
        console.error('❌ TOGGLE ATTENDANCE ERROR:', err);
        res.status(500).json({ message: 'Failed to toggle attendance' });
    }
};

exports.finalizeMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const [rows] = await db.query('SELECT * FROM rr_praise_meetings WHERE id = ?', [meetingId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Meeting not found' });

        const meeting = rows[0];
        if (meeting.status === 'finalized') return res.status(400).json({ message: 'Meeting is already finalized' });

        const missing = [];
        if (!meeting.meeting_date) missing.push('meeting_date');
        if (!meeting.venue) missing.push('venue');
        if (!meeting.presiding_officer_id && !meeting.presiding_officer_other) missing.push('presiding_officer');
        if (!meeting.minutes || !meeting.minutes.trim()) missing.push('minutes');

        if (missing.length > 0) {
            return res.status(422).json({ message: 'Missing required fields', missing });
        }

        await db.query(`
            UPDATE rr_praise_meetings
            SET status = 'finalized', finalized_at = NOW(), finalized_by = ?
            WHERE id = ?
        `, [req.user.id, meetingId]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:meeting-finalized', { meetingId });
            io.emit('rr:dashboard:update');
        }

        res.json({ message: 'Meeting finalized successfully' });
    } catch (err) {
        console.error('❌ FINALIZE MEETING ERROR:', err);
        res.status(500).json({ message: 'Failed to finalize meeting' });
    }
};
