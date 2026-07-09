const db = require('../../db');

const TARGET_TAT = 26; // PRIME-HRM standard working days

// ─────────────────────────────────────────────
// HELPER: Count working days elapsed since a date
// ─────────────────────────────────────────────
const getWorkingDaysElapsed = (startDate) => {
    if (!startDate) return 0;
    let count = 0;
    let cur = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    while (cur <= today) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
};

// Stage label map (11 stages)
const STAGE_DEFS = [
    { stage: 1,  name: 'Publication',       target: '10 cal days' },
    { stage: 2,  name: 'Submission',         target: '10 cal days' },
    { stage: 3,  name: 'Initial Eval',       target: '1 WD/30 apps' },
    { stage: 4,  name: 'Validation',         target: '1 WD/30 apps' },
    { stage: 5,  name: 'Posting Qual List',  target: '1 WD' },
    { stage: 6,  name: 'Comparative Asmt',   target: '7 WD/30 apps' },
    { stage: 7,  name: 'Post CA Results',    target: '1 WD/30 apps' },
    { stage: 8,  name: 'Deliberation',       target: '1 WD' },
    { stage: 9,  name: 'Selection',          target: '1–2 WD' },
    { stage: 10, name: 'Doc Submission',     target: '3–5 WD' },
    { stage: 11, name: 'Issue Appointment',  target: 'Final' },
];

