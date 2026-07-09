const db = require('../../db');
const path = require('path');
const fs = require('fs');

exports.getPrograms = async (req, res) => {
    try {
        const { plan_id, status, target_position_type, school_year } = req.query;
        let sql = `SELECT pr.*, p.title AS plan_title, p.school_year,
                   (SELECT COUNT(*) FROM ld_attendance a WHERE a.program_id = pr.id AND a.status = 'present') AS present_count,
                   (SELECT COUNT(*) FROM ld_attendance a WHERE a.program_id = pr.id) AS total_attendance
                   FROM ld_programs pr
                   LEFT JOIN ld_plans p ON pr.plan_id = p.id
                   WHERE 1=1`;
        const params = [];
        if (plan_id) { sql += ' AND pr.plan_id = ?'; params.push(plan_id); }
        if (status) { sql += ' AND pr.status = ?'; params.push(status); }
        if (target_position_type) { sql += ' AND (pr.target_position_type = ? OR pr.target_position_type = \'all\')'; params.push(target_position_type); }
        if (school_year) { sql += ' AND p.school_year = ?'; params.push(school_year); }
        sql += ' ORDER BY pr.created_at DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) { console.error('getPrograms Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getProgramById = async (req, res) => {
    try {
        const { id } = req.params;
        const [programs] = await db.query(
            `SELECT pr.*, p.title AS plan_title, p.school_year, o.title AS objective_title
             FROM ld_programs pr
             LEFT JOIN ld_plans p ON pr.plan_id = p.id
             LEFT JOIN ld_objectives o ON pr.objective_id = o.id
             WHERE pr.id = ?`, [id]);
        if (programs.length === 0) return res.status(404).json({ message: 'Program not found' });
        const [attendance] = await db.query(
            `SELECT a.*, u.full_name, u.applicant_type FROM ld_attendance a
             JOIN users u ON a.user_id = u.id WHERE a.program_id = ? ORDER BY u.full_name ASC`, [id]);
        const [materials] = await db.query('SELECT * FROM ld_materials WHERE program_id = ? ORDER BY uploaded_at DESC', [id]);
        const [evalForm] = await db.query(
            `SELECT ef.*,
                    (SELECT COUNT(*) FROM ld_evaluation_responses er WHERE er.eval_form_id = ef.id) AS response_count
             FROM ld_evaluation_forms ef WHERE ef.program_id = ?`, [id]);
        res.json({ ...programs[0], attendance, materials, evaluationForm: evalForm[0] || null });
    } catch (error) { console.error('getProgramById Error:', error); res.status(500).json({ message: error.message }); }
};

exports.createProgram = async (req, res) => {
    try {
        const { plan_id, objective_id, title, description, methodology, target_position_type, duration_hours, start_date, end_date, venue, resource_person, provider, budget_estimate } = req.body;
        if (!plan_id || !title) return res.status(400).json({ message: 'Plan ID and title are required' });
        const [result] = await db.query(
            `INSERT INTO ld_programs (plan_id, objective_id, title, description, methodology, target_position_type, duration_hours, start_date, end_date, venue, resource_person, provider, budget_estimate)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [plan_id, objective_id || null, title, description || '', methodology || 'Seminar', target_position_type || 'all',
             duration_hours || null, start_date || null, end_date || null, venue || null, resource_person || null, provider || null, budget_estimate || null]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `New program created: ${title}`, type: 'ld' });
        }
        res.status(201).json({ id: result.insertId, message: 'Program created' });
    } catch (error) { console.error('createProgram Error:', error); res.status(500).json({ message: error.message }); }
};

exports.updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { objective_id, title, description, methodology, target_position_type, duration_hours, start_date, end_date, venue, resource_person, provider, budget_estimate } = req.body;
        await db.query(
            `UPDATE ld_programs SET
             objective_id=COALESCE(?,objective_id), title=COALESCE(?,title), description=COALESCE(?,description),
             methodology=COALESCE(?,methodology), target_position_type=COALESCE(?,target_position_type),
             duration_hours=COALESCE(?,duration_hours), start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date),
             venue=COALESCE(?,venue), resource_person=COALESCE(?,resource_person), provider=COALESCE(?,provider),
             budget_estimate=COALESCE(?,budget_estimate) WHERE id=?`,
            [objective_id, title, description, methodology, target_position_type, duration_hours, start_date, end_date, venue, resource_person, provider, budget_estimate, id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `Program updated (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Program updated' });
    } catch (error) { console.error('updateProgram Error:', error); res.status(500).json({ message: error.message }); }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['planned', 'ongoing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
        await db.query('UPDATE ld_programs SET status = ? WHERE id = ?', [status, id]);
        const [program] = await db.query('SELECT * FROM ld_programs WHERE id = ?', [id]);
        const programTitle = program[0]?.title || 'a program';
        if (status === 'ongoing') {
            if (program.length > 0) {
                const typeFilter = program[0].target_position_type;
                let userSql = "SELECT id FROM users WHERE role = 'applicant'";
                const params = [];
                if (typeFilter !== 'all') { userSql += ' AND applicant_type = ?'; params.push(typeFilter); }
                const [users] = await db.query(userSql, params);
                if (users.length > 0) {
                    const values = users.map(u => [id, u.id, 'absent']);
                    await db.query('INSERT IGNORE INTO ld_attendance (program_id, user_id, status) VALUES ?', [values]);
                }
            }
        }
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.emit('notification:admin', { message: `Program "${programTitle}" status updated to ${status}`, type: 'ld' });
            // Notify all enrolled applicants of the status change
            const statusMessages = {
                ongoing: `📚 Training "${programTitle}" has started! Check your L&D dashboard.`,
                completed: `✅ Training "${programTitle}" is now completed. View your attendance & certificate.`,
                cancelled: `❌ Training "${programTitle}" has been cancelled.`,
            };
            if (statusMessages[status]) {
                const [enrolled] = await db.query(
                    'SELECT DISTINCT user_id FROM ld_attendance WHERE program_id = ?', [id]);
                enrolled.forEach(({ user_id }) => {
                    io.to(`ld-user-${user_id}`).emit('ld:notification:applicant', {
                        message: statusMessages[status],
                        type: 'status'
                    });
                });
            }
        }
        res.json({ message: `Status updated to ${status}` });
    } catch (error) { console.error('updateStatus Error:', error); res.status(500).json({ message: error.message }); }
};

exports.uploadAttendanceSheet = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const filePath = req.file.path.replace(/\\/g, '/');
        await db.query('UPDATE ld_programs SET attendance_sheet_path = ? WHERE id = ?', [filePath, id]);
        const io = req.app.get('socketio');
        if (io) io.emit('ld:dashboard:update');
        res.json({ message: 'Attendance sheet uploaded', path: filePath });
    } catch (error) { console.error('uploadAttendanceSheet Error:', error); res.status(500).json({ message: error.message }); }
};

