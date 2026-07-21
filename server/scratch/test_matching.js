require('dotenv').config();
const db = require('../db');

function matchDocType(apptType, appDocs) {
    const apptLower = apptType.toLowerCase();
    
    // Key keyword sets
    const keywords = [
        ['transcript', 'tor'],
        ['personal data sheet', 'cs form 212', 'pds'],
        ['diploma'],
        ['nbi clearance', 'nbi'],
        ['medical certificate', 'medical'],
        ['dental certificate', 'dental'],
        ['marriage certificate', 'marriage contract'],
        ['service record'],
        ['csc eligibility', 'eligibility'],
        ['no pending', 'omnibus sworn statement', 'csc mc 10']
    ];

    for (const kwSet of keywords) {
        if (kwSet.some(k => apptLower.includes(k))) {
            // Find appDoc matching any keyword in kwSet
            const found = appDocs.find(d => 
                d.file_path && d.verification_status !== 'superseded' &&
                kwSet.some(k => d.document_type.toLowerCase().includes(k))
            );
            if (found) return found;
        }
    }
    return null;
}

async function main() {
    const applicantId = 5;
    const [appDocs] = await db.query('SELECT * FROM application_documents WHERE application_id = ? AND file_path IS NOT NULL ORDER BY id DESC', [applicantId]);
    const [apptDocs] = await db.query('SELECT * FROM appointment_documents WHERE applicant_id = ? ORDER BY id ASC', [applicantId]);

    console.log('=== MATCHING RESULTS FOR APPLICANT 5 ===\n');

    const combined = apptDocs.map(doc => {
        let filePath = doc.file_path;
        let fileName = doc.file_name;
        let status = doc.verification_status;
        let source = 'appointment_documents';

        if (!filePath) {
            const matchedAppDoc = matchDocType(doc.document_type, appDocs);
            if (matchedAppDoc) {
                filePath = matchedAppDoc.file_path;
                fileName = matchedAppDoc.file_name;
                source = `application_documents (id: ${matchedAppDoc.id})`;
                // If status in appointment_documents is not_uploaded, should status also inherit uploaded/verified or stay?
                if (status === 'not_uploaded') {
                    status = matchedAppDoc.verification_status === 'verified' ? 'verified' : 'uploaded_pending_review';
                }
            }
        }

        return {
            id: doc.id,
            document_type: doc.document_type,
            status,
            file_name: fileName,
            file_path: filePath,
            source
        };
    });

    console.table(combined);
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
