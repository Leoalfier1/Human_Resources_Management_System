const db = require('../db');

async function main() {
    try {
        console.log("=== TABLE COLLATIONS ===");
        const [tableStatus] = await db.query(`
            SHOW TABLE STATUS 
            WHERE Name IN ('schools_offices', 'signatories', 'applications', 'vacancies', 'congratulatory_advices', 'users')
        `);
        tableStatus.forEach(t => {
            console.log(`Table: ${t.Name} | Collation: ${t.Collation}`);
        });

        console.log("\n=== COLUMN COLLATIONS ===");
        const [colStatus] = await db.query(`
            SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('schools_offices', 'signatories', 'applications', 'vacancies', 'congratulatory_advices', 'users')
            AND COLLATION_NAME IS NOT NULL
            ORDER BY TABLE_NAME, COLUMN_NAME
        `);
        colStatus.forEach(c => {
            console.log(`Table: ${c.TABLE_NAME} | Column: ${c.COLUMN_NAME} | Collation: ${c.COLLATION_NAME}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
