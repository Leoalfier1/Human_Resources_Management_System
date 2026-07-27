const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const db = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'root', database: 'deped_hrmis'
  });

  // Show all admin/staff accounts and their verified status
  const [rows] = await db.execute(
    "SELECT id, email, full_name, role, is_verified FROM users WHERE role IN ('admin','staff','hr_staff','hrmpsb','appointing_authority')"
  );
  
  console.log('\n=== Admin/Staff Accounts ===');
  rows.forEach(r => {
    console.log(`  [${r.role}] ${r.full_name} | ${r.email} | verified: ${r.is_verified}`);
  });

  // Make sure ALL admin/staff are verified and reset admin password
  const hash = await bcrypt.hash('Admin@123', 10);
  await db.execute(
    "UPDATE users SET is_verified = 1, password = ? WHERE email = 'admin@deped-dapitan.gov.ph'",
    [hash]
  );
  console.log('\n✅ admin@deped-dapitan.gov.ph → password set to Admin@123, verified = true');
  console.log('\n=== HOW TO LOG IN ===');
  console.log('  URL:      http://localhost:5173');
  console.log('  Toggle:   Staff / Admin Login');
  console.log('  Email:    admin@deped-dapitan.gov.ph');
  console.log('  Password: Admin@123');
  console.log('  After login → go to: http://localhost:5173/ld-portal/dashboard');

  await db.end();
})();
