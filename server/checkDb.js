const db = require('./db');

async function check() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    console.log("TABLES IN DB:");
    console.log(tables);

    for (let t of tables) {
      const tableName = Object.values(t)[0];
      const [columns] = await db.query(`DESCRIBE \`${tableName}\``);
      console.log(`\nCOLUMNS FOR ${tableName}:`);
      console.log(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
