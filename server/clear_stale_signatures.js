const db = require('./db');

async function clearSignatures() {
  try {
    await db.query("UPDATE ipcrf SET ratee_signed = 0, rater_signed = 0, signed_at = NULL");
    console.log("✅ Cleared all database signature flags for all IPCRFs.");
  } catch (err) {
    console.error("Error clearing signatures:", err);
  } finally {
    process.exit(0);
  }
}

clearSignatures();
