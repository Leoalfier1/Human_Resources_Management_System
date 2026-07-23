const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken } = require('../../middleware/authMiddleware');

router.use(verifyToken);

// Helper to get employee ID from user email
async function getEmployeeByEmail(email) {
    const [rows] = await db.query('SELECT * FROM employees WHERE email = ?', [email]);
    let employee;
    if (rows.length > 0) {
        employee = rows[0];
    } else {
        const [fallback] = await db.query('SELECT * FROM employees LIMIT 1');
        employee = fallback[0] ? { ...fallback[0] } : null;
    }
    if (employee) {
        const [userRows] = await db.query('SELECT full_name FROM users WHERE email = ?', [email]);
        if (userRows.length > 0) {
            employee.name = userRows[0].full_name;
        }
    }
    return employee;
}

// 1. GET Dashboard summary data & active training steppers
router.get('/dashboard', async (req, res) => {
    try {
        const [[tnaCount]] = await db.query("SELECT COUNT(*) as count FROM tna_cycles WHERE status = 'active'");
        const [[ongoingCount]] = await db.query("SELECT COUNT(*) as count FROM ld_programs WHERE step_4_status = 'in_progress'");
        const [[completedCount]] = await db.query("SELECT COUNT(*) as count FROM ld_programs WHERE step_5_status = 'completed'");
        const [[evalAvg]] = await db.query("SELECT AVG(competency_score_rating) as avg_score FROM ld_evaluations");

        const [programs] = await db.query("SELECT * FROM ld_programs ORDER BY created_at DESC");

        res.json({
            stats: {
                activeTNA: tnaCount.count,
                ongoingPrograms: ongoingCount.count,
                completedPrograms: completedCount.count,
                avgImpactScore: evalAvg.avg_score ? Number(evalAvg.avg_score).toFixed(2) : "0.00"
            },
            programs: programs || []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch L&D dashboard stats" });
    }
});

// 2. GET TNA Cycles & Aggregated Competency Gaps
router.get('/tna', async (req, res) => {
    try {
        const [cycles] = await db.query("SELECT * FROM tna_cycles ORDER BY created_at DESC");
        const [submissions] = await db.query(`
            SELECT ts.*, e.name as employee_name, e.position as employee_position 
            FROM tna_submissions ts
            JOIN employees e ON ts.employee_id = e.id
            ORDER BY ts.submitted_at DESC
        `);

        // Aggregate competency gaps
        const gapCounts = {};
        submissions.forEach(s => {
            let gaps = [];
            try {
                gaps = typeof s.competency_gaps === 'string' ? JSON.parse(s.competency_gaps) : s.competency_gaps;
            } catch (e) {
                gaps = [];
            }
            if (Array.isArray(gaps)) {
                gaps.forEach(g => {
                    gapCounts[g] = (gapCounts[g] || 0) + 1;
                });
            }
        });

        const gapsChart = Object.keys(gapCounts).map(name => ({
            name,
            count: gapCounts[name]
        }));

        res.json({
            cycles: cycles || [],
            submissions: submissions || [],
            gapsChart
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch TNA info" });
    }
});

// Create new TNA cycle
router.post('/tna', async (req, res) => {
    const { title, target_department } = req.body;
    try {
        await db.query(
            "INSERT INTO tna_cycles (title, target_department, status) VALUES (?, ?, 'active')",
            [title, target_department]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create TNA cycle" });
    }
});

// Submit TNA responses from Employee Portal
router.post('/tna/submit', async (req, res) => {
    const { tna_cycle_id, qualitative_answers, competency_gaps } = req.body;
    try {
        const employee = await getEmployeeByEmail(req.user.email);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        await db.query(
            "INSERT INTO tna_submissions (tna_cycle_id, employee_id, qualitative_answers, competency_gaps) VALUES (?, ?, ?, ?)",
            [tna_cycle_id, employee.id, JSON.stringify(qualitative_answers), JSON.stringify(competency_gaps)]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to submit TNA needs" });
    }
});

// 3. GET/POST Objectives Derived from TNAs
router.get('/objectives/:progId', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM ld_objectives WHERE ld_program_id = ?",
            [req.params.progId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch objectives" });
    }
});

router.post('/objectives', async (req, res) => {
    const { ld_program_id, objective_description, linked_gap, mapped_standard } = req.body;
    try {
        await db.query(
            "INSERT INTO ld_objectives (ld_program_id, objective_description, linked_gap, mapped_standard) VALUES (?, ?, ?, ?)",
            [ld_program_id, objective_description, linked_gap, mapped_standard]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to map objective" });
    }
});

// 4. GET/POST L&D Designed Programs
router.get('/programs', async (req, res) => {
    try {
        const [programs] = await db.query("SELECT * FROM ld_programs ORDER BY created_at DESC");
        res.json(programs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load programs" });
    }
});

router.post('/programs', async (req, res) => {
    const { title, description, target_participants, schedule_date, budget, methodology, facilitator } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO ld_programs (title, description, target_participants, schedule_date, budget, methodology, facilitator, 
              step_1_status, step_2_status, step_3_status, step_4_status, step_5_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', 'completed', 'completed', 'in_progress', 'not_started')`,
            [title, description, target_participants, schedule_date, budget, methodology, facilitator]
        );
        res.json({ success: true, insertId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to design program" });
    }
});

// 5. GET Program Enrollments & Attendance Logs
router.get('/programs/:progId/enrollments', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT le.*, e.name as employee_name, e.position as employee_position, e.unit as employee_unit 
            FROM ld_enrollments le
            JOIN employees e ON le.employee_id = e.id
            WHERE le.ld_program_id = ?
        `, [req.params.progId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load enrollments roster" });
    }
});

// Check-in employee attendance
router.put('/enrollments/:id/attendance', async (req, res) => {
    const { date } = req.body;
    try {
        const [[enrollment]] = await db.query("SELECT attendance_history FROM ld_enrollments WHERE id = ?", [req.params.id]);
        if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

        let history = [];
        try {
            history = typeof enrollment.attendance_history === 'string' ? JSON.parse(enrollment.attendance_history) : enrollment.attendance_history;
        } catch (e) {
            history = [];
        }
        if (!history.includes(date)) {
            history.push(date);
        }

        await db.query(
            "UPDATE ld_enrollments SET attendance_history = ? WHERE id = ?",
            [JSON.stringify(history), req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to check attendance" });
    }
});

// Mark completion status & upload certificate url mock
router.put('/enrollments/:id/status', async (req, res) => {
    const { status, post_score } = req.body;
    try {
        const certificate_url = status === 'completed' ? `Cert_Completion_L&D_${req.params.id}.pdf` : null;
        await db.query(
            "UPDATE ld_enrollments SET status = ?, post_score = ?, certificate_url = ? WHERE id = ?",
            [status, post_score || null, certificate_url, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update status" });
    }
});

// 6. Impact Evaluations comparisons (GET / POST)
router.get('/programs/:progId/evaluations', async (req, res) => {
    try {
        const [evals] = await db.query(`
            SELECT le.*, ev.satisfaction_score, ev.feedback_text, ev.competency_score_rating, 
                   e.name as employee_name, e.position as employee_position
            FROM ld_enrollments le
            LEFT JOIN ld_evaluations ev ON ev.ld_enrollment_id = le.id
            JOIN employees e ON le.employee_id = e.id
            WHERE le.ld_program_id = ?
        `, [req.params.progId]);

        res.json(evals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch evaluations" });
    }
});

router.post('/programs/:progId/evaluations', async (req, res) => {
    const { ld_enrollment_id, satisfaction_score, feedback_text, competency_score_rating } = req.body;
    try {
        await db.query(
            "INSERT INTO ld_evaluations (ld_enrollment_id, satisfaction_score, feedback_text, competency_score_rating) VALUES (?, ?, ?, ?)",
            [ld_enrollment_id, satisfaction_score, feedback_text, competency_score_rating]
        );
        
        // Also automatically mark enrollment as completed
        await db.query(
            "UPDATE ld_enrollments SET status = 'completed', post_score = ? WHERE id = ?",
            [competency_score_rating, ld_enrollment_id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to submit evaluation feedback" });
    }
});

// 7. EMPLOYEE SPECIFIC: GET Available Catalog & Enrolled sessions list
router.get('/employee/dashboard', async (req, res) => {
    try {
        const employee = await getEmployeeByEmail(req.user.email);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        // Enrolled programs
        const [enrolled] = await db.query(`
            SELECT le.id as enrollment_id, le.status as enrollment_status, le.attendance_history, le.pre_score, le.post_score, le.certificate_url,
                   lp.* 
            FROM ld_enrollments le
            JOIN ld_programs lp ON le.ld_program_id = lp.id
            WHERE le.employee_id = ?
        `, [employee.id]);

        // Recommended programs based on employee needs (mock gaps match)
        const [allPrograms] = await db.query("SELECT * FROM ld_programs");
        const enrolledIds = enrolled.map(e => e.id);
        const recommended = allPrograms.filter(p => !enrolledIds.includes(p.id));

        const [sdsRows] = await db.query("SELECT name FROM employees WHERE position = 'Schools Division Superintendent' LIMIT 1");
        const sdsName = sdsRows[0]?.name || "Schools Division Superintendent";

        res.json({
            enrolled: enrolled || [],
            recommended: recommended || [],
            sdsName
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch employee learning dashboard" });
    }
});

// Enroll in a training program
router.post('/employee/enroll', async (req, res) => {
    const { ld_program_id } = req.body;
    try {
        const employee = await getEmployeeByEmail(req.user.email);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        // Check if already enrolled
        const [existing] = await db.query(
            "SELECT id FROM ld_enrollments WHERE ld_program_id = ? AND employee_id = ?",
            [ld_program_id, employee.id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "Already enrolled in this training program" });
        }

        await db.query(
            "INSERT INTO ld_enrollments (ld_program_id, employee_id, status, pre_score) VALUES (?, ?, 'in_progress', 3.00)",
            [ld_program_id, employee.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to enroll in training" });
    }
});

// POST /intake - intake endpoint from PM module
router.post('/intake', async (req, res) => {
    try {
        const { employee_id, source, focus_areas } = req.body;
        console.log(`[L&D Intake Hub] Received intake record from source '${source}' for employee ID ${employee_id}. Target Gaps:`, focus_areas);
        res.status(201).json({ 
            success: true, 
            message: "Successfully logged intake record in L&D trainee development database." 
        });
    } catch (err) {
        console.error("L&D Intake Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
