const db = require('../../db');

const ADMIN_ROLES = ['admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'];

// Helper: write a persistent notification row
async function pushNotification(userId, type, message, link = null) {
    try {
        await db.query(
            `INSERT INTO ld_notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)`,
            [userId, type, message, link]
        );
    } catch (e) {
        console.error('pushNotification error:', e.message);
    }
}
function toSqlDate(val) {
    if (!val || typeof val !== 'string') return null;
    const str = val.trim();
    if (!str) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parts = str.split('/');
    if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        if (year.length === 4) return `${year}-${month}-${day}`;
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// POST /api/ld/proposals — employee submits a new proposal
exports.createProposal = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            title, category, rationale, target_participants,
            proposed_date_from, proposed_date_to,
            estimated_budget, mode_of_delivery,
        } = req.body;

        if (!title || !rationale) {
            return res.status(400).json({ message: 'Title and rationale are required.' });
        }

        const dateFrom = toSqlDate(proposed_date_from);
        const dateTo = toSqlDate(proposed_date_to);

        const [result] = await db.query(
            `INSERT INTO ld_program_proposals
                (proposed_by, title, category, rationale, target_participants,
                 proposed_date_from, proposed_date_to, estimated_budget, mode_of_delivery)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, category || null, rationale,
             target_participants || null,
             dateFrom, dateTo,
             estimated_budget || null, mode_of_delivery || null]
        );

        const proposalId = result.insertId;

        // Fetch proposer name for notification message
        const [[proposer]] = await db.query(`SELECT full_name FROM users WHERE id = ?`, [userId]);
        const proposerName = proposer?.full_name || `User #${userId}`;

        // Notify all admins in the ld-admin room via Socket.IO
        const io = req.app.get('socketio');
        if (io) {
            io.to('ld-admin').emit('ld:proposal:new', {
                id: proposalId,
                title,
                proposedBy: proposerName,
                submittedAt: new Date().toISOString(),
                message: `New proposal from ${proposerName}: "${title}"`,
            });
        }

        // Persist a notification for each admin user (role in ADMIN_ROLES)
        const [admins] = await db.query(
            `SELECT id FROM users WHERE role IN (${ADMIN_ROLES.map(() => '?').join(',')})`,
            ADMIN_ROLES
        );
        for (const admin of admins) {
            await pushNotification(
                admin.id, 'proposal_new',
                `New proposal from ${proposerName}: "${title}"`,
                '/ld-portal/pd-program-design'
            );
        }

        res.status(201).json({ id: proposalId, message: 'Proposal submitted successfully.' });
    } catch (error) {
        console.error('createProposal Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// GET /api/ld/proposals — admin sees all; employee sees own
exports.getProposals = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = ADMIN_ROLES.includes(req.user.role);
        const { status } = req.query;

        let sql = `
            SELECT p.*,
                   u.full_name AS proposer_name,
                   u.applicant_type AS proposer_type,
                   rv.full_name AS reviewer_name
            FROM ld_program_proposals p
            LEFT JOIN users u ON p.proposed_by = u.id
            LEFT JOIN users rv ON p.reviewed_by = rv.id
            WHERE 1=1
        `;
        const params = [];

        if (!isAdmin) {
            sql += ' AND p.proposed_by = ?';
            params.push(userId);
        }

        if (status) {
            sql += ' AND p.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY p.created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('getProposals Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// GET /api/ld/proposals/:id — detail
exports.getProposalById = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = ADMIN_ROLES.includes(req.user.role);
        const { id } = req.params;

        const [[row]] = await db.query(
            `SELECT p.*,
                    u.full_name AS proposer_name,
                    u.applicant_type AS proposer_type,
                    rv.full_name AS reviewer_name
             FROM ld_program_proposals p
             LEFT JOIN users u ON p.proposed_by = u.id
             LEFT JOIN users rv ON p.reviewed_by = rv.id
             WHERE p.id = ?`,
            [id]
        );

        if (!row) return res.status(404).json({ message: 'Proposal not found.' });

        // Employees can only see their own
        if (!isAdmin && row.proposed_by !== userId) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        res.json(row);
    } catch (error) {
        console.error('getProposalById Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/ld/proposals/:id/review — admin reviews (under_review / approved / declined)
exports.reviewProposal = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { status, admin_remarks } = req.body;

        const VALID_REVIEW_STATUSES = ['under_review', 'approved', 'declined'];
        if (!VALID_REVIEW_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Use: under_review | approved | declined' });
        }
        if (status === 'declined' && !admin_remarks?.trim()) {
            return res.status(400).json({ message: 'Admin remarks are required when declining a proposal.' });
        }

        const [[proposal]] = await db.query(`SELECT * FROM ld_program_proposals WHERE id = ?`, [id]);
        if (!proposal) return res.status(404).json({ message: 'Proposal not found.' });

        await db.query(
            `UPDATE ld_program_proposals
             SET status = ?, admin_remarks = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [status, admin_remarks || null, adminId, id]
        );

        // Notify the employee
        const statusLabel = { under_review: 'under review', approved: 'approved', declined: 'declined' }[status];
        const message = `Your proposal "${proposal.title}" has been ${statusLabel}.`;
        const link = '/ld-employee/propose-program';

        await pushNotification(proposal.proposed_by, `proposal_${status}`, message, link);

        const io = req.app.get('socketio');
        if (io) {
            io.to(`ld-user-${proposal.proposed_by}`).emit('ld:proposal:updated', {
                id: Number(id),
                status,
                message,
            });
            io.to('ld-admin').emit('ld:proposal:updated', { id: Number(id), status });
        }

        res.json({ message: `Proposal marked as ${status}.` });
    } catch (error) {
        console.error('reviewProposal Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// POST /api/ld/proposals/:id/convert — admin converts proposal into a real ld_programs row
exports.convertProposal = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        const [[proposal]] = await db.query(`SELECT * FROM ld_program_proposals WHERE id = ?`, [id]);
        if (!proposal) return res.status(404).json({ message: 'Proposal not found.' });
        if (proposal.status === 'converted') {
            return res.status(409).json({ message: 'This proposal has already been converted.' });
        }

        // Derive a methodology from mode_of_delivery
        const methodMap = {
            'face-to-face': 'Face-to-Face',
            'online': 'Online',
            'blended': 'Blended',
        };
        const methodology = methodMap[(proposal.mode_of_delivery || '').toLowerCase()] || 'Seminar';

        // Find or create an available ld_plan
        let planId = null;
        const [plans] = await db.query(`SELECT id FROM ld_plans ORDER BY created_at DESC LIMIT 1`);
        if (plans.length > 0) {
            planId = plans[0].id;
        } else {
            const [newPlan] = await db.query(
                `INSERT INTO ld_plans (title, school_year, description, status, source)
                 VALUES (?, ?, ?, ?, ?)`,
                ['Division L&D Master Plan SY 2025–2026', '2025-2026', 'Auto-generated master plan for converted proposals', 'approved', 'portal']
            );
            planId = newPlan.insertId;
        }

        const startDate = proposal.proposed_date_from ? new Date(proposal.proposed_date_from).toISOString().slice(0, 10) : null;
        const endDate = proposal.proposed_date_to ? new Date(proposal.proposed_date_to).toISOString().slice(0, 10) : null;

        const [result] = await db.query(
            `INSERT INTO ld_programs
                (plan_id, title, description, methodology, target_position_type,
                 start_date, end_date, budget_estimate, status, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', 'portal')`,
            [
                planId,
                proposal.title,
                proposal.rationale || '',
                methodology,
                'all',
                startDate,
                endDate,
                proposal.estimated_budget || null,
            ]
        );

        const newProgramId = result.insertId;

        // Link the proposal to the new program
        await db.query(
            `UPDATE ld_program_proposals
             SET status = 'converted', linked_program_id = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [newProgramId, adminId, id]
        );

        // Notify the employee
        const message = `Your proposal "${proposal.title}" has been approved and converted into a PD Program!`;
        await pushNotification(proposal.proposed_by, 'proposal_converted', message, '/ld-employee/browse-programs');

        const io = req.app.get('socketio');
        if (io) {
            io.to(`ld-user-${proposal.proposed_by}`).emit('ld:proposal:updated', {
                id: Number(id),
                status: 'converted',
                message,
            });
            io.emit('ld:dashboard:update');
        }

        res.status(201).json({
            message: 'Proposal converted to program successfully.',
            programId: newProgramId,
            proposalId: Number(id),
        });
    } catch (error) {
        console.error('convertProposal Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/ld/proposals/:id — delete a proposal
exports.deleteProposal = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = ADMIN_ROLES.includes(req.user.role);
        const { id } = req.params;

        const [[proposal]] = await db.query('SELECT * FROM ld_program_proposals WHERE id = ?', [id]);
        if (!proposal) return res.status(404).json({ message: 'Proposal not found.' });

        if (!isAdmin && proposal.proposed_by !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this proposal.' });
        }

        await db.query('DELETE FROM ld_program_proposals WHERE id = ?', [id]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:proposal:deleted', { id: Number(id) });
            io.emit('ld:dashboard:update');
        }

        res.json({ message: 'Proposal deleted successfully.' });
    } catch (error) {
        console.error('deleteProposal Error:', error);
        res.status(500).json({ message: error.message });
    }
};
