const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const db = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'deped_hrmis'
  });

  const hash = await bcrypt.hash('Applicant@123', 10);

  await db.execute(
    `UPDATE users SET password = ?, is_verified = 1 WHERE email = 'alma.reyes@deped.gov.ph'`,
    [hash]
  );

  console.log('\n✅ Applicant account ready!');
  console.log('\n=== HOW TO LOG IN (Applicant/Employee) ===');
  console.log('  URL:      http://localhost:5173');
  console.log('  Toggle:   Applicant Login');
  console.log('  Email:    alma.reyes@deped.gov.ph');
  console.log('  Password: Applicant@123');
  console.log('  After login → go to: http://localhost:5173/ld-employee/profile');

  await db.end();
})();