exports.bulkSeedAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const [program] = await db.query('SELECT target_position_type FROM ld_programs WHERE id = ?', [id]);
        if (program.length === 0) return res.status(404).json({ message: 'Program not found' });
        const typeFilter = program[0].target_position_type;
        let userSql = "SELECT id FROM users WHERE role = 'applicant'";
        const params = [];
        if (typeFilter !== 'all') { userSql += ' AND applicant_type = ?'; params.push(typeFilter); }
        const [users] = await db.query(userSql, params);
        if (users.length > 0) {
            const values = users.map(u => [id, u.id, 'absent']);
            await db.query('INSERT IGNORE INTO ld_attendance (program_id, user_id, status) VALUES ?', [values]);
        }
        res.json({ message: `Attendance seeded for ${users.length} users` });
    } catch (error) { console.error('bulkSeedAttendance Error:', error); res.status(500).json({ message: error.message }); }
};

exports.markAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['present', 'absent', 'excused'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
        await db.query('UPDATE ld_attendance SET status = ? WHERE id = ?', [status, id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            // Notify the specific applicant whose attendance changed
            const [rows] = await db.query(
                `SELECT a.user_id, pr.title AS program_title
                 FROM ld_attendance a JOIN ld_programs pr ON a.program_id = pr.id
                 WHERE a.id = ?`, [id]);
            if (rows.length > 0) {
                const { user_id, program_title } = rows[0];
                const statusLabel = status === 'present' ? '✅ Present' : status === 'excused' ? '⚠️ Excused' : '❌ Absent';
                io.to(`ld-user-${user_id}`).emit('ld:notification:applicant', {
                    message: `Your attendance for "${program_title}" has been marked as ${statusLabel}.`,
                    type: 'attendance'
                });
            }
        }
        res.json({ message: 'Attendance updated' });
    } catch (error) { console.error('markAttendance Error:', error); res.status(500).json({ message: error.message }); }
};

