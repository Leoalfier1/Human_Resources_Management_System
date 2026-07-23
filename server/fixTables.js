require('dotenv').config();
const db = require('./db');

async function fix() {
    try {
        // Create missing tables that initDb.js should have created
        await db.query(`CREATE TABLE IF NOT EXISTS performance_commitments (
            id INT PRIMARY KEY AUTO_INCREMENT,
            employee_id INT NOT NULL,
            rating_period_id INT NOT NULL,
            position_type ENUM('teaching','non_teaching','teaching_related') NOT NULL DEFAULT 'non_teaching',
            status ENUM('draft','submitted','committed','returned') DEFAULT 'draft',
            submitted_at TIMESTAMP NULL,
            committed_at TIMESTAMP NULL,
            rater_id INT NULL,
            reviewing_authority_id INT NULL,
            self_rating_submitted_at TIMESTAMP NULL,
            rater_rating_submitted_at TIMESTAMP NULL,
            final_rating_submitted_at TIMESTAMP NULL,
            overall_weighted_score DECIMAL(5,4) DEFAULT 0.0000,
            adjectival_rating VARCHAR(100) DEFAULT 'Not Rated',
            employee_acknowledged_at TIMESTAMP NULL,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
            FOREIGN KEY (rating_period_id) REFERENCES rating_periods(id) ON DELETE CASCADE
        )`);
        console.log('OK: performance_commitments');

        await db.query(`CREATE TABLE IF NOT EXISTS performance_targets (
            id INT PRIMARY KEY AUTO_INCREMENT,
            commitment_id INT NOT NULL,
            kra_template_id INT,
            kra_category VARCHAR(255) NOT NULL,
            weight_percent DECIMAL(5,2) NOT NULL,
            target_description TEXT,
            success_indicator TEXT,
            self_rating DECIMAL(3,2),
            rater_rating DECIMAL(3,2),
            final_rating DECIMAL(3,2),
            FOREIGN KEY (commitment_id) REFERENCES performance_commitments(id) ON DELETE CASCADE
        )`);
        console.log('OK: performance_targets');

        await db.query(`CREATE TABLE IF NOT EXISTS coaching_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            commitment_id INT NOT NULL,
            target_id INT,
            log_type VARCHAR(50),
            notes TEXT,
            file_path VARCHAR(500),
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (commitment_id) REFERENCES performance_commitments(id) ON DELETE CASCADE,
            FOREIGN KEY (target_id) REFERENCES performance_targets(id) ON DELETE SET NULL
        )`);
        console.log('OK: coaching_logs');

        await db.query(`CREATE TABLE IF NOT EXISTS rewards_recognition (
            id INT PRIMARY KEY AUTO_INCREMENT,
            commitment_id INT NOT NULL,
            reward_type_id INT,
            employee_id INT NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            notes TEXT,
            approved_by INT,
            approved_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (commitment_id) REFERENCES performance_commitments(id) ON DELETE CASCADE
        )`);
        console.log('OK: rewards_recognition');

        await db.query(`CREATE TABLE IF NOT EXISTS adjectival_bands (
            id INT PRIMARY KEY AUTO_INCREMENT,
            label VARCHAR(100) NOT NULL,
            min_score DECIMAL(4,2) NOT NULL,
            max_score DECIMAL(4,2) NOT NULL,
            sort_order INT DEFAULT 0
        )`);
        console.log('OK: adjectival_bands');

        // Seed adjectival bands if empty
        const [bands] = await db.query('SELECT COUNT(*) as cnt FROM adjectival_bands');
        if (bands[0].cnt === 0) {
            await db.query(`INSERT INTO adjectival_bands (label, min_score, max_score, sort_order) VALUES
                ('Outstanding', 4.50, 5.00, 1),
                ('Very Satisfactory', 3.50, 4.49, 2),
                ('Satisfactory', 2.50, 3.49, 3),
                ('Fair', 1.50, 2.49, 4),
                ('Poor', 0.00, 1.49, 5)`);
            console.log('OK: seeded adjectival_bands');
        }

        console.log('\nAll missing tables created!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

fix();
