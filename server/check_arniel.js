const db = require('./db');

async function checkArniel() {
  const [emp] = await db.query('SELECT * FROM employees WHERE name LIKE "%Arniel%"');
  console.log('EMPLOYEE:', emp);
  if (emp.length > 0) {
    const [comm] = await db.query('SELECT * FROM performance_commitments WHERE employee_id = ?', [emp[0].id]);
    console.log('COMMITMENT:', comm);
    const [rewards] = await db.query('SELECT * FROM rewards_recognition WHERE commitment_id IN (SELECT id FROM performance_commitments WHERE employee_id = ?)', [emp[0].id]);
    console.log('REWARDS:', rewards);
  }
  process.exit(0);
}

checkArniel();
