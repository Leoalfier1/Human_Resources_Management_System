require('dotenv').config();
const db = require('./db');
(async () => {
    const [cols] = await db.query("SHOW COLUMNS FROM employees");
    console.log('Total columns:', cols.length);
    cols.forEach(c => console.log(`  ${c.Field} — ${c.Type}${c.Null === 'NO' ? ' NOT NULL' : ''}${c.Default !== null ? ' DEFAULT ' + c.Default : ''}`));
    process.exit(0);
})();
