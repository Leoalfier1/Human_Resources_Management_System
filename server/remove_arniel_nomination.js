const db = require('./db');

async function removeArnielNomination() {
  console.log('⏳ Removing Arniel M. Banawa (employee_id: 4) from rewards_recognition...');
  const [result] = await db.query('DELETE FROM rewards_recognition WHERE employee_id = 4 OR commitment_id = 6');
  console.log(`✅ Removed ${result.affectedRows} nomination record(s) for Arniel M. Banawa!`);
  process.exit(0);
}

removeArnielNomination();
