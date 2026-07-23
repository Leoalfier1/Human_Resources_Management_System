const db = require('./db');

async function addSignatureColumns() {
  try {
    console.log('Adding rater_signature column to performance_commitments...');
    await db.query(`
      ALTER TABLE performance_commitments 
      ADD COLUMN rater_signature LONGTEXT NULL
    `);
    console.log('✅ Added to performance_commitments!');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('⚠️ Column already exists in performance_commitments.');
    } else {
      console.error(err);
    }
  }

  try {
    console.log('Adding rater_signature column to ipcrf...');
    await db.query(`
      ALTER TABLE ipcrf 
      ADD COLUMN rater_signature LONGTEXT NULL
    `);
    console.log('✅ Added to ipcrf!');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('⚠️ Column already exists in ipcrf.');
    } else {
      console.error(err);
    }
  }

  process.exit(0);
}

addSignatureColumns();
