// client/src/utils/pmReportGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateIPCRF_PDF = (employeeData) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const cy = employeeData.calendarYear || '2026';
    const cycle = employeeData.cycle || 'Midyear Review';
    const reviewDate = employeeData.reviewDate || '—';
    const name = employeeData.name || '—';
    const raterName = employeeData.raterName || '—';
    const position = employeeData.position || '—';
    const unit = employeeData.unit || '—';
    const rating = employeeData.rating || '—';
    const adjectival = employeeData.adjectival || '—';
    
    // --- OFFICIAL LETTERHEAD ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Republic of the Philippines', 105, 15, { align: 'center' });
    doc.text('Department of Education', 105, 20, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('REGION IX, ZAMBOANGA PENINSULA', 105, 25, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('SCHOOLS DIVISION OFFICE OF DAPITAN CITY', 105, 30, { align: 'center' });
    
    doc.line(20, 35, 190, 35);

    // --- FORM TITLE ---
    doc.setFontSize(11);
    doc.text('INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW FORM (IPCRF)', 105, 45, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Calendar Year: ${cy} | Cycle: ${cycle}`, 105, 50, { align: 'center' });

    // --- EMPLOYEE INFO TABLE ---
    const infoRows = [
        ['Name of Employee:', name, 'Name of Rater:', raterName],
        ['Position:', position, 'Position:', 'Schools Division Superintendent'],
        ['Division/Unit:', unit, 'Date of Review:', reviewDate]
    ];

    doc.autoTable({
        startY: 55,
        body: infoRows,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1 },
    });

    // --- RATING TABLE ---
    const kras = employeeData.kras || [];
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['MFO / KRA', 'Weight', 'Rating (1-5)', 'Score', 'Adjectival Rating']],
        body: kras.length > 0 ? kras.map(k => [
            k.title || '—', 
            k.weight || '—', 
            k.rating || '—', 
            k.rating && k.weight ? (parseFloat(k.rating) * (parseFloat(k.weight)/100)).toFixed(3) : '—',
            adjectival
        ]) : [['—', '—', '—', '—', '—']],
        styles: { fontSize: 8, halign: 'center' },
        headStyles: { fillColor: [30, 41, 59] },
    });

    // --- SUMMARY ---
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`FINAL WEIGHTED SCORE: ${rating}`, 20, finalY);
    doc.text(`ADJECTIVAL RATING: ${adjectival}`, 20, finalY + 5);

    // --- SIGNATURES ---
    const sigY = finalY + 25;
    doc.setFontSize(8);
    doc.text('__________________________', 30, sigY);
    doc.text(name.toUpperCase(), 30, sigY + 5);
    doc.text('Ratee', 30, sigY + 8);

    doc.text('__________________________', 130, sigY);
    doc.text(raterName.toUpperCase(), 130, sigY + 5);
    doc.text('Schools Division Superintendent (Rater)', 130, sigY + 8);

    // Save PDF
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`IPCRF_${cy}_${safeName}.pdf`);
};
