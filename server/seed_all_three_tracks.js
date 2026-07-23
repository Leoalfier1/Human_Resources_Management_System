const db = require('./db');
const bcrypt = require('bcrypt');

async function seedThreeTracks() {
  console.log('⏳ Seeding accounts for all 3 DepEd Personnel Tracks (Teaching, Non-Teaching, Teaching-Related)...');
  try {
    const hashed = await bcrypt.hash('password123', 10);

    // 1. Ensure master KRA templates exist for all 3 tracks
    await db.query("ALTER TABLE employees MODIFY COLUMN employee_type VARCHAR(50) DEFAULT 'non_teaching'");
    await db.query("ALTER TABLE kra_templates MODIFY COLUMN position_type ENUM('teaching', 'non_teaching', 'teaching_related') DEFAULT 'non_teaching'");
    await db.query("ALTER TABLE performance_commitments MODIFY COLUMN position_type ENUM('teaching', 'non_teaching', 'teaching_related') DEFAULT 'non_teaching'");

    const periodId = 1; // CY 2026

    // Master KRA Templates Seeder
    const kraTemplatesData = [
      // Teaching-Related
      { pos: 'teaching_related', name: 'Technical Assistance & Instructional Supervision', weight: 25, sort: 1 },
      { pos: 'teaching_related', name: 'Learning Resources Development & LRMDS Quality Assurance', weight: 20, sort: 2 },
      { pos: 'teaching_related', name: 'Curriculum Assessment & Program Evaluation', weight: 20, sort: 3 },
      { pos: 'teaching_related', name: 'Action Research & Continuous Improvement', weight: 20, sort: 4 },
      { pos: 'teaching_related', name: 'Stakeholder Engagement & Community Partnership', weight: 15, sort: 5 },

      // Non-Teaching
      { pos: 'non_teaching', name: 'Basic Education Support & Frontline Service Delivery', weight: 25, sort: 1 },
      { pos: 'non_teaching', name: 'Human Resource & Personnel Records Management', weight: 20, sort: 2 },
      { pos: 'non_teaching', name: 'Financial, Procurement & Supply Operations', weight: 20, sort: 3 },
      { pos: 'non_teaching', name: 'Governance, ISO & PRIME-HRM Compliance', weight: 20, sort: 4 },
      { pos: 'non_teaching', name: 'Client Feedback & Customer Satisfaction', weight: 15, sort: 5 },

      // Teaching
      { pos: 'teaching', name: 'Content Knowledge and Pedagogy (PPST Domain 1)', weight: 25, sort: 1 },
      { pos: 'teaching', name: 'Learning Environment & Diversity of Learners (PPST Domain 2 & 3)', weight: 25, sort: 2 },
      { pos: 'teaching', name: 'Curriculum and Planning (PPST Domain 4)', weight: 20, sort: 3 },
      { pos: 'teaching', name: 'Assessment and Reporting (PPST Domain 5)', weight: 20, sort: 4 },
      { pos: 'teaching', name: 'Community Linkages & Plus Factor (PPST Domain 6 & 7)', weight: 10, sort: 5 }
    ];

    for (const t of kraTemplatesData) {
      const [existing] = await db.query(
        'SELECT id FROM kra_templates WHERE rating_period_id = ? AND kra_name = ? AND position_type = ?',
        [periodId, t.name, t.pos]
      );
      if (existing.length === 0) {
        await db.query(
          'INSERT INTO kra_templates (rating_period_id, kra_name, weight_percent, sort_order, position_type) VALUES (?, ?, ?, ?, ?)',
          [periodId, t.name, t.weight, t.sort, t.pos]
        );
      }
    }
    console.log('✓ Master KRA Templates ready for all 3 tracks.');

    // Helper to create user + employee + IPCRF + objectives
    async function createTrackAccount({ email, name, position, unit, itemNo, employeeType, formType, objectives }) {
      // Create user if not exists
      let userId;
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

      // Create or update employee
      let empId;
      const [eRows] = await db.query('SELECT id FROM employees WHERE email = ?', [email]);
      if (eRows.length > 0) {
        empId = eRows[0].id;
        await db.query(
          'UPDATE employees SET name = ?, position = ?, unit = ?, plantilla_item_number = ?, form_type = ?, employee_type = ? WHERE id = ?',
          [name, position, unit, itemNo, formType, employeeType, empId]
        );
      } else {
        const [eRes] = await db.query(
          'INSERT INTO employees (name, position, unit, role, email, plantilla_item_number, form_type, employee_type, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
          [name, position, unit, 'employee', email, itemNo, formType, employeeType]
        );
        empId = eRes.insertId;
      }

      // Create IPCRF
      let ipcrfId;
      const [iRows] = await db.query('SELECT id FROM ipcrf WHERE employee_id = ? AND rating_period_id = ?', [empId, periodId]);
      if (iRows.length > 0) {
        ipcrfId = iRows[0].id;
        await db.query("UPDATE ipcrf SET status = 'not_submitted', ratee_signed = 0, rater_signed = 0 WHERE id = ?", [ipcrfId]);
      } else {
        const [iRes] = await db.query(
          "INSERT INTO ipcrf (employee_id, rating_period_id, status) VALUES (?, ?, 'not_submitted')",
          [empId, periodId]
        );
        ipcrfId = iRes.insertId;
      }

      // Create Objectives
      await db.query('DELETE FROM ipcrf_objectives WHERE ipcrf_id = ?', [ipcrfId]);
      const [kraTemplates] = await db.query('SELECT * FROM kra_templates WHERE position_type = ? ORDER BY sort_order ASC', [employeeType]);

      for (let i = 0; i < objectives.length; i++) {
        const obj = objectives[i];
        const kt = kraTemplates.find(k => k.kra_name === obj.kra) || kraTemplates[i];
        await db.query(
          'INSERT INTO ipcrf_objectives (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent, actual_accomplishment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [ipcrfId, kt ? kt.id : 1, i + 1, obj.desc, obj.indicator, obj.target, kt ? kt.weight_percent : 20, obj.target]
        );
      }

      console.log(`✓ Account created: ${name} (${email}) — ${position}`);
    }

    // 1. TEACHING-RELATED ACCOUNT
    await createTrackAccount({
      email: 'kadongtata1975@gmail.com',
      name: 'Raul M. Colot Jr.',
      position: 'Education Program Specialist II',
      unit: 'Curriculum Implementation Division',
      itemNo: 'EPS2-52-009',
      employeeType: 'teaching_related',
      formType: 'IPCRF (Teaching-Related)',
      objectives: [
        { kra: 'Technical Assistance & Instructional Supervision', desc: 'Provide Technical Assistance (TA) and Instructional Supervision to school heads and teachers on curriculum contextualization and learning area delivery', indicator: '100% of targeted schools provided with technical assistance reports, instructional supervision notes, and intervention plans', target: 'Conduct quarterly instructional monitoring and TA visits across 52 assigned division schools with documented TA reports by December 2026' },
        { kra: 'Learning Resources Development & LRMDS Quality Assurance', desc: 'Manage the development, quality assurance, and contextualization of Learning Action Cell (LAC) sessions and DepEd LRMDS learning resources', indicator: '100% of submitted Learning Activity Sheets (LAS) and instructional modules quality-assured following DepEd LRMDS standards', target: 'Quality assure 25 CID learning resources and facilitate 4 division-wide LAC sessions for instructional leaders' },
        { kra: 'Curriculum Assessment & Program Evaluation', desc: 'Monitor, evaluate, and analyze division-wide curriculum program implementation and learning assessment results for CID reporting', indicator: '100% of learning assessment results analyzed with strategic intervention plans submitted to the CID Chief', target: 'Submit 4 quarterly Curriculum Assessment & Learning Achievement reports with zero delayed submissions' },
        { kra: 'Action Research & Continuous Improvement', desc: 'Facilitate action research initiatives, curriculum innovations, and PRIME-HRM alignment for CID teaching-related personnel', indicator: '100% of approved Division action research proposals monitored with completed progress reports and Zero CSC findings', target: 'Evaluate 10 school action research proposals and submit complete CID PRIME-HRM documentary requirements by Q4 2026' },
        { kra: 'Stakeholder Engagement & Community Partnership', desc: 'Convene quarterly CID Stakeholders Assemblies and foster strategic partnerships with LGUs and community partners for curriculum enrichment', indicator: '100% quarterly stakeholders assemblies convened with signed MOUs/MOAs for curriculum support programs', target: 'Organize 4 quarterly CID Stakeholders Assemblies with 100% LGU and community partner participation' }
      ]
    });

    // 2. NON-TEACHING ACCOUNT
    await createTrackAccount({
      email: 'nonteaching@deped.gov.ph',
      name: 'Maria L. Santos-Reyes',
      position: 'Administrative Officer V',
      unit: 'Finance & Administrative Division',
      itemNo: 'AOV-52-001',
      employeeType: 'non_teaching',
      formType: 'IPCRF (Non-Teaching)',
      objectives: [
        { kra: 'Basic Education Support & Frontline Service Delivery', desc: 'Execute daily administrative, document processing, and customer support services in compliance with ARTA and DepEd Service Standards', indicator: '100% of client requests, communications, and transactions processed within prescribed turnaround times', target: 'Process 500+ administrative requests and communications with 100% compliance with DepEd Citizen\'s Charter timelines' },
        { kra: 'Human Resource & Personnel Records Management', desc: 'Manage personnel records, SALN filings, service cards, leave applications, and 201 files of division employees', indicator: '100% of personnel files updated and archived in accordance with CSC and DepEd records management policies', target: 'Maintain 100% updated 201 files for 487 division employees with zero unarchived personnel documents by Q3 2026' },
        { kra: 'Financial, Procurement & Supply Operations', desc: 'Facilitate timely preparation of disbursement vouchers, purchase requests, supply inventories, and financial liquidations', indicator: '100% of procurement documents and financial vouchers processed with zero audit findings from COA', target: 'Process 150+ financial vouchers and conduct quarterly physical inventory count of division equipment with zero COA disallowances' },
        { kra: 'Governance, ISO & PRIME-HRM Compliance', desc: 'Ensure organizational compliance with PRIME-HRM Level II, ISO 9001:2015 Quality Management, and office performance standards', indicator: '100% compliance with PRIME-HRM documentary requirements and internal quality audit standards', target: 'Achieve 100% PRIME-HRM Level II evidence submission and pass annual ISO Quality Management System audit' },
        { kra: 'Client Feedback & Customer Satisfaction', desc: 'Monitor client satisfaction feedback and resolve customer complaints and frontline inquiries efficiently', indicator: 'Maintain a 98% or higher Very Satisfactory client satisfaction rating on division frontline services', target: 'Collect 200+ Client Satisfaction Measurement (CSM) feedback forms with 98%+ positive rating' }
      ]
    });

    // 3. TEACHING ACCOUNT (Matching official DepEd RPMS IPCRF document)
    await createTrackAccount({
      email: 'teacher@deped.gov.ph',
      name: 'Arniel M. Banawa',
      position: 'Teacher III',
      unit: 'Dapitan City',
      itemNo: 'T3-99-012',
      employeeType: 'teaching',
      formType: 'IPCRF (Teaching)',
      objectives: [
        { kra: 'Content Knowledge and Pedagogy (PPST Domain 1)', desc: 'Applied knowledge of content within and across curriculum teaching areas (PPST 1.1.2)', indicator: 'Demonstrated Level 6/7 in PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', target: 'Achieve Level 6 COT rating across 4 classroom observation periods' },
        { kra: 'Content Knowledge and Pedagogy (PPST Domain 1)', desc: 'Used a range of teaching strategies that enhance learner achievement in literacy and numeracy skills (PPST 1.4.2)', indicator: 'Demonstrated Level 6/7 in PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', target: 'Implement literacy and numeracy intervention plans with 100% target achievement' },
        { kra: 'Content Knowledge and Pedagogy (PPST Domain 1)', desc: 'Applied a range of teaching strategies to develop critical and creative thinking, as well as other higher-order thinking skills (PPST 1.5.2)', indicator: 'Demonstrated Level 6/7 in PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', target: 'Incorporate HOTS questions in 100% of Daily Lesson Logs (DLL)' },
        { kra: 'Learning Environment & Diversity of Learners (PPST Domain 2 & 3)', desc: 'Managed classroom structure to engage learners, individually or in groups, in meaningful exploration, discovery and hands-on activities (PPST 2.3.2)', indicator: 'Demonstrated Level 6/7 in PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', target: 'Maintain 100% learner participation in interactive discovery activities' },
        { kra: 'Learning Environment & Diversity of Learners (PPST Domain 2 & 3)', desc: 'Managed learner behavior constructively by applying positive and non-violent discipline to ensure learning-focused environments (PPST 2.6.2)', indicator: 'Demonstrated Level 6/7 in PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', target: 'Zero corporal punishment complaints and 100% positive discipline compliance' },
        { kra: 'Learning Environment & Diversity of Learners (PPST Domain 2 & 3)', desc: 'Used differentiated, developmentally appropriate learning experiences to address learners gender, needs, strengths, interests and experiences (PPST 3.1.2)', indicator: 'Demonstrated Level 6/7 in PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', target: 'Provide differentiated activities for 100% of diverse learners' },
        { kra: 'Curriculum and Planning (PPST Domain 4)', desc: 'Planned, managed and implemented developmentally sequenced teaching and learning processes to meet curriculum requirements and varied teaching contexts (PPST 4.1.2)', indicator: 'Demonstrated Level 6/7 in PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', target: 'Submit 40 complete Daily Lesson Logs (DLL) aligned with MELCs' },
        { kra: 'Curriculum and Planning (PPST Domain 4)', desc: 'Participated in collegial discussions that use teacher and learner feedback to enrich teaching practice (PPST 4.4.2)', indicator: 'Shared insights and suggestions on the effective use of teacher and learner feedback during LAC sessions', target: 'Participate in 4 division/school LAC sessions with documented outputs' },
        { kra: 'Curriculum and Planning (PPST Domain 4)', desc: 'Selected, developed, organized and used appropriate teaching and learning resources, including ICT, to address learning goals (PPST 4.5.2)', indicator: 'Demonstrated Level 6/7 in PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', target: 'Develop and utilize 10 ICT-integrated learning materials' },
        { kra: 'Assessment and Reporting (PPST Domain 5)', desc: 'Designed, selected, organized and used diagnostic, formative and summative assessment strategies consistent with curriculum requirements (PPST 5.1.2)', indicator: 'Demonstrated Level 6/7 in PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', target: 'Administer 4 quarterly summative tests with completed item analysis' },
        { kra: 'Assessment and Reporting (PPST Domain 5)', desc: 'Monitored and evaluated learner progress and achievement using learner attainment data (PPST 5.2.2)', indicator: 'Implemented the intervention plan based on learner attainment data', target: 'Maintain 100% updated learner attainment data and progress monitoring sheets' },
        { kra: 'Assessment and Reporting (PPST Domain 5)', desc: 'Communicated promptly and clearly the learners needs, progress and achievement to key stakeholders, including parents/guardians (PPST 5.4.2)', indicator: 'Secured commitment and agreement from key stakeholders on communicated learner needs', target: 'Conduct 4 quarterly parent-teacher conferences with signed report cards' },
        { kra: 'Community Linkages & Plus Factor (PPST Domain 6 & 7)', desc: 'Applied a personal philosophy of teaching that is learner-centered (PPST 7.1.2)', indicator: 'Demonstrated a clear, theory-informed learner-centered philosophy in teaching practice', target: 'Submit teaching philosophy statement with reflective annotations' },
        { kra: 'Community Linkages & Plus Factor (PPST Domain 6 & 7)', desc: 'Set professional development goals based on the Philippine Professional Standards for Teachers (PPST 7.5.2)', indicator: 'Updated professional development goals during Phase II of the PMES Cycle', target: 'Complete annual e-SAT and Individual Development Plan (IPCRF-DP)' }
      ]
    });

    console.log('\n======================================================');
    console.log('✅ SUCCESS! All 3 DepEd Personnel Track Accounts Ready:');
    console.log('1. TEACHING-RELATED: kadongtata1975@gmail.com / password123');
    console.log('2. NON-TEACHING:      nonteaching@deped.gov.ph  / password123');
    console.log('3. TEACHING:          teacher@deped.gov.ph      / password123');
    console.log('4. ADMIN / RATER:     jay.montealto@deped.gov.ph / password123');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Failed to seed track accounts:', err);
  } finally {
    process.exit(0);
  }
}

seedThreeTracks();
