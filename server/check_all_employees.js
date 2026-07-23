const db = require('./db');

async function checkAllEmployees() {
  const [emps] = await db.query('SELECT id, name, position, role, employee_type, email FROM employees');
  console.log('--- ALL EMPLOYEES IN DATABASE ---');
  for (const e of emps) {
    const [comm] = await db.query('SELECT id, status, final_rating_submitted_at, overall_weighted_score, adjectival_rating FROM performance_commitments WHERE employee_id = ?', [e.id]);
    const [ipcrf] = await db.query('SELECT id, status FROM ipcrf WHERE employee_id = ?', [e.id]);
    console.log(`Employee ID ${e.id}: ${e.name} (${e.position} | ${e.employee_type})`);
    console.log(`  -> Commitment: ${comm.length > 0 ? `ID #${comm[0].id} (status: ${comm[0].status}, final_submitted: ${comm[0].final_rating_submitted_at})` : 'None'}`);
    console.log(`  -> IPCRF: ${ipcrf.length > 0 ? `ID #${ipcrf[0].id} (status: ${ipcrf[0].status})` : 'None'}`);
  }
  process.exit(0);
}

checkAllEmployees();
