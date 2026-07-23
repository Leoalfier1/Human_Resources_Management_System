const db = require('./db');
const bcrypt = require('bcrypt');

async function recreateRaul() {
  try {
    console.log('Re-creating Raul M. Colot Jr. account...');
    
    // Hash password
    const hashed = await bcrypt.hash('password123', 10);
    
    // Get active period ID
    const [periods] = await db.query('SELECT id FROM rating_periods WHERE is_active = 1 LIMIT 1');
    if (periods.length === 0) {
      console.error('Error: No active rating period found.');
      process.exit(1);
    }
    const periodId = periods[0].id;

    // 1. Create user account
    let userId;
    const email = 'kadongtata1975@gmail.com';
    const name = 'Raul M. Colot Jr.';
    const position = 'Education Program Specialist II';
    const unit = 'Curriculum Implementation Division';
    const itemNo = 'EPS2-52-009';
    const employeeType = 'teaching_related';
    const formType = 'IPCRF (Teaching-Related)';

    const [uRows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (uRows.length > 0) {
      userId = uRows[0].id;
      await db.query('UPDATE users SET password = ?, full_name = ? WHERE id = ?', [hashed, name, userId]);
    } else {
      const [uRes] = await db.query(
        'INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashed, 'employee', true]
      );
      userId = uRes.insertId;
    }
    console.log('✓ User record created/updated.');

    // 2. Create employee record (with static ID = 2 to match original links/nominations)
    let empId = 2;
    // Check if ID 2 is taken, if so, delete it
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('DELETE FROM employees WHERE id = 2');
    await db.query(
      'INSERT INTO employees (id, name, position, unit, role, email, plantilla_item_number, form_type, employee_type, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [empId, name, position, unit, 'employee', email, itemNo, formType, employeeType]
    );
    console.log('✓ Employee record created with ID 2.');

    // 3. Create IPCRF in 'submitted' status so it shows up in Review queue
    const [iRes] = await db.query(
      "INSERT INTO ipcrf (employee_id, rating_period_id, status, ratee_signed, submitted_at) VALUES (?, ?, 'submitted', TRUE, NOW())",
      [empId, periodId]
    );
    const ipcrfId = iRes.insertId;
    console.log('✓ IPCRF record created.');

    // 4. Create Objectives
    const objectives = [
      { kra: 'Technical Assistance & Instructional Supervision', desc: 'Provide Technical Assistance (TA) and Instructional Supervision to school heads and teachers on curriculum contextualization and learning area delivery', indicator: '100% of targeted schools provided with technical assistance reports, instructional supervision notes, and intervention plans', target: 'Conduct quarterly instructional monitoring and TA visits across 52 assigned division schools with documented TA reports by December 2026' },
      { kra: 'Learning Resources Development & LRMDS Quality Assurance', desc: 'Manage the development, quality assurance, and contextualization of Learning Action Cell (LAC) sessions and DepEd LRMDS learning resources', indicator: '100% of submitted Learning Activity Sheets (LAS) and instructional modules quality-assured following DepEd LRMDS standards', target: 'Quality assure 25 CID learning resources and facilitate 4 division-wide LAC sessions for instructional leaders' },
      { kra: 'Curriculum Assessment & Program Evaluation', desc: 'Monitor, evaluate, and analyze division-wide curriculum program implementation and learning assessment results for CID reporting', indicator: '100% of learning assessment results analyzed with strategic intervention plans submitted to the CID Chief', target: 'Submit 4 quarterly Curriculum Assessment & Learning Achievement reports with zero delayed submissions' },
      { kra: 'Action Research & Continuous Improvement', desc: 'Facilitate action research initiatives, curriculum innovations, and PRIME-HRM alignment for CID teaching-related personnel', indicator: '100% of approved Division action research proposals monitored with completed progress reports and Zero CSC findings', target: 'Evaluate 10 school action research proposals and submit complete CID PRIME-HRM documentary requirements by Q4 2026' },
      { kra: 'Stakeholder Engagement & Community Partnership', desc: 'Convene quarterly CID Stakeholders Assemblies and foster strategic partnerships with LGUs and community partners for curriculum enrichment', indicator: '100% quarterly stakeholders assemblies convened with signed MOUs/MOAs for curriculum support programs', target: 'Organize 4 quarterly CID Stakeholders Assemblies with 100% LGU and community partner participation' }
    ];

    const [kraTemplates] = await db.query('SELECT * FROM kra_templates WHERE position_type = ? ORDER BY sort_order ASC', [employeeType]);

    for (let i = 0; i < objectives.length; i++) {
      const obj = objectives[i];
      const kt = kraTemplates.find(k => k.kra_name === obj.kra) || kraTemplates[i];
      await db.query(
        'INSERT INTO ipcrf_objectives (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent, actual_accomplishment, self_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5)',
        [ipcrfId, kt ? kt.id : 1, i + 1, obj.desc, obj.indicator, obj.target, kt ? kt.weight_percent : 20, obj.target]
      );
    }
    console.log('✓ Objectives created and populated with self-ratings of 5.0.');

    // 5. Create performance_commitment and performance_targets in 'submitted' status
    const [cRes] = await db.query(
      'INSERT INTO performance_commitments (employee_id, rating_period_id, position_type, status, rater_id, submitted_at) VALUES (?, ?, ?, ?, 1, NOW())',
      [empId, periodId, employeeType, 'submitted']
    );
    const commitmentId = cRes.insertId;
    console.log('✓ Performance commitment created.');

    for (let i = 0; i < objectives.length; i++) {
      const obj = objectives[i];
      const kt = kraTemplates.find(k => k.kra_name === obj.kra) || kraTemplates[i];
      await db.query(
        'INSERT INTO performance_targets (commitment_id, kra_template_id, kra_category, weight_percent, target_description, success_indicator, self_rating) VALUES (?, ?, ?, ?, ?, ?, 5)',
        [commitmentId, kt ? kt.id : 1, obj.kra, kt ? kt.weight_percent : 20, obj.desc, obj.indicator]
      );
    }
    console.log('✓ Performance targets created.');

    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🎉 Raul M. Colot Jr. account created successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

recreateRaul();
