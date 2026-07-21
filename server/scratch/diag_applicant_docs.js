require('dotenv').config();
const db = require('../db');

async function main() {
    console.log('=== APPLICANTS / USERS ===');
    const [apps] = await db.query('SELECT id, full_name, email FROM applications WHERE id = 5 OR full_name LIKE "%jhustyn%" OR email LIKE "%jhustyn%"');
    console.log('Applications matching 5 or jhustyn:', apps);

    const appId = apps[0]?.id || 5;
    const userId = apps[0]?.user_id;

    console.log('\n=== APPOINTMENT DOCUMENTS for application_id =', appId, '===');
    const [apptDocs] = await db.query('SELECT * FROM appointment_documents WHERE applicant_id = ?', [appId]);
    console.table(apptDocs);

    console.log('\n=== SEARCHING ALL TABLES FOR DOCUMENTS RELATED TO THIS APPLICANT / USER ===');
    const [tables] = await db.query('SHOW TABLES');
    for (const t of tables) {
        const tableName = Object.values(t)[0];
        const [cols] = await db.query(`DESCRIBE ${tableName}`);
        const colNames = cols.map(c => c.Field);
        
        if (colNames.includes('file_path') || colNames.includes('file_url') || colNames.includes('document_path') || colNames.includes('path') || colNames.includes('url')) {
            console.log(`\n--- Table with file/path column: ${tableName} ---`);
            console.log('Columns:', colNames.join(', '));
            const [rows] = await db.query(`SELECT * FROM ${tableName} LIMIT 10`);
            console.log(`Sample rows from ${tableName}:`, rows);
        }
    }

    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
