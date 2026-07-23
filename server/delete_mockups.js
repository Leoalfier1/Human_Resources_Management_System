const db = require('./db');

async function getColumns(tableName) {
  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
    return cols.map(c => c.Field);
  } catch (err) {
    return [];
  }
}

async function run() {
  try {
    console.log("Starting mockup cleanup...");

    // Get Maribel's IDs
    const [maribelUser] = await db.query("SELECT id FROM users WHERE email = 'kadongtata1975@gmail.com'");
    if (maribelUser.length === 0) {
      console.error("Raul Colot Jr. not found in users table!");
      process.exit(1);
    }
    const maribelUserId = maribelUser[0].id;

    const [maribelEmp] = await db.query("SELECT id FROM employees WHERE email = 'kadongtata1975@gmail.com'");
    const maribelEmpId = maribelEmp.length > 0 ? maribelEmp[0].id : null;

    console.log(`Raul Colot Jr. - User ID: ${maribelUserId}, Employee ID: ${maribelEmpId}`);

    // Disable foreign key checks for clean sweep
    await db.query("SET FOREIGN_KEY_CHECKS = 0");

    const tables = [
      'employees', 'ipcrf', 'coaching_plans', 'development_plans', 'feedback_logs',
      'performance_evaluations', 'performance_commitments', 'performance_targets',
      'coaching_logs', 'rewards_recognition', 'tna_submissions', 'ld_enrollments',
      'ld_evaluations', 'users'
    ];

    for (const table of tables) {
      const cols = await getColumns(table);
      if (cols.length === 0) continue;

      if (table === 'users') {
        await db.query("DELETE FROM users WHERE id != ?", [maribelUserId]);
        console.log(`Cleaned up table: ${table} (by id)`);
      } else if (table === 'employees') {
        if (maribelEmpId) {
          await db.query("UPDATE employees SET supervisor_id = NULL WHERE id = ?", [maribelEmpId]);
          await db.query("DELETE FROM employees WHERE id != ?", [maribelEmpId]);
        } else {
          await db.query("DELETE FROM employees");
        }
        console.log(`Cleaned up table: ${table}`);
      } else {
        // Check if table has employee_id or user_id
        if (cols.includes('employee_id') && maribelEmpId) {
          await db.query(`DELETE FROM ${table} WHERE employee_id != ?`, [maribelEmpId]);
          console.log(`Cleaned up table: ${table} (by employee_id)`);
        } else if (cols.includes('user_id')) {
          await db.query(`DELETE FROM ${table} WHERE user_id != ?`, [maribelUserId]);
          console.log(`Cleaned up table: ${table} (by user_id)`);
        } else {
          // If no employee_id or user_id, check if it has id (and is not users or employees)
          // We can delete everything else except for config tables
          // Let's print columns to be sure
          console.log(`Skipping direct delete for table ${table}, columns:`, cols);
        }
      }
    }

    // Clean up other tables that might have references to deleted employees/users
    // Delete orphan items in sub-tables
    await db.query("DELETE FROM ipcrf_kra_ratings WHERE ipcrf_id NOT IN (SELECT id FROM ipcrf)");
    await db.query("DELETE FROM ipcrf_objectives WHERE ipcrf_id NOT IN (SELECT id FROM ipcrf)");
    await db.query("DELETE FROM mov_uploads WHERE ipcrf_objective_id NOT IN (SELECT id FROM ipcrf_objectives)");
    await db.query("DELETE FROM coaching_feedback WHERE coaching_plan_id NOT IN (SELECT id FROM coaching_plans)");
    
    // Check development_plan_items and development_plans relationship
    const dpCols = await getColumns('development_plans');
    console.log('development_plans columns:', dpCols);
    
    // Clear notifications, activity logs and appointments (these are division wide or mockup logs)
    await db.query("DELETE FROM notifications");
    await db.query("DELETE FROM activity_log");
    await db.query("DELETE FROM appointments");

    // Enable foreign key checks back
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Cleanup completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    try {
      await db.query("SET FOREIGN_KEY_CHECKS = 1");
    } catch (_) {}
    process.exit(1);
  }
}

run();
