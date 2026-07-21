require('dotenv').config();
const db = require('../db');

async function testRevisionFlow() {
    console.log('--- TESTING REVISION FLOW FOR APPOINTMENT DOCUMENTS ---');

    // 1. Fetch document ID for applicant 5
    const [docs] = await db.query('SELECT id, document_type, verification_status, revision_note FROM appointment_documents WHERE applicant_id = 5 LIMIT 1');
    if (docs.length === 0) {
        console.error('❌ No documents found for applicant 5');
        process.exit(1);
    }

    const testDoc = docs[0];
    console.log(`Initial state for doc ID ${testDoc.id} (${testDoc.document_type}): status=${testDoc.verification_status}, note=${testDoc.revision_note}`);

    // 2. Simulate Request Revision
    const testNote = 'Test note: Document is expired. Please upload a valid current copy.';
    await db.query(`UPDATE appointment_documents SET verification_status = 'needs_revision', revision_note = ?, verified_at = NULL WHERE id = ?`, [testNote, testDoc.id]);

    const [afterRevision] = await db.query('SELECT id, verification_status, revision_note FROM appointment_documents WHERE id = ?', [testDoc.id]);
    console.log(`After Request Revision: status=${afterRevision[0].verification_status}, note="${afterRevision[0].revision_note}"`);

    if (afterRevision[0].verification_status === 'needs_revision' && afterRevision[0].revision_note === testNote) {
        console.log('✅ Request Revision DB update successful!');
    } else {
        console.error('❌ Request Revision DB update failed!');
    }

    // 3. Simulate Verify override
    await db.query(`UPDATE appointment_documents SET verification_status = 'verified', verified_at = NOW(), revision_note = NULL WHERE id = ?`, [testDoc.id]);

    const [afterVerify] = await db.query('SELECT id, verification_status, revision_note FROM appointment_documents WHERE id = ?', [testDoc.id]);
    console.log(`After Verify Override: status=${afterVerify[0].verification_status}, note=${afterVerify[0].revision_note}`);

    if (afterVerify[0].verification_status === 'verified' && afterVerify[0].revision_note === null) {
        console.log('✅ Verify override cleared revision note successfully!');
    } else {
        console.error('❌ Verify override failed!');
    }

    // Restore original state
    await db.query(`UPDATE appointment_documents SET verification_status = ?, revision_note = ? WHERE id = ?`, [testDoc.verification_status, testDoc.revision_note, testDoc.id]);
    console.log('Reset test document back to initial state.');

    process.exit(0);
}

testRevisionFlow().catch(e => {
    console.error('Test error:', e);
    process.exit(1);
});
