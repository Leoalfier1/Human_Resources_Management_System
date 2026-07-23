const db = require('./db');

async function fixCommitmentScores() {
  try {
    console.log('⏳ Updating performance_commitments & ipcrf scores to 5.0000 (Outstanding)...');
    
    // Update performance_commitments
    await db.query(`
      UPDATE performance_commitments 
      SET overall_weighted_score = 5.0000, 
          adjectival_rating = 'Outstanding'
    `);

    // Update ipcrf
    await db.query(`
      UPDATE ipcrf 
      SET weighted_average_rating = 5.0000
    `);

    console.log('✅ Updated all performance_commitments and ipcrf records to 5.0000 (Outstanding) in MySQL!');
  } catch (err) {
    console.error('Error updating commitment scores:', err);
  } finally {
    process.exit(0);
  }
}

fixCommitmentScores();
