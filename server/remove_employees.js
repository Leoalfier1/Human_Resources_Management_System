const db = require('./db');

async function removeEmployees() {
  try {
    console.log('Starting deletion of Arniel (ID 4) and Maria (ID 3)...');
    
    // Disable foreign key checks temporarily
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Delete from coaching_logs linked to employee commitments
    await db.query(`
      DELETE FROM coaching_logs 
      WHERE commitment_id IN (SELECT id FROM performance_commitments WHERE employee_id IN (3, 4))
    `);
    console.log('Cleaned coaching_logs.');

    // 2. Delete from performance_targets linked to employee commitments
    await db.query(`
      DELETE FROM performance_targets 
      WHERE commitment_id IN (SELECT id FROM performance_commitments WHERE employee_id IN (3, 4))
    `);
    console.log('Cleaned performance_targets.');

    // 3. Delete from performance_commitments
    await db.query('DELETE FROM performance_commitments WHERE employee_id IN (3, 4)');
    console.log('Cleaned performance_commitments.');

    // 4. Delete from ipcrf_objectives linked to employee ipcrf
    await db.query(`
      DELETE FROM ipcrf_objectives 
      WHERE ipcrf_id IN (SELECT id FROM ipcrf WHERE employee_id IN (3, 4))
    `);
    console.log('Cleaned ipcrf_objectives.');

    // 5. Delete from ipcrf
    await db.query('DELETE FROM ipcrf WHERE employee_id IN (3, 4)');
    console.log('Cleaned ipcrf.');

    // 6. Delete from rewards_recognition
    await db.query('DELETE FROM rewards_recognition WHERE employee_id IN (3, 4)');
    console.log('Cleaned rewards_recognition.');

    // 7. Delete from notifications
    await db.query('DELETE FROM notifications WHERE user_id IN (3, 4)');
    console.log('Cleaned notifications.');

    // 8. Delete from user accounts associated with employees
    // Let's check user account emails associated with these employees
    const [employees] = await db.query('SELECT email FROM employees WHERE id IN (3, 4)');
    const emails = employees.map(e => e.email).filter(Boolean);
    if (emails.length > 0) {
      const placeholders = emails.map(() => '?').join(',');
      await db.query(`DELETE FROM users WHERE email IN (${placeholders})`, emails);
      console.log('Cleaned users accounts.');
    }

    // 9. Delete from employees
    await db.query('DELETE FROM employees WHERE id IN (3, 4)');
    console.log('Cleaned employees table.');

    // Re-enable foreign key checks
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Arniel M. Banawa and Maria L. Santos-Reyes have been completely removed from the system!');
  } catch (err) {
    console.error('Error during deletion:', err);
  } finally {
    process.exit(0);
  }
}

removeEmployees();
