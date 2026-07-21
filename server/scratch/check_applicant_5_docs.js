require('dotenv').config();
const db = require('../db');

async function main() {
    console.log('=== CHECKING APPLICANT 5 / APPLICATION 5 IN ALL DOCUMENT TABLES ===');
    
    // Check applications table for id = 5
    const [app] = await db.query('SELECT * FROM applications WHERE id = 5');
    console.log('Application ID 5:', app[0]);

    // Check appointment_documents for applicant_id = 5
    const [apptDocs] = await db.query('SELECT * FROM appointment_documents WHERE applicant_id = 5');
    console.log('\n--- appointment_documents (applicant_id = 5) ---');
    console.table(apptDocs);

    // Check application_documents for application_id = 5
    const [appDocs] = await db.query('SELECT * FROM application_documents WHERE application_id = 5');
    console.log('\n--- application_documents (application_id = 5) ---');
    console.table(appDocs);

    // Check if there are other applications for the same person/email
    if (app.length > 0) {
        const [otherApps] = await db.query('SELECT * FROM applications WHERE full_name = ? OR email = ?', [app[0].full_name, app[0].email]);
        console.log('\n--- All applications for this applicant ---');
        console.table(otherApps);

        for (const o of otherApps) {
            const [oAppt] = await db.query('SELECT * FROM appointment_documents WHERE applicant_id = ?', [o.id]);
            console.log(`\n--- appointment_documents for app ID ${o.id} (${o.full_name}) ---`);
            console.table(oAppt);

            const [oAppDocs] = await db.query('SELECT * FROM application_documents WHERE application_id = ?', [o.id]);
            console.log(`\n--- application_documents for app ID ${o.id} (${o.full_name}) ---`);
            console.table(oAppDocs);
        }
    }

    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
