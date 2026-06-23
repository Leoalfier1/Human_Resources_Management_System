const db = require('../../db');

const getApplicants = async (req, res) => {
    try {
        const { search, status, vacancy_id, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.*, v.position_title, v.assigned_school as school_abbreviation,
            car.total_score as ca_score, car.rank_val as ca_rank
            FROM applicants a
            LEFT JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN comparative_assessment_results car ON a.id = car.applicant_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (a.full_name LIKE ? OR a.id_number LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status && status !== 'all') {
            query += ` AND a.status = ?`;
            params.push(status);
        }
        if (vacancy_id && vacancy_id !== 'all') {
            query += ` AND a.vacancy_id = ?`;
            params.push(vacancy_id);
        }

        // Get total count for pagination metadata
        const [countResult] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as t`, params);
        const total_count = countResult[0].total;

        // Add sorting and pagination
        query += ` ORDER BY a.date_submitted DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const [rows] = await db.query(query, params);

        res.json({
            applicants: rows,
            pagination: {
                total_count,
                current_page: parseInt(page),
                total_pages: Math.ceil(total_count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSummary = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        let baseQuery = `SELECT COUNT(*) as count FROM applicants WHERE 1=1`;
        let params = [];

        if (vacancy_id && vacancy_id !== 'all') {
            baseQuery += ` AND vacancy_id = ?`;
            params.push(vacancy_id);
        }

        const [total] = await db.query(baseQuery, params);
        const [qualified] = await db.query(`${baseQuery} AND status IN ('qualified', 'shortlisted', 'selected', 'appointed')`, params);
        const [disqualified] = await db.query(`${baseQuery} AND status = 'disqualified'`, params);
        const [shortlisted] = await db.query(`${baseQuery} AND status = 'shortlisted'`, params);

        res.json({
            total: total[0].count,
            qualified: qualified[0].count,
            disqualified: disqualified[0].count,
            shortlisted: shortlisted[0].count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const [applicant] = await db.query(`SELECT full_name, vacancy_id FROM applicants WHERE id = ?`, [id]);
        if (applicant.length === 0) return res.status(404).json({ message: "Applicant not found" });

        await db.query(`UPDATE applicants SET status = ? WHERE id = ?`, [status, id]);

        // Log Activity
        await db.query(
            `INSERT INTO activity_log (vacancy_id, applicant_id, actor_id, action_description) VALUES (?, ?, ?, ?)`,
            [applicant[0].vacancy_id, id, req.user.id, `Applicant ${applicant[0].full_name} marked as ${status}`]
        );

        // Notify Dashboard
        req.app.get('socketio').emit('rsp:dashboard:update');

        res.json({ message: `Applicant status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const exportCSV = async (req, res) => {
    try {
        const { search, status, vacancy_id } = req.query;
        let query = `SELECT a.applicant_code, a.full_name, a.id_number, v.position_title, a.date_submitted, a.status FROM applicants a JOIN vacancies v ON a.vacancy_id = v.id WHERE 1=1`;
        const params = [];
        // (Apply same filter logic as getApplicants...)
        
        const [rows] = await db.query(query, params);
        
        let csv = "Code,Name,ID Number,Position,Date Submitted,Status\n";
        rows.forEach(r => {
            csv += `${r.applicant_code},"${r.full_name}",${r.id_number},"${r.position_title}",${r.date_submitted},${r.status}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=applicants_export.csv');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).send("Export failed");
    }
};

module.exports = { getApplicants, getSummary, updateStatus, exportCSV };