const db = require('./db');

async function testUnsubmit() {
  try {
    console.log("Simulating unsubmit API logic for employee 2 (Raul)...");
    
    // Simulating getMyEmployee(req)
    const [empRows] = await db.query('SELECT * FROM employees WHERE email = ?', ['kadongtata1975@gmail.com']);
    if (empRows.length === 0) {
      console.error("❌ Employee not found");
      process.exit(1);
    }
    const employee = empRows[0];
    console.log("Found Employee:", employee.name, "ID:", employee.id);

    const ipcrf_id = 1;
    
    // Simulating the query
    const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE id = ? AND employee_id = ?', [ipcrf_id, employee.id]);
    if (ipcrfRows.length === 0) {
      console.error("❌ Forbidden: IPCRF not found or doesn't match employee");
      process.exit(1);
    }
    const ipcrf = ipcrfRows[0];
    console.log("Found IPCRF status:", ipcrf.status);

    if (['reviewed', 'finalized', 'approved'].includes(ipcrf.status)) {
      console.error("❌ Cannot unsubmit an IPCRF that has already been approved or finalized.");
      process.exit(1);
    }

    // Try executing the queries
    await db.query("UPDATE ipcrf SET status = 'not_submitted', ratee_signed = FALSE, signed_at = NULL WHERE id = ?", [ipcrf_id]);
    await db.query("UPDATE performance_commitments SET status = 'draft' WHERE employee_id = ? AND rating_period_id = ?", [employee.id, ipcrf.rating_period_id]);
    
    console.log("✅ Database queries completed successfully!");
  } catch (err) {
    console.error("❌ Error during test:", err);
  } finally {
    process.exit(0);
  }
}

testUnsubmit();
