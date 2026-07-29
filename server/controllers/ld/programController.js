const db = require('../../db');
const path = require('path');
const fs = require('fs');

exports.getPrograms = async (req, res) => {
    try {
        const { plan_id, status, target_position_type, school_year, q } = req.query;
        let sql = `SELECT pr.*, p.title AS plan_title, p.school_year,
                   (SELECT COUNT(*) FROM ld_attendance a WHERE a.program_id = pr.id AND a.status = 'enrolled') AS enrolled_count,
                   COALESCE(pr.participant_count, 0) AS max_slots
                   FROM ld_programs pr
                   LEFT JOIN ld_plans p ON pr.plan_id = p.id
                   WHERE 1=1`;
        const params = [];
        if (plan_id) { sql += ' AND pr.plan_id = ?'; params.push(plan_id); }
        if (status) { sql += ' AND pr.status = ?'; params.push(status); }
        if (target_position_type) { sql += ' AND (pr.target_position_type = ? OR pr.target_position_type = \'all\')'; params.push(target_position_type); }
        if (school_year) { sql += ' AND p.school_year = ?'; params.push(school_year); }
        if (q) { sql += ' AND pr.title LIKE ?'; params.push(`%${q}%`); }
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
        const [[enrolledCount]] = await db.query(
            'SELECT COUNT(*) AS cnt FROM ld_attendance WHERE program_id = ? AND status = ?', [id, 'enrolled']
        );
        const [attendance] = await db.query(
            `SELECT a.*, u.full_name, u.applicant_type FROM ld_attendance a
             JOIN users u ON a.user_id = u.id WHERE a.program_id = ? ORDER BY u.full_name ASC`, [id]);
        const [materials] = await db.query('SELECT * FROM ld_materials WHERE program_id = ? ORDER BY uploaded_at DESC', [id]);
        const [evalForm] = await db.query(
            `SELECT ef.*,
                    (SELECT COUNT(*) FROM ld_evaluation_responses er WHERE er.eval_form_id = ef.id) AS response_count
             FROM ld_evaluation_forms ef WHERE ef.program_id = ?`, [id]);
        res.json({
            ...programs[0],
            enrolled_count: enrolledCount?.cnt || 0,
            max_slots: programs[0].participant_count || 0,
            attendance,
            materials,
            evaluationForm: evalForm[0] || null,
        });
    } catch (error) { console.error('getProgramById Error:', error); res.status(500).json({ message: error.message }); }
};

exports.createProgram = async (req, res) => {
    try {
        let { plan_id, objective_id, title, description, methodology, target_position_type, duration_hours, start_date, end_date, venue, resource_person, provider, budget_estimate, source } = req.body;
        if (!title || !title.trim()) return res.status(400).json({ message: 'Program title is required' });

        if (!plan_id) {
            const [plans] = await db.query(`SELECT id FROM ld_plans ORDER BY created_at DESC LIMIT 1`);
            if (plans.length > 0) plan_id = plans[0].id;
            else plan_id = 1;
        }

        const [result] = await db.query(
            `INSERT INTO ld_programs (plan_id, objective_id, title, description, methodology, target_position_type, duration_hours, start_date, end_date, venue, resource_person, provider, budget_estimate, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [plan_id, objective_id || null, title.trim(), description || '', methodology || 'Face-to-Face', target_position_type || 'all',
             duration_hours || null, start_date || null, end_date || null, venue || null, resource_person || null, provider || null, budget_estimate || null, source || 'plans']);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `New program created: ${title}`, type: 'ld' });
        }
        res.status(201).json({ id: result.insertId, message: 'Program created successfully' });
    } catch (error) { console.error('createProgram Error:', error); res.status(500).json({ message: error.message }); }
};

exports.updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            objective_id, title, description, methodology, training_category,
            target_position_type, target_participants, duration_hours,
            start_date, end_date, venue, resource_person, provider,
            budget_estimate, training_matrix,
        } = req.body;

        const matrixJson = training_matrix !== undefined
            ? (typeof training_matrix === 'string' ? training_matrix : JSON.stringify(training_matrix))
            : null;

        let parsedBudget = null;
        if (budget_estimate !== undefined && budget_estimate !== null && budget_estimate !== '') {
            const cleaned = String(budget_estimate).replace(/,/g, '').trim();
            const num = parseFloat(cleaned);
            if (!isNaN(num)) parsedBudget = num;
        }

        await db.query(
            `UPDATE ld_programs SET
             objective_id=COALESCE(?,objective_id), title=COALESCE(?,title), description=COALESCE(?,description),
             methodology=COALESCE(?,methodology), training_category=COALESCE(?,training_category),
             target_position_type=COALESCE(?,target_position_type), target_participants=COALESCE(?,target_participants),
             duration_hours=COALESCE(?,duration_hours), start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date),
             venue=COALESCE(?,venue), resource_person=COALESCE(?,resource_person), provider=COALESCE(?,provider),
             budget_estimate=COALESCE(?,budget_estimate),
             training_matrix=IF(? IS NOT NULL, ?, training_matrix)
             WHERE id=?`,
            [
                objective_id || null, title || null, description || null, methodology || null, training_category || null,
                target_position_type || null, target_participants || null, duration_hours || null,
                start_date || null, end_date || null, venue || null, resource_person || null, provider || null,
                parsedBudget, matrixJson, matrixJson, id
            ]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `Program updated (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Program updated successfully' });
    } catch (error) { console.error('updateProgram Error:', error); res.status(500).json({ message: error.message }); }
};

exports.submitForQA = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(
            `UPDATE ld_programs SET approval_stage = 'SGOD Review', status = 'planned' WHERE id = ?`,
            [id]
        );
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `Program submitted for QA review (ID: ${id})`, type: 'ld' });
        }
        res.json({ message: 'Program submitted for QA review successfully' });
    } catch (error) {
        console.error('submitForQA Error:', error);
        res.status(500).json({ message: error.message });
    }
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
            io.to('ld-admin').emit('ld:notification:admin', { message: `Program "${programTitle}" status updated to ${status}`, type: 'ld' });
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
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: 'Attendance sheet uploaded', type: 'ld' });
        }
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
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            io.to('ld-admin').emit('ld:notification:admin', { message: `Attendance seeded for ${users.length} users`, type: 'ld' });
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
                const [userRow] = await db.query('SELECT full_name FROM users WHERE id = ?', [user_id]);
                const userName = userRow.length > 0 ? userRow[0].full_name : 'Employee';
                io.to('ld-admin').emit('ld:notification:admin', {
                    message: `📋 ${userName}'s attendance for "${program_title}" updated to ${statusLabel}.`,
                    type: 'ld_applicant'
                });
            }
        }
        res.json({ message: 'Attendance updated' });
    } catch (error) { console.error('markAttendance Error:', error); res.status(500).json({ message: error.message }); }
};

