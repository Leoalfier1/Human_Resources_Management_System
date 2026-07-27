const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'deped_hrmis',
      multipleStatements: true,
    });

    const sqlPath = path.join(__dirname, '006_add_pd_program_tests.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running Migration 006 (PD Program Tests)...');
    await db.query(sql);
    console.log('✅ Migration 006 executed successfully!');
    await db.end();
  } catch (err) {
    console.error('❌ Migration 006 failed:', err.message);
    process.exit(1);
  }
})();
