const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const db = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'deped_hrmis'
  });

  const hash = await bcrypt.hash('Applicant@123', 10);

  const [existing] = await db.execute(
    `SELECT id FROM users WHERE email = 'juan.delacruz@deped.gov.ph'`
  );

  if (existing.length > 0) {
    await db.execute(
      `UPDATE users SET password = ?, is_verified = 1, full_name = 'Juan Dela Cruz' WHERE email = 'juan.delacruz@deped.gov.ph'`,
      [hash]
    );
    console.log('✅ Updated existing user juan.delacruz@deped.gov.ph');
  } else {
    await db.execute(
      `INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, 'applicant', 1)`,
      ['Juan Dela Cruz', 'juan.delacruz@deped.gov.ph', hash]
    );
    console.log('✅ Created new applicant: Juan Dela Cruz');
  }

  console.log('\n=== TEST APPLICANT LOGIN ===');
  console.log('  URL:      http://localhost:5173');
  console.log('  Toggle:   Applicant Login');
  console.log('  Email:    juan.delacruz@deped.gov.ph');
  console.log('  Password: Applicant@123');
  console.log('  After login → go to: http://localhost:5173/ld-employee/profile');

  await db.end();
})();
