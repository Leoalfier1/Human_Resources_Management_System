const db = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('⏳ Seeding complete data...');
  try {
    const hashed = await bcrypt.hash('password123', 10);

    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear data from all relevant tables
    const tables = [
      'objective_self_ratings', 'planned_mov_items', 'performance_indicators', 'performance_objectives',
      'rewards_recognition', 'coaching_logs', 'performance_targets', 'performance_commitments',
      'adjectival_bands', 'notifications', 'activity_log',
      'coaching_feedback', 'feedback_logs', 'coaching_plans', 'development_plans', 'development_plan_items',
      'tna_submissions', 'ld_enrollments', 'ld_evaluations',
      'ipcrf_kra_ratings', 'ipcrf_objectives', 'ipcrf',
      'performance_ratings', 'performance_evaluations', 'performance_criteria', 'performance_periods',
      'mov_uploads', 'mov_files',
      'applicant_qualification_results', 'applicant_documents', 'comparative_assessment_results',
      'appointments', 'applicants', 'minimum_qualifications_checklist', 'vacancies',
      'kra_objectives', 'kra_templates', 'rating_periods',
      'employees', 'users'
    ];
    for (const t of tables) {
      try { await db.query(`DELETE FROM \`${t}\``); } catch(e) { /* skip */ }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Database cleared.');

    // 1. USERS
    const [adminUser] = await db.query(
      'INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)',
      ['Jay Montealto, CESO V', 'jay.montealto@deped.gov.ph', hashed, 'admin', 1]
    );
    const adminUserId = adminUser.insertId;

    const [empUser] = await db.query(
      'INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)',
      ['Raul M. Colot Jr.', 'kadongtata1975@gmail.com', hashed, 'admin', 1]
    );
    console.log('✓ Users created.');

    // 2. EMPLOYEES
    const [adminEmp] = await db.query(
      'INSERT INTO employees (name, position, unit, role, email, form_type, employee_type, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Jay Montealto, CESO V', 'Schools Division Superintendent', 'Office of the SDS', 'admin', 'jay.montealto@deped.gov.ph', 'IPCRF Individual', 'non-teaching', null]
    );
    const adminEmpId = adminEmp.insertId;

    const [empEmp] = await db.query(
      'INSERT INTO employees (name, position, unit, role, email, form_type, employee_type, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Raul M. Colot Jr.', 'Education Program Specialist II', 'Curriculum Implementation Division', 'employee', 'kadongtata1975@gmail.com', 'IPCRF Individual', 'teaching', adminEmpId]
    );
    const empId = empEmp.insertId;
    console.log('✓ Employees created.');

    // 3. RATING PERIOD (Active)
    const [rpResult] = await db.query(
      'INSERT INTO rating_periods (year, cycle, is_active) VALUES (?, ?, ?)',
      [2026, 'annual', 1]
    );
    const periodId = rpResult.insertId;
    console.log('✓ Rating period created.');

    // 4. KRA TEMPLATES (teaching - for Education Program Specialist II)
    const kras = [
      { name: 'Curriculum Implementation and Instructional Supervision', weight: 30, desc: 'Provides technical assistance and instructional supervision to ensure effective curriculum delivery across assigned schools' },
      { name: 'Professional Growth and Development', weight: 20, desc: 'Pursues continuous professional development through training, seminars, and self-directed learning activities' },
      { name: 'Research and Innovation', weight: 15, desc: 'Conducts action research and develops innovative practices to improve teaching and learning outcomes' },
      { name: 'Stakeholder Engagement and Teamwork', weight: 15, desc: 'Builds effective partnerships with school heads, teachers, and community stakeholders to support division programs' },
      { name: 'Results/Output Delivery', weight: 20, desc: 'Delivers expected outputs, reports, and targets within specified timelines and quality standards' }
    ];
    const kraIds = [];
    for (let i = 0; i < kras.length; i++) {
      const [r] = await db.query(
        'INSERT INTO kra_templates (rating_period_id, kra_name, weight_percent, sort_order, position_type, category_name, default_weight_percent, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [periodId, kras[i].name, kras[i].weight, i + 1, 'non_teaching', kras[i].name, kras[i].weight, kras[i].desc, 1]
      );
      kraIds.push(r.insertId);
    }
    console.log('✓ KRA templates created.');

    // 5. ADJECTIVAL BANDS
    const bands = [
      { min: 4.5000, max: 5.0000, label: 'Outstanding', sort: 1 },
      { min: 3.5000, max: 4.4999, label: 'Very Satisfactory', sort: 2 },
      { min: 2.5000, max: 3.4999, label: 'Satisfactory', sort: 3 },
      { min: 1.5000, max: 2.4999, label: 'Unsatisfactory', sort: 4 },
      { min: 0.0000, max: 1.4999, label: 'Poor', sort: 5 }
    ];
    for (const b of bands) {
      await db.query('INSERT INTO adjectival_bands (min_score, max_score, label, sort_order) VALUES (?, ?, ?, ?)', [b.min, b.max, b.label, b.sort]);
    }
    console.log('✓ Adjectival bands created.');

    // 6. IPCRF for Raul (submitted - so admin can see it)
    const [ipcrfResult] = await db.query(
      'INSERT INTO ipcrf (employee_id, rating_period_id, status, submitted_at, ratee_signed) VALUES (?, ?, ?, NOW(), 1)',
      [empId, periodId, 'submitted']
    );
    const ipcrfId = ipcrfResult.insertId;
    console.log('✓ IPCRF created (status: submitted).');

    // 7. IPCRF OBJECTIVES (with real content)
    const objectives = [
      { desc: 'Conduct training needs assessment for assigned schools and submit TNA report', indicator: 'TNA report submitted for all 15 assigned schools', target: '15 TNA reports by March 2026' },
      { desc: 'Facilitate quarterly Learning Action Cell (LAC) sessions for teachers', indicator: '4 LAC sessions conducted with 90% attendance', target: '4 LAC sessions by December 2026' },
      { desc: 'Provide technical assistance to at least 10 schools on curriculum implementation', indicator: '10 TA visits completed with feedback forms', target: '10 TA visits by June 2026' },
      { desc: 'Submit monthly progress reports to the division office on time', indicator: '12 monthly reports submitted by the 15th of each month', target: '12 reports on time for SY 2026-2027' },
      { desc: 'Coordinate with school heads for the implementation of division programs', indicator: 'Monthly coordination meetings held with all 15 school heads', target: '12 coordination meetings by December 2026' }
    ];
    for (let i = 0; i < objectives.length; i++) {
      await db.query(
        'INSERT INTO ipcrf_objectives (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ipcrfId, kraIds[i], i + 1, objectives[i].desc, objectives[i].indicator, objectives[i].target, kras[i].weight]
      );
    }
    console.log('✓ IPCRF objectives created.');

    // 8. PERFORMANCE COMMITMENT for Raul (submitted, ready for admin review)
    const [commResult] = await db.query(
      `INSERT INTO performance_commitments 
       (employee_id, rating_period_id, position_type, status, submitted_at, rater_id, reviewing_authority_id)
       VALUES (?, ?, 'non_teaching', 'submitted', NOW(), ?, ?)`,
      [empId, periodId, adminEmpId, adminEmpId]
    );
    const commId = commResult.insertId;
    console.log('✓ Performance commitment created (status: submitted).');

    // 9. PERFORMANCE TARGETS (synced from IPCRF objectives)
    for (let i = 0; i < objectives.length; i++) {
      await db.query(
        'INSERT INTO performance_targets (commitment_id, kra_template_id, kra_category, weight_percent, target_description, success_indicator, self_rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [commId, kraIds[i], kras[i].name, kras[i].weight, objectives[i].desc, objectives[i].indicator, 4]
      );
    }
    console.log('✓ Performance targets created.');

    // 10. COACHING FEEDBACK (admin -> raul)
    await db.query(
      'INSERT INTO coaching_feedback (employee_id, rater_id, rating_period_id, phase, feedback_text) VALUES (?, ?, ?, ?, ?)',
      [empId, adminEmpId, periodId, 'phase2', 'Good progress on your training needs assessment. Please ensure all 15 schools are covered by the deadline. Keep up the good work!']
    );
    console.log('✓ Coaching feedback created.');

    // 11. COACHING PLANS
    await db.query(
      'INSERT INTO coaching_plans (employee_id, rating_period_id, session_date, topic, agreed_actions, status) VALUES (?, ?, ?, ?, ?, ?)',
      [empId, periodId, '2026-07-15', 'TNA report completion for remaining schools', 'Complete TNA for remaining 5 schools; submit consolidated report', 'planned']
    );
    console.log('✓ Coaching plans created.');

    // 12. DEVELOPMENT PLAN
    const [dpResult] = await db.query(
      'INSERT INTO development_plans (ipcrf_id, training_needs, development_interventions) VALUES (?, ?, ?)',
      [ipcrfId, 'Advanced curriculum supervision; Data-driven decision making', 'Enroll in Regional Leadership Program Q3 2026']
    );
    console.log('✓ Development plan created.');

    // 13. DEVELOPMENT PLAN ITEMS
    await db.query(
      'INSERT INTO development_plan_items (ipcrf_id, program_name, addresses, scheduled_date, status) VALUES (?, ?, ?, ?, ?)',
      [ipcrfId, 'Curriculum Leadership Workshop', 'Instructional Supervision Skills', 'September 2026', 'nominated']
    );
    console.log('✓ Development plan items created.');

    // 14. IPCRF KRA RATINGS (admin has rated Raul)
    for (let i = 0; i < kraIds.length; i++) {
      const rating = 4 - (i * 0.3); // 4.0, 3.7, 3.4, 3.1, 2.8
      await db.query(
        'INSERT INTO ipcrf_kra_ratings (ipcrf_id, kra_template_id, rating, actual_accomplishment, remarks) VALUES (?, ?, ?, ?, ?)',
        [ipcrfId, kraIds[i], rating, `Completed: ${objectives[i].desc}`, 'Good performance']
      );
    }
    console.log('✓ IPCRF KRA ratings created.');

    // 15. NOTIFICATIONS
    await db.query('INSERT INTO notifications (user_id, message, type, is_read) VALUES (?, ?, ?, ?)', [adminUserId, 'New IPCRF submitted by Raul M. Colot Jr. for review', 'pm_submission', 0]);
    await db.query('INSERT INTO notifications (user_id, message, type, is_read) VALUES (?, ?, ?, ?)', [empUser.insertId, 'Welcome to DepEd HRMIS! Your account is ready.', 'system', 0]);
    console.log('✓ Notifications created.');

    // 16. PERFORMANCE PERIOD & CRITERIA
    await db.query(
      "INSERT INTO performance_periods (period_name, start_date, end_date, status) VALUES (?, ?, ?, ?)",
      ['SY 2026-2027 Midyear', '2026-01-01', '2026-06-30', 'active']
    );

    const criteria = [
      { name: 'Job Knowledge', weight: 20 },
      { name: 'Quality of Work', weight: 25 },
      { name: 'Efficiency', weight: 20 },
      { name: 'Independence', weight: 15 },
      { name: 'Conduct', weight: 10 },
      { name: 'Punctuality', weight: 10 }
    ];
    for (const c of criteria) {
      await db.query('INSERT INTO performance_criteria (criteria_name, weight, max_score, employee_type) VALUES (?, ?, ?, ?)', [c.name, c.weight, 5, 'non-teaching']);
    }
    console.log('✓ Performance periods and criteria created.');

    // 17. TNA CYCLE
    await db.query(
      "INSERT INTO tna_cycles (title, target_department, status) VALUES (?, ?, ?)",
      ['SY 2026-2027 TNA', 'All Departments', 'active']
    );
    console.log('✓ TNA cycle created.');

    console.log('\n=============================================');
    console.log('  Database seeded successfully!');
    console.log('=============================================');
    console.log('  Admin: jay.montealto@deped.gov.ph / password123');
    console.log('  Employee: kadongtata1975@gmail.com / password123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
