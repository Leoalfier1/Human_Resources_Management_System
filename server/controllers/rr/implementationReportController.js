const db = require('../../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = './uploads/rr/reports/';
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

/**
 * Internal: check completion status of each PRAISE stage for a given cycle.
 */
async function getCycleSummary(cycleId) {
    const checks = [];

    // 1. Committee Meeting: at least one finalized meeting
    const [meetings] = await db.query(
        "SELECT id FROM rr_praise_meetings WHERE status = 'finalized' LIMIT 1"
    );
    checks.push({ stage: 'Committee Meeting', completed: meetings.length > 0 });

    // 2. Call for Nominees: this call is published or closed
    const [calls] = await db.query(
        "SELECT id FROM rr_nomination_calls WHERE id = ? AND status IN ('published','closed')",
        [cycleId]
    );
    checks.push({ stage: 'Call for Nominees', completed: calls.length > 0 });

    // 3. Preliminary Evaluation: no nominees stuck in pending_review for this call
    const [pendingReview] = await db.query(
        "SELECT COUNT(*) AS cnt FROM rr_call_nominations WHERE call_id = ? AND status = 'pending_review'",
        [cycleId]
    );
    const [totalNoms] = await db.query(
        "SELECT COUNT(*) AS cnt FROM rr_call_nominations WHERE call_id = ?",
        [cycleId]
    );
    const preliminaryDone = totalNoms[0].cnt > 0 && pendingReview[0].cnt === 0;
    checks.push({ stage: 'Preliminary Evaluation', completed: preliminaryDone });

    // 4. Validation & Interview: all advanced nominees have saved validation
    const [advanced] = await db.query(
        "SELECT COUNT(*) AS cnt FROM rr_call_nominations WHERE call_id = ? AND status = 'advanced'",
        [cycleId]
    );
    const [validated] = await db.query(`
        SELECT COUNT(*) AS cnt FROM rr_call_nominations cn
        JOIN rr_validation_interviews vi ON vi.nomination_id = cn.id
        WHERE cn.call_id = ? AND cn.status = 'advanced' AND vi.status = 'saved'
    `, [cycleId]);
    const validationDone = advanced[0].cnt > 0 && validated[0].cnt >= advanced[0].cnt;
    checks.push({ stage: 'Validation & Interview', completed: validationDone });

    // 5. Deliberation & Finalization: all advanced nominees have finalized_at set
    const [finalized] = await db.query(
        "SELECT COUNT(*) AS cnt FROM rr_call_nominations WHERE call_id = ? AND status = 'advanced' AND finalized_at IS NOT NULL",
        [cycleId]
    );
    const delibDone = advanced[0].cnt > 0 && finalized[0].cnt >= advanced[0].cnt;
    checks.push({ stage: 'Deliberation & Finalization', completed: delibDone });

    // 6. Announcement of Results: announcement published for this call
    const [announced] = await db.query(
        "SELECT id FROM rr_announcements WHERE nomination_call_id = ? AND status = 'published'",
        [cycleId]
    );
    checks.push({ stage: 'Announcement of Results', completed: announced.length > 0 });

    // 7. Awarding Ceremony: ceremony exists with datetime set
    const [ceremony] = await db.query(
        "SELECT id FROM rr_ceremonies WHERE nomination_call_id = ? AND ceremony_datetime IS NOT NULL",
        [cycleId]
    );
    checks.push({ stage: 'Awarding Ceremony', completed: ceremony.length > 0 });

    return checks;
}

/**
 * GET /api/rr/implementation-report/:cycleId
 */
exports.getReport = async (req, res) => {
    try {
        const { cycleId } = req.params;

        // Total nominees for this call
        const [nomineeCount] = await db.query(
            'SELECT COUNT(*) AS cnt FROM rr_call_nominations WHERE call_id = ?', [cycleId]
        );
        const totalNominees = nomineeCount[0]?.cnt || 0;

        // Awardees (approved) by category
        const [awardees] = await db.query(`
            SELECT
                cn.nominee_category,
                COUNT(*) AS count
            FROM rr_call_nominations cn
            WHERE cn.call_id = ? AND cn.deliberation_status = 'approved'
            GROUP BY cn.nominee_category
        `, [cycleId]);

        const categoryMap = { teaching: 0, teaching_related: 0, non_teaching: 0 };
        let totalAwardees = 0;
        for (const row of awardees) {
            categoryMap[row.nominee_category] = row.count;
            totalAwardees += row.count;
        }

        // Eligible personnel count (applicants)
        const [eligibleCount] = await db.query(
            "SELECT COUNT(*) AS cnt FROM users WHERE role = 'applicant'"
        );
        const totalEligible = eligibleCount[0]?.cnt || 1;
        const participationRate = totalNominees > 0
            ? Math.round((totalNominees / totalEligible) * 100)
            : 0;

        // Nominees by category for bar chart
        const [nomineeByCategory] = await db.query(`
            SELECT nominee_category, COUNT(*) AS count
            FROM rr_call_nominations
            WHERE call_id = ?
            GROUP BY nominee_category
        `, [cycleId]);

        const nomineeCatMap = { teaching: 0, teaching_related: 0, non_teaching: 0 };
        for (const row of nomineeByCategory) {
            nomineeCatMap[row.nominee_category] = row.count;
        }

        // Cycle summary
        const cycleSummary = await getCycleSummary(cycleId);

        // Existing report record
        let [reportRows] = await db.query(
            'SELECT * FROM rr_implementation_reports WHERE nomination_call_id = ?',
            [cycleId]
        );

        if (reportRows.length === 0) {
            await db.query(
                'INSERT INTO rr_implementation_reports (nomination_call_id) VALUES (?)',
                [cycleId]
            );
            [reportRows] = await db.query(
                'SELECT * FROM rr_implementation_reports WHERE nomination_call_id = ?',
                [cycleId]
            );
        }

        const report = reportRows[0];

        res.json({
            stats: {
                totalNominees,
                totalAwardees,
                teachingAwardees: categoryMap.teaching,
                nonTeachingAwardees: categoryMap.non_teaching,
                teachingRelatedAwardees: categoryMap.teaching_related,
                participationRate,
                budgetAllocated: report.budget_allocated,
                budgetUtilized: report.budget_utilized
            },
            nomineesByCategory: nomineeCatMap,
            cycleSummary,
            report: {
                narrativeReport: report.narrative_report,
                status: report.status,
                submittedAt: report.submitted_at,
                submittedBy: report.submitted_by
            }
        });
    } catch (err) {
        console.error('❌ GET IMPLEMENTATION REPORT ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch implementation report' });
    }
};

