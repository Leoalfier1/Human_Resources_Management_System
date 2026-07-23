const db = require('./db');

async function removeRaulNomination() {
  try {
    console.log('Removing Raul M. Colot Jr. nomination and resetting status...');
    
    // 1. Delete nomination
    await db.query('DELETE FROM rewards_recognition WHERE employee_id = 2');
    console.log('✅ Deleted rewards_recognition nominations for Raul.');

    // 2. Reset commitment
    await db.query(`
      UPDATE performance_commitments 
      SET status = 'submitted', 
          final_rating_submitted_at = NULL,
          rater_signature = NULL
      WHERE employee_id = 2
    `);
    console.log('✅ Reset performance_commitments status to submitted.');

    // 3. Reset IPCRF
    await db.query(`
      UPDATE ipcrf 
      SET status = 'submitted', 
          rater_signed = FALSE, 
          finalized_at = NULL,
          rater_signature = NULL
      WHERE employee_id = 2
    `);
    console.log('✅ Reset ipcrf status to submitted.');

    console.log('🎉 Done! Raul M. Colot Jr. is fully reset and ready for re-review and re-nomination!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

removeRaulNomination();
