const db = require('./db');

(async () => {
  try {
    await db.query(`
      UPDATE performance_commitments 
      SET status = 'draft', 
          final_rating_submitted_at = NULL, 
          overall_weighted_score = NULL, 
          adjectival_rating = NULL 
      WHERE employee_id = 8
    `);

    await db.query(`
      UPDATE ipcrf 
      SET status = 'not_submitted', 
          ratee_signed = 0,
          signed_at = NULL,
          finalized_at = NULL, 
          weighted_average_rating = NULL 
      WHERE employee_id = 8
    `);

    await db.query(`
      UPDATE performance_targets 
      SET rater_rating = NULL, 
          final_rating = NULL 
      WHERE commitment_id = 3
    `);

    console.log('✅ Successfully reset Raul M. Colot Jr. (Emp 8) to DRAFT / NOT_SUBMITTED!');

    const [comms] = await db.query('SELECT id, employee_id, status FROM performance_commitments WHERE employee_id = 8');
    console.log('Commitment Status:', comms[0]);

    const [ipcrf] = await db.query('SELECT id, employee_id, status FROM ipcrf WHERE employee_id = 8');
    console.log('IPCRF Status:', ipcrf[0]);

    process.exit(0);
  } catch (err) {
    console.error('Error resetting ratings:', err);
    process.exit(1);
  }
})();
