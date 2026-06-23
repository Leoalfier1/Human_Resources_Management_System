const express = require('express');
const router = express.Router();
const db = require('../../db');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// HELPER: Calculate working days (excluding weekends) for TAT
const getWorkingDays = (startDate) => {
    let count = 0;
    let curDate = new Date(startDate);
    const today = new Date();
    while (curDate <= today) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};

// GET /api/rsp/dashboard/consolidated
// Access: Admin, HR Staff, HRMPSB, Appointing Authority
router.get('/consolidated', 
    verifyToken, 
    requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'), 
    async (req, res) => {
    try {
        const TARGET_TAT = 26; // PRIME-HRM Standard
        const currentYear = new Date().getFullYear();

        // --- 1. SUMMARY STATS (Parallel Queries) ---
        const queries = {
            activeCount: "SELECT COUNT(*) as count FROM vacancies WHERE status = 'active'",
            nearDeadline: "SELECT COUNT(*) as count FROM vacancies WHERE status = 'active' AND deadline_date <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)",
            totalApplicants: "SELECT COUNT(*) as count FROM applicants",
            newApplicants: "SELECT COUNT(*) as count FROM applicants WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            pendingEval: "SELECT COUNT(*) as count FROM applicants WHERE status IN ('submitted', 'under_evaluation')",
            appointmentsFY: "SELECT COUNT(*) as count FROM appointments WHERE YEAR(issued_at) = ?",
            // Subquery to find the vacancy ref_no with the highest number of pending evaluations
            batchLabel: `
                SELECT v.ref_no 
                FROM vacancies v 
                JOIN applicants a ON v.id = a.vacancy_id 
                WHERE a.status IN ('submitted', 'under_evaluation') 
                GROUP BY v.id 
                ORDER BY COUNT(a.id) DESC LIMIT 1
            `
        };

        const [
            [activeRes], [nearRes], [totalAppRes], [newAppRes], [pendingRes], [apptRes], [batchRes]
        ] = await Promise.all([
            db.query(queries.activeCount),
            db.query(queries.nearDeadline),
            db.query(queries.totalApplicants),
            db.query(queries.newApplicants),
            db.query(queries.pendingEval),
            db.query(queries.appointmentsFY, [currentYear]),
            db.query(queries.batchLabel)
        ]);

        // --- 2. ACTIVE VACANCIES & PROGRESS ---
        const [vacancies] = await db.query(`
            SELECT v.id, v.ref_no, v.position_title, v.assigned_school, v.current_stage, 
                   v.deadline_date, v.posting_date,
                   (SELECT COUNT(*) FROM applicants WHERE vacancy_id = v.id) as total_applicants
            FROM vacancies v 
            WHERE v.status = 'active'
        `);

        // Stage definitions as per DepEd standards
        const stagesDef = [
            { stage: 1, name: "Publication", target: "10 cal days" },
            { stage: 2, name: "Submission", target: "10 cal days" },
            { stage: 3, name: "Initial Eval", target: "1 WD/30" },
            { stage: 4, name: "Validation", target: "1 WD/30" },
            { stage: 5, name: "Posting Qual List", target: "1 WD" },
            { stage: 6, name: "Comparative Asmt", target: "7 WD/30" },
            { stage: 7, name: "Post CA Results", target: "1 WD/30" },
            { stage: 8, name: "Deliberation", target: "1 WD" },
            { stage: 9, name: "Selection", target: "1-2 WD" },
            { stage: 10, name: "Doc Submission", target: "3-5 WD" },
            { stage: 11, name: "Issue Appointment", target: "Final" }
        ];

        const activePostingsFormatted = vacancies.map(v => {
            const daysLeft = Math.ceil((new Date(v.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
            const wdElapsed = getWorkingDays(v.posting_date);
            
            return {
                id: v.id,
                ref_no: v.ref_no,
                position_title: v.position_title,
                assigned_school: v.assigned_school,
                total_applicants: v.total_applicants,
                days_left: daysLeft,
                working_days_elapsed: wdElapsed,
                current_stage: v.current_stage,
                stage_name: stagesDef[v.current_stage - 1]?.name || "Final Process",
                workflow: stagesDef.map(s => ({
                    ...s,
                    status: s.stage < v.current_stage ? 'complete' : (s.stage === v.current_stage ? 'active' : 'upcoming')
                }))
            };
        });

        // --- 3. UPCOMING DEADLINES ---
        const upcomingDeadlines = activePostingsFormatted
            .map(v => {
                let urgency = 'default';
                if (v.days_left <= 1) urgency = 'red';
                else if (v.days_left <= 4) urgency = 'orange';
                return {
                    ref_no: v.ref_no,
                    label: `${v.ref_no} ${v.stage_name} Deadline`,
                    days_remaining: v.days_left,
                    urgency
                };
            })
            .sort((a, b) => a.days_remaining - b.days_remaining)
            .slice(0, 8);

        // --- 4. RECENT ACTIVITY ---
        const [activity] = await db.query(`
            SELECT a.*, u.full_name as actor_name 
            FROM activity_log a 
            LEFT JOIN users u ON a.actor_id = u.id 
            ORDER BY a.created_at DESC LIMIT 15
        `);

        // --- 5. RESPONSE CONSOLIDATION ---
        res.json({
            summary: {
                activePostings: activeRes[0].count,
                nearDeadlinePostings: nearRes[0].count,
                totalApplicants: totalAppRes[0].count,
                newApplicantsThisWeek: newAppRes[0].count,
                pendingEvaluations: pendingRes[0].count,
                pendingEvaluationsBatch: batchRes[0]?.ref_no || "N/A",
                appointmentsIssuedFY: apptRes[0].count,
                targetTAT: TARGET_TAT
            },
            activePostings: activePostingsFormatted,
            turnaroundTime: activePostingsFormatted.map(p => ({
                ref_no: p.ref_no,
                working_days_elapsed: p.working_days_elapsed,
                target: TARGET_TAT,
                is_over: p.working_days_elapsed > TARGET_TAT
            })),
            upcomingDeadlines,
            recentActivity: activity
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: "Internal Server Error fetching dashboard data." });
    }
});

module.exports = router;