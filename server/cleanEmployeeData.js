const db = require('./db');

async function clean() {
  // Clear all seed/performance data
  await db.query('DELETE FROM ipcrf_kra_ratings');
  console.log('Cleared ipcrf_kra_ratings');

  await db.query('DELETE FROM mov_uploads');
  console.log('Cleared mov_uploads');

  await db.query('DELETE FROM ipcrf_objectives');
  console.log('Cleared ipcrf_objectives');

  await db.query('DELETE FROM ipcrf');
  console.log('Cleared ipcrf');

  await db.query('DELETE FROM coaching_feedback');
  console.log('Cleared coaching_feedback');

  await db.query('DELETE FROM coaching_plans');
  console.log('Cleared coaching_plans');

  await db.query('DELETE FROM coaching_logs');
  console.log('Cleared coaching_logs');

  await db.query('DELETE FROM development_plan_items');
  console.log('Cleared development_plan_items');

  await db.query('DELETE FROM development_plans');
  console.log('Cleared development_plans');

  await db.query('DELETE FROM performance_targets');
  console.log('Cleared performance_targets');

  await db.query('DELETE FROM performance_commitments');
  console.log('Cleared performance_commitments');

  await db.query('DELETE FROM rewards_recognition');
  console.log('Cleared rewards_recognition');

  // Remove other users/employees, keep only kadongtata1975@gmail.com
  await db.query('DELETE FROM users WHERE email != ?', ['kadongtata1975@gmail.com']);
  console.log('Removed other users');

  await db.query('DELETE FROM employees WHERE email != ?', ['kadongtata1975@gmail.com']);
  console.log('Removed other employees');

  // Verify
  const [u] = await db.query('SELECT id, full_name, email, role FROM users');
  console.log('Remaining users:', JSON.stringify(u));
  const [e] = await db.query('SELECT id, name, email, role FROM employees');
  console.log('Remaining employees:', JSON.stringify(e));

  process.exit(0);
}

clean().catch(e => { console.error(e.message); process.exit(1); });
