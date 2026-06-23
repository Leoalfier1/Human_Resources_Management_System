const db = require('../../db');
const { getWorkingDaysElapsed } = require('../../utils/dateUtils');

const TARGET_TAT = process.env.TARGET_TAT || 26; // DepEd PRIME-HRM Standard

const getDashboardData = async (req, res) => {
    try {
        // --- 1. SUMMARY QUERIES ---
        const pActive = db.query("SELECT COUNT(*) as count FROM vacancies WHERE status = 'active'");
        const pNearDL = db.query("SELECT COUNT(*) as count FROM vacancies WHERE status = 'active' AND deadline_date <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)");
        const pTotApp = db.query("SELECT COUNT(*) as count FROM applicants");
        const pNewApp = db.query("SELECT COUNT(*) as count FROM applicants WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        const pPendEval = db.query("SELECT COUNT(*) as count FROM applicants WHERE status IN ('submitted', 'under_evaluation')");
        
        // Subquery for the batch with most pending evaluations
        const pBatch = db.query(`
            SELECT v.ref_no, COUNT(a.id) as pending_count 
            FROM vacancies v 
            JOIN applicants a ON v.id = a.vacancy_id 
            WHERE a.status IN ('submitted', 'under_evaluation') 
            GROUP BY v.id ORDER BY pending_count DESC LIMIT 1
        `);

        // Fiscal Year Appointments (Current Year)
        const currentYear = new Date().getFullYear();
        const pApptFY = db.query("SELECT COUNT(*) as count FROM appointments WHERE YEAR(issued_at) = ?", [currentYear]);

        // --- 2. ACTIVE POSTINGS QUERIES ---
        const pVacancies = db.query(`
            SELECT v.id, v.ref_no, v.position_title, v.assigned_school, v.current_stage, v.deadline_date, v.posting_date,
            (SELECT COUNT(*) FROM applicants WHERE vacancy_id = v.id) as total_applicants
            FROM vacancies v WHERE v.status = 'active'
        `);

        // --- 3. RECENT ACTIVITY QUERIES ---
        const pActivity = db.query(`
            SELECT a.*, u.full_name as actor_name 
            FROM activity_log a 
            LEFT JOIN users u ON a.actor_id = u.id 
            ORDER BY a.created_at DESC LIMIT 10
        `);

        // Execute all queries simultaneously for maximum speed
        const [
            [activeRes], [nearDLRes], [totAppRes], [newAppRes], [pendEvalRes], [batchRes], [apptFYRes], [vacRes], [actRes]
        ] = await Promise.all([pActive, pNearDL, pTotApp, pNewApp, pPendEval, pBatch, pApptFY, pVacancies, pActivity]);

        // --- FORMAT ACTIVE POSTINGS & TAT ---
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

        const activePostings = vacRes.map(v => {
            const daysLeft = Math.ceil((new Date(v.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
            const wdElapsed = getWorkingDaysElapsed(v.posting_date);

            return {
                id: v.id,
                ref_no: v.ref_no,
                position_title: v.position_title,
                assigned_school: v.assigned_school,
                total_applicants: v.total_applicants,
                days_left: daysLeft,
                working_days_elapsed: wdElapsed,
                is_over_tat: wdElapsed > TARGET_TAT,
                current_stage: v.current_stage,
                stage_name: stagesDef[v.current_stage - 1]?.name || "Completed",
                workflow: stagesDef.map(s => ({
                    ...s,
                    status: s.stage < v.current_stage ? 'complete' : (s.stage === v.current_stage ? 'active' : 'upcoming')
                }))
            };
        });

        // --- DERIVE UPCOMING DEADLINES ---
        // For urgency: red if <= 1 day, orange if <= 4 days
        const upcomingDeadlines = vacRes.map(v => {
            const daysLeft = Math.ceil((new Date(v.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
            let urgency = 'default';
            if (daysLeft <= 1) urgency = 'red';
            else if (daysLeft <= 4) urgency = 'orange';

            return {
                ref_no: v.ref_no,
                label: `${v.ref_no} ${stagesDef[v.current_stage - 1]?.name || 'Process'} Deadline`,
                days_remaining: daysLeft,
                urgency
            };
        }).sort((a, b) => a.days_remaining - b.days_remaining).slice(0, 6);

        // Send Consolidated JSON
        res.json({
            summary: {
                activePostings: activeRes[0].count,
                nearDeadlinePostings: nearDLRes[0].count,
                totalApplicants: totAppRes[0].count,
                newApplicantsThisWeek: newAppRes[0].count,
                pendingEvaluations: pendEvalRes[0].count,
                pendingEvaluationsBatch: batchRes[0]?.ref_no || "None",
                appointmentsIssuedFY: apptFYRes[0].count,
                targetTAT: TARGET_TAT
            },
            activePostings,
            turnaroundTime: activePostings.map(p => ({
                ref_no: p.ref_no,
                working_days_elapsed: p.working_days_elapsed,
                target: TARGET_TAT,
                is_over: p.is_over_tat
            })),
            upcomingDeadlines,
            recentActivity: actRes
        });

    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
};

module.exports = { getDashboardData };