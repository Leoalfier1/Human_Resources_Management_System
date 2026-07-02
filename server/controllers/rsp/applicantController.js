const db = require('../../db');

// 1. GET /api/rsp/applicants -> List of applicants with filters
exports.getApplicants = async (req, res) => {
    try {
        const { search, status, vacancy_id, page = 1, limit = 50 } = req.query;

        let query = `
            SELECT a.id, a.full_name, a.email, a.status, a.ref_no, a.submitted_at, a.current_school, a.applicant_id,
                   v.position_title, v.subject, v.assigned_school
            FROM applications a
            LEFT JOIN vacancies v ON a.vacancy_id = v.id
            WHERE a.status != 'draft'
        `;
        
        let countQuery = `
            SELECT COUNT(*) as total
            FROM applications a
            LEFT JOIN vacancies v ON a.vacancy_id = v.id
            WHERE a.status != 'draft'
        `;
        const params = [];

        if (status && status !== 'all') {
            const statusFilter = ` AND a.status = ?`;
            query += statusFilter;
            countQuery += statusFilter;
            params.push(status);
        }

        if (vacancy_id && vacancy_id !== 'all') {
            const vacancyFilter = ` AND a.vacancy_id = ?`;
            query += vacancyFilter;
            countQuery += vacancyFilter;
            params.push(vacancy_id);
        }

        if (search) {
            const searchFilter = ` AND (a.full_name LIKE ? OR a.ref_no LIKE ? OR v.position_title LIKE ?)`;
            query += searchFilter;
            countQuery += searchFilter;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        query += ` ORDER BY a.submitted_at DESC`;

        const [countResult] = await db.query(countQuery, params);
        const total_count = countResult[0].total;

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT ? OFFSET ?`;
        const queryParams = [...params, parseInt(limit), offset];

        const [rows] = await db.query(query, queryParams);
        
        // Ensure consistent fallback if status is null and map fields for frontend
        const formattedRows = rows.map(r => ({
            ...r,
            status: r.status || 'submitted',
            applicant_code: r.ref_no,
            id_number: r.applicant_id || '-',
            school_abbreviation: r.current_school || r.assigned_school || 'N/A'
        }));

        res.json({
            applicants: formattedRows,
            pagination: {
                total_count,
                total_pages: Math.ceil(total_count / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('❌ GET APPLICANTS ERROR:', err);
        res.status(500).json({ message: 'Server error fetching applicants' });
    }
};

// 2. GET /api/rsp/applicants/summary -> Counts of statuses
exports.getApplicantSummary = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        
        let query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified,
                SUM(CASE WHEN status = 'disqualified' THEN 1 ELSE 0 END) as disqualified,
                SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted
            FROM applications
            WHERE status != 'draft'
        `;
        const params = [];

        if (vacancy_id && vacancy_id !== 'all') {
            query += ` AND vacancy_id = ?`;
            params.push(vacancy_id);
        }

        const [rows] = await db.query(query, params);
        
        res.json({
            total: Number(rows[0].total) || 0,
            qualified: Number(rows[0].qualified) || 0,
            disqualified: Number(rows[0].disqualified) || 0,
            shortlisted: Number(rows[0].shortlisted) || 0
        });
    } catch (err) {
        console.error('❌ GET APPLICANT SUMMARY ERROR:', err);
        res.status(500).json({ message: 'Server error fetching summary stats' });
    }
};

// 3. PATCH /api/rsp/applicants/:id/status -> Update status manually
exports.updateApplicantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) return res.status(400).json({ message: 'Status is required' });

        await db.query(
            `UPDATE applications SET status = ? WHERE id = ?`,
            [status, id]
        );

        // Also emit socket event to refresh applicant's dashboard
        const io = req.app.get('socketio');
        if (io) {
            io.to(`application-${id}`).emit('application:stage-update', { applicationId: id });
        }

        res.json({ message: `Applicant status updated to ${status}` });
    } catch (err) {
        console.error('❌ UPDATE APPLICANT STATUS ERROR:', err);
        res.status(500).json({ message: 'Server error updating status' });
    }
};

// 4. GET /api/rsp/applicants/export -> Export applicants as CSV
exports.exportApplicants = async (req, res) => {
    try {
        const { search, status, vacancy_id } = req.query;

        let query = `
            SELECT a.id, a.full_name, a.email, a.status, a.ref_no, a.submitted_at, a.current_school, a.applicant_id,
                   v.position_title, v.subject, v.assigned_school
            FROM applications a
            LEFT JOIN vacancies v ON a.vacancy_id = v.id
            WHERE a.status != 'draft'
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ` AND a.status = ?`;
            params.push(status);
        }

        if (vacancy_id && vacancy_id !== 'all') {
            query += ` AND a.vacancy_id = ?`;
            params.push(vacancy_id);
        }

        if (search) {
            query += ` AND (a.full_name LIKE ? OR a.ref_no LIKE ? OR v.position_title LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        query += ` ORDER BY a.submitted_at DESC`;

        const [rows] = await db.query(query, params);

        let csv = 'ID,Applicant Code,Full Name,Email,Position,School,Status,Date Submitted\n';
        rows.forEach(r => {
            csv += `"${r.applicant_id || '-'}","${r.ref_no || ''}","${r.full_name || ''}","${r.email || ''}","${r.position_title || ''}","${r.current_school || r.assigned_school || ''}","${r.status || 'submitted'}","${r.submitted_at || ''}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('applicants.csv');
        res.send(csv);
    } catch (err) {
        console.error('❌ EXPORT APPLICANTS ERROR:', err);
        res.status(500).send('Server error exporting applicants');
    }
};