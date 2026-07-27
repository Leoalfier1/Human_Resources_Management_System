const db = require('../db');

async function migrate() {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM ld_materials');
    const colNames = cols.map(c => c.Field);
    console.log('Current columns:', colNames.join(', '));

    if (!colNames.includes('file_size')) {
      await db.query('ALTER TABLE ld_materials ADD COLUMN file_size BIGINT DEFAULT NULL AFTER file_name');
      console.log('✅ file_size column added');
    } else {
      console.log('ℹ️  file_size already exists');
    }

    if (!colNames.includes('section_type')) {
      await db.query('ALTER TABLE ld_materials ADD COLUMN section_type VARCHAR(50) DEFAULT NULL AFTER file_type');
      console.log('✅ section_type column added');
    } else {
      console.log('ℹ️  section_type already exists');
    }

    console.log('✅ Migration complete');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  }
}

migrate();
