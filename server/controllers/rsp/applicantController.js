const db = require('../../db');

// 1. GET /api/rsp/applicants -> List of applicants with filters
exports.getApplicants = async (req, res) => {
    try {
        const { search, status, vacancy_id, page = 1, limit = 50 } = req.query;

        let query = `
            SELECT a.id, a.full_name, a.email, a.status, a.ref_no, a.submitted_at, a.current_school, a.applicant_id,
                   a.initial_evaluation_remarks, a.disqualification_recorded_by, a.disqualification_recorded_at,
                   u.full_name AS disqualified_by_name,
                   v.position_title, v.subject, v.assigned_school, v.position_type,
                   COALESCE(a.snap_address, ae.address) AS address,
                   COALESCE(a.snap_age, ae.age) AS age,
                   COALESCE(a.snap_sex, ae.sex) AS sex,
                   COALESCE(a.snap_civil_status, ae.civil_status) AS civil_status,
                   COALESCE(a.snap_religion, ae.religion) AS religion,
                   COALESCE(a.snap_disability, ae.disability) AS disability,
                   COALESCE(a.snap_ethnic_group, ae.ethnic_group) AS ethnic_group,
                   COALESCE(a.phone, ae.contact_no) AS contact_no,
                   COALESCE(a.snap_education, ae.education) AS education,
                   ae.training_title,
                   COALESCE(a.snap_training_hours, ae.training_hours) AS training_hours,
                   COALESCE(a.years_experience, ae.experience_years) AS experience_years,
                   ae.experience_details,
                   COALESCE(a.snap_eligibility, ae.eligibility) AS eligibility
            FROM applications a
            LEFT JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN applicant_eligibility_screening ae ON ae.application_id = a.id
            LEFT JOIN users u ON a.disqualification_recorded_by = u.id
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

        if (req.query.position_type && req.query.position_type !== 'all') {
            const ptFilter = ` AND v.position_type = ?`;
            query += ptFilter;
            countQuery += ptFilter;
            params.push(req.query.position_type);
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
            school_abbreviation: r.current_school || r.assigned_school || 'N/A',
            address: r.address || 'Not provided',
            age: r.age || null,
            sex: r.sex || 'Not provided',
            civil_status: r.civil_status || 'Not provided',
            religion: r.religion || 'Not provided',
            disability: r.disability || 'Not provided',
            ethnic_group: r.ethnic_group || 'Not provided',
            contact_no: r.contact_no || 'Not provided',
            education: r.education || 'Not provided',
            training_title: r.training_title || 'Not provided',
            training_hours: r.training_hours || null,
            experience_years: r.experience_years || null,
            experience_details: r.experience_details || 'Not provided',
            eligibility: r.eligibility || 'Not provided',
            initial_evaluation_remarks: r.initial_evaluation_remarks || null,
            disqualification_recorded_by: r.disqualification_recorded_by || null,
            disqualification_recorded_at: r.disqualification_recorded_at || null,
            disqualified_by_name: r.disqualified_by_name || null
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
        const { status, remarks } = req.body;

        if (!status) return res.status(400).json({ message: 'Status is required' });

        const [appRow] = await db.query(
            'SELECT a.full_name, v.position_title FROM applications a JOIN vacancies v ON a.vacancy_id = v.id WHERE a.id = ?',
            [id]
        );
        const posTitle = appRow[0]?.position_title || 'this position';

        if (status === 'disqualified') {
            if (!remarks || typeof remarks !== 'string' || remarks.trim().length < 10) {
                return res.status(422).json({ message: 'Remarks are required for disqualification (minimum 10 characters).' });
            }
            const userId = req.user.id;
            await db.query(
                `UPDATE applications SET status = ?, current_stage = 3, initial_evaluation_remarks = ?, disqualification_recorded_by = ?, disqualification_recorded_at = NOW() WHERE id = ?`,
                [status, remarks.trim(), userId, id]
            );
            await db.query(
                `INSERT INTO application_disqualification_history (application_id, reason, recorded_by, recorded_at) VALUES (?, ?, ?, NOW())`,
                [id, remarks.trim(), userId]
            );
            await db.query(`
                INSERT INTO stage_history (application_id, stage_number, status, completed_at, updated_by)
                VALUES (?, 3, 'completed', NOW(), ?)
                ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW(), updated_by = VALUES(updated_by)
            `, [id, userId]);

            const notifMessage = `Your application for ${posTitle} has been evaluated. Unfortunately, you did not meet the minimum qualification standards required for this position. Reason: ${remarks.trim()}`;
            await db.query(
                `INSERT INTO notifications (application_id, message) VALUES (?, ?)`,
                [id, notifMessage]
            );
        } else {
            await db.query(
                `UPDATE applications SET status = ? WHERE id = ?`,
                [status, id]
            );
        }

        const io = req.app.get('socketio');
        if (io) {
            io.to(`application-${id}`).emit('application:stage-update', { applicationId: id });
            io.emit('rsp:applicants:update');
            io.emit('rsp:dashboard:update');
            io.emit('notification:admin', {
                message: `Applicant ${appRow[0]?.full_name || ''} status changed to ${status} for ${posTitle}`,
                type: 'rsp'
            });
        }

        res.json({ message: `Applicant status updated to ${status}` });
    } catch (err) {
        console.error('❌ UPDATE APPLICANT STATUS ERROR:', err);
        res.status(500).json({ message: 'Server error updating status' });
    }
};

// 4. GET /api/rsp/applicants/mqs-criteria -> Fetch MQS criteria for a vacancy (Annex D header)
exports.getVacancyMqsCriteria = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) return res.status(400).json({ message: 'vacancy_id is required' });

        const [vacancyRows] = await db.query(
            `SELECT id, position_title, salary_grade, monthly_salary, minimum_qualifications, position_type
             FROM vacancies WHERE id = ?`,
            [vacancy_id]
        );
        if (vacancyRows.length === 0) return res.status(404).json({ message: 'Vacancy not found' });
        const vacancy = vacancyRows[0];

        const [mqsRows] = await db.query(
            `SELECT education, training, experience, eligibility
             FROM rsp_mqs_criteria WHERE vacancy_id = ?`,
            [vacancy_id]
        );

        const mqs = mqsRows.length > 0 ? mqsRows[0] : {
            education: vacancy.minimum_qualifications || null,
            training: null,
            experience: null,
            eligibility: null
        };

        res.json({
            vacancy_id: vacancy.id,
            position_title: vacancy.position_title,
            salary_grade: vacancy.salary_grade ? `SG-${vacancy.salary_grade}` : null,
            monthly_salary: vacancy.monthly_salary,
            position_type: vacancy.position_type,
            mqs: {
                education: mqs.education || 'None Required',
                training: mqs.training || 'None Required',
                experience: mqs.experience || 'None Required',
                eligibility: mqs.eligibility || 'None Required'
            }
        });
    } catch (err) {
        console.error('❌ GET MQS CRITERIA ERROR:', err);
        res.status(500).json({ message: 'Server error fetching MQS criteria' });
    }
};

// 5. PUT /api/rsp/applicants/mqs-criteria -> Upsert MQS criteria for a vacancy
exports.upsertMqsCriteria = async (req, res) => {
    try {
        const { vacancy_id, education, training, experience, eligibility } = req.body;
        if (!vacancy_id) return res.status(400).json({ message: 'vacancy_id is required' });

        await db.query(
            `INSERT INTO rsp_mqs_criteria (vacancy_id, education, training, experience, eligibility)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                education = VALUES(education),
                training = VALUES(training),
                experience = VALUES(experience),
                eligibility = VALUES(eligibility)`,
            [vacancy_id, education || null, training || null, experience || null, eligibility || null]
        );

        res.json({ message: 'MQS criteria updated successfully' });
    } catch (err) {
        console.error('❌ UPSERT MQS CRITERIA ERROR:', err);
        res.status(500).json({ message: 'Server error updating MQS criteria' });
    }
};

// 6. GET /api/rsp/applicants/export -> Export applicants as CSV
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