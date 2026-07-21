require('dotenv').config();
const db = require('../db');

const DOC_KEYWORD_GROUPS = [
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

const matchApplicationDoc = (apptDocType, applicationDocs) => {
    const lower = apptDocType.toLowerCase();
    for (const kwSet of DOC_KEYWORD_GROUPS) {
        if (kwSet.some(k => lower.includes(k))) {
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

    const hasNullFilePaths = docs.some(d => !d.file_path);
    let applicationDocs = [];
    if (hasNullFilePaths) {
        const [appDocs] = await db.query(
            `SELECT document_type, file_name, file_path, verification_status
             FROM application_documents
             WHERE application_id = ? AND file_path IS NOT NULL
             ORDER BY id DESC`,
            [applicantId]
        );
        applicationDocs = appDocs;
    }

    const enrichedDocs = docs.map(doc => {
        if (doc.file_path) return doc;
        const matched = matchApplicationDoc(doc.document_type, applicationDocs);
        if (!matched) return doc;
        return {
            ...doc,
            file_path: matched.file_path,
            file_name: matched.file_name || doc.file_name,
            verification_status: doc.verification_status === 'not_uploaded'
                ? (matched.verification_status === 'verified' ? 'verified' : 'uploaded_pending_review')
                : doc.verification_status,
            _source: 'application_documents'
        };
    });

    console.log('=== FINAL ENDPOINT RESPONSE: documents with file_path status ===\n');
    enrichedDocs.forEach(d => {
        const fileStatus = d.file_path ? `✅ HAS FILE: ${d.file_path}` : '❌ NO FILE';
        const viewEnabled = d.file_path ? '👁  VIEW ENABLED' : '🚫 VIEW DISABLED';
        console.log(`[${d.verification_status.toUpperCase()}] ${d.document_type}`);
        console.log(`  ${fileStatus}`);
        console.log(`  ${viewEnabled}`);
        if (d._source) console.log(`  📎 sourced from: ${d._source}`);
        console.log('');
    });

    const stats = {
        total:    enrichedDocs.length,
        verified: enrichedDocs.filter(d => d.verification_status === 'verified').length,
        uploaded: enrichedDocs.filter(d => d.verification_status === 'uploaded_pending_review').length,
        pending:  enrichedDocs.filter(d => d.verification_status === 'not_uploaded').length,
        revision: enrichedDocs.filter(d => d.verification_status === 'needs_revision').length
    };
    console.log('=== STATS ===');
    console.log(stats);

    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
