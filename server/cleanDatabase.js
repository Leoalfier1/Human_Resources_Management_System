const db = require('./db');

async function cleanDatabase() {
  console.log("🧹 Starting database cleanup...");
  try {
    await db.query("SET FOREIGN_KEY_CHECKS = 0");

    // 1. Keep only admin users - delete all non-admin
    const [adminUsers] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    const adminUserIds = adminUsers.map(u => u.id);
    console.log(`  Admin user IDs to keep: [${adminUserIds}]`);

    if (adminUserIds.length > 0) {
      const placeholders = adminUserIds.map(() => '?').join(',');
      await db.query(`DELETE FROM users WHERE id NOT IN (${placeholders})`, adminUserIds);
    } else {
      await db.query("DELETE FROM users");
    }
    console.log("✓ Cleaned users table (kept admins only)");

    // 2. Keep only admin employees - delete all non-admin
    const [adminEmps] = await db.query("SELECT id FROM employees WHERE role = 'admin'");
    const adminEmpIds = adminEmps.map(e => e.id);
    console.log(`  Admin employee IDs to keep: [${adminEmpIds}]`);

    // Delete all dependent data first (won't matter with FK_CHECKS=0 but be explicit)
    const truncateOrder = [
      'notifications',
      'activity_log',
      'appointments',
      'applicant_documents',
      'applicant_qualification_results',
      'applicants',
      'comparative_assessment_results',
      'minimum_qualifications_checklist',
      'vacancies',
      'mov_uploads',
      'mov_files',
      'ipcrf_kra_ratings',
      'ipcrf_objectives',
      'ipcrf',
      'kra_objectives',
      'ld_evaluations',
      'ld_enrollments',
      'ld_objectives',
      'ld_programs',
      'tna_submissions',
      'tna_cycles',
      'performance_ratings',
      'performance_evaluations',
      'performance_criteria',
      'performance_periods',
      'development_plan_items',
      'development_plans',
      'feedback_logs',
      'coaching_feedback',
      'coaching_plans',
      'coaching_logs',
      'performance_targets',
      'performance_commitments',
      'rewards_recognition',
    ];

    for (const table of truncateOrder) {
      await db.query(`DELETE FROM ${table}`);
      console.log(`  ✓ Cleared ${table}`);
    }

    // 3. Delete non-admin employees
    if (adminEmpIds.length > 0) {
      const placeholders = adminEmpIds.map(() => '?').join(',');
      await db.query(`DELETE FROM employees WHERE id NOT IN (${placeholders})`, adminEmpIds);
    } else {
      await db.query("DELETE FROM employees");
    }
    console.log("✓ Cleaned employees table (kept admins only)");

    // 4. Keep reference data: kra_templates, reward_types, adjectival_bands, rating_periods
    // These are seeded by initDb and needed for the system to function
    const [kraCount] = await db.query("SELECT COUNT(*) as cnt FROM kra_templates");
    const [rewardCount] = await db.query("SELECT COUNT(*) as cnt FROM reward_types");
    const [bandCount] = await db.query("SELECT COUNT(*) as cnt FROM adjectival_bands");
    const [periodCount] = await db.query("SELECT COUNT(*) as cnt FROM rating_periods");
    console.log(`  Reference data kept: kra_templates(${kraCount[0].cnt}), reward_types(${rewardCount[0].cnt}), adjectival_bands(${bandCount[0].cnt}), rating_periods(${periodCount[0].cnt})`);

    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    // Summary
    const [users] = await db.query("SELECT COUNT(*) as cnt FROM users");
    const [employees] = await db.query("SELECT COUNT(*) as cnt FROM employees");
    console.log("\n📊 Cleanup Summary:");
    console.log(`  Users remaining: ${users[0].cnt}`);
    console.log(`  Employees remaining: ${employees[0].cnt}`);
    console.log("✅ Database cleanup complete!");
    console.log("\n🔑 Admin login: jay.montealto@deped.gov.ph / password123");

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    process.exit(0);
  }
}

cleanDatabase();
