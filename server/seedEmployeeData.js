const db = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('⏳ Clearing database tables and seeding one admin and one employee user...');
  try {
    const hashed = await bcrypt.hash('password123', 10);

    // Disable foreign key checks to truncate cleanly
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tablesToTruncate = [
      'users',
      'employees',
      'rating_periods',
      'kra_templates',
      'kra_objectives',
      'ipcrf',
      'ipcrf_kra_ratings',
      'ipcrf_objectives',
      'mov_files',
      'mov_uploads',
      'coaching_plans',
      'coaching_feedback',
      'development_plans',
      'development_plan_items',
      'feedback_logs',
      'tna_submissions',
      'ld_enrollments',
      'ld_evaluations',
      'applicants',
      'applicant_documents',
      'applicant_qualification_results',
      'comparative_assessment_results',
      'appointments',
      'notifications',
      'activity_log'
    ];

    for (const table of tablesToTruncate) {
      await db.query(`TRUNCATE TABLE ${table}`);
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Cleared existing data.');

    // 1. Create users (Only 2 users: Reynaldo Admin and Maribel Employee)
    await db.query(
      `INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)`,
      ['Jay Montealto, CESO V', 'jay.montealto@deped.gov.ph', hashed, 'admin', true]
    );
    await db.query(
      `INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)`,
      ['Raul M. Colot Jr.', 'kadongtata1975@gmail.com', hashed, 'employee', true]
    );
    console.log('✓ Users created.');

    // 2. Create employees
    const [reynaldoResult] = await db.query(
      `INSERT INTO employees (name, position, unit, role, email) VALUES (?, ?, ?, ?, ?)`,
      ['Jay Montealto, CESO V', 'Schools Division Superintendent', 'Office of the SDS', 'admin', 'jay.montealto@deped.gov.ph']
    );
    const reynaldoId = reynaldoResult.insertId;

    const [maribelResult] = await db.query(
      `INSERT INTO employees (name, position, unit, role, email, plantilla_item_number, form_type, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Raul M. Colot Jr.', 'Education Program Specialist II', 'Curriculum Implementation Division', 'employee', 'kadongtata1975@gmail.com', '4-52-009', 'IPCRF (Individual)', reynaldoId]
    );
    const maribelId = maribelResult.insertId;
    console.log('✓ Employees created.');

    // 3. Create active rating period
    const [per] = await db.query(
      "INSERT INTO rating_periods (year, cycle, is_active) VALUES (?, ?, ?)",
      [2026, 'annual', true]
    );
    const periodId = per.insertId;
    console.log('✓ Rating period ready.');

    // 4. Create KRA templates
    const kras = [
      { name: 'Basic Education Services Delivery', weight: 25, sort: 1 },
      { name: 'Human Resource Management & Development', weight: 20, sort: 2 },
      { name: 'Financial & Administrative Management', weight: 20, sort: 3 },
      { name: 'Governance & Organizational Performance', weight: 20, sort: 4 },
      { name: 'Stakeholder Engagement & Partnership', weight: 15, sort: 5 },
    ];
    const kraMap = {};
    for (const k of kras) {
      const [kr] = await db.query(
        'INSERT INTO kra_templates (rating_period_id, kra_name, weight_percent, sort_order) VALUES (?, ?, ?, ?)',
        [periodId, k.name, k.weight, k.sort]
      );
      kraMap[k.name] = kr.insertId;
    }
    console.log('✓ KRA templates ready.');

    // 5. Create IPCRF for Maribel
    const [ipcrfResult] = await db.query(
      "INSERT INTO ipcrf (employee_id, rating_period_id, status) VALUES (?, ?, ?)",
      [maribelId, periodId, 'not_submitted']
    );
    const ipcrfId = ipcrfResult.insertId;
    console.log('✓ IPCRFs ready.');

    // 6. Create IPCRF objectives & template KRA objectives
    const objectives = [
      { 
        kra: 'Basic Education Services Delivery', 
        desc: 'Provide Technical Assistance (TA) and Instructional Supervision to school heads and teachers on curriculum contextualization and learning area delivery', 
        indicator: '100% of targeted schools provided with technical assistance reports, instructional supervision notes, and intervention plans', 
        target: 'Conduct quarterly instructional monitoring and TA visits across 52 assigned division schools with documented TA reports by December 2026' 
      },
      { 
        kra: 'Human Resource Management & Development', 
        desc: 'Manage the development, quality assurance, and contextualization of Learning Action Cell (LAC) sessions and DepEd LRMDS learning resources', 
        indicator: '100% of submitted Learning Activity Sheets (LAS) and instructional modules quality-assured following DepEd LRMDS standards', 
        target: 'Quality assure 25 CID learning resources and facilitate 4 division-wide LAC sessions for instructional leaders' 
      },
      { 
        kra: 'Financial & Administrative Management', 
        desc: 'Monitor, evaluate, and analyze division-wide curriculum program implementation and learning assessment results for CID reporting', 
        indicator: '100% of learning assessment results analyzed with strategic intervention plans submitted to the CID Chief', 
        target: 'Submit 4 quarterly Curriculum Assessment & Learning Achievement reports with zero delayed submissions' 
      },
      { 
        kra: 'Governance & Organizational Performance', 
        desc: 'Facilitate action research initiatives, curriculum innovations, and PRIME-HRM alignment for CID teaching-related personnel', 
        indicator: '100% of approved Division action research proposals monitored with completed progress reports and Zero CSC findings', 
        target: 'Evaluate 10 school action research proposals and submit complete CID PRIME-HRM documentary requirements by Q4 2026' 
      },
      { 
        kra: 'Stakeholder Engagement & Partnership', 
        desc: 'Convene quarterly CID Stakeholders Assemblies and foster strategic partnerships with LGUs and community partners for curriculum enrichment', 
        indicator: '100% quarterly stakeholders assemblies convened with signed MOUs/MOAs for curriculum support programs', 
        target: 'Organize 4 quarterly CID Stakeholders Assemblies with 100% LGU and community partner participation' 
      },
    ];

    for (let i = 0; i < objectives.length; i++) {
      const obj = objectives[i];
      const kraId = kraMap[obj.kra];
      if (!kraId) continue;

      // 6a. Seed master KRA objectives
      await db.query(
        'INSERT INTO kra_objectives (kra_template_id, objective_description, success_indicator, target_statement) VALUES (?, ?, ?, ?)',
        [kraId, obj.desc, obj.indicator, obj.target]
      );

      // 6b. Seed individual employee IPCRF objectives
      await db.query(
        'INSERT INTO ipcrf_objectives (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, actual_accomplishment) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ipcrfId, kraId, i + 1, obj.desc, obj.indicator, obj.target, obj.target]
      );
    }
    console.log('✓ IPCRF and KRA objectives ready.');

    // 7. Create coaching feedback
    await db.query(
      "INSERT INTO coaching_feedback (employee_id, rater_id, rating_period_id, phase, feedback_text) VALUES (?, ?, ?, ?, ?)",
      [maribelId, reynaldoId, periodId, 'phase2', 'Your Q1 accomplishment report was thorough and well-organized. The LAC session data was particularly commendable. Please ensure that the remaining 2 schools complete their MOA for the feeding program enrollment by the end of Q2.']
    );
    await db.query(
      "INSERT INTO coaching_feedback (employee_id, rater_id, rating_period_id, phase, feedback_text) VALUES (?, ?, ?, ?, ?)",
      [maribelId, reynaldoId, periodId, 'phase3', 'Midyear review shows strong performance overall. Focus remaining Q3 efforts on completing the Stakeholders Assembly backlog. Recommend enrollment in leadership development program.']
    );
    console.log('✓ Coaching feedback ready.');

    // 8. Create coaching plans
    await db.query(
      "INSERT INTO coaching_plans (employee_id, rating_period_id, session_date, topic, agreed_actions, status) VALUES (?, ?, ?, ?, ?, ?)",
      [maribelId, periodId, '2026-03-31', 'Delayed submission of Q4 2025 accomplishment reports from 3 school heads', 'Conduct coaching session with concerned school heads; set firm deadline of March 31', 'completed']
    );
    await db.query(
      "INSERT INTO coaching_plans (employee_id, rating_period_id, session_date, topic, agreed_actions, status) VALUES (?, ?, ?, ?, ?, ?)",
      [maribelId, periodId, '2026-04-30', 'Low IPCRF objective alignment with division\'s strategic priorities', 'Revisit and revise objectives with employee to align with SDO\'s M&E framework', 'completed']
    );
    await db.query(
      "INSERT INTO coaching_plans (employee_id, rating_period_id, session_date, topic, agreed_actions, status) VALUES (?, ?, ?, ?, ?, ?)",
      [maribelId, periodId, '2026-06-30', 'Insufficient MOV documentation for Feeding Program objective', 'Prepare comprehensive documentation kit: photos, attendance sheets, purchase orders', 'planned']
    );
    console.log('✓ Coaching plans ready.');

    // 9. Leave IPCRF KRA ratings empty initially
    console.log('✓ KRA ratings cleared for rating from scratch.');

    // 10. Create development plan items
    await db.query(
      "INSERT INTO development_plan_items (ipcrf_id, program_name, addresses, scheduled_date, status) VALUES (?, ?, ?, ?, ?)",
      [ipcrfId, 'PRIME-HRM Level II Workshop', 'Advanced PRIME-HRM Documentation', 'August 2026', 'enrolled']
    );
    await db.query(
      "INSERT INTO development_plan_items (ipcrf_id, program_name, addresses, scheduled_date, status) VALUES (?, ?, ?, ?, ?)",
      [ipcrfId, 'Regional Leadership Program (DepEd RO IV-A)', 'Leadership & Management', 'Q3 2026', 'nominated']
    );
    await db.query(
      "INSERT INTO development_plan_items (ipcrf_id, program_name, addresses, scheduled_date, status) VALUES (?, ?, ?, ?, ?)",
      [ipcrfId, 'In-house coaching session (SDO-SGOD)', 'MOV Best Practices', 'July 2026', 'scheduled']
    );
    console.log('✓ Development plan items ready.');

    // 11. Create development plan discussion notes
    await db.query(
      "INSERT INTO development_plans (ipcrf_id, training_needs, development_interventions) VALUES (?, ?, ?)",
      [ipcrfId, 'Enhanced MOV documentation; Advanced PRIME-HRM compliance workshop; Leadership and management seminar for division chiefs.', 'Recommend enrollment in Q3 regional leadership program.']
    );
    console.log('✓ Development plan notes ready.');

    console.log('\n=============================================');
    console.log('Employee view seed data created successfully!');
    console.log('Admin Login:');
    console.log('  Email: jay.montealto@deped.gov.ph');
    console.log('  Password: password123');
    console.log('Employee Login:');
    console.log('  Email: kadongtata1975@gmail.com');
    console.log('  Password: password123');
    console.log('=============================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
