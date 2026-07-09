const db = require('../../db');

exports.getEligibilityList = async (req, res) => {
    try {
        const { vacancy_id, search, page = 1, limit = 100 } = req.query;
        let where = ['1=1'];
        let params = [];

        if (vacancy_id) {
            where.push('aes.vacancy_id = ?');
            params.push(vacancy_id);
        }
        if (search) {
            where.push('(aes.applicant_name LIKE ? OR aes.application_code LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = where.join(' AND ');

        const [count] = await db.query(`SELECT COUNT(*) as total FROM applicant_eligibility_screening aes WHERE ${whereClause}`, params);
        const [rows] = await db.query(
            `SELECT * FROM applicant_eligibility_screening aes WHERE ${whereClause} ORDER BY aes.id ASC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({ data: rows, total: count[0].total, page: parseInt(page), totalPages: Math.ceil(count[0].total / parseInt(limit)) });
    } catch (error) {
        console.error('getEligibilityList Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateRemarks = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        if (!['qualified', 'disqualified', null].includes(remarks)) {
            return res.status(400).json({ message: 'Remarks must be "qualified", "disqualified", or null.' });
        }

        await db.query('UPDATE applicant_eligibility_screening SET remarks = ? WHERE id = ?', [remarks || null, id]);
        res.json({ message: 'Remarks updated successfully.' });
    } catch (error) {
        console.error('updateRemarks Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.exportCSV = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        let where = ['1=1'];
        let params = [];
        if (vacancy_id) { where.push('vacancy_id = ?'); params.push(vacancy_id); }

        const [rows] = await db.query(
            `SELECT * FROM applicant_eligibility_screening WHERE ${where.join(' AND ')} ORDER BY id ASC`,
            params
        );

        const header = 'No,Application Code,Name,Address,Age,Sex,Civil Status,Religion,Disability,Ethnic Group,Email,Contact,Education,Training Title,Training Hours,Experience Years,Eligibility,Remarks\n';
        const csv = header + rows.map((r, i) =>
            `${i + 1},${r.application_code || ''},"${r.applicant_name || ''}","${r.address || ''}",${r.age || ''},${r.sex || ''},${r.civil_status || ''},${r.religion || ''},${r.disability || ''},${r.ethnic_group || ''},${r.email || ''},${r.contact_no || ''},${r.education || ''},"${r.training_title || ''}",${r.training_hours || ''},${r.experience_years || ''},${r.eligibility || ''},${r.remarks || ''}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="eligibility_screening.csv"');
        res.send(csv);
    } catch (error) {
        console.error('exportCSV Error:', error);
        res.status(500).json({ message: error.message });
    }
};
