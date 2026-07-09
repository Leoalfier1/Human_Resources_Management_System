const mysql = require('mysql2');
require('dotenv').config();

// We use a "Pool" because it is better for handling multiple users
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection and run self-healing schema patch
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to Laragon MySQL Database!');
        connection.release();
        patchDatabase();
    }
});

// Self-healing database initialization / patch
async function patchDatabase() {
    try {
        const db = pool.promise();
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

        console.log("✅ Database self-healing check completed successfully.");
    } catch (err) {
        console.error('❌ Database self-healing check failed:', err.message);
    }
}

module.exports = pool.promise();