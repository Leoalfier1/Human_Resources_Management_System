const mysql = require('mysql2/promise');
require('dotenv').config();

// We use a "Pool" because it is better for handling multiple users
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectTimeout: 30000,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    idleTimeout: 60000,
    maxIdle: 5
});

db.on('error', (err) => {
    console.error('⚠️ MySQL pool error:', err.code);
});

// Test the connection and run self-healing schema patch
async function initDb() {
    try {
        await db.query('SELECT 1');
        console.log('✅ Connected to MySQL Database!');
        await patchDatabase();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    }
}

// Self-healing database initialization / patch
async function patchDatabase() {
    try {
        console.log('📡 Running database self-healing check...');

        // 1. Check and alter ld_attendance if columns are missing
        const [columns] = await db.query("SHOW COLUMNS FROM ld_attendance");
        const hasCertPath = columns.some(c => c.Field === 'certificate_path');
        const hasAckAt = columns.some(c => c.Field === 'acknowledged_at');

        if (!hasCertPath) {
            await db.query("ALTER TABLE ld_attendance ADD COLUMN certificate_path VARCHAR(500) DEFAULT NULL");
            console.log("🔹 Added certificate_path column to ld_attendance");
        }
        if (!hasAckAt) {
            await db.query("ALTER TABLE ld_attendance ADD COLUMN acknowledged_at TIMESTAMP NULL DEFAULT NULL");
            console.log("🔹 Added acknowledged_at column to ld_attendance");
        }

        // 2. Check and create appeals table
        await db.query(`
            CREATE TABLE IF NOT EXISTS appeals (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                applicant_id INT NOT NULL,
                reason TEXT NOT NULL,
                status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
                admin_response TEXT DEFAULT NULL,
                reviewed_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_appeals_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
                CONSTRAINT fk_appeals_applicant FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Add application_id FK to applicant_eligibility_screening for idempotent sync
        const [aesColumns] = await db.query("SHOW COLUMNS FROM applicant_eligibility_screening");
        const hasAppId = aesColumns.some(c => c.Field === 'application_id');
        if (!hasAppId) {
            await db.query("ALTER TABLE applicant_eligibility_screening ADD COLUMN application_id INT DEFAULT NULL AFTER id");
            await db.query("ALTER TABLE applicant_eligibility_screening ADD UNIQUE INDEX uq_aes_application (application_id)");
            await db.query("ALTER TABLE applicant_eligibility_screening ADD CONSTRAINT fk_aes_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE");
            console.log("🔹 Added application_id column + FK to applicant_eligibility_screening");
        }

        // 4. Widen name_extension column size to VARCHAR(100) to prevent ER_DATA_TOO_LONG
        const [pdsCols] = await db.query("SHOW COLUMNS FROM personal_data_sheets");
        const neColPds = pdsCols.find(c => c.Field === 'name_extension');
        if (neColPds && neColPds.Type && neColPds.Type.includes('20')) {
            await db.query("ALTER TABLE personal_data_sheets MODIFY COLUMN name_extension VARCHAR(100) DEFAULT NULL");
            console.log("🔹 Widened name_extension column to VARCHAR(100) in personal_data_sheets");
        }

        const [empCols] = await db.query("SHOW COLUMNS FROM employees");
        const neColEmp = empCols.find(c => c.Field === 'name_extension');
        if (neColEmp && neColEmp.Type && neColEmp.Type.includes('20')) {
            await db.query("ALTER TABLE employees MODIFY COLUMN name_extension VARCHAR(100) DEFAULT NULL");
            console.log("🔹 Widened name_extension column to VARCHAR(100) in employees");
        }

        // 5. Sync IES evaluation weights from templates to correct older records that had 10.00
        await db.query(`
            UPDATE ies_criterion_scores ics
            JOIN ies_evaluations ie ON ics.ies_evaluation_id = ie.id
            JOIN ies_weight_templates iwt ON ie.position_category = iwt.position_category 
                AND (ie.bracket_key = iwt.bracket_key OR (ie.bracket_key IS NULL AND iwt.bracket_key IS NULL))
                AND ics.criteria_key = iwt.criteria_key
            SET ics.weight_allocation = iwt.max_points
            WHERE ics.weight_allocation != iwt.max_points;
        `);
        console.log("🔹 Synced IES evaluation criteria weights with DO 007 templates");

        // 6. Fix "0 as sentinel" flaw by allowing NULL in actual_score
        const [icsCols] = await db.query("SHOW COLUMNS FROM ies_criterion_scores");
        const asCol = icsCols.find(c => c.Field === 'actual_score');
        if (asCol && asCol.Null === 'NO') {
            await db.query("ALTER TABLE ies_criterion_scores MODIFY COLUMN actual_score decimal(5,2) DEFAULT NULL");
            // Set existing 0.00 to NULL to clear the old scaffolded default, BUT ONLY for draft evaluations with total 0
            await db.query(`
                UPDATE ies_criterion_scores ics
                JOIN ies_evaluations ie ON ics.ies_evaluation_id = ie.id
                SET ics.actual_score = NULL
                WHERE ics.actual_score = 0 AND ie.status = 'draft' AND (ie.total_score = 0 OR ie.total_score IS NULL)
            `);
            console.log("🔹 Updated actual_score to allow NULL and cleared old 0.00 scaffolds");
        }

        // 7. Fix schools_offices collation mismatch (migration 045)
        //    schools_offices was created with the MySQL 8 server-default collation
        //    (utf8mb4_0900_ai_ci) while every other table uses utf8mb4_unicode_ci.
        //    JOINing schools_offices.name against vacancies.assigned_school causes
        //    "Illegal mix of collations" (ER_CANT_AGGREGATE_2COLLATIONS).
        const [soStatus] = await db.query(`SHOW TABLE STATUS WHERE Name = 'schools_offices'`);
        if (soStatus.length > 0 && soStatus[0].Collation !== 'utf8mb4_unicode_ci') {
            await db.query(
                `ALTER TABLE schools_offices CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );
            console.log('🔹 Fixed schools_offices collation → utf8mb4_unicode_ci');
        }

        console.log("✅ Database self-healing check completed successfully.");

    } catch (err) {
        console.error('❌ Database self-healing check failed:', err.message);
    }
}

initDb();

module.exports = db;