// ─────────────────────────────────────────────
// MAIN CONTROLLER
// GET /api/rsp/dashboard/consolidated
// ─────────────────────────────────────────────
exports.getDashboardData = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // ── 1. SUMMARY STATS ─────────────────────────────────────────
        const [[statRow]] = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM vacancies WHERE status = 'active')
                    AS activePostings,

                (SELECT COUNT(*) FROM vacancies
                 WHERE status = 'active'
                   AND deadline_date <= DATE_ADD(CURDATE(), INTERVAL 5 DAY))
                    AS nearDeadlinePostings,

                (SELECT COUNT(*) FROM applications WHERE status != 'draft')
                    AS totalApplicants,

                (SELECT COUNT(*) FROM applications
                 WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                   AND status != 'draft')
                    AS newApplicantsThisWeek,

                (SELECT COUNT(*) FROM applications
                 WHERE status IN ('submitted', 'under_evaluation'))
                    AS pendingEvaluations,

                (SELECT COUNT(*) FROM applications
                 WHERE status = 'appointed'
                   AND YEAR(COALESCE(updated_at, submitted_at)) = ?)
                    AS appointmentsIssuedFY,

                (SELECT COUNT(*) FROM vacancies WHERE status = 'active' AND position_type = 'teaching')
                    AS teachingPostings,

                (SELECT COUNT(*) FROM vacancies WHERE status = 'active' AND position_type = 'non_teaching')
                    AS nonTeachingPostings,

                (SELECT COUNT(*) FROM vacancies WHERE status = 'active' AND position_type = 'teaching_related')
                    AS teachingRelatedPostings,

                (SELECT COUNT(*) FROM applications a
                 JOIN vacancies v ON a.vacancy_id = v.id
                 WHERE a.status != 'draft' AND v.position_type = 'teaching')
                    AS teachingApplicants,

                (SELECT COUNT(*) FROM applications a
                 JOIN vacancies v ON a.vacancy_id = v.id
                 WHERE a.status != 'draft' AND v.position_type = 'non_teaching')
                    AS nonTeachingApplicants,

                (SELECT COUNT(*) FROM applications a
                 JOIN vacancies v ON a.vacancy_id = v.id
                 WHERE a.status != 'draft' AND v.position_type = 'teaching_related')
                    AS teachingRelatedApplicants
            FROM DUAL
        `, [currentYear]);

        // Which vacancy has the most pending evaluations (used as batch label)
        const [[batchRow]] = await db.query(`
            SELECT v.ref_no
            FROM vacancies v
            JOIN applications a ON v.id = a.vacancy_id
            WHERE a.status IN ('submitted', 'under_evaluation')
            GROUP BY v.id
            ORDER BY COUNT(a.id) DESC
            LIMIT 1
        `).catch(() => [[null]]);

        // ── 2. ACTIVE VACANCIES + WORKFLOW ───────────────────────────
        const [vacancies] = await db.query(`
            SELECT
                v.id, v.ref_no, v.position_title, v.assigned_school,
                v.current_stage, v.posting_date, v.deadline_date, v.position_type,
                (SELECT COUNT(*) FROM applications
                 WHERE vacancy_id = v.id AND status != 'draft') AS total_applicants
            FROM vacancies v
            WHERE v.status = 'active'
            ORDER BY v.created_at DESC
        `);

        const activePostings = vacancies.map(v => {
            const daysLeft = Math.ceil(
                (new Date(v.deadline_date) - new Date()) / (1000 * 60 * 60 * 24)
            );
            const wdElapsed = getWorkingDaysElapsed(v.posting_date);

            return {
                id:                   v.id,
                ref_no:               v.ref_no,
                position_title:       v.position_title,
                assigned_school:      v.assigned_school,
                position_type:        v.position_type || 'teaching',
                total_applicants:     Number(v.total_applicants) || 0,
                days_left:            daysLeft,
                working_days_elapsed: wdElapsed,
                current_stage:        v.current_stage,
                stage_name:           STAGE_DEFS[v.current_stage - 1]?.name || 'Process Complete',
                workflow:             STAGE_DEFS.map(s => ({
                    ...s,
                    status: s.stage < v.current_stage  ? 'complete'
                          : s.stage === v.current_stage ? 'active'
                          : 'upcoming'
                }))
            };
        });

        // ── 3. TURNAROUND TIME (TAT) ──────────────────────────────────
        const turnaroundTime = activePostings.map(p => ({
            ref_no:               p.ref_no,
            working_days_elapsed: p.working_days_elapsed,
            target:               TARGET_TAT,
            is_over:              p.working_days_elapsed > TARGET_TAT
        }));

        // ── 4. UPCOMING DEADLINES ─────────────────────────────────────
        const upcomingDeadlines = activePostings
            .filter(v => v.days_left >= 0)         // exclude already-closed
            .map(v => {
                let urgency = 'default';
                if (v.days_left <= 1) urgency = 'red';
                else if (v.days_left <= 4) urgency = 'orange';
                return {
                    ref_no:         v.ref_no,
                    label:          `${v.ref_no} — ${v.stage_name}`,
                    days_remaining: v.days_left,
                    urgency
                };
            })
            .sort((a, b) => a.days_remaining - b.days_remaining)
            .slice(0, 8);

        // ── 5. RECENT ACTIVITY ────────────────────────────────────────
        const [activity] = await db.query(`
            SELECT al.*, u.full_name AS actor_name, al.created_at
            FROM activity_log al
            LEFT JOIN users u ON al.actor_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 15
        `);

        // ── 6. RESPOND ────────────────────────────────────────────────
        res.json({
            summary: {
                activePostings:          Number(statRow.activePostings)         || 0,
                nearDeadlinePostings:    Number(statRow.nearDeadlinePostings)   || 0,
                totalApplicants:         Number(statRow.totalApplicants)        || 0,
                newApplicantsThisWeek:   Number(statRow.newApplicantsThisWeek) || 0,
                pendingEvaluations:      Number(statRow.pendingEvaluations)     || 0,
                pendingEvaluationsBatch: batchRow?.ref_no || 'N/A',
                appointmentsIssuedFY:    Number(statRow.appointmentsIssuedFY)  || 0,
                targetTAT:               TARGET_TAT,
                teachingPostings:          Number(statRow.teachingPostings)          || 0,
                nonTeachingPostings:       Number(statRow.nonTeachingPostings)       || 0,
                teachingRelatedPostings:   Number(statRow.teachingRelatedPostings)   || 0,
                teachingApplicants:        Number(statRow.teachingApplicants)        || 0,
                nonTeachingApplicants:     Number(statRow.nonTeachingApplicants)     || 0,
                teachingRelatedApplicants: Number(statRow.teachingRelatedApplicants) || 0
            },
            activePostings,
            turnaroundTime,
            upcomingDeadlines,
            recentActivity: activity
        });

    } catch (error) {
        console.error('❌ Dashboard Controller Error:', error);
        res.status(500).json({ message: 'Failed to load dashboard data.', detail: error.message });
    }
};