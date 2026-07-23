const db = require('../db');

async function ensureEmployeeCommitmentsAndIpcrf(targetPeriodId) {
    if (!targetPeriodId) return;
    try {
        // Get active rating period details
        const [periodRows] = await db.query('SELECT * FROM rating_periods WHERE id = ?', [targetPeriodId]);
        if (periodRows.length === 0) return;
        const period = periodRows[0];

        // Get all non-admin employees
        const [employees] = await db.query("SELECT * FROM employees WHERE role != 'admin'");
        
        for (const emp of employees) {
            // Classify position
            let posType = 'non_teaching';
            const posLower = emp.position?.toLowerCase() || '';
            if (posLower.includes('master teacher') || posLower.includes('principal') || posLower.includes('superintendent') || posLower.includes('supervisor') || posLower.includes('coordinator') || posLower.includes('head teacher')) {
                posType = 'teaching_related';
            } else if (posLower.includes('teacher') && !posLower.includes('aide') && !posLower.includes('assistant')) {
                posType = 'teaching';
            }

            // 1. Ensure performance_commitments exists
            const [commRows] = await db.query(
                'SELECT id FROM performance_commitments WHERE employee_id = ? AND rating_period_id = ?',
                [emp.id, targetPeriodId]
            );
            let commitmentId;
            if (commRows.length === 0) {
                // Determine supervisor/rater
                const [raterRows] = await db.query("SELECT id FROM employees WHERE role IN ('supervisor', 'admin') AND id != ? LIMIT 1", [emp.id]);
                const raterId = raterRows.length > 0 ? raterRows[0].id : null;

                const [insRes] = await db.query(
                    `INSERT INTO performance_commitments (employee_id, rating_period_id, position_type, status, rater_id)
                     VALUES (?, ?, ?, 'draft', ?)`,
                    [emp.id, targetPeriodId, posType, raterId]
                );
                commitmentId = insRes.insertId;
                console.log(`Auto-created commitment ID ${commitmentId} for employee ${emp.name}`);
            } else {
                commitmentId = commRows[0].id;
            }

            // 2. Ensure ipcrf exists
            const [ipcrfRows] = await db.query(
                'SELECT id FROM ipcrf WHERE employee_id = ? AND rating_period_id = ?',
                [emp.id, targetPeriodId]
            );
            let ipcrfId;
            if (ipcrfRows.length === 0) {
                const [insRes] = await db.query(
                    `INSERT INTO ipcrf (employee_id, rating_period_id, status)
                     VALUES (?, ?, 'not_submitted')`,
                    [emp.id, targetPeriodId]
                );
                ipcrfId = insRes.insertId;
                console.log(`Auto-created ipcrf ID ${ipcrfId} for employee ${emp.name}`);
            } else {
                ipcrfId = ipcrfRows[0].id;
            }

            // 3. Ensure ipcrf_objectives exist if ipcrf is empty
            const [objRows] = await db.query('SELECT id FROM ipcrf_objectives WHERE ipcrf_id = ?', [ipcrfId]);
            if (objRows.length === 0) {
                // Fetch KRA templates for this position type
                const [templates] = await db.query(
                    'SELECT * FROM kra_templates WHERE position_type = ? ORDER BY id',
                    [posType]
                );
                for (let i = 0; i < templates.length; i++) {
                    const temp = templates[i];
                    await db.query(
                        `INSERT INTO ipcrf_objectives (ipcrf_id, kra_template_id, sequence_no, weight_percent, objective_description, success_indicator)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [ipcrfId, temp.id, i + 1, temp.weight_percent, temp.kra_name, '']
                    );
                }
                console.log(`Auto-created objectives for ipcrf ID ${ipcrfId}`);
            }
        }
    } catch (e) {
        console.error("Error in ensureEmployeeCommitmentsAndIpcrf:", e);
    }
}

module.exports = {
    ensureEmployeeCommitmentsAndIpcrf
};
