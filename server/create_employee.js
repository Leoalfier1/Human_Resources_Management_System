const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const db = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'deped_hrmis'
  });

  const hash = await bcrypt.hash('Employee@123', 10);

  try {
    await db.execute(
      `INSERT INTO users (first_name, last_name, email, password, role, is_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      ['Alma', 'Reyes', 'alma.reyes@deped.gov.ph', hash, 'applicant', 1]
    );
    console.log('✅ Employee account CREATED!');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      await db.execute(
        `UPDATE users SET password = ?, role = 'applicant', is_verified = 1
         WHERE email = ?`,
        [hash, 'alma.reyes@deped.gov.ph']
      );
      console.log('✅ Employee account already exists — password RESET!');
    } else {
      console.error('❌ Error:', err.message);
    }
  }

  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║        EMPLOYEE PORTAL TEST ACCOUNT       ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  Email:    alma.reyes@deped.gov.ph        ║');
  console.log('  ║  Password: Employee@123                   ║');
  console.log('  ║  Role:     applicant                      ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  URL: /ld-employee/profile                ║');
  console.log('  ╚══════════════════════════════════════════╝');

  await db.end();
})();
