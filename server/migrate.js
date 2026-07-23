const db = require('./db');

async function migrate() {
  console.log('⏳ Running database migration...');

  try {
    // 1. Add missing columns to kra_templates
    const [ktCols] = await db.query("SHOW COLUMNS FROM kra_templates");
    const ktFields = ktCols.map(c => c.Field);

    if (!ktFields.includes('position_type')) {
      await db.query("ALTER TABLE kra_templates ADD COLUMN position_type enum('teaching','non_teaching') DEFAULT 'non_teaching' AFTER sort_order");
      console.log('✓ Added position_type to kra_templates');
    }
    if (!ktFields.includes('category_name')) {
      await db.query("ALTER TABLE kra_templates ADD COLUMN category_name varchar(200) DEFAULT NULL AFTER position_type");
      console.log('✓ Added category_name to kra_templates');
    }
    if (!ktFields.includes('default_weight_percent')) {
      await db.query("ALTER TABLE kra_templates ADD COLUMN default_weight_percent decimal(5,2) DEFAULT NULL AFTER category_name");
      console.log('✓ Added default_weight_percent to kra_templates');
    }
    if (!ktFields.includes('description')) {
      await db.query("ALTER TABLE kra_templates ADD COLUMN description text AFTER default_weight_percent");
      console.log('✓ Added description to kra_templates');
    }
    if (!ktFields.includes('is_active')) {
      await db.query("ALTER TABLE kra_templates ADD COLUMN is_active tinyint(1) DEFAULT 1 AFTER description");
      console.log('✓ Added is_active to kra_templates');
    }

    // 2. Create performance_commitments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_commitments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        rating_period_id INT NOT NULL,
        position_type enum('teaching','non_teaching') DEFAULT 'non_teaching',
        status enum('draft','submitted','under_review','committed','returned','needs_revision') DEFAULT 'draft',
        overall_weighted_score decimal(5,4) DEFAULT NULL,
        adjectival_rating varchar(50) DEFAULT NULL,
        rater_id INT DEFAULT NULL,
        reviewing_authority_id INT DEFAULT NULL,
        submitted_at timestamp NULL DEFAULT NULL,
        committed_at timestamp NULL DEFAULT NULL,
        final_rating_submitted_at timestamp NULL DEFAULT NULL,
        rater_rating_submitted_at timestamp NULL DEFAULT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_employee (employee_id),
        INDEX idx_period (rating_period_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created performance_commitments table');

    // 3. Create performance_targets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_targets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        commitment_id INT NOT NULL,
        kra_template_id INT DEFAULT NULL,
        kra_category varchar(200) DEFAULT NULL,
        weight_percent decimal(5,2) DEFAULT 0,
        target_description text,
        success_indicator text,
        self_rating int DEFAULT NULL,
        rater_rating decimal(5,2) DEFAULT NULL,
        final_rating decimal(5,2) DEFAULT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_commitment (commitment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created performance_targets table');

    // 4. Create adjectival_bands table
    await db.query(`
      CREATE TABLE IF NOT EXISTS adjectival_bands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        min_score decimal(5,4) NOT NULL,
        max_score decimal(5,4) NOT NULL,
        label varchar(100) NOT NULL,
        sort_order int DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created adjectival_bands table');

    // 5. Create rewards_recognition table
    await db.query(`
      CREATE TABLE IF NOT EXISTS rewards_recognition (
        id INT AUTO_INCREMENT PRIMARY KEY,
        commitment_id INT DEFAULT NULL,
        employee_id INT NOT NULL,
        reward_type varchar(100) DEFAULT NULL,
        nomination_status enum('nominated','approved','rejected') DEFAULT 'nominated',
        nominated_by int DEFAULT NULL,
        nominated_at timestamp DEFAULT CURRENT_TIMESTAMP,
        approved_by int DEFAULT NULL,
        approved_at timestamp NULL DEFAULT NULL,
        notes text,
        INDEX idx_employee (employee_id),
        INDEX idx_commitment (commitment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created rewards_recognition table');

    // 6. Create coaching_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS coaching_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        commitment_id INT NOT NULL,
        target_id INT DEFAULT NULL,
        author_id INT NOT NULL,
        entry_date date DEFAULT NULL,
        note text,
        evidence_file_path varchar(500) DEFAULT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_commitment (commitment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created coaching_logs table');

    // 7. Create performance_objectives table
    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_objectives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ipcrf_objective_id INT NOT NULL,
        sequence_no int DEFAULT 1,
        objective_description text,
        mfo_category varchar(200) DEFAULT NULL,
        timeline_start date DEFAULT NULL,
        timeline_end date DEFAULT NULL,
        objective_weight decimal(5,2) DEFAULT 0,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ipcrf_obj (ipcrf_objective_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created performance_objectives table');

    // 8. Create performance_indicators table
    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_indicators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        performance_objective_id INT NOT NULL,
        dimension varchar(100) DEFAULT NULL,
        level_5_text text,
        level_4_text text,
        level_3_text text,
        level_2_text text,
        level_1_text text,
        INDEX idx_perf_obj (performance_objective_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created performance_indicators table');

    // 9. Create planned_mov_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS planned_mov_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        performance_objective_id INT NOT NULL,
        description text,
        INDEX idx_perf_obj (performance_objective_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created planned_mov_items table');

    // 10. Create objective_self_ratings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS objective_self_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        performance_objective_id INT NOT NULL UNIQUE,
        quality_rating int DEFAULT NULL,
        efficiency_rating int DEFAULT NULL,
        timeliness_rating int DEFAULT NULL,
        average_rating decimal(5,2) DEFAULT NULL,
        score decimal(10,4) DEFAULT NULL,
        rated_at timestamp NULL DEFAULT NULL,
        INDEX idx_perf_obj (performance_objective_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created objective_self_ratings table');

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
