const db = require('./db');

async function run() {
  try {
    const [rows] = await db.query('SELECT * FROM rating_periods');
    console.log("=== rating_periods ===");
    console.log(rows);
    
    const [comms] = await db.query('SELECT * FROM performance_commitments');
    console.log("=== performance_commitments ===");
    console.log(comms);

    const [employees] = await db.query('SELECT * FROM employees');
    console.log("=== employees ===");
    console.log(employees);

    const [users] = await db.query('SELECT * FROM users');
    console.log("=== users ===");
    console.log(users);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