/**
 * PUT /api/rr/implementation-report/:cycleId
 * Body: { narrativeReport, budgetAllocated, budgetUtilized }
 */
exports.putReport = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const { narrativeReport, budgetAllocated, budgetUtilized } = req.body;

        // Check if already submitted
        const [existing] = await db.query(
            "SELECT status FROM rr_implementation_reports WHERE nomination_call_id = ?",
            [cycleId]
        );
        if (existing.length > 0 && existing[0].status === 'submitted') {
            return res.status(403).json({ message: 'Report has been submitted and cannot be edited' });
        }

        await db.query(`
            INSERT INTO rr_implementation_reports (nomination_call_id, narrative_report, budget_allocated, budget_utilized)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                narrative_report = VALUES(narrative_report),
                budget_allocated = VALUES(budget_allocated),
                budget_utilized = VALUES(budget_utilized)
        `, [cycleId, narrativeReport || null, budgetAllocated || null, budgetUtilized || null]);

        const [rows] = await db.query(
            'SELECT * FROM rr_implementation_reports WHERE nomination_call_id = ?', [cycleId]
        );

        res.json({ report: rows[0] || null });
    } catch (err) {
        console.error('❌ PUT IMPLEMENTATION REPORT ERROR:', err);
        res.status(500).json({ message: 'Failed to save report' });
    }
};

/**
 * POST /api/rr/implementation-report/:cycleId/generate-pdf
 * Generates a PDF report and streams it as a download.
 */