exports.uploadCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const filePath = req.file.path.replace(/\\/g, '/');
        await db.query('UPDATE ld_attendance SET certificate_path = ? WHERE id = ?', [filePath, id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            // Notify the specific applicant that their certificate is ready
            const [rows] = await db.query(
                `SELECT a.user_id, pr.title AS program_title
                 FROM ld_attendance a JOIN ld_programs pr ON a.program_id = pr.id
                 WHERE a.id = ?`, [id]);
            if (rows.length > 0) {
                const { user_id, program_title } = rows[0];
                io.to(`ld-user-${user_id}`).emit('ld:notification:applicant', {
                    message: `🎓 Your certificate for "${program_title}" is ready! Download it from your L&D dashboard.`,
                    type: 'certificate'
                });
            }
        }
        res.json({ message: 'Certificate uploaded', path: filePath });
    } catch (error) { console.error('uploadCertificate Error:', error); res.status(500).json({ message: error.message }); }
};

exports.uploadMaterial = async (req, res) => {
    try {
        const { program_id, title } = req.body;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        if (!program_id || !title) return res.status(400).json({ message: 'Program ID and title are required' });
        const filePath = req.file.path.replace(/\\/g, '/');
        await db.query(
            'INSERT INTO ld_materials (program_id, title, file_path, file_name, uploaded_by) VALUES (?, ?, ?, ?, ?)',
            [program_id, title, filePath, req.file.originalname, req.user.id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            // Notify all enrolled applicants of the new material
            const [rows] = await db.query(
                `SELECT DISTINCT a.user_id, pr.title AS program_title
                 FROM ld_attendance a JOIN ld_programs pr ON a.program_id = pr.id
                 WHERE a.program_id = ?`, [program_id]);
            rows.forEach(({ user_id, program_title }) => {
                io.to(`ld-user-${user_id}`).emit('ld:notification:applicant', {
                    message: `📄 New material "${title}" has been added to "${program_title}". Check your L&D dashboard.`,
                    type: 'material'
                });
            });
        }
        res.status(201).json({ message: 'Material uploaded' });
    } catch (error) { console.error('uploadMaterial Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getMaterials = async (req, res) => {
    try {
        const { program_id } = req.query;
        const [rows] = await db.query(
            'SELECT * FROM ld_materials WHERE program_id = ? ORDER BY uploaded_at DESC', [program_id]);
        res.json(rows);
    } catch (error) { console.error('getMaterials Error:', error); res.status(500).json({ message: error.message }); }
};

exports.getMyPrograms = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            `SELECT pr.*, a.status AS attendance_status, a.id AS attendance_id, a.certificate_path, a.acknowledged_at,
                    p.title AS plan_title, p.school_year,
                    (SELECT COUNT(*) FROM ld_materials m WHERE m.program_id = pr.id) AS material_count
             FROM ld_programs pr
             JOIN ld_attendance a ON a.program_id = pr.id AND a.user_id = ?
             LEFT JOIN ld_plans p ON pr.plan_id = p.id
             ORDER BY pr.start_date DESC`, [userId]);
        res.json(rows);
    } catch (error) { console.error('getMyPrograms Error:', error); res.status(500).json({ message: error.message }); }
};

exports.acknowledgeParticipation = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE ld_attendance SET acknowledged_at = NOW() WHERE id = ? AND user_id = ?', [id, req.user.id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            // Notify admin room with the applicant's name and program
            const [rows] = await db.query(
                `SELECT u.full_name, pr.title AS program_title
                 FROM ld_attendance a
                 JOIN users u ON a.user_id = u.id
                 JOIN ld_programs pr ON a.program_id = pr.id
                 WHERE a.id = ?`, [id]);
            if (rows.length > 0) {
                const { full_name, program_title } = rows[0];
                io.to('ld-admin').emit('ld:notification:admin', {
                    message: `✅ ${full_name} acknowledged participation in "${program_title}".`,
                    type: 'ld_applicant'
                });
            }
        }
        res.json({ message: 'Participation acknowledged' });
    } catch (error) { console.error('acknowledgeParticipation Error:', error); res.status(500).json({ message: error.message }); }
};
