const db = require('./db');

async function init() {
  console.log("⏳ Initializing database...");
  try {
    // 1. Create Tables (IF NOT EXISTS - preserves data on restart)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(200) NOT NULL,
        email VARCHAR(200) UNIQUE NOT NULL,
        mobile VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ users table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS rating_periods (
        id INT PRIMARY KEY AUTO_INCREMENT,
        year INT NOT NULL,
        cycle ENUM('midyear', 'annual') NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ rating_periods table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        position VARCHAR(200),
        unit VARCHAR(200),
        role ENUM('admin', 'supervisor', 'employee') DEFAULT 'employee',
        email VARCHAR(200) UNIQUE,
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ employees table ready");

    const [empCols] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees'");
    const hasCol = (col) => empCols.some(c => c.COLUMN_NAME === col);
    if (!hasCol('plantilla_item_number')) await db.query("ALTER TABLE employees ADD COLUMN plantilla_item_number VARCHAR(100) NULL");
    if (!hasCol('form_type')) await db.query("ALTER TABLE employees ADD COLUMN form_type VARCHAR(50) DEFAULT 'IPCRF Individual'");
    if (!hasCol('employee_type')) await db.query("ALTER TABLE employees ADD COLUMN employee_type ENUM('teaching', 'non-teaching') DEFAULT 'non-teaching'");
    if (!hasCol('supervisor_id')) await db.query("ALTER TABLE employees ADD COLUMN supervisor_id INT NULL, ADD FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL");
    if (!hasCol('position')) await db.query("ALTER TABLE employees ADD COLUMN position VARCHAR(200) NULL");
    if (!hasCol('unit')) await db.query("ALTER TABLE employees ADD COLUMN unit VARCHAR(200) NULL");

    // Create Performance tables (Step 1)
    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_periods (
        id INT PRIMARY KEY AUTO_INCREMENT,
        period_name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('draft', 'active', 'closed') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ performance_periods table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_criteria (
        id INT PRIMARY KEY AUTO_INCREMENT,
        criteria_name VARCHAR(255) NOT NULL,
        weight DECIMAL(5,2) NOT NULL,
        max_score INT DEFAULT 5,
        employee_type ENUM('teaching', 'non-teaching') DEFAULT 'non-teaching',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ performance_criteria table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_evaluations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        performance_period_id INT NOT NULL,
        employee_id INT NOT NULL,
        supervisor_id INT NOT NULL,
        overall_score DECIMAL(5,2) DEFAULT 0.00,
        comments TEXT,
        status ENUM('draft', 'submitted', 'acknowledged') DEFAULT 'draft',
        acknowledged_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (performance_period_id) REFERENCES performance_periods(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ performance_evaluations table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_ratings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        performance_evaluation_id INT NOT NULL,
        performance_criteria_id INT NOT NULL,
        score DECIMAL(3,2) NOT NULL,
        FOREIGN KEY (performance_evaluation_id) REFERENCES performance_evaluations(id) ON DELETE CASCADE,
        FOREIGN KEY (performance_criteria_id) REFERENCES performance_criteria(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ performance_ratings table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS kra_templates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        rating_period_id INT,
        kra_name VARCHAR(200) NOT NULL,
        weight_percent DECIMAL(5,2) NOT NULL,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (rating_period_id) REFERENCES rating_periods(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ kra_templates table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS kra_objectives (
        id INT PRIMARY KEY AUTO_INCREMENT,
        kra_template_id INT,
        objective_description TEXT,
        success_indicator TEXT,
        target_statement TEXT,
        mov_expected TEXT,
        FOREIGN KEY (kra_template_id) REFERENCES kra_templates(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ kra_objectives table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS ipcrf (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT,
        rating_period_id INT,
        status ENUM('not_submitted','submitted','under_review','reviewed','needs_revision','finalized') DEFAULT 'not_submitted',
        weighted_average_rating DECIMAL(4,2),
        ratee_signed BOOLEAN DEFAULT FALSE,
        rater_signed BOOLEAN DEFAULT FALSE,
        approving_authority_signed BOOLEAN DEFAULT FALSE,
        submitted_at TIMESTAMP NULL,
        finalized_at TIMESTAMP NULL,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (rating_period_id) REFERENCES rating_periods(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ ipcrf table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS ipcrf_kra_ratings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ipcrf_id INT,
        kra_template_id INT,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        actual_accomplishment TEXT,
        remarks TEXT,
        FOREIGN KEY (ipcrf_id) REFERENCES ipcrf(id) ON DELETE CASCADE,
        FOREIGN KEY (kra_template_id) REFERENCES kra_templates(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ ipcrf_kra_ratings table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS mov_files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ipcrf_kra_rating_id INT,
        original_filename VARCHAR(255),
        stored_filename VARCHAR(255),
        file_size_bytes BIGINT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ipcrf_kra_rating_id) REFERENCES ipcrf_kra_ratings(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ mov_files table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS coaching_plans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT,
        rating_period_id INT,
        session_date DATE,
        topic TEXT,
        agreed_actions TEXT,
        next_steps TEXT,
        status ENUM('planned','completed','cancelled') DEFAULT 'planned',
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (rating_period_id) REFERENCES rating_periods(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ coaching_plans table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS development_plans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ipcrf_id INT,
        training_needs TEXT,
        development_interventions TEXT,
        linked_ld_program_id INT NULL,
        FOREIGN KEY (ipcrf_id) REFERENCES ipcrf(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ development_plans table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS feedback_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT,
        rating_period_id INT,
        feedback_date DATE,
        type ENUM('Positive', 'Constructive') NOT NULL,
        content TEXT NOT NULL,
        acknowledged BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (rating_period_id) REFERENCES rating_periods(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ feedback_logs table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS ipcrf_objectives (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ipcrf_id INT NOT NULL,
        kra_template_id INT NOT NULL,
        sequence_no INT,
        objective_description TEXT,
        success_indicator TEXT,
        target_statement TEXT,
        actual_accomplishment TEXT,
        remarks TEXT,
        FOREIGN KEY (ipcrf_id) REFERENCES ipcrf(id) ON DELETE CASCADE,
        FOREIGN KEY (kra_template_id) REFERENCES kra_templates(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ ipcrf_objectives table ready");

    // Add weight_percent column to ipcrf_objectives if missing
    try { await db.query("ALTER TABLE ipcrf_objectives ADD COLUMN weight_percent DECIMAL(5,2) NULL"); } catch(e) {}

    // Add self_rating column to ipcrf_objectives if missing
    try { await db.query("ALTER TABLE ipcrf_objectives ADD COLUMN self_rating INT NULL"); } catch(e) {}

    // Add signed_at column to ipcrf if missing
    try { await db.query("ALTER TABLE ipcrf ADD COLUMN signed_at TIMESTAMP NULL"); } catch(e) {}

    await db.query(`
      CREATE TABLE IF NOT EXISTS mov_uploads (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ipcrf_objective_id INT NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        stored_filename VARCHAR(255) NOT NULL,
        file_size_bytes BIGINT NOT NULL,
        file_type VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ipcrf_objective_id) REFERENCES ipcrf_objectives(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ mov_uploads table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS coaching_feedback (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        rater_id INT NOT NULL,
        rating_period_id INT NOT NULL,
        phase ENUM('phase1','phase2','phase3','phase4') NOT NULL,
        feedback_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (rater_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (rating_period_id) REFERENCES rating_periods(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ coaching_feedback table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS development_plan_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ipcrf_id INT NOT NULL,
        program_name VARCHAR(255) NOT NULL,
        addresses VARCHAR(255),
        scheduled_date VARCHAR(100),
        status ENUM('enrolled','nominated','scheduled','completed') DEFAULT 'scheduled',
        linked_ld_program_id INT NULL,
        FOREIGN KEY (ipcrf_id) REFERENCES ipcrf(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ development_plan_items table ready");

    // L&D Tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS tna_cycles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        target_department VARCHAR(200) DEFAULT 'All Departments',
        status ENUM('not_started', 'active', 'completed') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ tna_cycles table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS tna_submissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tna_cycle_id INT NOT NULL,
        employee_id INT NOT NULL,
        qualitative_answers TEXT,
        competency_gaps TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tna_cycle_id) REFERENCES tna_cycles(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ tna_submissions table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS ld_programs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        target_participants VARCHAR(200),
        schedule_date VARCHAR(100),
        budget DECIMAL(12,2) DEFAULT 0.00,
        methodology ENUM('workshop', 'seminar', 'e-learning', 'coaching', 'mentoring') DEFAULT 'workshop',
        facilitator VARCHAR(200),
        step_1_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'completed',
        step_2_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'completed',
        step_3_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'in_progress',
        step_4_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
        step_5_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ ld_programs table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS ld_objectives (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ld_program_id INT NOT NULL,
        objective_description TEXT NOT NULL,
        linked_gap VARCHAR(255),
        mapped_standard VARCHAR(255),
        FOREIGN KEY (ld_program_id) REFERENCES ld_programs(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ ld_objectives table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS ld_enrollments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ld_program_id INT NOT NULL,
        employee_id INT NOT NULL,
        attendance_history VARCHAR(255) DEFAULT '[]',
        status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'in_progress',
        certificate_url VARCHAR(255) NULL,
        pre_score DECIMAL(3,2) DEFAULT 3.00,
        post_score DECIMAL(3,2) NULL,
        FOREIGN KEY (ld_program_id) REFERENCES ld_programs(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ ld_enrollments table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS ld_evaluations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ld_enrollment_id INT NOT NULL,
        satisfaction_score INT,
        feedback_text TEXT,
        competency_score_rating INT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ld_enrollment_id) REFERENCES ld_enrollments(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ ld_evaluations table ready");

    // RSP Table Creations
    await db.query(`
      CREATE TABLE IF NOT EXISTS vacancies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ref_no VARCHAR(50) NOT NULL UNIQUE,
        position_title VARCHAR(200) NOT NULL,
        item_number VARCHAR(100) NOT NULL,
        salary_grade INT,
        assigned_school VARCHAR(200) NOT NULL,
        minimum_qualifications TEXT,
        no_of_vacancies INT DEFAULT 1,
        posting_date DATE,
        deadline_date DATE,
        division_memo_file_path VARCHAR(255),
        publish_division_website BOOLEAN DEFAULT FALSE,
        publish_facebook BOOLEAN DEFAULT FALSE,
        publish_bulletin BOOLEAN DEFAULT FALSE,
        created_by INT NULL,
        current_stage INT DEFAULT 1,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ vacancies table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS applicants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        applicant_code VARCHAR(50) NOT NULL UNIQUE,
        full_name VARCHAR(200) NOT NULL,
        id_number VARCHAR(50) NOT NULL,
        vacancy_id INT NOT NULL,
        user_id INT NULL,
        status VARCHAR(50) DEFAULT 'submitted',
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log("✓ applicants table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS minimum_qualifications_checklist (
        id INT PRIMARY KEY AUTO_INCREMENT,
        vacancy_id INT NOT NULL,
        criterion_label VARCHAR(255) NOT NULL,
        is_required BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ minimum_qualifications_checklist table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS applicant_qualification_results (
        applicant_id INT NOT NULL,
        criterion_id INT NOT NULL,
        passed BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (applicant_id, criterion_id),
        FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
        FOREIGN KEY (criterion_id) REFERENCES minimum_qualifications_checklist(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ applicant_qualification_results table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS applicant_documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        applicant_id INT NOT NULL,
        document_type VARCHAR(255) NOT NULL,
        is_required BOOLEAN DEFAULT TRUE,
        file_path VARCHAR(255),
        verification_status VARCHAR(50) DEFAULT 'uploaded_pending_review',
        FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ applicant_documents table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS comparative_assessment_results (
        id INT PRIMARY KEY AUTO_INCREMENT,
        applicant_id INT NOT NULL,
        total_score DECIMAL(5,2),
        rank_val INT,
        FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ comparative_assessment_results table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        vacancy_id INT NULL,
        applicant_id INT NULL,
        actor_id INT NULL,
        action_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ activity_log table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        applicant_id INT NOT NULL,
        issued_at DATE,
        status VARCHAR(50) DEFAULT 'pending',
        FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ appointments table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ notifications table ready");

    // --- Performance Management Phase 0-4 Additions ---
    try {
      const [cols] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kra_templates'");
      const hasCol = (col) => cols.some(c => c.COLUMN_NAME === col);
      if (!hasCol('position_type')) await db.query("ALTER TABLE kra_templates ADD COLUMN position_type ENUM('teaching','non_teaching','teaching_related') DEFAULT 'non_teaching'");
      if (!hasCol('category_name')) await db.query("ALTER TABLE kra_templates ADD COLUMN category_name VARCHAR(255) NULL");
      if (!hasCol('default_weight_percent')) await db.query("ALTER TABLE kra_templates ADD COLUMN default_weight_percent DECIMAL(5,2) DEFAULT 0.00");
      if (!hasCol('description')) await db.query("ALTER TABLE kra_templates ADD COLUMN description TEXT NULL");
      if (!hasCol('is_active')) await db.query("ALTER TABLE kra_templates ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
      console.log("✓ kra_templates table altered for Phase 0");
    } catch(e) { console.error("Error altering kra_templates:", e); }

    try {
      const [cols] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rating_periods'");
      const hasCol = (col) => cols.some(c => c.COLUMN_NAME === col);
      if (!hasCol('school_year')) await db.query("ALTER TABLE rating_periods ADD COLUMN school_year VARCHAR(100) NULL");
      if (!hasCol('period_label')) await db.query("ALTER TABLE rating_periods ADD COLUMN period_label VARCHAR(255) NULL");
      if (!hasCol('start_date')) await db.query("ALTER TABLE rating_periods ADD COLUMN start_date DATE NULL");
      if (!hasCol('end_date')) await db.query("ALTER TABLE rating_periods ADD COLUMN end_date DATE NULL");
      console.log("✓ rating_periods table altered for Phase 0");
    } catch(e) { console.error("Error altering rating_periods:", e); }

    try {
      const [pcCols] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'performance_commitments'");
      const hasPCCol = (col) => pcCols.some(c => c.COLUMN_NAME === col);
      if (!hasPCCol('employee_acknowledged_at')) await db.query("ALTER TABLE performance_commitments ADD COLUMN employee_acknowledged_at TIMESTAMP NULL");
      await db.query("ALTER TABLE performance_commitments MODIFY COLUMN position_type ENUM('teaching', 'non_teaching', 'teaching_related') DEFAULT 'non_teaching'");
      await db.query("ALTER TABLE kra_templates MODIFY COLUMN position_type ENUM('teaching', 'non_teaching', 'teaching_related') DEFAULT 'non_teaching'");
      console.log("✓ performance_commitments & kra_templates tables altered for position_type ENUM");
    } catch(e) { console.error("Error altering performance_commitments/kra_templates:", e); }

    await db.query(`
      CREATE TABLE IF NOT EXISTS adjectival_bands (
        id INT PRIMARY KEY AUTO_INCREMENT,
        min_score DECIMAL(5,4) NOT NULL,
        max_score DECIMAL(5,4) NOT NULL,
        label VARCHAR(100) NOT NULL,
        sort_order INT DEFAULT 0
      )
    `);
    console.log("✓ adjectival_bands table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS reward_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    console.log("✓ reward_types table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_commitments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        rating_period_id INT NOT NULL,
        position_type ENUM('teaching','non_teaching','teaching_related') NOT NULL,
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
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (rating_period_id) REFERENCES rating_periods(id) ON DELETE CASCADE,
        FOREIGN KEY (rater_id) REFERENCES employees(id) ON DELETE SET NULL,
        FOREIGN KEY (reviewing_authority_id) REFERENCES employees(id) ON DELETE SET NULL
      )
    `);
    console.log("✓ performance_commitments table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS performance_targets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        commitment_id INT NOT NULL,
        kra_template_id INT NULL,
        kra_category VARCHAR(255) NOT NULL,
        weight_percent DECIMAL(5,2) NOT NULL,
        target_description TEXT,
        success_indicator TEXT,
        self_rating DECIMAL(3,2) NULL,
        rater_rating DECIMAL(3,2) NULL,
        final_rating DECIMAL(3,2) NULL,
        FOREIGN KEY (commitment_id) REFERENCES performance_commitments(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ performance_targets table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS coaching_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        commitment_id INT NOT NULL,
        target_id INT NULL,
        author_id INT NOT NULL,
        entry_date DATE NOT NULL,
        note TEXT NOT NULL,
        evidence_file_path VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (commitment_id) REFERENCES performance_commitments(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES performance_targets(id) ON DELETE SET NULL,
        FOREIGN KEY (author_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
    console.log("✓ coaching_logs table ready");

    await db.query(`
      CREATE TABLE IF NOT EXISTS rewards_recognition (
        id INT PRIMARY KEY AUTO_INCREMENT,
        commitment_id INT NOT NULL,
        employee_id INT NOT NULL,
        reward_type VARCHAR(255) NOT NULL,
        nomination_status ENUM('nominated','approved','rejected') DEFAULT 'nominated',
        nominated_by INT NOT NULL,
        nominated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_by INT NULL,
        approved_at TIMESTAMP NULL,
        notes TEXT,
        FOREIGN KEY (commitment_id) REFERENCES performance_commitments(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (nominated_by) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL
      )
    `);
    console.log("✓ rewards_recognition table ready");

    console.log("✅ Database tables ready.");

    // Seed default KRA templates if empty
    const [existingKras] = await db.query('SELECT COUNT(*) as cnt FROM kra_templates');
    if (existingKras[0].cnt === 0) {
      console.log("⏳ Seeding default KRA templates...");
      const defaultKras = [
        // Non-Teaching KRAs
        { kra_name: 'Physical Fitness and Health', weight_percent: 20, position_type: 'non_teaching', description: 'Maintains physical fitness and promotes health and safety in the workplace' },
        { kra_name: 'Professionalism and Ethics', weight_percent: 20, position_type: 'non_teaching', description: 'Demonstrates professionalism, integrity, and ethical conduct in all work activities' },
        { kra_name: 'Support to Schools/Office Operations', weight_percent: 20, position_type: 'non_teaching', description: 'Provides efficient and effective support services to school and office operations' },
        { kra_name: 'Interpersonal Skills and Teamwork', weight_percent: 20, position_type: 'non_teaching', description: 'Works collaboratively with colleagues and stakeholders to achieve organizational goals' },
        { kra_name: 'Results/Output Delivery', weight_percent: 20, position_type: 'non_teaching', description: 'Delivers expected outputs and achieves targets within specified timelines' },
        // Teaching KRAs
        { kra_name: 'Content Knowledge and Pedagogy', weight_percent: 30, position_type: 'teaching', description: 'Demonstrates mastery of subject matter and applies effective teaching strategies' },
        { kra_name: 'Learning Environment', weight_percent: 20, position_type: 'teaching', description: 'Creates a safe and inclusive learning environment conducive to teaching and learning' },
        { kra_name: 'Diversity of Learners', weight_percent: 20, position_type: 'teaching', description: 'Responds to the diverse needs of learners through differentiated instruction' },
        { kra_name: 'Curriculum and Planning', weight_percent: 15, position_type: 'teaching', description: 'Plans and prepares appropriate curriculum and instructional materials' },
        { kra_name: 'Assessment and Reporting', weight_percent: 15, position_type: 'teaching', description: 'Uses appropriate assessment strategies and reports learner progress accurately' }
      ];
      for (const k of defaultKras) {
        await db.query(
          'INSERT INTO kra_templates (kra_name, weight_percent, position_type, description, is_active) VALUES (?, ?, ?, ?, TRUE)',
          [k.kra_name, k.weight_percent, k.position_type, k.description]
        );
      }
      console.log("✓ Default KRA templates seeded");
    }

    // Seed DepEd SDO Dapitan City Award Categories
    const depEdAwards = [
      { name: 'Outstanding Elementary School Teacher (Teacher I, II, III)', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Secondary School Teacher (Teacher I, II, III)', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Elementary Master Teacher (Master Teacher I, II, III)', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Secondary Master Teacher (Master Teacher I, II, III)', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Kindergarten Teacher', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Elementary School Head', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Secondary School Head', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Public District Supervisor', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Education Program Supervisor', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Chief Education Supervisor', description: 'Individual Category - Teaching and Teaching-Related' },
      { name: 'Outstanding Level 1 Employees (SG 1-9)', description: 'Individual Category - Non-Teaching Employee' },
      { name: 'Outstanding Level 2 Employees', description: 'Individual Category - Non-Teaching Employee' },
      { name: 'Outstanding Budget Office', description: 'Individual Category - Non-Teaching Employee (Group B)' },
      { name: 'Outstanding Senior Education Program Specialist', description: 'Individual Category - Non-Teaching Employee (Group B)' },
      { name: 'Outstanding Librarian', description: 'Individual Category - Non-Teaching Employee (Group B)' },
      { name: 'Outstanding Engineer', description: 'Individual Category - Non-Teaching Employee (Group B)' },
      { name: 'Outstanding Cashier', description: 'Individual Category - Non-Teaching Employee (Group B)' },
      { name: 'Outstanding Nurse', description: 'Individual Category - Non-Teaching Employee (Group B)' },
      { name: 'Outstanding Medical Officer', description: 'Individual Category - Non-Teaching Employee (Group B)' },
      { name: 'Outstanding Elementary School', description: 'Institutional Category' },
      { name: 'Outstanding Secondary School', description: 'Institutional Category' },
      { name: 'Outstanding ICT Program (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding IPED Program (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding Youth Program Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding Gulayan Sa Paaralan Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding SBFP Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding WINS Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding Madrasah Program (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding SPED Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding DRRM Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding Research Program Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding GAD Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding Reading Program Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Outstanding Sports Program Implementation (Division)', description: 'Program Implementation Category' },
      { name: 'Best Alternative Learning System Program Implementation', description: 'Program Implementation Category - School Category' }
    ];
    console.log("⏳ Syncing DepEd award categories...");
    const [existingRewards] = await db.query('SELECT name FROM reward_types');
    const existingNames = existingRewards.map(r => r.name);
    const depEdNames = depEdAwards.map(a => a.name);
    // Remove entries not in DepEd list
    const toRemove = existingNames.filter(n => !depEdNames.includes(n));
    if (toRemove.length > 0) {
      const rmPlaceholders = toRemove.map(() => '?').join(',');
      await db.query(`DELETE FROM reward_types WHERE name IN (${rmPlaceholders})`, toRemove);
      console.log("✓ Removed " + toRemove.length + " non-DepEd reward types");
    }
    // Add missing DepEd entries
    const toAdd = depEdAwards.filter(a => !existingNames.includes(a.name));
    for (const a of toAdd) {
      await db.query('INSERT INTO reward_types (name, description, is_active) VALUES (?, ?, TRUE)', [a.name, a.description]);
    }
    if (toAdd.length > 0) console.log("✓ Added " + toAdd.length + " DepEd award categories");
    console.log("✓ DepEd award categories synced (" + depEdAwards.length + " total)");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}

if (require.main === module) {
  init().then(() => {
    console.log("✅ Database initialization completed successfully!");
    process.exit(0);
  }).catch((err) => {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  });
}

module.exports = { init };
