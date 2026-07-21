const db = require('../../db');

exports.getQueue = async (req, res) => {
    try {
        const { category } = req.query;
        let sql = `
            SELECT
                cn.id AS nomination_id,
                cn.nominee_name,
                cn.nominee_category,
                cn.is_flagged,
                cn.submitted_at,
                at.id AS award_type_id,
                at.name AS award_type_name,
                COALESCE(req_counts.total_required, 0) AS total_required,
                COALESCE(doc_counts.submitted_required, 0) AS submitted_required
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON nc.id = cn.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            LEFT JOIN (
                SELECT award_type_id, COUNT(*) AS total_required
                FROM rr_award_document_requirements
                WHERE is_required = 1
                GROUP BY award_type_id
            ) req_counts ON req_counts.award_type_id = at.id
            LEFT JOIN (
                SELECT
                    cnd.nomination_id,
                    COUNT(DISTINCT cnd.requirement_id) AS submitted_required
                FROM rr_call_nomination_documents cnd
                JOIN rr_call_nominations cn2 ON cn2.id = cnd.nomination_id
                JOIN rr_nomination_calls nc2 ON nc2.id = cn2.call_id
                WHERE cnd.requirement_id IS NOT NULL
                GROUP BY cnd.nomination_id
            ) doc_counts ON doc_counts.nomination_id = cn.id
            WHERE nc.status = 'published'
        `;
        const params = [];
        if (category && category !== 'all') {
            sql += ' AND cn.nominee_category = ?';
            params.push(category);
        }
        sql += ' ORDER BY cn.submitted_at DESC';

        const [rows] = await db.query(sql, params);

        const enriched = rows.map(r => {
            const total = r.total_required || 0;
            const submitted = r.submitted_required || 0;
            const completeness = total > 0 ? Math.round((submitted / total) * 100) : 0;
            return {
                ...r,
                total_required: total,
                submitted_required: submitted,
                completeness_pct: completeness,
                preliminary_status: completeness >= 100 ? 'ready' : 'needs_action'
            };
        });

        res.json(enriched);
    } catch (err) {
        console.error('❌ GET PRELIMINARY EVALUATION QUEUE ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch preliminary evaluation queue' });
    }
};

exports.getNominationChecklist = async (req, res) => {
    try {
        const { nominationId } = req.params;

        const [nomRows] = await db.query(`
            SELECT cn.*, at.id AS award_type_id, at.name AS award_type_name,
                   nc.eligible_category
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON nc.id = cn.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            WHERE cn.id = ?
        `, [nominationId]);

        if (nomRows.length === 0) {
            return res.status(404).json({ message: 'Nomination not found' });
        }

        const nomination = nomRows[0];

        const [requirements] = await db.query(`
            SELECT adr.id, adr.document_label, adr.display_order, adr.is_required
            FROM rr_award_document_requirements adr
            WHERE adr.award_type_id = ?
            ORDER BY adr.display_order ASC
        `, [nomination.award_type_id]);

        const [submittedDocs] = await db.query(`
            SELECT cnd.id, cnd.requirement_id, cnd.file_path, cnd.file_label, cnd.uploaded_at
            FROM rr_call_nomination_documents cnd
            WHERE cnd.nomination_id = ?
        `, [nominationId]);

        const submittedMap = {};
        for (const doc of submittedDocs) {
            if (doc.requirement_id) {
                submittedMap[doc.requirement_id] = doc;
            }
        }

        const checklist = requirements.map(req => {
            const submitted = submittedMap[req.id] || null;
            return {
                requirement_id: req.id,
                document_label: req.document_label,
                display_order: req.display_order,
                is_required: req.is_required,
                is_submitted: !!submitted,
                submitted_doc: submitted ? {
                    id: submitted.id,
                    file_path: submitted.file_path,
                    file_label: submitted.file_label,
                    uploaded_at: submitted.uploaded_at
                } : null
            };
        });

        const totalRequired = requirements.filter(r => r.is_required).length;
        const submittedRequired = requirements
            .filter(r => r.is_required)
            .filter(r => submittedMap[r.id]).length;
        const completeness_pct = totalRequired > 0
            ? Math.round((submittedRequired / totalRequired) * 100)
            : 0;

        res.json({
            nomination: {
                id: nomination.id,
                nominee_name: nomination.nominee_name,
                nominee_category: nomination.nominee_category,
                award_type_id: nomination.award_type_id,
                award_type_name: nomination.award_type_name,
                eligible_category: nomination.eligible_category,
                is_flagged: !!nomination.is_flagged,
                flagged_note: nomination.flagged_note,
                flagged_at: nomination.flagged_at,
                flagged_by: nomination.flagged_by,
                submitted_at: nomination.submitted_at
            },
            checklist,
            total_required: totalRequired,
            submitted_required: submittedRequired,
            completeness_pct,
            preliminary_status: completeness_pct >= 100 ? 'ready' : 'needs_action'
        });
    } catch (err) {
        console.error('❌ GET NOMINATION CHECKLIST ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch nomination checklist' });
    }
};

