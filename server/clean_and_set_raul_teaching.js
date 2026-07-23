const db = require('./db');
const bcrypt = require('bcrypt');

async function run() {
  console.log('🧹 Starting cleanup and seeding for Raul M. Colot Jr. as Teaching Personnel...');
  try {
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Truncate/Clear all transactional/evaluation/progress tables
    const tablesToClear = [
      'objective_self_ratings',
      'planned_mov_items',
      'mov_uploads',
      'mov_files',
      'coaching_feedback',
      'coaching_plans',
      'coaching_logs',
      'development_plan_items',
      'development_plans',
      'rewards_recognition',
      'performance_targets',
      'performance_commitments',
      'ipcrf_kra_ratings',
      'ipcrf_objectives',
      'ipcrf',
      'performance_ratings',
      'performance_evaluations'
    ];

    for (const table of tablesToClear) {
      await db.query(`DELETE FROM \`${table}\``);
      console.log(`  ✓ Cleared table: ${table}`);
    }

    // Reset auto-increment
    await db.query('ALTER TABLE ipcrf AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE ipcrf_objectives AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE performance_commitments AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE performance_targets AUTO_INCREMENT = 1');

    // 2. Ensure only Admin and Raul exist
    await db.query("DELETE FROM users WHERE email NOT IN ('jay.montealto@deped.gov.ph', 'kadongtata1975@gmail.com')");
    await db.query("DELETE FROM employees WHERE email NOT IN ('jay.montealto@deped.gov.ph', 'kadongtata1975@gmail.com')");
    console.log('  ✓ Cleaned up other users/employees');

    const hashed = await bcrypt.hash('password123', 10);

    // 3. Ensure Jay Montealto exists (Admin / Rater)
    const [existingAdminUser] = await db.query("SELECT id FROM users WHERE email = 'jay.montealto@deped.gov.ph'");
    let adminUserId;
    if (existingAdminUser.length > 0) {
      adminUserId = existingAdminUser[0].id;
      await db.query("UPDATE users SET password = ?, role = 'admin', full_name = 'Jay Montealto, CESO V' WHERE id = ?", [hashed, adminUserId]);
    } else {
      const [res] = await db.query(
        "INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)",
        ['Jay Montealto, CESO V', 'jay.montealto@deped.gov.ph', hashed, 'admin', 1]
      );
      adminUserId = res.insertId;
    }

    const [existingAdminEmp] = await db.query("SELECT id FROM employees WHERE email = 'jay.montealto@deped.gov.ph'");
    let adminEmpId = 1;
    if (existingAdminEmp.length > 0) {
      adminEmpId = existingAdminEmp[0].id;
      await db.query(
        "UPDATE employees SET name = 'Jay Montealto, CESO V', role = 'admin', position = 'Schools Division Superintendent', unit = 'Office of the SDS', employee_type = 'non_teaching' WHERE id = ?",
        [adminEmpId]
      );
    } else {
      await db.query(
        "INSERT INTO employees (id, name, email, role, position, unit, employee_type, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [1, 'Jay Montealto, CESO V', 'jay.montealto@deped.gov.ph', 'admin', 'Schools Division Superintendent', 'Office of the SDS', 'non_teaching', null]
      );
    }
    console.log('  ✓ Jay Montealto (Admin) record verified.');

    // 4. Ensure Raul M. Colot Jr. exists (Employee, Teacher III, Teaching)
    const [existingRaulUser] = await db.query("SELECT id FROM users WHERE email = 'kadongtata1975@gmail.com'");
    let raulUserId;
    if (existingRaulUser.length > 0) {
      raulUserId = existingRaulUser[0].id;
      await db.query("UPDATE users SET password = ?, role = 'employee', full_name = 'Raul M. Colot Jr.' WHERE id = ?", [hashed, raulUserId]);
    } else {
      const [res] = await db.query(
        "INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)",
        ['Raul M. Colot Jr.', 'kadongtata1975@gmail.com', hashed, 'employee', 1]
      );
      raulUserId = res.insertId;
    }

    const [existingRaulEmp] = await db.query("SELECT id FROM employees WHERE email = 'kadongtata1975@gmail.com'");
    let raulEmpId = 2;
    if (existingRaulEmp.length > 0) {
      raulEmpId = existingRaulEmp[0].id;
      await db.query(
        "UPDATE employees SET name = 'Raul M. Colot Jr.', role = 'employee', position = 'Teacher III', unit = 'Dapitan City', employee_type = 'teaching', plantilla_item_number = 'T3-99-012', form_type = 'IPCRF (Teaching)', supervisor_id = 1 WHERE id = ?",
        [raulEmpId]
      );
    } else {
      await db.query(
        "INSERT INTO employees (id, name, email, role, position, unit, employee_type, plantilla_item_number, form_type, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [2, 'Raul M. Colot Jr.', 'kadongtata1975@gmail.com', 'employee', 'Teacher III', 'Dapitan City', 'teaching', 'T3-99-012', 'IPCRF (Teaching)', 1]
      );
    }
    console.log('  ✓ Raul M. Colot Jr. (Teaching) record verified.');

    // 5. Ensure rating period is clean and active for 2026
    await db.query('DELETE FROM rating_periods');
    const [rpRes] = await db.query(
      `INSERT INTO rating_periods (id, year, cycle, is_active, school_year, period_label, start_date, end_date)
       VALUES (1, 2026, 'annual', 1, '2026-2027', 'SCHOOL YEAR 2026-2027', '2026-01-01', '2026-12-31')`
    );
    const periodId = 1;
    console.log('  ✓ Rating period set to SY 2026-2027.');

    // 6. Delete and seed Teaching KRA Templates (6 PPST Domains)
    await db.query("DELETE FROM kra_templates WHERE position_type = 'teaching'");
    
    const domains = [
      { name: 'Content Knowledge and Pedagogy', weight: 20.358, sort: 1 },
      { name: 'Learning Environment', weight: 13.572, sort: 2 },
      { name: 'Diversity of Learners', weight: 6.786, sort: 3 },
      { name: 'Curriculum and Planning', weight: 20.358, sort: 4 },
      { name: 'Assessment and Reporting', weight: 20.358, sort: 5 },
      { name: 'Personal Growth and Professional Development', weight: 18.568, sort: 6 }
    ];

    const domainMap = {};
    for (const d of domains) {
      const [res] = await db.query(
        'INSERT INTO kra_templates (rating_period_id, kra_name, weight_percent, sort_order, position_type) VALUES (?, ?, ?, ?, ?)',
        [periodId, d.name, d.weight, d.sort, 'teaching']
      );
      domainMap[d.name] = res.insertId;
    }
    console.log('  ✓ Teaching KRA Templates (6 PPST Domains) created.');

    // 7. Create IPCRF for Raul in 'not_submitted' status (clean slate)
    const [ipcrfRes] = await db.query(
      "INSERT INTO ipcrf (id, employee_id, rating_period_id, status, ratee_signed, rater_signed, signed_at) VALUES (1, 2, 1, 'not_submitted', 0, 0, NULL)"
    );
    const ipcrfId = 1;
    console.log('  ✓ Clean IPCRF record created for Raul.');

    // 8. Create the 14 PPST Objectives mapped to the 6 Domains
    const objectives14 = [
      // Domain 1: Content Knowledge and Pedagogy
      { 
        domain: 'Content Knowledge and Pedagogy', 
        desc: '1. Applied knowledge of content within and across curriculum teaching areas (PPST 1.1.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in the COT rating sheet / interobserver agreement form presented', 
        target: 'Achieve Level 6 COT rating across 4 classroom observation periods', 
        weight: 7.14
      },
      { 
        domain: 'Content Knowledge and Pedagogy', 
        desc: '2. Used a range of teaching strategies that enhance learner achievement in literacy and numeracy skills (PPST 1.4.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Implement literacy and numeracy intervention plans with 100% target achievement', 
        weight: 7.14
      },
      { 
        domain: 'Content Knowledge and Pedagogy', 
        desc: '3. Applied a range of teaching strategies to develop critical and creative thinking, as well as other higher-order thinking skills (PPST 1.5.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Incorporate HOTS questions in 100% of Daily Lesson Logs (DLL)', 
        weight: 7.14
      },

      // Domain 2: Learning Environment
      { 
        domain: 'Learning Environment', 
        desc: '4. Managed classroom structure to engage learners, individually or in groups, in meaningful exploration, discovery and hands-on activities (PPST 2.3.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Maintain 100% learner participation in interactive discovery activities', 
        weight: 7.14
      },
      { 
        domain: 'Learning Environment', 
        desc: '5. Managed learner behavior constructively by applying positive and non-violent discipline to ensure learning-focused environments (PPST 2.6.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Zero corporal punishment complaints and 100% positive discipline compliance', 
        weight: 7.14
      },

      // Domain 3: Diversity of Learners
      { 
        domain: 'Diversity of Learners', 
        desc: '6. Used differentiated, developmentally appropriate learning experiences to address learners gender, needs, strengths, interests and experiences (PPST 3.1.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Provide differentiated activities for 100% of diverse learners', 
        weight: 7.14
      },

      // Domain 4: Curriculum and Planning
      { 
        domain: 'Curriculum and Planning', 
        desc: '7. Planned, managed and implemented developmentally sequenced teaching and learning processes to meet curriculum requirements and varied teaching contexts (PPST 4.1.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Submit 40 complete Daily Lesson Logs (DLL) aligned with MELCs', 
        weight: 7.14
      },
      { 
        domain: 'Curriculum and Planning', 
        desc: '8. Participated in collegial discussions that use teacher and learner feedback to enrich teaching practice (PPST 4.4.2)', 
        indicator: 'Shared insights and suggestions on the effective use of teacher and learner feedback during LAC sessions/meetings/other collegial discussions to enrich teaching practice, as evidenced by MOV 3', 
        target: 'Participate in 4 division/school LAC sessions with documented outputs', 
        weight: 7.14
      },
      { 
        domain: 'Curriculum and Planning', 
        desc: '9. Selected, developed, organized and used appropriate teaching and learning resources, including ICT, to address learning goals (PPST 4.5.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Develop and utilize 10 ICT-integrated learning materials', 
        weight: 7.14
      },

      // Domain 5: Assessment and Reporting
      { 
        domain: 'Assessment and Reporting', 
        desc: '10. Designed, selected, organized and used diagnostic, formative and summative assessment strategies consistent with curriculum requirements (PPST 5.1.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Administer 4 quarterly summative tests with completed item analysis', 
        weight: 7.14
      },
      { 
        domain: 'Assessment and Reporting', 
        desc: '11. Monitored and evaluated learner progress and achievement using learner attainment data (PPST 5.2.2)', 
        indicator: 'Implemented the intervention plan based on learner attainment data, as evidenced by MOV 4', 
        target: 'Maintain 100% updated learner attainment data and progress monitoring sheets', 
        weight: 7.14
      },
      { 
        domain: 'Assessment and Reporting', 
        desc: '12. Communicated promptly and clearly the learners needs, progress and achievement to key stakeholders, including parents/guardians (PPST 5.4.2)', 
        indicator: 'Secured commitment and agreement from key stakeholders, including parents/guardians, on the communicated learners needs, progress, and achievement, as evidenced by the MOV presented', 
        target: 'Conduct 4 quarterly parent-teacher conferences with signed report cards', 
        weight: 7.14
      },

      // Domain 6: Personal Growth and Professional Development
      { 
        domain: 'Personal Growth and Professional Development', 
        desc: '13. Applied a personal philosophy of teaching that is learner-centered (PPST 7.1.2)', 
        indicator: 'Demonstrated a clear, theory-informed learner-centered philosophy that showed simple, specific and reflective annotations', 
        target: 'Submit teaching philosophy statement with reflective annotations', 
        weight: 7.16
      },
      { 
        domain: 'Personal Growth and Professional Development', 
        desc: '14. Set professional development goals based on the Philippine Professional Standards for Teachers (PPST 7.5.2)', 
        indicator: 'Updated professional development goals during Phase II of the PMES Cycle as evidenced by MOV 4', 
        target: 'Complete annual e-SAT and Individual Development Plan (IPCRF-DP)', 
        weight: 7.16
      }
    ];

    for (let i = 0; i < objectives14.length; i++) {
      const obj = objectives14[i];
      const kraTemplateId = domainMap[obj.domain];
      await db.query(
        `INSERT INTO ipcrf_objectives 
          (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent, actual_accomplishment, self_rating) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [ipcrfId, kraTemplateId, i + 1, obj.desc, obj.indicator, obj.target, obj.weight, obj.target]
      );
    }
    console.log('  ✓ 14 Teaching Objectives added to Raul\'s IPCRF with empty self ratings.');

    // 9. Create a clean Performance Commitment in 'draft' status
    const [cRes] = await db.query(
      `INSERT INTO performance_commitments 
        (id, employee_id, rating_period_id, position_type, status, rater_id, submitted_at) 
       VALUES (1, 2, 1, 'teaching', 'draft', 1, NULL)`
    );
    const commitmentId = 1;

    for (let i = 0; i < objectives14.length; i++) {
      const obj = objectives14[i];
      const kraTemplateId = domainMap[obj.domain];
      await db.query(
        `INSERT INTO performance_targets (commitment_id, kra_template_id, kra_category, weight_percent, target_description, success_indicator, self_rating) VALUES (?, ?, ?, ?, ?, ?, NULL)`,
        [commitmentId, kraTemplateId, obj.domain, obj.weight, obj.desc, obj.indicator]
      );
    }
    console.log('  ✓ Clean Performance Commitment created in draft state.');

    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🎉 Raul transformed to Teaching Personnel with clean slate successfully!');
  } catch (err) {
    console.error('❌ Failed to run script:', err);
  } finally {
    process.exit(0);
  }
}

run();
