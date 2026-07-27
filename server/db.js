const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.MYSQL_PASSWORD || 'root',
    database: process.env.DB_NAME || 'deped_hrmis',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// We use a "Pool" because it is better for handling multiple users
const pool = mysql.createPool(dbConfig);

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

async function tableExists(db, tableName) {
    const [rows] = await db.query('SHOW TABLES LIKE ?', [tableName]);
    return rows.length > 0;
}

async function ensureTable(db, tableName, createSql) {
    if (await tableExists(db, tableName)) {
        return false;
    }
    await db.query(createSql);
    return true;
}

// Self-healing database initialization / patch
async function patchDatabase() {
    try {
        const db = pool.promise();
        console.log('📡 Running database self-healing check...');

        // Ensure employees table exists for employee profile management
        await ensureTable(db, 'employees', `
            CREATE TABLE employees (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                employee_no VARCHAR(50) DEFAULT NULL,
                first_name VARCHAR(100) DEFAULT NULL,
                middle_name VARCHAR(100) DEFAULT NULL,
                last_name VARCHAR(100) DEFAULT NULL,
                name_extension VARCHAR(20) DEFAULT NULL,
                date_of_birth DATE DEFAULT NULL,
                place_of_birth VARCHAR(255) DEFAULT NULL,
                sex VARCHAR(20) DEFAULT NULL,
                civil_status VARCHAR(30) DEFAULT NULL,
                blood_type VARCHAR(10) DEFAULT NULL,
                gsis_id VARCHAR(50) DEFAULT NULL,
                pagibig_id VARCHAR(50) DEFAULT NULL,
                philhealth_no VARCHAR(50) DEFAULT NULL,
                tin_no VARCHAR(50) DEFAULT NULL,
                mobile_no VARCHAR(50) DEFAULT NULL,
                email VARCHAR(150) DEFAULT NULL,
                address TEXT DEFAULT NULL,
                assigned_school VARCHAR(255) DEFAULT NULL,
                employment_status VARCHAR(50) DEFAULT 'permanent',
                employment_type VARCHAR(50) DEFAULT 'teaching',
                position_title VARCHAR(100) DEFAULT 'Teacher III',
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 1. Create ld_attendance if missing, then add any missing columns
        await ensureTable(db, 'ld_attendance', `
            CREATE TABLE ld_attendance (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                program_id INT NOT NULL,
                user_id INT NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'present',
                certificate_path VARCHAR(500) DEFAULT NULL,
                acknowledged_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        const [columns] = await db.query("SHOW COLUMNS FROM ld_attendance");
        const hasCertPath = columns.some(c => c.Field === 'certificate_path');
        const hasAckAt = columns.some(c => c.Field === 'acknowledged_at');
        const hasRemarks = columns.some(c => c.Field === 'remarks');

        if (!hasCertPath) {
            await db.query("ALTER TABLE ld_attendance ADD COLUMN certificate_path VARCHAR(500) DEFAULT NULL");
            console.log("🔹 Added certificate_path column to ld_attendance");
        }
        if (!hasAckAt) {
            await db.query("ALTER TABLE ld_attendance ADD COLUMN acknowledged_at TIMESTAMP NULL DEFAULT NULL");
            console.log("🔹 Added acknowledged_at column to ld_attendance");
        }
        if (!hasRemarks) {
            await db.query("ALTER TABLE ld_attendance ADD COLUMN remarks TEXT DEFAULT NULL");
            console.log("🔹 Added remarks column to ld_attendance");
        }

        // 2. Create compatibility table for appeals if the app needs it.
        await ensureTable(db, 'appeals', `
            CREATE TABLE appeals (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                application_id INT DEFAULT NULL,
                applicant_id INT DEFAULT NULL,
                reason TEXT NOT NULL,
                status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
                admin_response TEXT DEFAULT NULL,
                reviewed_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Create compatibility table for eligibility screening if missing.
        await ensureTable(db, 'applicant_eligibility_screening', `
            CREATE TABLE applicant_eligibility_screening (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                application_id INT DEFAULT NULL,
                applicant_id INT DEFAULT NULL,
                score DECIMAL(5,2) DEFAULT NULL,
                remarks TEXT DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        const [aesColumns] = await db.query("SHOW COLUMNS FROM applicant_eligibility_screening");
        const hasAppId = aesColumns.some(c => c.Field === 'application_id');
        if (!hasAppId) {
            await db.query("ALTER TABLE applicant_eligibility_screening ADD COLUMN application_id INT DEFAULT NULL AFTER id");
            console.log("🔹 Added application_id column to applicant_eligibility_screening");
        }

        // ── Step 9 & 10: DepEd Memo 044 — Update HRD Database & Continuous Improvement ──

        // 4. ld_program_completion_reports — stores submitted completion reports
        await ensureTable(db, 'ld_program_completion_reports', `
            CREATE TABLE ld_program_completion_reports (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                program_id INT NOT NULL,
                submitted_by INT DEFAULT NULL,
                completion_date DATE DEFAULT NULL,
                total_participants INT DEFAULT 0,
                total_present INT DEFAULT 0,
                total_hours DECIMAL(6,1) DEFAULT 0,
                section_1_summary TEXT DEFAULT NULL,
                section_2_summary TEXT DEFAULT NULL,
                section_3_summary TEXT DEFAULT NULL,
                section_4_summary TEXT DEFAULT NULL,
                section_5_summary TEXT DEFAULT NULL,
                section_6_summary TEXT DEFAULT NULL,
                section_7a_recommendations TEXT DEFAULT NULL,
                section_7b_challenges TEXT DEFAULT NULL,
                report_pdf_path VARCHAR(500) DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_cpr_program (program_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. ld_employee_training_records — auto-populated per-participant on completion
        await ensureTable(db, 'ld_employee_training_records', `
            CREATE TABLE ld_employee_training_records (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                program_id INT NOT NULL,
                program_title VARCHAR(255) DEFAULT NULL,
                training_date DATE DEFAULT NULL,
                duration_hours DECIMAL(6,1) DEFAULT 0,
                personnel_type VARCHAR(50) DEFAULT NULL,
                status ENUM('completed','incomplete') NOT NULL DEFAULT 'completed',
                certificate_path VARCHAR(500) DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_etr_user_program (user_id, program_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 6. ld_program_me_summaries — stores admin manual edits for M&E
        await ensureTable(db, 'ld_program_me_summaries', `
            CREATE TABLE ld_program_me_summaries (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                program_id INT NOT NULL,
                strengths JSON DEFAULT NULL,
                areas_for_improvement JSON DEFAULT NULL,
                recommendations TEXT DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_mes_program (program_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 7. Add pretest_avg / posttest_avg / approval_stage / qa_checklist / qa_comments columns to ld_programs if missing
        const [progCols] = await db.query("SHOW COLUMNS FROM ld_programs");
        if (!progCols.some(c => c.Field === 'pretest_avg')) {
            await db.query("ALTER TABLE ld_programs ADD COLUMN pretest_avg DECIMAL(5,2) DEFAULT NULL AFTER budget_estimate");
            console.log("🔹 Added pretest_avg column to ld_programs");
        }
        if (!progCols.some(c => c.Field === 'posttest_avg')) {
            await db.query("ALTER TABLE ld_programs ADD COLUMN posttest_avg DECIMAL(5,2) DEFAULT NULL AFTER pretest_avg");
            console.log("🔹 Added posttest_avg column to ld_programs");
        }
        if (!progCols.some(c => c.Field === 'approval_stage')) {
            await db.query("ALTER TABLE ld_programs ADD COLUMN approval_stage VARCHAR(50) NOT NULL DEFAULT 'SGOD Review' AFTER status");
            console.log("🔹 Added approval_stage column to ld_programs");
        }
        if (!progCols.some(c => c.Field === 'qa_checklist')) {
            await db.query("ALTER TABLE ld_programs ADD COLUMN qa_checklist JSON DEFAULT NULL AFTER approval_stage");
            console.log("🔹 Added qa_checklist column to ld_programs");
        }
        if (!progCols.some(c => c.Field === 'qa_comments')) {
            await db.query("ALTER TABLE ld_programs ADD COLUMN qa_comments TEXT DEFAULT NULL AFTER qa_checklist");
            console.log("🔹 Added qa_comments column to ld_programs");
        }
        if (!progCols.some(c => c.Field === 'training_category')) {
            await db.query("ALTER TABLE ld_programs ADD COLUMN training_category VARCHAR(150) DEFAULT NULL AFTER methodology");
            console.log("🔹 Added training_category column to ld_programs");
        }
        if (!progCols.some(c => c.Field === 'target_participants')) {
            await db.query("ALTER TABLE ld_programs ADD COLUMN target_participants VARCHAR(255) DEFAULT NULL AFTER target_position_type");
            console.log("🔹 Added target_participants column to ld_programs");
        }
        if (!progCols.some(c => c.Field === 'training_matrix')) {
            await db.query("ALTER TABLE ld_programs ADD COLUMN training_matrix JSON DEFAULT NULL AFTER qa_comments");
            console.log("🔹 Added training_matrix column to ld_programs");
        }

        // Add division, prepared_by, division_priorities columns to ld_plans if missing
        const [planCols] = await db.query("SHOW COLUMNS FROM ld_plans");
        if (!planCols.some(c => c.Field === 'division')) {
            await db.query("ALTER TABLE ld_plans ADD COLUMN division VARCHAR(150) DEFAULT 'Dapitan City' AFTER school_year");
            console.log("🔹 Added division column to ld_plans");
        }
        if (!planCols.some(c => c.Field === 'prepared_by')) {
            await db.query("ALTER TABLE ld_plans ADD COLUMN prepared_by VARCHAR(255) DEFAULT NULL AFTER division");
            console.log("🔹 Added prepared_by column to ld_plans");
        }
        if (!planCols.some(c => c.Field === 'division_priorities')) {
            await db.query("ALTER TABLE ld_plans ADD COLUMN division_priorities TEXT DEFAULT NULL AFTER prepared_by");
            console.log("🔹 Added division_priorities column to ld_plans");
        }

        // 8. Add remarks column to ld_attendance for notes — handled above

        // 9. ld_program_proposals — employee-initiated PD program proposals
        await ensureTable(db, 'ld_program_proposals', `
            CREATE TABLE ld_program_proposals (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                proposed_by INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) DEFAULT NULL,
                rationale TEXT DEFAULT NULL,
                target_participants VARCHAR(255) DEFAULT NULL,
                proposed_date_from DATE DEFAULT NULL,
                proposed_date_to DATE DEFAULT NULL,
                estimated_budget DECIMAL(10,2) DEFAULT NULL,
                mode_of_delivery VARCHAR(50) DEFAULT NULL,
                status ENUM('submitted','under_review','approved','declined','converted') NOT NULL DEFAULT 'submitted',
                admin_remarks TEXT DEFAULT NULL,
                reviewed_by INT DEFAULT NULL,
                reviewed_at TIMESTAMP NULL DEFAULT NULL,
                linked_program_id INT DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("🔹 ld_program_proposals table ensured");

        // 10. ld_notifications — persistent bell notifications for L&D portal
        await ensureTable(db, 'ld_notifications', `
            CREATE TABLE ld_notifications (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL DEFAULT 'info',
                message TEXT NOT NULL,
                link VARCHAR(500) DEFAULT NULL,
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("🔹 ld_notifications table ensured");

        // 11. ld_esat_ratings — employee e-SAT self-assessment ratings
        await ensureTable(db, 'ld_esat_ratings', `
            CREATE TABLE ld_esat_ratings (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                school_year VARCHAR(50) DEFAULT '2025–2026',
                ratings JSON DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_esat_user_sy (user_id, school_year)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("🔹 ld_esat_ratings table ensured");

        // 12. ld_ipcrf_records — employee IPCRF KRAs and appraisal ratings
        await ensureTable(db, 'ld_ipcrf_records', `
            CREATE TABLE ld_ipcrf_records (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                school_year VARCHAR(50) DEFAULT '2025–2026',
                final_rating DECIMAL(3,2) DEFAULT 3.80,
                kras JSON DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_ipcrf_user_sy (user_id, school_year)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("🔹 ld_ipcrf_records table ensured");

        // 13. ld_idp_records — employee Individual Development Plan
        await ensureTable(db, 'ld_idp_records', `
            CREATE TABLE ld_idp_records (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                development_goal TEXT DEFAULT NULL,
                learning_priority TEXT DEFAULT NULL,
                preferred_intervention TEXT DEFAULT NULL,
                target_date VARCHAR(100) DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_idp_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("🔹 ld_idp_records table ensured");

        // 14. ld_program_waps — Workplace Application Plan submissions
        await ensureTable(db, 'ld_program_waps', `
            CREATE TABLE ld_program_waps (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                program_id INT NOT NULL,
                user_id INT NOT NULL,
                wap_data JSON DEFAULT NULL,
                status VARCHAR(50) DEFAULT 'submitted',
                submitted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_wap_prog_user (program_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("🔹 ld_program_waps table ensured");

        // 15a. ld_materials — file attachments for PD programs
        await ensureTable(db, 'ld_materials', `
            CREATE TABLE ld_materials (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                program_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                file_name VARCHAR(500) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(100) DEFAULT NULL,
                file_size INT DEFAULT NULL,
                uploaded_by INT DEFAULT NULL,
                uploaded_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_mat_program (program_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("🔹 ld_materials table ensured");

        // 15. ld_session_checkins — per-session attendance check-ins
        await ensureTable(db, 'ld_session_checkins', `
            CREATE TABLE ld_session_checkins (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                program_id INT NOT NULL,
                user_id INT NOT NULL,
                session_name VARCHAR(150) NOT NULL,
                status VARCHAR(50) DEFAULT 'present',
                checked_in_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                checked_out_at TIMESTAMP NULL DEFAULT NULL,
                UNIQUE KEY uq_session_checkin (program_id, user_id, session_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("🔹 ld_session_checkins table ensured");

        const [scCols] = await db.query("SHOW COLUMNS FROM ld_session_checkins");
        const hasCheckedOutAt = scCols.some(c => c.Field === 'checked_out_at');
        if (!hasCheckedOutAt) {
            await db.query("ALTER TABLE ld_session_checkins ADD COLUMN checked_out_at TIMESTAMP NULL DEFAULT NULL AFTER checked_in_at");
            console.log("🔹 Added checked_out_at column to ld_session_checkins");
        }

        const [attCols] = await db.query("SHOW COLUMNS FROM ld_attendance");
        const hasTimeIn = attCols.some(c => c.Field === 'time_in');
        const hasTimeOut = attCols.some(c => c.Field === 'time_out');
        if (!hasTimeIn) {
            await db.query("ALTER TABLE ld_attendance ADD COLUMN time_in TIMESTAMP NULL DEFAULT NULL");
            console.log("🔹 Added time_in column to ld_attendance");
        }
        if (!hasTimeOut) {
            await db.query("ALTER TABLE ld_attendance ADD COLUMN time_out TIMESTAMP NULL DEFAULT NULL");
            console.log("🔹 Added time_out column to ld_attendance");
        }

        // Purge test proposal records matching "Christian's Dance Class"
        try {
            const [testProposals] = await db.query(
                `SELECT id, linked_program_id FROM ld_program_proposals WHERE title LIKE '%Christian%Dance Class%'`
            );
            if (testProposals.length > 0) {
                const propIds = testProposals.map(p => p.id);
                const linkedProgIds = testProposals.map(p => p.linked_program_id).filter(Boolean);

                await db.query(`DELETE FROM ld_program_proposals WHERE id IN (?)`, [propIds]);
                if (linkedProgIds.length > 0) {
                    await db.query(`DELETE FROM ld_programs WHERE id IN (?)`, [linkedProgIds]);
                }
                await db.query(`DELETE FROM ld_notifications WHERE message LIKE '%Dance Class%'`);
                console.log(`🔹 Purged ${testProposals.length} test proposal record(s) matching Christian's Dance Class`);
            }
        } catch (purgeErr) {
            console.error('Test proposal purge note:', purgeErr.message);
        }

        // Ensure ld_notifications has a user_id index for performance
        const [notifIdxRows] = await db.query(
            `SELECT INDEX_NAME FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ld_notifications' AND INDEX_NAME = 'idx_notif_user'`
        );
        if (notifIdxRows.length === 0) {
            await db.query(`ALTER TABLE ld_notifications ADD INDEX idx_notif_user (user_id, is_read)`);
            console.log("🔹 Added idx_notif_user index to ld_notifications");
        }

        // Ensure at least one default HRD plan exists in ld_plans
        try {
            const [existingPlans] = await db.query(`SELECT id FROM ld_plans LIMIT 1`);
            if (existingPlans.length === 0) {
                await db.query(
                    `INSERT INTO ld_plans (title, school_year, description, status)
                     VALUES (?, ?, ?, ?)`,
                    ['Division L&D Master Plan SY 2025–2026', '2025-2026', 'Master HRD Plan for DepEd Dapitan City Division', 'approved']
                );
                console.log("🔹 Created default HRD Plan in ld_plans");
            }
        } catch (planErr) {
            console.error('Plan seeding note:', planErr.message);
        }

        console.log("✅ Database self-healing check completed successfully.");
    } catch (err) {
        console.error('❌ Database self-healing check failed:', err.message);
    }
}

module.exports = pool.promise();