const db = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  console.log("⏳ Seeding performance management data (Phases 0-4)...");
  try {
    const hashed = await bcrypt.hash('password123', 10);

    // Turn off checks
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Clear performance tables
    const tables = [
      'rewards_recognition',
      'coaching_logs',
      'performance_targets',
      'performance_commitments',
      'adjectival_bands',
      'reward_types',
      'kra_templates',
      'rating_periods',
      'applicant_qualification_results',
      'applicant_documents',
      'comparative_assessment_results',
      'appointments',
      'applicants',
      'minimum_qualifications_checklist',
      'vacancies',
      'ipcrf_objectives',
      'ipcrf'
    ];
    for (const table of tables) {
      await db.query(`TRUNCATE TABLE \`${table}\``);
    }
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("✓ Truncated old performance tables.");

    // 1. Create rating periods (SY 2021-2022 to SY 2026-2027 active)
    const periodsToSeed = [
      { year: 2021, school_year: '2021-2022', is_active: false },
      { year: 2022, school_year: '2022-2023', is_active: false },
      { year: 2023, school_year: '2023-2024', is_active: false },
      { year: 2024, school_year: '2024-2025', is_active: false },
      { year: 2025, school_year: '2025-2026', is_active: false },
      { year: 2026, school_year: '2026-2027', is_active: true }
    ];

    const periodIds = {};
    for (const p of periodsToSeed) {
      const [res] = await db.query(
        `INSERT INTO rating_periods (year, cycle, is_active, school_year, period_label, start_date, end_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.year, 'annual', p.is_active, p.school_year, `SCHOOL YEAR ${p.school_year}`, `${p.year}-01-01`, `${p.year}-12-31`]
      );
      periodIds[p.school_year] = res.insertId;
    }
    const periodId2024 = periodIds['2024-2025'];
    const periodId2025 = periodIds['2025-2026'];
    const periodId2026 = periodIds['2026-2027'];
    console.log("✓ Seeded school year rating periods.");

    // 2. Create adjectival bands
    const bands = [
      { min: 4.5000, max: 5.0000, label: 'Outstanding', sort: 1 },
      { min: 3.5000, max: 4.4999, label: 'Very Satisfactory', sort: 2 },
      { min: 2.5000, max: 3.4999, label: 'Satisfactory', sort: 3 },
      { min: 1.5000, max: 2.4999, label: 'Unsatisfactory', sort: 4 },
      { min: 0.0000, max: 1.4999, label: 'Poor', sort: 5 }
    ];
    for (const b of bands) {
      await db.query(
        `INSERT INTO adjectival_bands (min_score, max_score, label, sort_order) VALUES (?, ?, ?, ?)`,
        [b.min, b.max, b.label, b.sort]
      );
    }
    console.log("✓ Seeded adjectival bands.");

    // 3. Create reward types
    const rewardTypes = [
      { name: 'Outstanding Performance Award', desc: 'Given to personnel who got an Outstanding rating.' },
      { name: 'Leadership Excellence Award', desc: 'Given to unit leaders displaying extraordinary guidance.' },
      { name: 'Loyalty Service Award', desc: 'Given to long-standing employees of DepEd.' }
    ];
    for (const r of rewardTypes) {
      await db.query(
        `INSERT INTO reward_types (name, description, is_active) VALUES (?, ?, ?)`,
        [r.name, r.desc, true]
      );
    }
    console.log("✓ Seeded reward types.");

    // 4. Create KRA templates for 2026
    const nonTeachingKras = [
      { name: 'Basic Education Services Delivery', weight: 25.00, desc: 'Deliver basic educ support services.' },
      { name: 'Human Resource Management & Development', weight: 20.00, desc: 'LAC, staff development, employee metrics.' },
      { name: 'Financial & Administrative Management', weight: 20.00, desc: 'Budgeting, reporting, files management.' },
      { name: 'Governance & Organizational Performance', weight: 20.00, desc: 'Office orders, plans, DepEd standards compliance.' },
      { name: 'Stakeholder Engagement & Partnership', weight: 15.00, desc: 'Community relations, PTA meetings, LGU links.' }
    ];

    const teachingKras = [
      { name: 'Content Knowledge and Pedagogy', weight: 35.00, desc: 'Apply content knowledge within curriculum areas.' },
      { name: 'Learning Environment & Diversity of Learners', weight: 25.00, desc: 'Establish safe & secure learning setups.' },
      { name: 'Curriculum and Planning', weight: 20.00, desc: 'Plan & manage teaching-learning processes.' },
      { name: 'Assessment and Reporting', weight: 20.00, desc: 'Design, select, organize assessment tools.' }
    ];

    const kraMap = { non_teaching: {}, teaching: {} };
    for (const k of nonTeachingKras) {
      const [result] = await db.query(
        `INSERT INTO kra_templates (rating_period_id, kra_name, weight_percent, sort_order, position_type, category_name, default_weight_percent, description, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [periodId2026, k.name, k.weight, 0, 'non_teaching', k.name, k.weight, k.desc, true]
      );
      kraMap.non_teaching[k.name] = result.insertId;
    }

    for (const k of teachingKras) {
      const [result] = await db.query(
        `INSERT INTO kra_templates (rating_period_id, kra_name, weight_percent, sort_order, position_type, category_name, default_weight_percent, description, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [periodId2026, k.name, k.weight, 0, 'teaching', k.name, k.weight, k.desc, true]
      );
      kraMap.teaching[k.name] = result.insertId;
    }
    console.log("✓ Seeded KRA templates.");

    // Fetch user IDs
    const [reynaldoRows] = await db.query("SELECT id FROM employees WHERE email = 'jay.montealto@deped.gov.ph'");
    const reynaldoId = reynaldoRows[0]?.id || 1;

    const [maribelRows] = await db.query("SELECT id FROM employees WHERE email = 'kadongtata1975@gmail.com'");
    const maribelId = maribelRows[0]?.id;

    if (!maribelId) {
      console.log("⚠️ Raul Colot Jr. employee account not found! Run seedEmployeeData.js first.");
      process.exit(1);
    }



    // 5. Create commitments for 2026 (Active period)
    
    // MARIBEL (Draft, Non-Teaching, 100% weights)
    const [maribelCommResult] = await db.query(
      `INSERT INTO performance_commitments (employee_id, rating_period_id, position_type, status, submitted_at, rater_rating_submitted_at, rater_id)
       VALUES (?, ?, ?, ?, NULL, NULL, ?)`,
      [maribelId, periodId2026, 'non_teaching', 'draft', reynaldoId]
    );
    const maribelCommId = maribelCommResult.insertId;

    const maribelTargets = [
      { category: 'Basic Education Services Delivery', weight: 25.00, desc: 'Feeding program implement' },
      { category: 'Human Resource Management & Development', weight: 20.00, desc: 'Conduct LAC sessions' },
      { category: 'Financial & Administrative Management', weight: 20.00, desc: 'Process SALN folders' },
      { category: 'Governance & Organizational Performance', weight: 20.00, desc: 'PRIME-HRM Level II check' },
      { category: 'Stakeholder Engagement & Partnership', weight: 15.00, desc: 'Convene LGU assemblies' }
    ];
    for (const t of maribelTargets) {
      await db.query(
        `INSERT INTO performance_targets (commitment_id, kra_template_id, kra_category, weight_percent, target_description, success_indicator, self_rating, rater_rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [maribelCommId, kraMap.non_teaching[t.category], t.category, t.weight, t.desc, '100% done', 4.0, 4.0]
      );
    }

    // 6. Create coaching logs for Maribel
    await db.query(
      `INSERT INTO coaching_logs (commitment_id, target_id, author_id, entry_date, note)
       VALUES (?, NULL, ?, NOW(), ?)`,
      [maribelCommId, reynaldoId, 'Very good progress on monthly payroll processing. Keep it up!']
    );

    // 7. Seed finalized commitments in historical years (2024-2025 to 2025-2026) for Raul M. Colot Jr.

    // Seed Maribel's specific historical ratings as well
    const [hist1Result] = await db.query(
      `INSERT INTO performance_commitments (employee_id, rating_period_id, position_type, status, submitted_at, rater_rating_submitted_at, final_rating_submitted_at, overall_weighted_score, adjectival_rating, rater_id)
       VALUES (?, ?, ?, ?, NOW(), NOW(), NOW(), ?, ?, ?)`,
      [maribelId, periodIds['2024-2025'], 'non_teaching', 'committed', 4.80, 'Outstanding', reynaldoId]
    );
    const hist1CommId = hist1Result.insertId;

    const [hist2Result] = await db.query(
      `INSERT INTO performance_commitments (employee_id, rating_period_id, position_type, status, submitted_at, rater_rating_submitted_at, final_rating_submitted_at, overall_weighted_score, adjectival_rating, rater_id)
       VALUES (?, ?, ?, ?, NOW(), NOW(), NOW(), ?, ?, ?)`,
      [maribelId, periodIds['2025-2026'], 'non_teaching', 'committed', 4.10, 'Very Satisfactory', reynaldoId]
    );
    const hist2CommId = hist2Result.insertId;

    // Seed targets for historical commitments
    const historicalTargets1 = [
      { category: 'Basic Education Services Delivery', weight: 25.00, desc: 'Deliver elementary support' },
      { category: 'Human Resource Management & Development', weight: 20.00, desc: 'Conduct staff training' },
      { category: 'Financial & Administrative Management', weight: 20.00, desc: 'Manage budget reporting' },
      { category: 'Governance & Organizational Performance', weight: 20.00, desc: 'Office compliance audits' },
      { category: 'Stakeholder Engagement & Partnership', weight: 15.00, desc: 'Coordinate community links' }
    ];
    for (const t of historicalTargets1) {
      await db.query(
        `INSERT INTO performance_targets (commitment_id, kra_template_id, kra_category, weight_percent, target_description, success_indicator, self_rating, rater_rating, final_rating)
         VALUES (?, ?, ?, ?, ?, ?, 4.0, 4.0, 4.8)`,
        [hist1CommId, kraMap.non_teaching[t.category], t.category, t.weight, t.desc, '100% completed']
      );
    }

    const historicalTargets2 = [
      { category: 'Basic Education Services Delivery', weight: 25.00, desc: 'Implement education assistance' },
      { category: 'Human Resource Management & Development', weight: 20.00, desc: 'Organize development sessions' },
      { category: 'Financial & Administrative Management', weight: 20.00, desc: 'Perform audits and filings' },
      { category: 'Governance & Organizational Performance', weight: 20.00, desc: 'Standard operating compliance' },
      { category: 'Stakeholder Engagement & Partnership', weight: 15.00, desc: 'Engage local LGU partners' }
    ];
    for (const t of historicalTargets2) {
      await db.query(
        `INSERT INTO performance_targets (commitment_id, kra_template_id, kra_category, weight_percent, target_description, success_indicator, self_rating, rater_rating, final_rating)
         VALUES (?, ?, ?, ?, ?, ?, 4.0, 4.0, 4.1)`,
        [hist2CommId, kraMap.non_teaching[t.category], t.category, t.weight, t.desc, '100% completed']
      );
    }

    console.log("✓ Seeded commitments, targets, and coaching logs.");

    // === SEED IPCRF & OBJECTIVES FOR EMPLOYEE VIEW ===
    const [ipcrfResult] = await db.query(
      "INSERT INTO ipcrf (employee_id, rating_period_id, status) VALUES (?, ?, ?)",
      [maribelId, periodId2026, 'not_submitted']
    );
    const employeeIpcrfId = ipcrfResult.insertId;

    const objectives = [
      { kra: 'Basic Education Services Delivery', desc: 'Manage implementation of school-based feeding program across all elementary schools in the division', indicator: '100% of target schools have active feeding program with updated beneficiary lists', target: '52 schools with feeding program implemented by June 2026' },
      { kra: 'Human Resource Management & Development', desc: 'Facilitate division-wide LAC (Learning Action Cell) sessions for instructional leaders', indicator: '100% of LAC sessions conducted with attendance reports', target: '4 LAC sessions conducted; attendance report submitted to SGOD' },
      { kra: 'Financial & Administrative Management', desc: 'Ensure timely processing of personnel documents (appointments, SALN, PDS)', indicator: '100% SALN compliance rate', target: 'All 487 SALN submissions processed and filed by April 30, 2026' },
      { kra: 'Governance & Organizational Performance', desc: 'Submit complete PRIME-HRM documentary requirements to CSC Regional Office', indicator: 'Zero CSC findings', target: 'Complete submission by March 31, 2026; zero CSC findings' },
      { kra: 'Stakeholder Engagement & Partnership', desc: 'Convene quarterly Stakeholders\' Assembly for all barangay LGU partners', indicator: '100% quarterly assemblies convened', target: '4 stakeholders\' assemblies with MOU/MOA outputs' },
    ];

    for (let i = 0; i < objectives.length; i++) {
      const obj = objectives[i];
      const kraId = kraMap.non_teaching[obj.kra];
      if (!kraId) continue;

      await db.query(
        'INSERT INTO ipcrf_objectives (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, actual_accomplishment) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [employeeIpcrfId, kraId, i + 1, obj.desc, obj.indicator, obj.target, obj.target]
      );
    }
    console.log("✓ Seeded employee IPCRF and objectives.");

    // === SEED RSP VACANCIES & APPLICANTS ===
    // 1. Seed vacancies
    const [vac1] = await db.query(
      `INSERT INTO vacancies (ref_no, position_title, item_number, salary_grade, assigned_school, minimum_qualifications, no_of_vacancies, posting_date, deadline_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['VAC-2026-001', 'Teacher I (Junior High School)', 'TCH1-540012-2026', 11, 'Dapitan City National High School', 'Bachelor of Secondary Education major in English, Board Licensure Examination for Professional Teachers (BLEPT) passer, No experience required, 4 hours of relevant training', 2, '2026-07-01', '2026-07-31', 'active']
    );
    const vac1Id = vac1.insertId;

    const [vac2] = await db.query(
      `INSERT INTO vacancies (ref_no, position_title, item_number, salary_grade, assigned_school, minimum_qualifications, no_of_vacancies, posting_date, deadline_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['VAC-2026-002', 'Administrative Assistant II (Finance)', 'ADAS2-540025-2026', 8, 'Division Office - Finance Unit', 'Completion of two years in college, Career Service (Sub-professional) eligibility, 1 year of relevant experience, 4 hours of training', 1, '2026-07-01', '2026-07-31', 'active']
    );
    const vac2Id = vac2.insertId;

    console.log("✓ Seeded vacancies.");

    // 2. Seed checklist criteria for Vacancy 1
    const criteria = [
      { label: 'Bachelor of Secondary Education or equivalent with major/minor in area of specialization', req: 1 },
      { label: 'Board Licensure Examination for Professional Teachers (BLEPT) Passer', req: 1 },
      { label: 'No experience required', req: 0 },
      { label: 'No training required', req: 0 }
    ];
    const critIds = [];
    for (const c of criteria) {
      const [critRes] = await db.query(
        `INSERT INTO minimum_qualifications_checklist (vacancy_id, criterion_label, is_required) VALUES (?, ?, ?)`,
        [vac1Id, c.label, c.req]
      );
      critIds.push(critRes.insertId);
    }
    console.log("✓ Seeded vacancy criteria.");

    // 3. Seed Raul M. Colot Jr. as mockup applicant
    const [appRes] = await db.query(
      `INSERT INTO applicants (applicant_code, full_name, id_number, vacancy_id, user_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['APP-2026-001', 'Raul M. Colot Jr.', '09123456789', vac1Id, maribelId, 'submitted']
    );
    const applicantId = appRes.insertId;

    // 4. Seed qualification results for applicant
    for (const cId of critIds) {
      await db.query(
        `INSERT INTO applicant_qualification_results (applicant_id, criterion_id, passed) VALUES (?, ?, 1)`,
        [applicantId, cId]
      );
    }

    // 5. Seed applicant uploaded documents
    const docTypes = ['pds', 'tor', 'license'];
    for (const type of docTypes) {
      await db.query(
        `INSERT INTO applicant_documents (applicant_id, document_type, is_required, verification_status)
         VALUES (?, ?, 1, 'uploaded_pending_review')`,
        [applicantId, type]
      );
    }
    console.log("✓ Seeded Raul M. Colot Jr. as mockup applicant.");
    console.log("✅ Seeding completed successfully!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    throw err;
  }
}

// execute if run directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seed;
