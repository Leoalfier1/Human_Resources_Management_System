const db = require('./db');

async function fixVarchar() {
  try {
    await db.query("ALTER TABLE employees MODIFY COLUMN employee_type VARCHAR(50) DEFAULT 'non_teaching'");
    console.log("✅ Successfully updated employees employee_type column to VARCHAR(50)!");
  } catch (err) {
    console.error("❌ Failed to alter employees table:", err);
  } finally {
    process.exit(0);
  }
}

fixVarchar();
