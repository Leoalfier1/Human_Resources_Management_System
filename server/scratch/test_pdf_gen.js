/**
 * Standalone PDF generation + text extraction test.
 * Simulates the controller generatePDF for applicant 5 and extracts text.
 */
const path = require('path');
const fs   = require('fs');
const db   = require('../db');
const PDFDocument = require('pdfkit');

const getRequiredDocs = (positionType = 'teaching') => {
    const common = [
        "Original/Authenticated Transcript of Records",
        "Updated Personal Data Sheet (CS Form 212)",
        "NBI Clearance (issued within 6 months)",
        "Medical Certificate (from government hospital)",
        "Dental Certificate",
        "4 pcs. Passport-size ID photos (white background)",
        "Marriage Certificate (for married female)",
        "Authenticated Service Record",
        "Certificate of No Pending Administrative Case"
    ];
    if (positionType === 'non_teaching' || positionType === 'teaching_related') {
        return [common[0], "Original/Authenticated Diploma (relevant degree)", ...common.slice(1, 9), "CSC Eligibility / Professional Civil Service Eligibility"];
    }
    return [common[0], "Original/Authenticated BSEd/BEEd Diploma", ...common.slice(1, 10)];
};

const toTitleCase = (str) =>
    (str || '').trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

async function main() {
    const applicantId = 5;

    const [rows] = await db.query(`
        SELECT a.id AS application_id, a.full_name, a.letter_salutation, a.vacancy_id,
               v.position_title, v.item_number, v.assigned_school, v.position_type, v.subject,
               IFNULL(ca.place_of_assignment, v.assigned_school) AS place_of_assignment,
               ca.report_date, ca.document_submission_deadline, ca.appointing_authority_name
        FROM applications a
        JOIN vacancies v ON a.vacancy_id = v.id
        LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
        WHERE a.id = ?
    `, [applicantId]);

    const d = rows[0];

    const defaultReportDate = (() => { const x = new Date(); x.setMonth(x.getMonth()+1); x.setDate(1); return x; })();
    const defaultDeadline   = (() => { const x = new Date(); x.setDate(x.getDate()+7); return x; })();
    const effectiveDate = d.report_date
        ? new Date(d.report_date).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
        : defaultReportDate.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
    const deadlineDate = d.document_submission_deadline
        ? new Date(d.document_submission_deadline).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
        : defaultDeadline.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });

    const [apptDocs] = await db.query(`SELECT document_type FROM appointment_documents WHERE applicant_id = ? ORDER BY id`, [d.application_id]);
    const pdfDocs = apptDocs.length > 0 ? apptDocs.map(r => r.document_type) : getRequiredDocs(d.position_type || 'teaching');

    const [sigRows] = await db.query(
        `SELECT full_name, position FROM signatories WHERE is_active = 1
         ORDER BY FIELD(position, 'Schools Division Superintendent') DESC LIMIT 1`
    );
    const signatoryName  = sigRows.length > 0 ? sigRows[0].full_name : '[Signatory Not Configured]';
    const signatoryTitle = sigRows.length > 0 ? sigRows[0].position  : 'Schools Division Superintendent';

    const outPath = path.join(__dirname, '../scratch/test_output.pdf');
    const doc = new PDFDocument({ margin: 72, size: 'LETTER' });
    const ws  = fs.createWriteStream(outPath);
    doc.pipe(ws);

    const L  = 72;
    const R  = doc.page.width - 72;
    const W  = R - L;
    const SI = 'Times-Italic';
    const SB = 'Times-Bold';
    const S  = 'Times-Roman';

    const sealPath = path.join(__dirname, '../assets/deped-seal.png');
    if (fs.existsSync(sealPath)) {
        const sealW = 80;
        doc.image(sealPath, (doc.page.width - sealW)/2, doc.y || 72, { width: sealW });
        doc.y = (doc.y || 72) + sealW + 4;
    }

    doc.fillColor('#000000');
    doc.font(SI).fontSize(12).text('Republic of the Philippines', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.1);
    doc.font(SB).fontSize(16).text('Department of Education', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.1);
    doc.font(S).fontSize(10).text('REGION IX, ZAMBOANGA PENINSULA', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.05);
    doc.font(SB).fontSize(10.5).text('SCHOOLS DIVISION OF DAPITAN CITY', L, doc.y, { width: W, align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(L, doc.y).lineTo(R, doc.y).lineWidth(1.5).stroke('#1B3A6B');
    doc.moveDown(1.5);

    doc.font(S).fontSize(11).text(
        new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }),
        L, doc.y, { width: W, align: 'right' }
    );
    doc.moveDown(1.5);

    doc.font(SB).fontSize(12).text(d.full_name.trim().toUpperCase(), L, doc.y, { width: W });
    doc.font(S).fontSize(11).text(d.place_of_assignment || d.assigned_school, L, doc.y, { width: W });
    doc.moveDown(1.5);

    const salutation  = d.letter_salutation || 'Mr./Ms.';
    const lastName    = toTitleCase(d.full_name.trim().split(/\s+/).pop());
    doc.font(S).fontSize(11).text(`Dear ${salutation} ${lastName},`, L, doc.y, { width: W });
    doc.moveDown();

    const subjectPart = d.subject ? ` (${d.subject})` : '';
    const itemNoPart  = d.item_number ? ` under Item No. ${d.item_number}` : '';
    const stationPart = d.place_of_assignment || d.assigned_school || '[Station TBD]';
    const datePart    = d.report_date ? effectiveDate : '[To Be Determined]';

    doc.font(SB).fontSize(11).text('Congratulations! ', L, doc.y, { width: W, continued: true })
       .font(S).text(`It is with great pleasure that I inform you of your selection for appointment to the position of ${d.position_title}${subjectPart}${itemNoPart} at ${stationPart}, effective ${datePart}.`, { align: 'justify' });

    doc.moveDown(0.8);
    doc.font(S).fontSize(11).text(`You are hereby required to report to your assigned station on the said date. Please submit the following documents to the Human Resource Management Division on or before ${deadlineDate}:`, L, doc.y, { width: W, align: 'justify' });
    doc.moveDown(0.5);

    doc.font(SI).fontSize(9).text('This appointment is made pursuant to Section 9, Article X of the Civil Service Rules on Personnel Actions, and is in accordance with DepEd Order No. 007, s. 2023 and relevant PRIME-HRM guidelines.', L, doc.y, { width: W, align: 'justify' });
    doc.moveDown(0.5);

    const colW   = (W - 20) / 2;
    const col1X  = L;
    const col2X  = L + colW + 20;
    const midIdx = Math.ceil(pdfDocs.length / 2);
    const col1   = pdfDocs.slice(0, midIdx);
    const col2   = pdfDocs.slice(midIdx);

    doc.font(S).fontSize(9);
    const rowCount   = Math.max(col1.length, col2.length);
    const rowHeights = [];
    for (let i = 0; i < rowCount; i++) {
        const h1 = col1[i] ? doc.heightOfString(`${i+1}. ${col1[i]}`, { width: colW }) : 0;
        const h2 = col2[i] ? doc.heightOfString(`${midIdx+i+1}. ${col2[i]}`, { width: colW }) : 0;
        rowHeights.push(Math.max(h1, h2) + 2);
    }

    let rowY = doc.y;
    for (let i = 0; i < rowCount; i++) {
        if (col1[i]) doc.text(`${i+1}. ${col1[i]}`, col1X, rowY, { width: colW });
        if (col2[i]) doc.text(`${midIdx+i+1}. ${col2[i]}`, col2X, rowY, { width: colW });
        rowY += rowHeights[i];
    }
    doc.y = rowY;

    doc.moveDown(0.8);
    doc.font(S).fontSize(11).text('Failure to submit the required documents within the prescribed period may result in the withdrawal of this advice. Please acknowledge receipt of this letter by signing below.', L, doc.y, { width: W, align: 'justify' });
    doc.moveDown(0.8);
    doc.font(SB).fontSize(11).text('Congratulations once again!', L, doc.y, { width: W });
    doc.moveDown(1);

    const sigY  = doc.y;
    doc.font(SB).fontSize(11).text(signatoryName.toUpperCase(), L, sigY, { width: 240 });
    doc.font(S).fontSize(9).text(signatoryTitle, L, doc.y, { width: 240 });

    const rightX = R - 200;
    const ackY   = sigY + 20;
    doc.moveTo(rightX, ackY+25).lineTo(rightX+200, ackY+25).lineWidth(0.5).stroke('#333333');
    doc.font(S).fontSize(9).text("Appointee's Signature over Printed Name", rightX, ackY+28, { width: 200, align: 'center' });

    const footerY = doc.y + 20;
    doc.moveTo(L, footerY).lineTo(R, footerY).lineWidth(0.5).stroke('#CCCCCC');
    doc.font(S).fontSize(8).fillColor('#888888')
       .text(`This is a system-generated document. Digitally attested via PRIME-HRM on ${new Date().toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}.`, L, footerY+5, { align:'center', width: W });

    console.log('Final doc.y before end:', Math.round(doc.y));
    console.log('Page height:', doc.page.height, '| Margin bottom:', 72);
    console.log('Overflow?', doc.y > doc.page.height - 72 ? 'YES - OVERFLOWS' : 'NO - Fits on one page');

    doc.end();

    await new Promise(resolve => ws.on('finish', resolve));
    console.log('\n✅ PDF written to:', outPath);
    console.log('   File size:', fs.statSync(outPath).size, 'bytes');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
