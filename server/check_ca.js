const db = require('./db');
async function run() {
    try {
        await db.query('DELETE FROM comparative_assessment_scores');
        await db.query('DELETE FROM comparative_assessment_results');
        console.log('✅ Test data cleared — DB ready for use');
    } catch(e) { console.error(e.message); } finally { db.end(); }
}
run();
