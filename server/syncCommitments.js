require('dotenv').config();
const db = require('./db');

async function syncCommitments() {
    try {
        console.log('--- Syncing performance_commitments & performance_targets from IPCRF data ---\n');

        const [periods] = await db.query('SELECT id, is_active FROM rating_periods ORDER BY id');
        let activePeriod = periods.find(p => p.is_active);
        if (!activePeriod && periods.length > 0) activePeriod = periods[periods.length - 1];
        if (!activePeriod) { console.error('No rating period found.'); process.exit(1); }
        console.log('Using rating period:', activePeriod.id);

        const [ipcrfs] = await db.query('SELECT * FROM ipcrf');
        console.log(`Found ${ipcrfs.length} IPCRF records\n`);

        for (const ipcrf of ipcrfs) {
            if (ipcrf.status === 'not_submitted') {
                console.log(`  IPCRF #${ipcrf.id} (emp ${ipcrf.employee_id}): skipped (not_submitted)`);
                continue;
            }

            const [employee] = await db.query('SELECT id, employee_type, position, name FROM employees WHERE id = ?', [ipcrf.employee_id]);
            if (employee.length === 0) { console.log(`  IPCRF #${ipcrf.id}: employee not found, skipping`); continue; }
            const posType = employee[0].employee_type === 'teaching' ? 'teaching' : 'non_teaching';

            const [existing] = await db.query(
                'SELECT id FROM performance_commitments WHERE employee_id = ? AND rating_period_id = ?',
                [ipcrf.employee_id, activePeriod.id]
            );

            let commitmentStatus = 'submitted';
            if (ipcrf.status === 'finalized') commitmentStatus = 'committed';
            else if (ipcrf.status === 'needs_revision') commitmentStatus = 'returned';
            else if (ipcrf.status === 'under_review' || ipcrf.status === 'reviewed') commitmentStatus = 'committed';

            let commitmentId;
            if (existing.length > 0) {
                commitmentId = existing[0].id;
                await db.query(
                    `UPDATE performance_commitments SET status = ?, submitted_at = COALESCE(?, submitted_at), rater_id = ?, position_type = ? WHERE id = ?`,
                    [commitmentStatus, ipcrf.submitted_at, null, posType, commitmentId]
                );
                await db.query('DELETE FROM performance_targets WHERE commitment_id = ?', [commitmentId]);
                console.log(`  IPCRF #${ipcrf.id} (emp ${ipcrf.employee_id}): updated existing commitment #${commitmentId} (status: ${commitmentStatus})`);
            } else {
                const [commResult] = await db.query(
                    `INSERT INTO performance_commitments (employee_id, rating_period_id, position_type, status, submitted_at, rater_id)
                     VALUES (?, ?, ?, ?, NOW(), NULL)`,
                    [ipcrf.employee_id, activePeriod.id, posType, commitmentStatus]
                );
                commitmentId = commResult.insertId;
                console.log(`  IPCRF #${ipcrf.id} (emp ${ipcrf.employee_id}): created commitment #${commitmentId} (status: ${commitmentStatus})`);
            }

            if (ipcrf.status === 'finalized' && ipcrf.weighted_average_rating) {
                await db.query(
                    `UPDATE performance_commitments SET overall_weighted_score = ?, adjectival_rating = CASE WHEN ? >= 4.5 THEN 'Outstanding' WHEN ? >= 3.5 THEN 'Very Satisfactory' WHEN ? >= 2.5 THEN 'Satisfactory' WHEN ? >= 1.5 THEN 'Fair' ELSE 'Poor' END, final_rating_submitted_at = NOW() WHERE id = ?`,
                    [ipcrf.weighted_average_rating, ipcrf.weighted_average_rating, ipcrf.weighted_average_rating, ipcrf.weighted_average_rating, ipcrf.weighted_average_rating, commitmentId]
                );
            }

            const [objectives] = await db.query(
                `SELECT io.*, k.kra_name, k.weight_percent as template_weight
                 FROM ipcrf_objectives io
                 LEFT JOIN kra_templates k ON io.kra_template_id = k.id
                 WHERE io.ipcrf_id = ?
                 ORDER BY io.sequence_no`,
                [ipcrf.id]
            );

            let inserted = 0;
            for (const obj of objectives) {
                const weight = obj.weight_percent || obj.template_weight || 0;
                const target = obj.objective_description || obj.target_statement || '';
                const indicator = obj.success_indicator || '';
                await db.query(
                    `INSERT INTO performance_targets (commitment_id, kra_template_id, kra_category, weight_percent, target_description, success_indicator, self_rating)
                     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
                    [commitmentId, obj.kra_template_id, obj.kra_name || 'Unassigned', weight, target, indicator]
                );
                inserted++;
            }
            console.log(`    -> inserted ${inserted} performance_targets`);
        }

        const [final] = await db.query('SELECT COUNT(*) as cnt FROM performance_commitments');
        const [finalT] = await db.query('SELECT COUNT(*) as cnt FROM performance_targets');
        console.log(`\nDone! performance_commitments: ${final[0].cnt} rows, performance_targets: ${finalT[0].cnt} rows`);
        process.exit(0);
    } catch (err) {
        console.error('Sync failed:', err.message);
        process.exit(1);
    }
}

syncCommitments();