exports.requestMissingDocs = async (req, res) => {
    try {
        const { nominationId } = req.params;

        const [nomRows] = await db.query(`
            SELECT cn.*, at.name AS award_type_name, nc.eligible_category
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON nc.id = cn.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            WHERE cn.id = ?
        `, [nominationId]);

        if (nomRows.length === 0) {
            return res.status(404).json({ message: 'Nomination not found' });
        }

        const nomination = nomRows[0];

        const [requirements] = await db.query(
            'SELECT id, document_label FROM rr_award_document_requirements WHERE award_type_id = ? AND is_required = 1',
            [nomination.award_type_id]
        );

        const [submittedDocs] = await db.query(
            'SELECT requirement_id FROM rr_call_nomination_documents WHERE nomination_id = ? AND requirement_id IS NOT NULL',
            [nominationId]
        );

        const submittedIds = new Set(submittedDocs.map(d => d.requirement_id));
        const missingDocs = requirements.filter(r => !submittedIds.has(r.id));

        if (missingDocs.length === 0) {
            return res.status(400).json({ message: 'No missing documents — all required docs are already submitted' });
        }

        // Create notification records for the nominee (and nominator if different)
        const notifyUsers = [];
        if (nomination.nominee_user_id) notifyUsers.push(nomination.nominee_user_id);
        if (nomination.nominated_by_user_id && nomination.nominated_by_user_id !== nomination.nominee_user_id) {
            notifyUsers.push(nomination.nominated_by_user_id);
        }

        const missingList = missingDocs.map(d => d.document_label).join(', ');
        const notificationMessage = `Action required for "${nomination.award_type_name}" nomination of ${nomination.nominee_name}: Missing documents — ${missingList}`;

        for (const userId of notifyUsers) {
            const [emp] = await db.query(
                'SELECT id AS employee_id FROM employees WHERE user_id = ? LIMIT 1',
                [userId]
            );
            if (emp.length > 0) {
                await db.query(
                    'INSERT INTO personnel_notifications (employee_id, type, message) VALUES (?, ?, ?)',
                    [emp[0].employee_id, 'general', notificationMessage]
                );
            }
        }

        const io = req.app.get('socketio');
        if (io) {
            for (const userId of notifyUsers) {
                io.to(`rr-user-${userId}`).emit('notification:admin', {
                    type: 'rr',
                    message: notificationMessage
                });
            }
            io.emit('rr:dashboard:update');
        }

        res.json({
            message: 'Missing docs request sent',
            missing: missingDocs.map(d => d.document_label),
            notified_users: notifyUsers
        });
    } catch (err) {
        console.error('❌ REQUEST MISSING DOCS ERROR:', err);
        res.status(500).json({ message: 'Failed to request missing documents' });
    }
};

exports.flagForReview = async (req, res) => {
    try {
        const { nominationId } = req.params;
        const { note } = req.body;

        const [existing] = await db.query(
            'SELECT id FROM rr_call_nominations WHERE id = ?',
            [nominationId]
        );
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Nomination not found' });
        }

        await db.query(`
            UPDATE rr_call_nominations
            SET is_flagged = 1, flagged_note = ?, flagged_at = NOW(), flagged_by = ?
            WHERE id = ?
        `, [note || null, req.user.id, nominationId]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:nomination-flagged', { nominationId, note });
            io.emit('rr:dashboard:update');
        }

        res.json({ message: 'Nomination flagged for review' });
    } catch (err) {
        console.error('❌ FLAG FOR REVIEW ERROR:', err);
        res.status(500).json({ message: 'Failed to flag nomination' });
    }
};

exports.getAwardDocumentRequirements = async (req, res) => {
    try {
        const { awardTypeId } = req.params;
        const [rows] = await db.query(
            'SELECT id, award_type_id, document_label, display_order, is_required FROM rr_award_document_requirements WHERE award_type_id = ? ORDER BY display_order ASC',
            [awardTypeId]
        );
        res.json(rows);
    } catch (err) {
        console.error('❌ GET AWARD DOCUMENT REQUIREMENTS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch award document requirements' });
    }
};
