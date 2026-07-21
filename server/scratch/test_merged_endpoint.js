require('dotenv').config();
const db = require('../db');

const matchApplicationDoc = (apptType, applicationDocs) => {
    const apptLower = apptType.toLowerCase();
    
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
            const found = applicationDocs.find(d => 
                d.file_path && d.verification_status !== 'superseded' &&
                kwSet.some(k => d.document_type.toLowerCase().includes(k))
            );
            if (found) return found;
        }
    }
    return null;
};

async function main() {
    const applicantId = 5;

    const [docs] = await db.query(
        'SELECT * FROM appointment_documents WHERE applicant_id = ? ORDER BY id ASC',
        [applicantId]
    );

    const [appDocs] = await db.query(
        'SELECT * FROM application_documents WHERE application_id = ? AND file_path IS NOT NULL ORDER BY id DESC',
        [applicantId]
    );

    const mergedDocs = docs.map(doc => {
        if (!doc.file_path) {
            const matched = matchApplicationDoc(doc.document_type, appDocs);
            if (matched) {
                return {
                    ...doc,
                    file_path: matched.file_path,
                    file_name: matched.file_name || doc.file_name,
                    verification_status: doc.verification_status === 'not_uploaded'
                        ? (matched.verification_status === 'verified' ? 'verified' : 'uploaded_pending_review')
                        : doc.verification_status
                };
            }
        }
        return doc;
    });

    const stats = {
        total:    mergedDocs.length,
        verified: mergedDocs.filter(d => d.verification_status === 'verified').length,
        uploaded: mergedDocs.filter(d => d.verification_status === 'uploaded_pending_review').length,
        pending:  mergedDocs.filter(d => d.verification_status === 'not_uploaded').length,
        revision: mergedDocs.filter(d => d.verification_status === 'needs_revision').length
    };

    console.log('=== MERGED API RESPONSE payload ===');
    console.log(JSON.stringify({ documents: mergedDocs, stats }, null, 2));

    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
