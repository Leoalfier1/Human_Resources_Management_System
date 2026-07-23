const db = require('./db');

async function fixEmployeesEnum() {
  try {
    await db.query("ALTER TABLE employees MODIFY COLUMN employee_type ENUM('teaching', 'non_teaching', 'teaching_related') DEFAULT 'non_teaching'");
    console.log("✅ Altered employees employee_type column to include 'teaching_related'!");
  } catch (err) {
    console.error("❌ Failed to alter employees table:", err);
  }
}

fixEmployeesEnum();