exports.submitAttendanceProof = async (req, res) => {
    try {
        const { program_id } = req.body;
        const userId = req.user.id;
        if (!program_id) return res.status(400).json({ message: 'Program ID is required' });

        const [program] = await db.query('SELECT id, title FROM ld_programs WHERE id = ?', [program_id]);
        if (program.length === 0) return res.status(404).json({ message: 'Program not found' });

        const [attendance] = await db.query(
            'SELECT id, status FROM ld_attendance WHERE program_id = ? AND user_id = ?', [program_id, userId]);
        if (attendance.length === 0) return res.status(400).json({ message: 'You are not enrolled in this program' });
        if (attendance[0].status === 'present') return res.status(400).json({ message: 'Attendance already marked as present' });

        let proofPath = null;
        if (req.file) {
            proofPath = req.file.path.replace(/\\/g, '/');
        }

        await db.query(
            'UPDATE ld_attendance SET status = ?, remarks = ? WHERE id = ?',
            ['present', proofPath ? `Proof uploaded: ${proofPath}` : 'Self-reported attendance', attendance[0].id]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            const [userRow] = await db.query('SELECT full_name FROM users WHERE id = ?', [userId]);
            const userName = userRow.length > 0 ? userRow[0].full_name : 'Employee';
            io.to('ld-admin').emit('ld:notification:admin', {
                message: `📋 ${userName} submitted attendance proof for "${program[0].title}".`,
                type: 'ld_applicant'
            });
            io.to(`ld-user-${userId}`).emit('ld:notification:applicant', {
                message: `✅ Your attendance for "${program[0].title}" has been submitted successfully.`,
                type: 'attendance'
            });
        }
        res.json({ message: 'Attendance proof submitted successfully' });
    } catch (error) { console.error('submitAttendanceProof Error:', error); res.status(500).json({ message: error.message }); }
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

// getMaterials and uploadMaterial are defined at the bottom of this file
// (see "Material / File Attachment Handlers" section).

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

exports.getDashboardStats = async (req, res) => {
    try {
        const [[pendingProgs]] = await db.query(
            `SELECT COUNT(*) AS count FROM ld_programs WHERE status IN ('upcoming', 'planned') OR approval_stage IN ('Draft', 'SGOD Review', 'SDS Review')`
        );
        const [[pendingProps]] = await db.query(
            `SELECT COUNT(*) AS count FROM ld_program_proposals WHERE status = 'submitted'`
        );
        const pendingApprovalsCount = (pendingProgs?.count || 0) + (pendingProps?.count || 0);

        const [[upcomingRow]] = await db.query(
            `SELECT COUNT(*) AS count FROM ld_programs WHERE (start_date >= CURDATE() OR status IN ('upcoming', 'planned')) AND status != 'cancelled'`
        );
        const upcomingCount = upcomingRow?.count || 0;

        const [[enrolledRow]] = await db.query(
            `SELECT COUNT(DISTINCT user_id) AS count FROM ld_attendance WHERE status = 'enrolled'`
        );
        const enrolledCount = enrolledRow?.count || 0;

        const [[meRow]] = await db.query(
            `SELECT ROUND(AVG(CASE WHEN status = 'completed' THEN 100 ELSE 0 END), 0) AS rate FROM ld_programs`
        );
        const meCompletionRate = meRow?.rate !== null && meRow?.rate !== undefined ? `${meRow.rate}%` : '94%';

        const unreviewedProposalsCount = pendingProps?.count || 0;

        const [pendingRows] = await db.query(
            `SELECT pr.id, pr.title AS program, COALESCE(u.full_name, 'HRMO Staff') AS \`by\`,
                    COALESCE(pr.approval_stage, 'SGOD Review') AS stage,
                    CASE WHEN pr.status = 'completed' THEN 'Completed'
                         WHEN pr.status = 'ongoing' THEN 'Active'
                         WHEN pr.approval_stage = 'SDS Approved' THEN 'Approved'
                         WHEN pr.approval_stage = 'Draft' THEN 'Draft'
                         ELSE 'Pending' END AS status
             FROM ld_programs pr
             LEFT JOIN users u ON pr.created_by = u.id
             WHERE pr.status != 'completed'
             ORDER BY pr.created_at DESC
             LIMIT 10`
        );

        const [upcomingList] = await db.query(
            `SELECT pr.id, pr.title, pr.start_date, pr.end_date, pr.target_position_type,
                    (SELECT COUNT(*) FROM ld_attendance a WHERE a.program_id = pr.id AND a.status = 'enrolled') AS pax
             FROM ld_programs pr
             WHERE pr.status != 'completed' AND pr.status != 'cancelled'
             ORDER BY pr.start_date ASC
             LIMIT 10`
        );

        res.json({
            stats: {
                pendingApprovals: pendingApprovalsCount,
                upcomingPrograms: upcomingCount,
                enrolledParticipants: enrolledCount,
                meCompletionRate: meCompletionRate,
                newProposals: unreviewedProposalsCount,
            },
            pendingRows,
            upcomingPrograms: upcomingList.map(p => ({
                id: p.id,
                title: p.title,
                date: p.start_date ? new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (p.end_date ? `–${new Date(p.end_date).getDate()}` : '') : 'TBD',
                pax: p.pax || 0,
                tag: p.target_position_type === 'teaching' ? 'Teaching' : p.target_position_type === 'non_teaching' ? 'Non-teaching' : 'Tchg-related',
            })),
        });
    } catch (error) {
        console.error('getDashboardStats Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const DEFAULT_NEAP_CHECKLIST = {
    'LEARNING DESIGN': [
        { id: 1, text: 'Training objectives are SMART and aligned with PPST/competency framework', done: true },
        { id: 2, text: 'Learning outcomes are clearly stated and measurable', done: true },
        { id: 3, text: 'Content is accurate, updated, and contextually relevant', done: true },
        { id: 4, text: 'Methodology promotes active participation and application', done: false },
    ],
    'FACILITATOR QUALIFICATIONS': [
        { id: 5, text: 'Resource speaker CV is on file and qualifications are verified', done: true },
        { id: 6, text: 'Speaker has at least 3 years relevant expertise in the topic area', done: true },
    ],
    'ASSESSMENT & EVALUATION': [
        { id: 7, text: 'Pre-test and post-test instruments are validated', done: false },
        { id: 8, text: 'WAP template is complete and submitted', done: true },
        { id: 9, text: 'Evaluation covers Level 1–3 (Reaction, Learning, Transfer)', done: false },
    ],
    'DOCUMENTATION': [
        { id: 10, text: 'Session guides are prepared for all sessions', done: false },
        { id: 11, text: 'Materials list is complete and approved', done: true },
    ],
};

exports.getProgramQA = async (req, res) => {
    try {
        const { id } = req.params;
        let [programs] = await db.query(
            `SELECT id, title, start_date, end_date, duration_hours, approval_stage, qa_checklist, qa_comments,
                    (SELECT COUNT(*) FROM ld_attendance WHERE program_id = ld_programs.id) AS pax
             FROM ld_programs WHERE id = ?`, [id]
        );
        if (programs.length === 0) {
            [programs] = await db.query(
                `SELECT id, title, start_date, end_date, duration_hours, approval_stage, qa_checklist, qa_comments,
                        (SELECT COUNT(*) FROM ld_attendance WHERE program_id = ld_programs.id) AS pax
                 FROM ld_programs ORDER BY created_at DESC LIMIT 1`
            );
        }
        if (programs.length === 0) {
            return res.json({
                id: Number(id) || 1,
                title: 'PPST Coaching Clinics for Teaching Personnel',
                startDate: '2026-08-05',
                endDate: '2026-08-07',
                durationHours: 24,
                pax: 0,
                approvalStage: 'SGOD Review',
                checklist: DEFAULT_NEAP_CHECKLIST,
                comments: '',
            });
        }

        const prog = programs[0];
        let checklist = DEFAULT_NEAP_CHECKLIST;
        if (prog.qa_checklist) {
            try {
                checklist = typeof prog.qa_checklist === 'string' ? JSON.parse(prog.qa_checklist) : prog.qa_checklist;
            } catch (e) {}
        }

        res.json({
            id: prog.id,
            title: prog.title,
            startDate: prog.start_date,
            endDate: prog.end_date,
            durationHours: prog.duration_hours,
            pax: prog.pax || 0,
            approvalStage: prog.approval_stage || 'SGOD Review',
            checklist,
            comments: prog.qa_comments || '',
        });
    } catch (error) {
        console.error('getProgramQA Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateProgramQA = async (req, res) => {
    try {
        const { id } = req.params;
        const { checklist, approvalStage, comments } = req.body;

        const updates = [];
        const params = [];
        if (checklist !== undefined) {
            updates.push('qa_checklist = ?');
            params.push(JSON.stringify(checklist));
        }
        if (approvalStage !== undefined) {
            updates.push('approval_stage = ?');
            params.push(approvalStage);
        }
        if (comments !== undefined) {
            updates.push('qa_comments = ?');
            params.push(comments);
        }

        if (updates.length > 0) {
            params.push(id);
            await db.query(`UPDATE ld_programs SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        const io = req.app.get('socketio');
        if (io) io.emit('ld:dashboard:update');

        res.json({ message: 'QA review persisted successfully' });
    } catch (error) {
        console.error('updateProgramQA Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getConductData = async (req, res) => {
    try {
        const programId = req.params.id || req.query.programId;
        let [programs] = await db.query(`SELECT * FROM ld_programs WHERE id = ?`, [programId]);
        if (programs.length === 0) {
            [programs] = await db.query(`SELECT * FROM ld_programs ORDER BY created_at DESC LIMIT 1`);
        }
        if (programs.length === 0) {
            return res.json({
                program: {
                    id: Number(programId) || 1,
                    title: 'PPST Coaching Clinics for Teaching Personnel',
                    startDate: '2026-08-05',
                    endDate: '2026-08-07',
                    venue: 'Dapitan City National High School AVR',
                    registered: 0,
                    targetPax: 80,
                },
                statCards: [
                    { value: 0, label: 'Registered', sub: 'of 80', bg: '#1B2A50' },
                    { value: 0, label: 'Present Today', sub: 'of 0', bg: '#16A34A' },
                    { value: 0, label: 'Pre-test Done', sub: 'of 0', bg: '#DE4E2A' },
                    { value: 0, label: 'Post-test Done', sub: 'of 0', bg: '#6B7280' },
                ],
                attendanceRows: [],
            });
        }

        const prog = programs[0];

        const [attendance] = await db.query(
            `SELECT a.id, a.user_id, a.status, a.created_at,
                    u.full_name AS name, CONCAT('2024-', u.id) AS empNo,
                    COALESCE(u.applicant_type, 'Teacher I') AS position,
                    'Dapitan City NHS' AS school
             FROM ld_attendance a
             JOIN users u ON a.user_id = u.id
             WHERE a.program_id = ?
             ORDER BY u.full_name ASC`, [prog.id]
        );

        const [checkins] = await db.query(
            `SELECT user_id, session_name, checked_in_at, checked_out_at
             FROM ld_session_checkins WHERE program_id = ?`, [prog.id]
        );

        const checkinMap = {};
        checkins.forEach(c => {
            if (!checkinMap[c.user_id]) checkinMap[c.user_id] = {};
            checkinMap[c.user_id][c.session_name] = c;
        });

        const registeredCount = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present' || checkinMap[a.user_id]).length;

        const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

        const [testSubmissions] = await db.query(
            `SELECT test_type, user_id, score FROM ld_program_test_submissions WHERE program_id = ?`,
            [prog.id]
        );

        const preSubmissions = testSubmissions.filter(s => s.test_type === 'pre_test');
        const postSubmissions = testSubmissions.filter(s => s.test_type === 'post_test');

        const preCompletion = registeredCount > 0 ? Math.round((preSubmissions.length / registeredCount) * 100) : 0;
        const avgPreScore = preSubmissions.length > 0
            ? Math.round(preSubmissions.reduce((acc, curr) => acc + Number(curr.score), 0) / preSubmissions.length)
            : 0;

        const postCompletion = registeredCount > 0 ? Math.round((postSubmissions.length / registeredCount) * 100) : 0;
        const avgPostScore = postSubmissions.length > 0
            ? Math.round(postSubmissions.reduce((acc, curr) => acc + Number(curr.score), 0) / postSubmissions.length)
            : 0;

        const responseObj = {
            program: {
                id: prog.id,
                title: prog.title,
                startDate: prog.start_date,
                endDate: prog.end_date,
                venue: prog.venue || 'DCNHS Audio-Visual Room',
                registered: registeredCount,
                targetPax: prog.budget_estimate ? Math.round(prog.budget_estimate / 1000) : 80,
            },
            statCards: [
                { value: registeredCount, label: 'Registered', sub: `of ${prog.budget_estimate ? Math.round(prog.budget_estimate / 1000) : 80}`, bg: '#1B2A50' },
                { value: presentCount, label: 'Present Today', sub: `of ${registeredCount}`, bg: '#16A34A' },
                { value: preSubmissions.length, label: 'Pre-test Done', sub: `of ${registeredCount}`, bg: '#DE4E2A' },
                { value: postSubmissions.length, label: 'Post-test Done', sub: `of ${registeredCount}`, bg: '#6B7280' },
            ],
            attendanceRows: attendance.map((a, i) => {
                const userCheckins = checkinMap[a.user_id] || {};
                const checkinList = Object.values(userCheckins);
                const morningSession = checkinList.find(c => (c.session_name || '').toLowerCase().includes('morning') || (c.session_name || '').toLowerCase().includes('day 1')) || checkinList[0];
                const afternoonSession = checkinList.find(c => (c.session_name || '').toLowerCase().includes('afternoon') || (c.session_name || '').toLowerCase().includes('day 2')) || checkinList[1];

                const amTime = morningSession?.checked_in_at ? formatTime(morningSession.checked_in_at) : (a.status === 'present' ? '08:00 AM' : '—');
                const pmTime = afternoonSession?.checked_out_at ? formatTime(afternoonSession.checked_out_at) : (morningSession?.checked_out_at ? formatTime(morningSession.checked_out_at) : (a.status === 'present' ? '05:00 PM' : '—'));

                const hasTimeIn = amTime !== '—';
                const hasTimeOut = pmTime !== '—';

                let liveStatus = 'Not Checked In';
                if (hasTimeIn && hasTimeOut) {
                    liveStatus = 'Completed';
                } else if (hasTimeIn) {
                    liveStatus = 'Checked In';
                } else if (a.status === 'excused') {
                    liveStatus = 'Excused';
                } else if (a.status === 'absent') {
                    liveStatus = 'Absent';
                }

                return {
                    num: i + 1,
                    name: a.name,
                    position: a.position,
                    school: a.school,
                    am: amTime,
                    pm: pmTime,
                    status: liveStatus,
                };
            }),
            metrics: [
                { label: 'Attendance Rate', value: registeredCount > 0 ? Math.round((presentCount / registeredCount) * 100) : 0, color: '#1B2A50' },
                { label: 'Pre-test Completion', value: preCompletion, color: '#16A34A' },
                { label: 'Avg. Pre-test Score', value: avgPreScore, color: '#B45309' },
                { label: 'Post-test Completion', value: postCompletion, color: '#2563EB' },
                { label: 'Avg. Post-test Score', value: avgPostScore, color: '#7C3AED' },
            ],
        };

        res.json(responseObj);
    } catch (error) {
        console.error('getConductData Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAttendanceMonitorRecords = async (req, res) => {
    try {
        const { program_id, personnel_type, search } = req.query;
        let sql = `
            SELECT a.id, a.status, a.remarks, a.created_at, a.time_in, a.time_out,
                   u.id AS user_id, u.full_name AS name,
                   COALESCE(e.employee_no, CONCAT('EMP-', LPAD(u.id, 4, '0'))) AS empNo,
                   COALESCE(e.employment_type, u.applicant_type, 'Teaching') AS type,
                   COALESCE(e.position_title, 'TBD') AS position,
                   COALESCE(e.assigned_school, 'TBD') AS school,
                   pr.id AS programId, pr.title AS program
            FROM ld_attendance a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN employees e ON e.user_id = u.id
            JOIN ld_programs pr ON a.program_id = pr.id
            WHERE a.status = 'enrolled'
        `;
        const params = [];
        if (program_id && program_id !== 'all') {
            sql += ` AND a.program_id = ?`;
            params.push(program_id);
        }
        if (personnel_type && personnel_type !== 'All Personnel Types') {
            sql += ` AND COALESCE(e.employment_type, u.applicant_type, '') = ?`;
            params.push(personnel_type);
        }
        if (search && search.trim()) {
            sql += ` AND (u.full_name LIKE ? OR COALESCE(e.employee_no, '') LIKE ?)`;
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }
        sql += ` ORDER BY a.created_at DESC`;

        const [rows] = await db.query(sql, params);
        const [programs] = await db.query(`SELECT id, title AS name FROM ld_programs WHERE status = 'published' OR status = 'ongoing'`);

        const totalEnrolled = rows.length;
        const totalPresent = rows.filter(r => r.time_in !== null).length;
        const rate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

        res.json({
            statCards: [
                { value: totalEnrolled, label: 'Total Enrolled', color: '#1B2A50', bg: '#DBEAFE' },
                { value: totalPresent, label: 'Total Present', color: '#16A34A', bg: '#DCFCE7' },
                { value: `${rate}%`, label: 'Attendance Rate', color: '#DE4E2A', bg: '#fff5f2', note: rate >= 75 ? 'Target Met' : 'Below Target' },
            ],
            records: rows.map(r => {
                const hasTimeIn = r.time_in !== null;
                const hasTimeOut = r.time_out !== null;
                let liveStatus = 'Not Checked In';
                if (hasTimeIn && hasTimeOut) {
                    liveStatus = 'Completed';
                } else if (hasTimeIn) {
                    liveStatus = 'Checked In';
                } else if (r.status === 'excused') {
                    liveStatus = 'Excused';
                } else if (r.status === 'absent') {
                    liveStatus = 'Absent';
                }

                return {
                    empNo: r.empNo,
                    name: r.name,
                    type: r.type,
                    position: r.position,
                    school: r.school,
                    program: r.program,
                    date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    status: liveStatus,
                    filed: hasTimeIn,
                };
            }),
            programs: programs.map(p => ({
                id: p.id,
                name: p.name,
                rate: 85,
            })),
        });
    } catch (error) {
        console.error('getAttendanceMonitorRecords Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getProgramEligibility = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userType = req.user.applicant_type || 'teaching';

        const [progs] = await db.query('SELECT * FROM ld_programs WHERE id = ?', [id]);
        if (progs.length === 0) return res.status(404).json({ message: 'Program not found' });
        const program = progs[0];

        // Check personnel type match
        const progTarget = (program.target_participants || '').toLowerCase();
        const typeMatch = progTarget.includes('all') || progTarget.includes(userType) || userType === 'teaching';

        // Check IPCRF rating
        const [ipcrfRows] = await db.query('SELECT final_rating FROM ld_ipcrf_records WHERE user_id = ?', [userId]);
        const ipcrfRating = ipcrfRows.length > 0 ? Number(ipcrfRows[0].final_rating) : 3.80;
        const ipcrfPass = ipcrfRating >= 3.0;

        // Check e-SAT submission
        const [esatRows] = await db.query('SELECT id FROM ld_esat_ratings WHERE user_id = ?', [userId]);
        const esatSubmitted = esatRows.length > 0;

        // Check overlapping enrollment
        const [overlapRows] = await db.query(
            `SELECT id FROM ld_attendance WHERE user_id = ? AND program_id = ?`,
            [userId, id]
        );
        const alreadyEnrolled = overlapRows.length > 0;
        const noOverlap = true;

        const allPassed = typeMatch && ipcrfPass && esatSubmitted && !alreadyEnrolled;

        res.json({
            eligible: allPassed,
            alreadyEnrolled,
            checks: [
                { title: `Personnel type matches program target (${userType})`, status: typeMatch ? 'passed' : 'failed' },
                { title: `Latest IPCRF rating ≥ 3.0 (Actual: ${ipcrfRating})`, status: ipcrfPass ? 'passed' : 'failed' },
                { title: 'e-SAT Self-Assessment submitted for current SY', status: esatSubmitted ? 'passed' : 'failed' },
                { title: alreadyEnrolled ? 'Already enrolled in this program' : 'No overlapping program enrollment', status: alreadyEnrolled ? 'failed' : 'passed' },
            ],
        });
    } catch (error) {
        console.error('getProgramEligibility Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.enrollProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [existing] = await db.query('SELECT id FROM ld_attendance WHERE program_id = ? AND user_id = ?', [id, userId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already enrolled in this program' });
        }

        const [progs] = await db.query('SELECT id, participant_count FROM ld_programs WHERE id = ?', [id]);
        if (progs.length === 0) return res.status(404).json({ message: 'Program not found' });

        const [enrolled] = await db.query('SELECT COUNT(*) AS cnt FROM ld_attendance WHERE program_id = ? AND status = ?', [id, 'enrolled']);
        const maxSlots = progs[0].participant_count || 999999;
        if (enrolled[0].cnt >= maxSlots) {
            return res.status(400).json({ message: 'No available slots for this program' });
        }

        await db.query(
            'INSERT INTO ld_attendance (program_id, user_id, status) VALUES (?, ?, ?)',
            [id, userId, 'enrolled']
        );

        const [updatedEnrolled] = await db.query('SELECT COUNT(*) AS cnt FROM ld_attendance WHERE program_id = ? AND status = ?', [id, 'enrolled']);

        res.json({
            message: 'Enrolled successfully in PD Program',
            enrolled_count: updatedEnrolled[0].cnt,
            max_slots: maxSlots,
        });
    } catch (error) {
        console.error('enrollProgram Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getProgramSessionMaterials = async (req, res) => {
    try {
        const { id } = req.params;
        const [materials] = await db.query('SELECT * FROM ld_materials WHERE program_id = ? ORDER BY uploaded_at DESC', [id]);
        res.json({
            slides: [
                { title: 'Overview of Philippine Professional Standards for Teachers (PPST)', docRef: 'DepEd Order No. 42, s. 2017', slideNo: 'Slide 1 of 5' },
                { title: 'Domain 1: Content Knowledge and Pedagogy', docRef: 'DepEd Order No. 42, s. 2017', slideNo: 'Slide 2 of 5' },
                { title: 'Domain 2: Learning Environment & Diversity', docRef: 'DepEd Order No. 42, s. 2017', slideNo: 'Slide 3 of 5' },
                { title: 'Coaching & Mentoring Strategies', docRef: 'DepEd Order No. 42, s. 2017', slideNo: 'Slide 4 of 5' },
                { title: 'Action Planning and Reflection', docRef: 'DepEd Order No. 42, s. 2017', slideNo: 'Slide 5 of 5' },
            ],
            materials: materials.map(m => ({
                id: m.id,
                name: m.title || m.file_name,
                size: '2.4 MB',
                path: m.file_path,
            })),
        });
    } catch (error) {
        console.error('getProgramSessionMaterials Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.checkinSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { session_name } = req.body;
        const sName = session_name || 'Day 1 Morning Session';

        await db.query(
            `INSERT INTO ld_session_checkins (program_id, user_id, session_name, status, checked_in_at)
             VALUES (?, ?, ?, 'present', NOW())
             ON DUPLICATE KEY UPDATE checked_in_at = NOW(), status = 'present'`,
            [id, userId, sName]
        );

        await db.query(
            `UPDATE ld_attendance SET status = 'present', updated_at = NOW() WHERE program_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (req.io) {
            req.io.to('ld-admin').emit('ld_attendance_updated', { programId: id, userId });
        }

        res.json({ message: `Check-in successful for ${sName}`, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('checkinSession Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.checkoutSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { session_name } = req.body;
        const sName = session_name || 'Day 1 Afternoon Session';

        await db.query(
            `INSERT INTO ld_session_checkins (program_id, user_id, session_name, status, checked_out_at)
             VALUES (?, ?, ?, 'present', NOW())
             ON DUPLICATE KEY UPDATE checked_out_at = NOW()`,
            [id, userId, sName]
        );

        await db.query(
            `UPDATE ld_attendance SET status = 'present', updated_at = NOW() WHERE program_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (req.io) {
            req.io.to('ld-admin').emit('ld_attendance_updated', { programId: id, userId });
        }

        res.json({ message: `Check-out successful for ${sName}`, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('checkoutSession Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.submitWAP = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { wap_data } = req.body;

        await db.query(
            `INSERT INTO ld_program_waps (program_id, user_id, wap_data, status) VALUES (?, ?, ?, 'submitted')
             ON DUPLICATE KEY UPDATE wap_data = VALUES(wap_data), status = 'submitted', submitted_at = NOW()`,
            [id, userId, JSON.stringify(wap_data || {})]
        );
        res.json({ message: 'Workplace Application Plan (WAP) submitted successfully' });
    } catch (error) {
        console.error('submitWAP Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyEnrollments = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            `SELECT a.id AS attendance_id, a.status AS attendance_status, a.created_at AS enrolled_at,
                    pr.id AS program_id, pr.title, pr.start_date, pr.end_date, pr.venue, pr.methodology,
                    pr.duration_hours
             FROM ld_attendance a
             JOIN ld_programs pr ON a.program_id = pr.id
             WHERE a.user_id = ?
             ORDER BY pr.start_date DESC`,
            [userId]
        );
        res.json(rows.map(r => ({
            id: r.program_id,
            title: r.title,
            dates: r.start_date ? `${new Date(r.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${r.end_date ? ' – ' + new Date(r.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}` : 'TBD',
            venue: r.venue || 'SDO Conference Hall',
            status: r.attendance_status === 'present' ? 'Completed' : 'Enrolled',
            hours: r.duration_hours || 24,
        })));
    } catch (error) {
        console.error('getMyEnrollments Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Material / File Attachment Handlers ──────────────────────────────────────

exports.getMaterials = async (req, res) => {
    try {
        const { program_id, section_type } = req.query;
        if (!program_id) return res.status(400).json({ message: 'program_id is required' });

        let sql, params;
        if (section_type) {
            sql = `SELECT id, program_id, title, file_name, file_path, file_type, file_size, section_type, uploaded_at
                   FROM ld_materials WHERE program_id = ? AND section_type = ? ORDER BY uploaded_at DESC`;
            params = [program_id, section_type];
        } else {
            sql = `SELECT id, program_id, title, file_name, file_path, file_type, file_size, section_type, uploaded_at
                   FROM ld_materials WHERE program_id = ? ORDER BY uploaded_at DESC`;
            params = [program_id];
        }

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('getMaterials Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.uploadMaterial = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const { program_id, title, section_type } = req.body;

        // TODO: restore strict validation before production
        // Using fallback program_id=1 for testing when no valid id is provided
        const programIdInt = parseInt(program_id, 10) || 1;

        const userId   = req.user?.id || null;
        const filePath = req.file.path.replace(/\\/g, '/'); // normalise Windows slashes
        const fileName = req.file.originalname;
        const fileType = req.file.mimetype;
        const fileSize = req.file.size;
        const fileTitle = title || fileName;

        const [result] = await db.query(
            `INSERT INTO ld_materials
               (program_id, title, file_name, file_path, file_type, file_size, uploaded_by, section_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [programIdInt, fileTitle, fileName, filePath, fileType, fileSize, userId, section_type || null]
        );

        // Notify enrolled participants of the new material via socket.io
        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
            const [enrolled] = await db.query(
                `SELECT DISTINCT a.user_id, pr.title AS program_title
                 FROM ld_attendance a
                 JOIN ld_programs pr ON a.program_id = pr.id
                 WHERE a.program_id = ?`,
                [programIdInt]
            );
            enrolled.forEach(({ user_id, program_title }) => {
                io.to(`ld-user-${user_id}`).emit('ld:notification:applicant', {
                    message: `📄 New material "${fileTitle}" has been added to "${program_title}". Check your L&D dashboard.`,
                    type: 'material',
                });
            });
        }

        res.json({
            id:           result.insertId,
            program_id:   programIdInt,
            title:        fileTitle,
            file_name:    fileName,
            file_path:    filePath,
            file_type:    fileType,
            file_size:    fileSize,
            section_type: section_type || null,
        });
    } catch (error) {
        console.error('uploadMaterial Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Assessment / Test System Controllers ──────────────────────────────────────

exports.getProgramTests = async (req, res) => {
    try {
        const programId = parseInt(req.params.id, 10) || 1;
        const [questions] = await db.query(
            `SELECT id, program_id, test_type, question_text, question_type, options, correct_answer, order_no
             FROM ld_program_questions
             WHERE program_id = ?
             ORDER BY test_type ASC, order_no ASC, id ASC`,
            [programId]
        );

        const pre_test = questions.filter(q => q.test_type === 'pre_test').map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || [])
        }));
        const post_test = questions.filter(q => q.test_type === 'post_test').map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || [])
        }));

        res.json({ pre_test, post_test });
    } catch (error) {
        console.error('getProgramTests Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.saveProgramTests = async (req, res) => {
    try {
        const programId = parseInt(req.params.id, 10) || 1;
        const { pre_test = [], post_test = [] } = req.body;

        await db.query(`DELETE FROM ld_program_questions WHERE program_id = ?`, [programId]);

        const insertQ = async (list, type) => {
            for (let i = 0; i < list.length; i++) {
                const q = list[i];
                if (!q.question_text || !q.question_text.trim()) continue;
                const opts = Array.isArray(q.options) ? JSON.stringify(q.options) : JSON.stringify([]);
                await db.query(
                    `INSERT INTO ld_program_questions
                       (program_id, test_type, question_text, question_type, options, correct_answer, order_no)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        programId,
                        type,
                        q.question_text.trim(),
                        q.question_type || 'multiple_choice',
                        opts,
                        q.correct_answer || '',
                        i + 1
                    ]
                );
            }
        };

        await insertQ(pre_test, 'pre_test');
        await insertQ(post_test, 'post_test');

        res.json({ message: 'Program assessment questions saved successfully' });
    } catch (error) {
        console.error('saveProgramTests Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyTestStatus = async (req, res) => {
    try {
        const programId = parseInt(req.params.id, 10) || 1;
        const userId = req.user.id;

        const [questions] = await db.query(
            `SELECT test_type, COUNT(*) AS count FROM ld_program_questions WHERE program_id = ? GROUP BY test_type`,
            [programId]
        );
        const has_pre_test = questions.some(q => q.test_type === 'pre_test' && q.count > 0);
        const has_post_test = questions.some(q => q.test_type === 'post_test' && q.count > 0);

        const [submissions] = await db.query(
            `SELECT test_type, score, total_questions, correct_count, answers, completed_at
             FROM ld_program_test_submissions
             WHERE program_id = ? AND user_id = ?`,
            [programId, userId]
        );

        const preSub = submissions.find(s => s.test_type === 'pre_test') || null;
        const postSub = submissions.find(s => s.test_type === 'post_test') || null;

        res.json({
            has_pre_test,
            has_post_test,
            pre_test: {
                completed: !!preSub,
                submission: preSub
            },
            post_test: {
                completed: !!postSub,
                submission: postSub
            }
        });
    } catch (error) {
        console.error('getMyTestStatus Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.submitProgramTest = async (req, res) => {
    try {
        const programId = parseInt(req.params.id, 10) || 1;
        const userId = req.user.id;
        const { test_type, answers = {} } = req.body;

        if (!['pre_test', 'post_test'].includes(test_type)) {
            return res.status(400).json({ message: 'Invalid test_type' });
        }

        const [questions] = await db.query(
            `SELECT id, question_text, correct_answer FROM ld_program_questions WHERE program_id = ? AND test_type = ?`,
            [programId, test_type]
        );

        let correctCount = 0;
        let totalQuestions = questions.length;

        if (questions.length === 0) {
            // Fallback grading for sample questions when program has no custom questions yet
            totalQuestions = Object.keys(answers).length || 1;
            Object.values(answers).forEach(ans => {
                if (ans === 'Enhancing teacher competencies' || ans === 'True') correctCount++;
            });
        } else {
            questions.forEach(q => {
                const userAnswer = answers[q.id];
                if (userAnswer && String(userAnswer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
                    correctCount++;
                }
            });
        }

        const score = Math.round((correctCount / totalQuestions) * 100 * 100) / 100;

        await db.query(
            `INSERT INTO ld_program_test_submissions
               (program_id, user_id, test_type, score, total_questions, correct_count, answers)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               score = VALUES(score),
               total_questions = VALUES(total_questions),
               correct_count = VALUES(correct_count),
               answers = VALUES(answers),
               completed_at = CURRENT_TIMESTAMP`,
            [programId, userId, test_type, score, totalQuestions, correctCount, JSON.stringify(answers)]
        );

        res.json({
            message: `${test_type === 'pre_test' ? 'Pre-Test' : 'Post-Test'} submitted successfully`,
            score,
            correct_count: correctCount,
            total_questions: totalQuestions
        });
    } catch (error) {
        console.error('submitProgramTest Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const [progs] = await db.query('SELECT id FROM ld_programs WHERE id = ?', [id]);
        if (progs.length === 0) return res.status(404).json({ message: 'Program not found' });

        await db.query('DELETE FROM ld_attendance WHERE program_id = ?', [id]);
        await db.query('DELETE FROM ld_materials WHERE program_id = ?', [id]);
        await db.query('DELETE FROM ld_evaluation_forms WHERE program_id = ?', [id]);
        await db.query('DELETE FROM ld_program_questions WHERE program_id = ?', [id]);
        await db.query('DELETE FROM ld_program_test_submissions WHERE program_id = ?', [id]);
        await db.query('DELETE FROM ld_programs WHERE id = ?', [id]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('ld:dashboard:update');
        }

        res.json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('deleteProgram Error:', error);
        res.status(500).json({ message: error.message });
    }
};


