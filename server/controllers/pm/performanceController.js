const db = require('../../db');

// 1. Supervisor: List assigned non-teaching employees
const getAssignedEmployees = async (req, res) => {
    try {
        const [supRows] = await db.query('SELECT * FROM employees WHERE email = ?', [req.user.email]);
        if (supRows.length === 0) return res.status(404).json({ message: "Supervisor record not found" });
        const supervisor = supRows[0];

        // Get active period
        const [periodRows] = await db.query("SELECT * FROM performance_periods WHERE status = 'active' LIMIT 1");
        if (periodRows.length === 0) {
            // No active period, return assigned employees with Not Started status
            const [empRows] = await db.query(
                "SELECT id, name, position, unit, employee_type FROM employees WHERE supervisor_id = ? AND employee_type = 'non-teaching' ORDER BY name ASC",
                [supervisor.id]
            );
            return res.json({ 
                employees: empRows.map(e => ({ ...e, evaluation_status: 'Not Started', overall_score: 0 })), 
                period: null 
            });
        }

        const activePeriod = periodRows[0];

        const [empRows] = await db.query(
            `SELECT e.id, e.name, e.position, e.unit, e.employee_type, 
                    pe.id as evaluation_id, pe.status as evaluation_status, pe.overall_score
             FROM employees e
             LEFT JOIN performance_evaluations pe ON pe.employee_id = e.id AND pe.performance_period_id = ?
             WHERE e.supervisor_id = ? AND e.employee_type = 'non-teaching'
             ORDER BY e.name ASC`,
            [activePeriod.id, supervisor.id]
        );

        res.json({
            employees: empRows.map(e => ({
                ...e,
                evaluation_status: e.evaluation_status || 'Not Started',
                overall_score: e.overall_score || 0
            })),
            period: activePeriod
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 2. Supervisor/Employee: Get active evaluation period & criteria
const getActivePeriodAndCriteria = async (req, res) => {
    try {
        const [periodRows] = await db.query("SELECT * FROM performance_periods WHERE status = 'active' LIMIT 1");
        if (periodRows.length === 0) return res.status(404).json({ message: "No active evaluation period found" });
        const activePeriod = periodRows[0];

        const [criteriaRows] = await db.query(
            "SELECT * FROM performance_criteria WHERE employee_type = 'non-teaching' ORDER BY criteria_name ASC"
        );

        res.json({ period: activePeriod, criteria: criteriaRows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. Supervisor: Get evaluation details of an employee for active period
const getEvaluationDetails = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const [periodRows] = await db.query("SELECT * FROM performance_periods WHERE status = 'active' LIMIT 1");
        if (periodRows.length === 0) return res.status(404).json({ message: "No active evaluation period found" });
        const activePeriod = periodRows[0];

        // Verify employee is non-teaching
        const [empRows] = await db.query(
            "SELECT id, name, position, unit, employee_type FROM employees WHERE id = ? AND employee_type = 'non-teaching'", 
            [employeeId]
        );
        if (empRows.length === 0) return res.status(404).json({ message: "Employee not found or is teaching staff" });
        const employee = empRows[0];

        // Fetch evaluation record
        const [evalRows] = await db.query(
            "SELECT * FROM performance_evaluations WHERE employee_id = ? AND performance_period_id = ?",
            [employeeId, activePeriod.id]
        );

        const evaluation = evalRows[0] || null;
        let ratings = [];

        if (evaluation) {
            const [ratingRows] = await db.query(
                `SELECT pr.id, pr.performance_criteria_id as criteria_id, pr.score, pc.criteria_name, pc.weight, pc.max_score
                 FROM performance_ratings pr
                 JOIN performance_criteria pc ON pr.performance_criteria_id = pc.id
                 WHERE pr.performance_evaluation_id = ?`,
                [evaluation.id]
            );
            ratings = ratingRows;
        }

        res.json({
            employee,
            period: activePeriod,
            evaluation,
            ratings
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 4. Supervisor: Save or submit performance evaluation
const saveOrSubmitEvaluation = async (req, res) => {
    try {
        const { employee_id, performance_period_id, ratings, comments, status } = req.body;

        if (!employee_id || !performance_period_id || !ratings || !Array.isArray(ratings)) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Validate employee is non-teaching
        const [empRows] = await db.query("SELECT id, supervisor_id, employee_type FROM employees WHERE id = ? AND employee_type = 'non-teaching'", [employee_id]);
        if (empRows.length === 0) return res.status(404).json({ message: "Employee not found or is teaching staff" });
        
        // Find supervisor record
        const [supRows] = await db.query('SELECT * FROM employees WHERE email = ?', [req.user.email]);
        if (supRows.length === 0) return res.status(404).json({ message: "Supervisor record not found" });
        const supervisor = supRows[0];

        // Calculate overall score as weighted average
        let weightedSum = 0;
        let totalWeight = 0;
        for (const r of ratings) {
            const [critRows] = await db.query("SELECT weight FROM performance_criteria WHERE id = ?", [r.criteria_id]);
            if (critRows.length > 0) {
                const weight = parseFloat(critRows[0].weight);
                weightedSum += parseFloat(r.score) * weight;
                totalWeight += weight;
            }
        }
        const overallScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;

        // Check if evaluation already exists
        const [existing] = await db.query(
            "SELECT id FROM performance_evaluations WHERE employee_id = ? AND performance_period_id = ?",
            [employee_id, performance_period_id]
        );

        let evaluationId;
        if (existing.length > 0) {
            evaluationId = existing[0].id;
            await db.query(
                `UPDATE performance_evaluations 
                 SET overall_score = ?, comments = ?, status = ?
                 WHERE id = ?`,
                [overallScore, comments, status, evaluationId]
            );
        } else {
            const [insertResult] = await db.query(
                `INSERT INTO performance_evaluations 
                 (performance_period_id, employee_id, supervisor_id, overall_score, comments, status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [performance_period_id, employee_id, supervisor.id, overallScore, comments, status]
            );
            evaluationId = insertResult.insertId;
        }

        // Update itemized ratings
        await db.query("DELETE FROM performance_ratings WHERE performance_evaluation_id = ?", [evaluationId]);
        for (const r of ratings) {
            await db.query(
                "INSERT INTO performance_ratings (performance_evaluation_id, performance_criteria_id, score) VALUES (?, ?, ?)",
                [evaluationId, r.criteria_id, r.score]
            );
        }

        // Optional log activity
        try {
            await db.query(
                "INSERT INTO activity_log (applicant_id, actor_id, action_description) VALUES (NULL, ?, ?)",
                [req.user.id, `Evaluation saved as ${status} for Employee ID ${employee_id}`]
            );
        } catch (logErr) {}

        // Emit socket notification
        try {
            const io = req.app.get('socketio');
            if (io) {
                io.emit('performance:status_changed', { employee_id, status });
            }
        } catch (socketErr) {}

        res.json({ 
            message: `Evaluation successfully saved as ${status}!`, 
            evaluationId, 
            overallScore 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 5. Employee: Get own performance evaluations history
const getPerformanceHistory = async (req, res) => {
    try {
        const [empRows] = await db.query("SELECT * FROM employees WHERE email = ?", [req.user.email]);
        if (empRows.length === 0) return res.status(404).json({ message: "Employee record not found" });
        const employee = empRows[0];

        const [evalRows] = await db.query(
            `SELECT pc.*, 
                    COALESCE(rp.period_label, CONCAT(rp.year, ' ', rp.cycle)) as period_name,
                    rp.start_date, rp.end_date,
                    r.name as supervisor_name,
                    pc.overall_weighted_score as overall_score,
                    pc.employee_acknowledged_at as acknowledged_at,
                    CASE WHEN pc.employee_acknowledged_at IS NOT NULL THEN 'acknowledged' ELSE 'finalized' END as status
             FROM performance_commitments pc
             JOIN rating_periods rp ON pc.rating_period_id = rp.id
             LEFT JOIN employees r ON pc.rater_id = r.id
             WHERE pc.employee_id = ? AND pc.final_rating_submitted_at IS NOT NULL
             ORDER BY rp.end_date DESC`,
            [employee.id]
        );

        res.json(evalRows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 6. Employee/Supervisor: View specific evaluation details with criteria ratings
const getEvaluationDetailsById = async (req, res) => {
    try {
        const { evaluationId } = req.params;

        const [evalRows] = await db.query(
            `SELECT pc.*, 
                    COALESCE(rp.period_label, CONCAT(rp.year, ' ', rp.cycle)) as period_name,
                    rp.start_date, rp.end_date,
                    r.name as supervisor_name, e.name as employee_name, e.position, e.unit, e.employee_type,
                    pc.overall_weighted_score as overall_score,
                    pc.employee_acknowledged_at as acknowledged_at,
                    CASE WHEN pc.employee_acknowledged_at IS NOT NULL THEN 'acknowledged' ELSE 'finalized' END as status
             FROM performance_commitments pc
             JOIN rating_periods rp ON pc.rating_period_id = rp.id
             LEFT JOIN employees r ON pc.rater_id = r.id
             JOIN employees e ON pc.employee_id = e.id
             WHERE pc.id = ?`,
            [evaluationId]
        );

        if (evalRows.length === 0) return res.status(404).json({ message: "Evaluation not found" });
        const evaluation = evalRows[0];

        // Fetch ratings from performance_targets
        const [ratingRows] = await db.query(
            `SELECT pt.id, pt.kra_category as criteria_name, pt.weight_percent as weight, pt.final_rating as score, 
                    5 as max_score
             FROM performance_targets pt
             WHERE pt.commitment_id = ?`,
            [evaluationId]
        );

        res.json({
            evaluation,
            ratings: ratingRows
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 7. Employee: Acknowledge evaluation
const acknowledgeEvaluation = async (req, res) => {
    try {
        const { evaluationId } = req.params;
        const [empRows] = await db.query("SELECT * FROM employees WHERE email = ?", [req.user.email]);
        if (empRows.length === 0) return res.status(404).json({ message: "Employee record not found" });
        const employee = empRows[0];

        const [updateResult] = await db.query(
            `UPDATE performance_commitments 
             SET employee_acknowledged_at = CURRENT_TIMESTAMP
             WHERE id = ? AND employee_id = ? AND final_rating_submitted_at IS NOT NULL AND employee_acknowledged_at IS NULL`,
            [evaluationId, employee.id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({ 
                message: "Unable to acknowledge evaluation. It must exist, belong to you, and be finalized." 
            });
        }

        try {
            await db.query(
                "INSERT INTO activity_log (applicant_id, actor_id, action_description) VALUES (NULL, ?, ?)",
                [req.user.id, `Acknowledged performance evaluation ID ${evaluationId}`]
            );
        } catch (logErr) {}

        res.json({ message: "Evaluation acknowledged successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAssignedEmployees,
    getActivePeriodAndCriteria,
    getEvaluationDetails,
    getEvaluationDetailsById,
    saveOrSubmitEvaluation,
    getPerformanceHistory,
    acknowledgeEvaluation
};
