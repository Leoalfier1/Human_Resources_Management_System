const db = require('../../db');

const LEGAL_BASIS = "This appointment is made pursuant to Section 9, Article B of the Civil Service Rules on Personnel Actions, and in accordance with DepEd Order No. 007, s. 2015 and relevant PRIME-HRM guidelines.";

// Helper: working days between two dates
const getWorkingDaysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    let count = 0;
    let cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
};

// ─────────────────────────────────────────────────────────────
// GET /api/rsp/notice-of-appointment/vacancy/:vacancyId
// Returns all appointed applicants for a vacancy (for selector)
// ─────────────────────────────────────────────────────────────
const getAppointedList = async (req, res) => {
    try {
        const { vacancyId } = req.params;

        const [rows] = await db.query(`
            SELECT 
                a.id, a.full_name, a.ref_no,
                ap.id AS appointment_id, ap.issued_at
            FROM applications a
            JOIN appointments ap ON ap.applicant_id = a.id
            WHERE a.vacancy_id = ?
              AND a.status IN ('selected', 'appointed')
            ORDER BY ap.issued_at DESC
        `, [vacancyId]);

        res.json(rows);
    } catch (error) {
        console.error('getAppointedList Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/rsp/notice-of-appointment/:applicantId
// Full notice details for one applicant
// ─────────────────────────────────────────────────────────────
const getNoticeDetails = async (req, res) => {
    try {
        const { applicantId } = req.params;

        const [rows] = await db.query(`
            SELECT
                a.id AS applicant_id,
                a.full_name,
                a.ref_no,
                a.submitted_at AS qualified_at,
                v.id            AS vacancy_id,
                v.ref_no        AS vacancy_ref,
                v.position_title,
                v.item_number,
                v.salary_grade,
                v.assigned_school,
                v.posting_date,
                v.deadline_date,
                v.assessment_submitted_at,
                v.shortlist_endorsed_at,
                ap.id           AS appointment_id,
                ap.monthly_salary,
                ap.nature_of_appointment,
                ap.issued_at,
                ap.notice_posting_deadline,
                ca.report_date,
                ca.appointing_authority_name,
                ca.place_of_assignment
            FROM applications a
            JOIN vacancies v  ON a.vacancy_id   = v.id
            JOIN appointments ap ON ap.applicant_id = a.id
            LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
            WHERE a.id = ?
            ORDER BY ap.issued_at DESC
            LIMIT 1
        `, [applicantId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Notice data not found. Make sure an appointment has been issued for this applicant.' });
        }

        const d = rows[0];

        // Deadline tracking (15-day posting window)
        const issued   = new Date(d.issued_at);
        const today    = new Date();
        const deadline = d.notice_posting_deadline
            ? new Date(d.notice_posting_deadline)
            : new Date(issued.getTime() + 15 * 24 * 60 * 60 * 1000);

        const daysElapsed   = Math.floor((today - issued) / (1000 * 60 * 60 * 24));
        const percentElapsed = Math.min(Math.round((daysElapsed / 15) * 100), 100);

        // Postings log
        const [postings] = await db.query(
            'SELECT channel, posted_at FROM appointment_notice_postings WHERE appointment_id = ?',
            [d.appointment_id]
        );

        // Total TAT (working days from vacancy posting to appointment issue)
        const totalTAT = getWorkingDaysBetween(d.posting_date, d.issued_at);

        const sgLabel = d.salary_grade ? `SG-${d.salary_grade}` : '—';

        const monthlySalaryLabel = d.monthly_salary
            ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
                  .format(d.monthly_salary) + '/month'
            : 'Per Salary Standardization Law';

        res.json({
            notice: {
                appointment_id:  d.appointment_id,
                applicant_id:    d.applicant_id,
                vacancy_id:      d.vacancy_id,
                fullName:        d.full_name.toUpperCase(),
                positionTitle:   d.position_title,
                itemNumber:      d.item_number || '—',
                salaryGrade:     sgLabel,
                monthlySalary:   monthlySalaryLabel,
                station:         d.place_of_assignment || d.assigned_school,
                nature:          d.nature_of_appointment || 'Original Appointment',
                effectivityDate: d.report_date,
                legalBasis:      LEGAL_BASIS,
                signatory:       d.appointing_authority_name || 'Schools Division Superintendent',
                issuedAt:        d.issued_at
            },
            tracker: {
                issuedAt:       d.issued_at,
                deadline:       deadline.toISOString(),
                daysElapsed,
                percentElapsed,
                isOverdue:      daysElapsed > 15
            },
            postings,
            timeline: [
                { label: 'Vacancy Posted',      date: d.posting_date },
                { label: 'Applications Closed', date: d.deadline_date },
                { label: 'Initial Eval',        date: d.qualified_at },
                { label: 'CA Assessment',       date: d.assessment_submitted_at },
                { label: 'Deliberation',        date: d.shortlist_endorsed_at },
                { label: 'Appointment Issued',  date: d.issued_at }
            ],
            totalTAT
        });
    } catch (error) {
        console.error('getNoticeDetails Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/rsp/notice-of-appointment/:appointmentId/post
// Log which channels the notice was published to
// ─────────────────────────────────────────────────────────────
const postNotice = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { channels } = req.body;

        if (!channels || channels.length === 0) {
            return res.status(400).json({ message: 'Select at least one channel.' });
        }

        // Avoid duplicate postings for the same channel
        const [existing] = await db.query(
            'SELECT channel FROM appointment_notice_postings WHERE appointment_id = ?',
            [appointmentId]
        );
        const alreadyPosted = existing.map(r => r.channel);
        const newChannels   = channels.filter(ch => !alreadyPosted.includes(ch));

        if (newChannels.length === 0) {
            return res.status(400).json({ message: 'All selected channels have already been posted.' });
        }

        const insertData = newChannels.map(ch => [appointmentId, ch, req.user.id]);
        await db.query(
            'INSERT INTO appointment_notice_postings (appointment_id, channel, posted_by) VALUES ?',
            [insertData]
        );

        // Advance vacancy to Stage 11 complete
        await db.query(`
            UPDATE vacancies v
            JOIN appointments ap ON ap.vacancy_id = v.id
            SET v.current_stage = GREATEST(v.current_stage, 11)
            WHERE ap.id = ?
        `, [appointmentId]);

        // Activity log
        await db.query(`
            INSERT INTO activity_log (vacancy_id, actor_id, action_description)
            SELECT ap.vacancy_id, ?, CONCAT('Notice of Appointment posted to: ', ?)
            FROM appointments ap WHERE ap.id = ?
        `, [req.user.id, newChannels.join(', '), appointmentId]);

        const io = req.app.get('socketio');
        if (io) io.emit('rsp:dashboard:update');

        res.json({ message: `Notice posted to: ${newChannels.join(', ')}` });
    } catch (error) {
        console.error('postNotice Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/rsp/notice-of-appointment/:applicantId/pdf
// Stream a PDF of the Notice of Appointment
// ─────────────────────────────────────────────────────────────
const generatePDF = async (req, res) => {
    try {
        const { applicantId } = req.params;

        const [rows] = await db.query(`
            SELECT
                a.full_name, v.position_title, v.item_number, v.salary_grade,
                v.assigned_school, ap.issued_at, ap.nature_of_appointment,
                ap.monthly_salary, ca.report_date, ca.appointing_authority_name,
                ca.place_of_assignment
            FROM applications a
            JOIN vacancies v      ON a.vacancy_id     = v.id
            JOIN appointments ap  ON ap.applicant_id  = a.id
            LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
            WHERE a.id = ?
            LIMIT 1
        `, [applicantId]);

        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        const d = rows[0];

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 72, size: 'LETTER' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="Notice_of_Appointment_${d.full_name.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        // ── Letterhead ──
        doc.fontSize(10).font('Helvetica').text('Republic of the Philippines', { align: 'center' });
        doc.text('Department of Education', { align: 'center' });
        doc.text('Region IX – Zamboanga Peninsula', { align: 'center' });
        doc.font('Helvetica-Bold').text('Schools Division Office of Dapitan City', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).lineWidth(2).stroke('#1B3A6B');
        doc.moveDown(1.5);

        // ── Title ──
        doc.fontSize(16).font('Helvetica-Bold')
           .text('NOTICE OF APPOINTMENT', { align: 'center', underline: true });
        doc.moveDown(1.5);

        // ── Content Table ──
        const rows2 = [
            ['Name',            d.full_name.toUpperCase()],
            ['Position Title',  d.position_title],
            ['Item Number',     d.item_number || '—'],
            ['Salary Grade',    d.salary_grade ? `SG-${d.salary_grade}` : '—'],
            ['Station',         d.place_of_assignment || d.assigned_school],
            ['Nature',          d.nature_of_appointment || 'Original Appointment'],
            ['Effectivity Date', d.report_date
                ? new Date(d.report_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : '—'],
        ];

        doc.fontSize(11).font('Helvetica');
        rows2.forEach(([label, val]) => {
            doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
               .font('Helvetica').text(val || '—');
        });

        doc.moveDown(1.5);

        // ── Legal Basis ──
        doc.font('Helvetica').fontSize(10)
           .text(`"${LEGAL_BASIS}"`, { align: 'justify', oblique: true });

        doc.moveDown(3);

        // ── Signatories ──
        const sigY = doc.y;
        const leftX  = 72;
        const rightX = doc.page.width / 2 + 36;

        doc.font('Helvetica-Bold').fontSize(11)
           .text(d.appointing_authority_name || 'Schools Division Superintendent', leftX, sigY);
        doc.font('Helvetica').fontSize(9)
           .text('Schools Division Superintendent', leftX);
        doc.text(`Date: ${new Date(d.issued_at).toLocaleDateString()}`, leftX);

        doc.font('Helvetica-Bold').fontSize(11)
           .text(d.full_name.toUpperCase(), rightX, sigY);
        doc.font('Helvetica').fontSize(9)
           .text("Appointee's Signature", rightX);
        doc.text('Date: ___________________', rightX);

        doc.end();
    } catch (error) {
        console.error('generatePDF Error:', error);
        res.status(500).json({ message: 'Could not generate PDF.' });
    }
};

module.exports = { getAppointedList, getNoticeDetails, postNotice, generatePDF };