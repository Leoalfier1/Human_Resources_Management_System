const db = require('../../db');

// 1. GET /api/rsp/applicants -> List of applicants with filters
exports.getApplicants = async (req, res) => {
    try {
        const { search, status, vacancy_id, page = 1, limit = 50 } = req.query;

        let query = `
            SELECT 
                a.id, a.full_name, a.email, a.status, a.ref_no, a.submitted_at,
                a.current_school, a.applicant_id,
                v.position_title, v.subject, v.assigned_school,
                -- PDS fields
                p.res_city_municipality, p.res_province,
                TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE())      AS age,
                p.sex,
                p.civil_status,
                p.mobile_no,
                p.email_address                                        AS pds_email,
                p.college                                              AS pds_college,
                p.graduate_studies                                     AS pds_graduate,
                p.ld_training                                          AS pds_training,
                p.work_experience                                      AS pds_work,
                p.civil_service_eligibility                            AS pds_eligibility,
                -- disability / ethnic / religion stored as plain varchar — adjust if you add them later
                p.civil_status_other
            FROM applications a
            LEFT JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN personal_data_sheets p ON p.user_id = a.applicant_id
            WHERE a.status != 'draft'
        `;

        let countQuery = `
            SELECT COUNT(*) as total
            FROM applications a
            LEFT JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN personal_data_sheets p ON p.user_id = a.applicant_id
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
        
        // Parse JSON fields safely
        const parseJSON = (val) => {
            if (!val) return [];
            if (typeof val === 'object') return Array.isArray(val) ? val : [];
            try { return JSON.parse(val); } catch { return []; }
        };

        const formattedRows = rows.map(r => {
            const college      = parseJSON(r.pds_college);
            const graduate     = parseJSON(r.pds_graduate);
            const trainings    = parseJSON(r.pds_training);
            const workExp      = parseJSON(r.pds_work);
            const eligibility  = parseJSON(r.pds_eligibility);

            // Highest education label
            const highestEdu = graduate.length
                ? graduate[graduate.length - 1]?.degree_course || 'Graduate Studies'
                : college.length
                    ? college[college.length - 1]?.degree_course || 'College'
                    : '—';

            // Most recent training
            const latestTraining = trainings.length ? trainings[0] : null;

            // Total years of experience
            const totalYears = workExp.reduce((sum, w) => {
                if (!w.date_from) return sum;
                const from = new Date(w.date_from);
                const to   = w.date_to && w.date_to.toLowerCase() !== 'present' ? new Date(w.date_to) : new Date();
                const diff = (to - from) / (1000 * 60 * 60 * 24 * 365.25);
                return sum + Math.max(0, diff);
            }, 0);

            // Latest eligibility
            const latestElig = eligibility.length ? eligibility[0] : null;

            return {
                ...r,
                status:           r.status || 'submitted',
                applicant_code:   r.ref_no,
                id_number:        r.applicant_id || '—',
                school_abbreviation: r.current_school || r.assigned_school || 'N/A',
                // PDS-derived display fields
                address:          [r.res_city_municipality, r.res_province].filter(Boolean).join(', ') || '—',
                age:              r.age || '—',
                sex:              r.sex || '—',
                civil_status:     r.civil_status || '—',
                contact_no:       r.mobile_no || r.pds_email || '—',
                education:        highestEdu,
                training_title:   latestTraining?.title || '—',
                training_hours:   latestTraining?.num_hours || '—',
                experience_details: workExp.length ? `${workExp[0]?.position_title} @ ${workExp[0]?.department_agency}` : '—',
                experience_years: totalYears > 0 ? `${totalYears.toFixed(1)} yrs` : '—',
                eligibility_name: latestElig?.eligibility_name || '—',
            };
        });

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

        const io = req.app.get('socketio');
        if (io) {
            io.to(`application-${id}`).emit('application:stage-update', { applicationId: id, status });
            io.emit('rsp:applicants:update'); // triggers admin table to refresh
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