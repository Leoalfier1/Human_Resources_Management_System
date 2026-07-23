const db = require('./db');

async function resetCommitments() {
  try {
    // 1. Delete all nominations
    await db.query("DELETE FROM rewards_recognition");
    console.log("✅ Cleared all nominations!");

    // 2. Reset commitments
    await db.query(`
      UPDATE performance_commitments 
      SET final_rating_submitted_at = NULL, 
          status = 'submitted',
          rater_signature = NULL
    `);
    
    // 3. Reset IPCRFs
    await db.query(`
      UPDATE ipcrf 
      SET status = 'submitted', 
          finalized_at = NULL,
          rater_signed = FALSE,
          rater_signature = NULL
    `);
    
    console.log("✅ Reset all performance commitments & IPCRFs to 'submitted' for Rater review testing!");
  } catch (err) {
    console.error("Error resetting commitments:", err);
  } finally {
    process.exit(0);
  }
}

resetCommitments();
