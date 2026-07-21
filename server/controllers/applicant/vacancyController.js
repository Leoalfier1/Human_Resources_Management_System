const db = require('../../db');

// ─────────────────────────────────────────────
// HELPER: Compute days left & elapsed from deadline
// ─────────────────────────────────────────────
function computeDays(deadlineDate) {
    const deadline = new Date(deadlineDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = deadline - today;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, 10 - Math.max(0, daysLeft));
    return { daysLeft, daysElapsed };
}

// ─────────────────────────────────────────────
// GET /api/vacancies/settings
// ─────────────────────────────────────────────
exports.getSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM settings LIMIT 1');
        if (rows.length === 0) {
            return res.json({
                office_name: 'Schools Division Office of Dapitan City',
                region: 'Region IX – Zamboanga Peninsula',
                contact_number: '065-908-1234'
            });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('❌ GET SETTINGS ERROR:', error);
        res.status(500).json({ message: 'Could not load settings.' });
    }
};

// ─────────────────────────────────────────────
// GET /api/vacancies
// Filters by applicant_type from JWT if present.
// NULL applicant_type (legacy accounts) → sees ALL vacancies.
// ─────────────────────────────────────────────
exports.getVacancies = async (req, res) => {
    try {
        const { search = '', school = '', status = '' } = req.query;

        // Determine position_type filter from JWT (req.user set by verifyToken middleware)
        // If applicant_type is NULL (old accounts or staff browsing), show everything.
        const applicantType = req.user?.applicant_type || null;

        const conditions = ["v.is_deleted = 0"];
        const params = [];

        // Hard filter: only show matching position_type
        // NULL applicant_type → no filter (backward compatible)
        if (applicantType === 'teaching') {
            conditions.push(`v.position_type = 'teaching'`);
        } else if (applicantType === 'non_teaching') {
            conditions.push(`v.position_type = 'non_teaching'`);
        } else if (applicantType === 'teaching_related') {
            conditions.push(`v.position_type = 'teaching_related'`);
        }
        // else: NULL → no position_type filter → show all

        if (search) {
            conditions.push(`(v.position_title LIKE ? OR v.subject LIKE ? OR v.assigned_school LIKE ?)`);
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (school) {
            conditions.push(`v.assigned_school LIKE ?`);
            params.push(`%${school}%`);
        }
        if (status === 'closing_soon') {
            conditions.push(`DATEDIFF(v.deadline_date, CURDATE()) BETWEEN 0 AND 3`);
        } else if (status === 'closed') {
            conditions.push(`(v.status = 'closed' OR DATEDIFF(v.deadline_date, CURDATE()) < 0)`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                v.id, v.ref_no, v.position_title, v.subject,
                v.salary_grade, v.monthly_salary,
                v.assigned_school, v.no_of_vacancies,
                v.posting_date, v.deadline_date,
                v.status, v.is_featured,
                v.minimum_qualifications,
                v.position_type,
                (SELECT COUNT(*) FROM applications WHERE vacancy_id = v.id AND status != 'draft') AS applicant_count
            FROM vacancies v
            ${whereClause}
            ORDER BY v.is_featured DESC, v.posting_date DESC
        `;

        const [rows] = await db.query(query, params);

        const list = rows.map(v => {
            const { daysLeft, daysElapsed } = computeDays(v.deadline_date);
            return {
                ...v,
                salary_grade: v.salary_grade ? `SG-${v.salary_grade}` : null,
                days_left: daysLeft,
                days_elapsed: daysElapsed,
                computed_status: daysLeft < 0 || v.status === 'closed' ? 'closed'
                    : daysLeft <= 3 ? 'closing_soon' : 'open'
            };
        });

        const openItems = list.filter(v => v.computed_status !== 'closed');
        const openPositions = openItems.length;
        const totalVacancies = openItems.reduce((sum, v) => sum + (v.no_of_vacancies || 1), 0);
        const soonestDaysLeft = openItems.length
            ? Math.min(...openItems.map(v => v.days_left))
            : 10;

        res.json({
            list: openItems,
            stats: {
                openPositions,
                totalVacancies,
                daysRemaining: Math.max(0, soonestDaysLeft),
                // Tell the frontend what type this applicant is so it can label the page
                applicantType: applicantType || 'all'
            }
        });
    } catch (error) {
        console.error('❌ GET VACANCIES ERROR:', error);
        res.status(500).json({ message: 'Could not load vacancies.' });
    }
};

// ─────────────────────────────────────────────
// GET /api/vacancies/:id
// ─────────────────────────────────────────────
exports.getVacancyById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT 
                v.*,
                v.salary_grade AS salary_grade_raw,
                v.position_type,
                (SELECT COUNT(*) FROM applications WHERE vacancy_id = v.id AND status != 'draft') AS applicant_count
            FROM vacancies v
            WHERE v.id = ? AND v.is_deleted = 0
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Vacancy not found.' });
        }

        const vacancy = rows[0];

        const [quals] = await db.query(
            'SELECT id, label FROM qualification_standards WHERE vacancy_id = ? ORDER BY id',
            [id]
        );

        const [duties] = await db.query(
            'SELECT id, label FROM duties_responsibilities WHERE vacancy_id = ? ORDER BY id',
            [id]
        );

        const [docs] = await db.query(
            'SELECT id, document_type, is_mandatory FROM vacancy_required_documents WHERE vacancy_id = ? ORDER BY is_mandatory DESC, id',
            [id]
        );

        const { daysLeft, daysElapsed } = computeDays(vacancy.deadline_date);
        const sgNum = vacancy.salary_grade_raw;

        res.json({
            ...vacancy,
            salary_grade: sgNum ? `SG-${sgNum}` : null,
            salary_grade_num: sgNum,
            days_left: daysLeft,
            days_elapsed: daysElapsed,
            computed_status: daysLeft < 0 || vacancy.status === 'closed' ? 'closed'
                : daysLeft <= 3 ? 'closing_soon' : 'open',
            qualification_standards: quals,
            duties_responsibilities: duties,
            required_documents: docs
        });
    } catch (error) {
        console.error('❌ GET VACANCY DETAIL ERROR:', error);
        res.status(500).json({ message: 'Could not load vacancy details.' });
    }
};

// ─────────────────────────────────────────────
// GET /api/vacancies/:id/has-applied
// ─────────────────────────────────────────────
exports.hasApplied = async (req, res) => {
    try {
        const { id } = req.params;
        const applicantId = req.user.id;

        const [rows] = await db.query(
            `SELECT id, ref_no, status FROM applications WHERE vacancy_id = ? AND applicant_id = ? AND status != 'draft' LIMIT 1`,
            [id, applicantId]
        );

        res.json({
            hasApplied: rows.length > 0,
            application: rows.length > 0 ? rows[0] : null
        });
    } catch (error) {
        console.error('❌ HAS-APPLIED ERROR:', error);
        res.status(500).json({ message: 'Could not check application status.' });
    }
};