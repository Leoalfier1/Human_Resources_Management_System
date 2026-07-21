require('dotenv').config();
const db = require('../db');

async function main() {
    console.log('=== APPLICANT 5: application_documents ===');
    const [appDocs] = await db.query('SELECT id, document_type, file_name, file_path, verification_status FROM application_documents WHERE application_id = 5');
    console.table(appDocs);

    console.log('=== APPLICANT 5: appointment_documents ===');
    const [apptDocs] = await db.query('SELECT id, document_type, file_name, file_path, verification_status FROM appointment_documents WHERE applicant_id = 5');
    console.table(apptDocs);

    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
