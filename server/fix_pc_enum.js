const db = require('./db');

async function fixEnum() {
  try {
    await db.query("ALTER TABLE performance_commitments MODIFY COLUMN position_type ENUM('teaching', 'non_teaching', 'teaching_related') DEFAULT 'non_teaching'");
    console.log("✅ Successfully updated performance_commitments position_type ENUM to include 'teaching_related'!");
  } catch (err) {
    console.error("❌ Failed to alter table:", err);
  } finally {
    process.exit(0);
  }
}

fixEnum();
