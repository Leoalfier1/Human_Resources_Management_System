const db = require('./db');

async function removeRaulEntirely() {
  try {
    console.log('Starting complete removal of Raul M. Colot Jr. (ID 2)...');
    
    // Disable foreign key checks temporarily
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Delete coaching logs
    await db.query('DELETE FROM coaching_logs WHERE commitment_id IN (SELECT id FROM performance_commitments WHERE employee_id = 2)');
    console.log('Cleaned coaching_logs.');

    // 2. Delete targets
    await db.query('DELETE FROM performance_targets WHERE commitment_id IN (SELECT id FROM performance_commitments WHERE employee_id = 2)');
    console.log('Cleaned performance_targets.');

    // 3. Delete commitments
    await db.query('DELETE FROM performance_commitments WHERE employee_id = 2');
    console.log('Cleaned performance_commitments.');

    // 4. Delete objectives
    await db.query('DELETE FROM ipcrf_objectives WHERE ipcrf_id IN (SELECT id FROM ipcrf WHERE employee_id = 2)');
    console.log('Cleaned ipcrf_objectives.');

    // 5. Delete IPCRF
    await db.query('DELETE FROM ipcrf WHERE employee_id = 2');
    console.log('Cleaned ipcrf.');

    // 6. Delete nominations
    await db.query('DELETE FROM rewards_recognition WHERE employee_id = 2');
    console.log('Cleaned rewards_recognition.');

    // 7. Delete notifications
    await db.query('DELETE FROM notifications WHERE user_id = 2');
    console.log('Cleaned notifications.');

    // 8. Delete user account
    const [employees] = await db.query('SELECT email FROM employees WHERE id = 2');
    const emails = employees.map(e => e.email).filter(Boolean);
    if (emails.length > 0) {
      await db.query('DELETE FROM users WHERE email IN (?)', [emails]);
      console.log('Cleaned users accounts.');
    }

    // 9. Delete employee record
    await db.query('DELETE FROM employees WHERE id = 2');
    console.log('Cleaned employees table.');

    // Re-enable foreign key checks
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Raul M. Colot Jr. has been completely removed from the system!');
  } catch (err) {
    console.error('Error during deletion:', err);
  } finally {
    process.exit(0);
  }
}

removeRaulEntirely();
