const db = require('./db');

async function reset() {
  await db.query("UPDATE ipcrf SET status = 'not_submitted', ratee_signed = 0, rater_signed = 0, signed_at = NULL");
  await db.query("UPDATE performance_commitments SET status = 'draft'");
  await db.query("UPDATE ipcrf_objectives io JOIN kra_templates kt ON io.kra_template_id = kt.id SET io.weight_percent = kt.weight_percent WHERE io.weight_percent IS NULL");
  await db.query("TRUNCATE TABLE coaching_feedback");
  await db.query("TRUNCATE TABLE coaching_logs");
  console.log("✅ IPCRF, commitments, and feedback reset cleanly!");
  process.exit(0);
}

reset().catch(err => {
  console.error(err);
  process.exit(1);
});