exports.postGeneratePDF = async (req, res) => {
    try {
        const { cycleId } = req.params;

        // Gather all data
        const [nomineeCount] = await db.query(
            'SELECT COUNT(*) AS cnt FROM rr_call_nominations WHERE call_id = ?', [cycleId]
        );
        const [awardees] = await db.query(`
            SELECT cn.nominee_category, COUNT(*) AS count
            FROM rr_call_nominations cn
            WHERE cn.call_id = ? AND cn.deliberation_status = 'approved'
            GROUP BY cn.nominee_category
        `, [cycleId]);

        const [reportRows] = await db.query(
            'SELECT * FROM rr_implementation_reports WHERE nomination_call_id = ?', [cycleId]
        );
        const report = reportRows[0] || {};

        const [callRows] = await db.query(`
            SELECT nc.*, at.name AS award_type_name
            FROM rr_nomination_calls nc
            JOIN rr_award_types at ON at.id = nc.award_type_id
            WHERE nc.id = ?
        `, [cycleId]);
        const callInfo = callRows[0] || {};

        const [winners] = await db.query(`
            SELECT cn.nominee_name, cn.nominee_category, at.name AS award_type_name, vi.weighted_total
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON nc.id = cn.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            LEFT JOIN rr_validation_interviews vi ON vi.nomination_id = cn.id
            WHERE cn.call_id = ? AND cn.deliberation_status = 'approved'
            ORDER BY at.name, vi.weighted_total DESC
        `, [cycleId]);

        const cycleSummary = await getCycleSummary(cycleId);

        const categoryMap = { teaching: 0, teaching_related: 0, non_teaching: 0 };
        let totalAwardees = 0;
        for (const row of awardees) {
            categoryMap[row.nominee_category] = row.count;
            totalAwardees += row.count;
        }

        // Generate PDF
        const doc = new PDFDocument({ size: 'LETTER', margins: { top: 60, bottom: 60, left: 72, right: 72 } });
        const fileName = `RR_Report_Cycle${cycleId}_${Date.now()}.pdf`;
        const filePath = path.join(REPORTS_DIR, fileName);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        const navy = [27, 58, 107];
        const redOrange = [214, 64, 47];
        const gray = [100, 116, 139];

        // Header
        doc.rect(0, 0, 612, 80).fill(navy);
        doc.fontSize(8).fillColor('white').text('Republic of the Philippines', 72, 20, { align: 'center' });
        doc.fontSize(10).text('Department of Education', { align: 'center' });
        doc.fontSize(8).text('Schools Division Office of Dapitan City', { align: 'center' });

        doc.moveDown(2);
        doc.fillColor(navy).fontSize(16).text('R&R IMPLEMENTATION REPORT', { align: 'center', underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor(gray).text(`Cycle: ${callInfo.award_type_name || 'N/A'} — ${callInfo.eligible_category || ''}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(8).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

        doc.moveDown(1.5);

        // Stats section
        doc.fillColor(navy).fontSize(12).text('SUMMARY STATISTICS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor(gray);
        doc.text(`Total Nominees: ${nomineeCount[0]?.cnt || 0}`);
        doc.text(`Total Awardees: ${totalAwardees}`);
        doc.text(`Teaching Awards: ${categoryMap.teaching}`);
        doc.text(`Non-Teaching Awards: ${categoryMap.non_teaching}`);
        doc.text(`Teaching-Related Awards: ${categoryMap.teaching_related}`);
        if (report.budget_allocated) {
            doc.text(`Budget Allocated: P${Number(report.budget_allocated).toLocaleString()}`);
        }
        if (report.budget_utilized) {
            doc.text(`Budget Utilized: P${Number(report.budget_utilized).toLocaleString()}`);
        }

        doc.moveDown(1);

        // Winners list
        doc.fillColor(navy).fontSize(12).text('AWARDEES', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(8).fillColor(gray);
        for (const w of winners) {
            const cat = (w.nominee_category || '').replace(/_/g, ' ');
            doc.text(`${w.nominee_name} — ${w.award_type_name} (${cat}) Score: ${w.weighted_total ? Number(w.weighted_total).toFixed(1) : 'N/A'}`);
        }

        doc.moveDown(1);

        // Cycle summary
        doc.fillColor(navy).fontSize(12).text('PRAISE CYCLE SUMMARY', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(8).fillColor(gray);
        for (const s of cycleSummary) {
            const icon = s.completed ? '[COMPLETED]' : '[IN PROGRESS]';
            doc.text(`${icon} ${s.stage}`);
        }

        doc.moveDown(1.5);

        // Narrative
        if (report.narrative_report) {
            doc.fillColor(navy).fontSize(12).text('NARRATIVE REPORT', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(9).fillColor(gray).text(report.narrative_report, { lineGap: 4 });
        }

        doc.moveDown(2);

        // Footer
        doc.rect(0, 720, 612, 72).fill(navy);
        doc.fontSize(7).fillColor('white').text(
            'DepEd SDO Dapitan City — PRIME-HRM Rewards & Recognition',
            72, 740, { align: 'center' }
        );

        doc.end();
        await new Promise(resolve => writeStream.on('finish', resolve));

        // Save path to DB
        const relativePath = filePath.replace(/\\/g, '/');
        await db.query(`
            UPDATE rr_implementation_reports SET report_data = JSON_OBJECT('pdf_path', ?) WHERE nomination_call_id = ?
        `, [relativePath, cycleId]);

        res.download(filePath, fileName);
    } catch (err) {
        console.error('❌ GENERATE PDF ERROR:', err);
        res.status(500).json({ message: 'Failed to generate PDF' });
    }
};

/**
 * PATCH /api/rr/implementation-report/:cycleId/submit
 * Validates all stages complete + narrative non-empty, then locks report.
 */
exports.patchSubmit = async (req, res) => {
    try {
        const { cycleId } = req.params;

        // Check existing report
        const [existing] = await db.query(
            'SELECT * FROM rr_implementation_reports WHERE nomination_call_id = ?', [cycleId]
        );
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }
        if (existing[0].status === 'submitted') {
            return res.status(409).json({ message: 'Report has already been submitted' });
        }

        // Validate narrative non-empty
        if (!existing[0].narrative_report || existing[0].narrative_report.trim().length === 0) {
            return res.status(400).json({ message: 'Narrative report is required before submission' });
        }

        // Validate all 8 stages
        const summary = await getCycleSummary(cycleId);
        const incomplete = summary.filter(s => !s.completed);
        if (incomplete.length > 0) {
            return res.status(409).json({
                message: 'Not all PRAISE cycle stages are complete',
                incomplete: incomplete.map(s => s.stage)
            });
        }

        // Submit
        await db.query(`
            UPDATE rr_implementation_reports
            SET status = 'submitted', submitted_at = NOW(), submitted_by = ?
            WHERE nomination_call_id = ?
        `, [req.user.id, cycleId]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:report-submitted', { cycleId: Number(cycleId) });
            io.emit('rr:dashboard:update');
        }

        res.json({ message: 'Report submitted to Region successfully' });
    } catch (err) {
        console.error('❌ SUBMIT REPORT ERROR:', err);
        res.status(500).json({ message: 'Failed to submit report' });
    }
};
