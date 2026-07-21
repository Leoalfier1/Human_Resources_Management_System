const mysql = require('mysql2');
require('dotenv').config();
const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME
});
const db = pool.promise();

async function check() {
    // 1. Find jhustyn's application
    const [apps] = await db.query(`SELECT a.id, a.full_name, a.ref_no, a.status, a.vacancy_id, a.table_rows_override, a.letter_type FROM applications a WHERE a.ref_no = 'TR-001' OR a.full_name LIKE '%jhustyn%' LIMIT 3`);
    console.log('=== APPLICATIONS ===');
    apps.forEach(a => console.log(`  id=${a.id} name="${a.full_name}" ref=${a.ref_no} status=${a.status} vacancy=${a.vacancy_id} override=${a.table_rows_override ? 'YES' : 'NO'} letter_type=${a.letter_type}`));

    for (const app of apps) {
        console.log(`\n=== Application ${app.id} (${app.ref_no}) ===`);

        // 2. MQ checklist for this vacancy
        const [mqc] = await db.query('SELECT * FROM minimum_qualifications_checklist WHERE vacancy_id = ?', [app.vacancy_id]);
        console.log(`  MQC rows for vacancy ${app.vacancy_id}: ${mqc.length}`);
        mqc.forEach(r => console.log(`    id=${r.id} label="${r.criterion_label}" required=${r.is_required}`));

        // 3. AQR for this applicant
        const [aqr] = await db.query('SELECT * FROM applicant_qualification_results WHERE applicant_id = ?', [app.id]);
        console.log(`  AQR rows: ${aqr.length}`);
        aqr.forEach(r => console.log(`    id=${r.id} criterion=${r.criterion_id} passed=${r.passed} reason="${r.criterion_reason || ''}"`));

        // 4. rsp_mqs_criteria
        const [mqs] = await db.query('SELECT * FROM rsp_mqs_criteria WHERE vacancy_id = ?', [app.vacancy_id]);
        console.log(`  rsp_mqs_criteria: ${mqs.length}`);
        if (mqs.length > 0) {
            const m = mqs[0];
            console.log(`    edu="${m.education}" training="${m.training}" exp="${m.experience}" elig="${m.eligibility}"`);
        }

        // 5. table_rows_override content
        if (app.table_rows_override) {
            const override = typeof app.table_rows_override === 'string' ? JSON.parse(app.table_rows_override) : app.table_rows_override;
            console.log(`  table_rows_override: ${JSON.stringify(override).substring(0, 300)}`);
        }

        // 6. PDS data
        const [pds] = await db.query('SELECT college, graduate_studies, work_experience, ld_training, civil_service_eligibility FROM personal_data_sheets WHERE user_id = (SELECT user_id FROM applications WHERE id = ? LIMIT 1) LIMIT 1', [app.id]);
        if (pds.length > 0) {
            const p = pds[0];
            console.log(`  PDS: college=${p.college ? 'YES' : 'NO'} grad=${p.graduate_studies ? 'YES' : 'NO'} work=${p.work_experience ? 'YES' : 'NO'} training=${p.ld_training ? 'YES' : 'NO'} elig=${p.civil_service_eligibility ? 'YES' : 'NO'}`);
        } else {
            console.log(`  PDS: NOT FOUND`);
        }
    }

    // 7. Check what logo files exist
    const fs = require('fs');
    const path = require('path');
    const assetsDir = path.join(__dirname, '../assets');
    console.log('\n=== LOGO FILES in server/assets/ ===');
    try {
        const files = fs.readdirSync(assetsDir);
        files.forEach(f => console.log(`  ${f}`));
    } catch (e) {
        console.log(`  Error: ${e.message}`);
    }

    // Also check public assets
    const pubDir = path.join(__dirname, '../../client/public/assets');
    console.log('\n=== LOGO FILES in client/public/assets/ ===');
    try {
        const files = fs.readdirSync(pubDir);
        files.forEach(f => console.log(`  ${f}`));
    } catch (e) {
        console.log(`  Error: ${e.message}`);
    }

    db.end();
}
check().catch(e => { console.error(e); process.exit(1); });
