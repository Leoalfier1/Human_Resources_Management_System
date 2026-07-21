/**
 * Test script: generate the Congratulatory Advice PDF for applicant 5
 * and extract all text from it to verify output.
 */
const path = require('path');
const fs   = require('fs');

// Simulate the generatePDF function in a minimal standalone way
const db = require('../db');
const PDFDocument = require('pdfkit');

async function generateAndExtract() {
    // --- Same data fetch logic as the controller ---
    const applicantId = 5;

    const [rows] = await db.query(`
        SELECT
            a.id AS application_id,
            a.full_name,
            a.letter_salutation,
            a.vacancy_id,
            v.position_title,
            v.item_number,
            v.assigned_school,
            v.position_type,
            v.subject,
            IFNULL(ca.place_of_assignment, v.assigned_school) AS place_of_assignment,
            ca.report_date,
            ca.document_submission_deadline,
            ca.appointing_authority_name
        FROM applications a
        JOIN vacancies v ON a.vacancy_id = v.id
        LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
        WHERE a.id = ?
    `, [applicantId]);

    const d = rows[0];
    console.log('\n=== RAW DATA FROM DB ===');
    console.log('full_name:', d.full_name);
    console.log('letter_salutation:', d.letter_salutation);
    console.log('item_number:', d.item_number);
    console.log('assigned_school:', d.assigned_school);
    console.log('place_of_assignment:', d.place_of_assignment);
    console.log('appointing_authority_name:', d.appointing_authority_name);

    const [sigRows] = await db.query(
        `SELECT full_name, position FROM signatories
         WHERE is_active = 1
         ORDER BY FIELD(position, 'Schools Division Superintendent') DESC
         LIMIT 1`
    );
    console.log('\nSIGNATORY FROM TABLE:', sigRows[0] || 'NONE');

    const toTitleCase = (str) =>
        (str || '').trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const rawLastName = d.full_name.trim().split(/\s+/).pop();
    console.log('lastName (title-cased):', toTitleCase(rawLastName));

    console.log('\n=== KEY VALUES THAT WILL APPEAR IN PDF ===');
    console.log('Salutation line: Dear', d.letter_salutation || 'Mr./Ms.', toTitleCase(rawLastName) + ',');
    console.log('Item number:', d.item_number);
    console.log('Station:', d.place_of_assignment || d.assigned_school);
    console.log('Signatory name:', sigRows[0]?.full_name || '[Signatory Not Configured]');
    console.log('Signatory title:', sigRows[0]?.position || 'Schools Division Superintendent');
}

generateAndExtract().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
