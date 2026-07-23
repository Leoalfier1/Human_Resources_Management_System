const db = require('./db');
const { classifyPosition } = require('./utils/positionClassifier');

async function testSubmit() {
  try {
    const [e] = await db.query('SELECT * FROM employees WHERE id = 2');
    const employee = e[0];
    const ipcrf_id = 1;
    const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE id = ? AND employee_id = ?', [ipcrf_id, employee.id]);
    const [periodRows] = await db.query('SELECT * FROM rating_periods WHERE is_active = true LIMIT 1');
    const period = periodRows[0];
    const posType = classifyPosition ? classifyPosition(employee.position, employee.employee_type) : 'non_teaching';
    const [raterRows] = await db.query('SELECT * FROM employees WHERE id = ?', [employee.supervisor_id]);
    const rater = raterRows[0];
    
    await db.query("UPDATE ipcrf SET status = 'submitted', submitted_at = NOW(), ratee_signed = TRUE WHERE id = ?", [ipcrf_id]);
    
    const [existingComm] = await db.query('SELECT id FROM performance_commitments WHERE employee_id = ? AND rating_period_id = ?', [employee.id, period.id]);
    let commitmentId;
    if (existingComm.length > 0) {
      commitmentId = existingComm[0].id;
      await db.query(
        "UPDATE performance_commitments SET status = 'submitted', submitted_at = NOW(), rater_id = ?, position_type = ? WHERE id = ?",
        [rater ? rater.id : null, posType, commitmentId]
      );
      await db.query('DELETE FROM performance_targets WHERE commitment_id = ?', [commitmentId]);
    } else {
      const [commResult] = await db.query(
        "INSERT INTO performance_commitments (employee_id, rating_period_id, position_type, status, submitted_at, rater_id) VALUES (?, ?, ?, 'submitted', NOW(), ?)",
        [employee.id, period.id, posType, rater ? rater.id : null]
      );
      commitmentId = commResult.insertId;
    }
    
    const [objectives] = await db.query(
      `SELECT io.*, k.kra_name, k.weight_percent as template_weight, COALESCE(io.weight_percent, k.weight_percent) as weight_percent
       FROM ipcrf_objectives io 
       JOIN kra_templates k ON io.kra_template_id = k.id 
       WHERE io.ipcrf_id = ? 
       ORDER BY io.sequence_no`,
      [ipcrf_id]
    );
    
    for (const obj of objectives) {
      await db.query(
        "INSERT INTO performance_targets (commitment_id, kra_template_id, kra_category, weight_percent, target_description, success_indicator, self_rating) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [commitmentId, obj.kra_template_id, obj.kra_name || 'Unassigned', obj.weight_percent || 0, obj.objective_description || obj.target_statement || '', obj.success_indicator || '', null]
      );
    }
    console.log('✅ TEST SUBMISSION EXECUTED SUCCESSFULLY!');
  } catch(err) {
    console.error('❌ TEST SUBMISSION FAILED:', err);
  } finally {
    process.exit(0);
  }
}

testSubmit();
