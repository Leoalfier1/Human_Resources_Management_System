const db = require('./db');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const email = 'jay.montealto@deped.gov.ph';
  const fullName = 'Jay Montealto, CESO V';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    console.log('Admin already exists');
    process.exit(0);
  }

  await db.query(
    'INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)',
    [fullName, email, hashedPassword, 'admin', true]
  );
  console.log('Admin user created');

  await db.query(
    'INSERT INTO employees (name, email, role, position, unit) VALUES (?, ?, ?, ?, ?)',
    [fullName, email, 'admin', 'Schools Division Superintendent', 'Office of the SDS']
  );
  console.log('Admin employee record created');

  process.exit(0);
}

createAdmin().catch(e => { console.error(e.message); process.exit(1); });
