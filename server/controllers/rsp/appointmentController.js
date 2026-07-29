const db = require('../../db');
const syncApplicationsStage = require('../../utils/syncApplicationsStage');
const { sendAppointmentConfirmationEmail } = require('../../utils/mailer');

// ── 1. GET APPOINTEE QUEUE ─────────────────────────────────────────
const getProcessingAppointees = async (req, res) => {
    try {
        const { vacancy_id } = req.query;
        if (!vacancy_id) {
            return res.status(400).json({ message: 'vacancy_id is required' });
        }

        const [rows] = await db.query(`
            SELECT
                a.id, a.full_name, a.applicant_id,
                v.position_title, v.item_number,
                RANK() OVER (ORDER BY IFNULL(r.total_score, 0) DESC) AS rank_val,
                ca.report_date
            FROM applications a
            JOIN vacancies v ON a.vacancy_id = v.id
            LEFT JOIN comparative_assessment_results r ON a.id = r.applicant_id
            LEFT JOIN congratulatory_advices ca ON ca.applicant_id = a.id
            WHERE a.vacancy_id = ?
              AND a.status IN ('selected', 'appointed')
            ORDER BY rank_val ASC
        `, [vacancy_id]);

        res.json(rows);
    } catch (error) {
        console.error('getProcessingAppointees Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── 2. ISSUE APPOINTMENT ──────────────────────────────────────────────────────
// Full transactional pipeline:
//   appointments INSERT  →  applications UPDATE (status+stage)
//   → employees UPSERT + employee_no generation via insertId
//   → service_records INSERT
//   → leave_credits INSERT (if new employee)
//   → vacancies stage/status UPDATE
//   → stage_history  →  notifications  →  activity_log
//   → socket.io broadcast  →  appointment confirmation email (fire-and-forget)
// ──────────────────────────────────────────────────────────────────────────────
const issueAppointment = async (req, res) => {
    // Guard: applicant_id here is applications.id (FK naming in appointments table)
    const { applicant_id, vacancy_id } = req.body;
    if (!applicant_id || !vacancy_id) {
        return res.status(400).json({ message: 'applicant_id and vacancy_id are required.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // ── IDEMPOTENCY CHECK ─────────────────────────────────────────────────
        // Prevent double-issuing the same appointment
        const [[existingAppt]] = await connection.query(
            'SELECT id FROM appointments WHERE applicant_id = ? AND vacancy_id = ?',
            [applicant_id, vacancy_id]
        );
        if (existingAppt) {
            await connection.rollback();
            connection.release();
            return res.status(409).json({ message: 'Appointment already issued for this applicant and vacancy.' });
        }

        // ── FETCH SUPPORTING DATA ─────────────────────────────────────────────
        // applications row (applicant_id col in `applications` = user_id FK to users)
        const [[app]] = await connection.query(
            `SELECT a.id, a.applicant_id AS user_id, a.full_name, a.email, a.phone
             FROM applications a
             WHERE a.id = ?`,
            [applicant_id]
        );
        if (!app) throw new Error(`Application row not found: id=${applicant_id}`);

        const userId = app.user_id;  // this is users.id

        // vacancy details
        const [[vac]] = await connection.query(
            `SELECT id, position_title, item_number, salary_grade, monthly_salary,
                    assigned_school, school_office_id, position_type, no_of_vacancies
             FROM vacancies WHERE id = ?`,
            [vacancy_id]
        );
        if (!vac) throw new Error(`Vacancy not found: id=${vacancy_id}`);

        // PDS data (LEFT JOIN — may be NULL if not yet submitted)
        const [[pds]] = await connection.query(
            `SELECT surname, first_name, middle_name, name_extension,
                    date_of_birth, place_of_birth, sex, civil_status, blood_type,
                    gsis_id_no, pagibig_id_no, philhealth_no, tin_no,
                    mobile_no, email_address,
                    CONCAT_WS(', ',
                        NULLIF(res_house_block_lot,''),
                        NULLIF(res_street,''),
                        NULLIF(res_barangay,''),
                        NULLIF(res_city_municipality,''),
                        NULLIF(res_province,'')
                    ) AS full_address
             FROM personal_data_sheets
             WHERE user_id = ?`,
            [userId]
        );

        // users fallback for name / contact
        const [[usr]] = await connection.query(
            'SELECT full_name, email, mobile FROM users WHERE id = ?',
            [userId]
        );

        // ── NAME RESOLUTION ───────────────────────────────────────────────────
        // Prefer PDS fields; fall back to splitting users.full_name
        let firstName, middleName, lastName, nameExtension;
        if (pds && pds.first_name) {
            firstName     = pds.first_name  || null;
            middleName    = pds.middle_name  || null;
            lastName      = pds.surname      || null;
            nameExtension = pds.name_extension || null;
        } else {
            const parts = (usr.full_name || '').trim().split(/\s+/);
            firstName     = parts[0] || null;
            lastName      = parts.length > 1 ? parts[parts.length - 1] : firstName;
            middleName    = parts.length > 2 ? parts.slice(1, -1).join(' ') : null;
            nameExtension = null;
        }

        // Appointee's email for confirmation — prefer PDS > application > users
        const appointeeEmail = (pds && pds.email_address) || app.email || usr.email || null;
        const appointeeName  = app.full_name || usr.full_name;

        // ── STEP 1: INSERT APPOINTMENT ROW ────────────────────────────────────
        const postingDeadline = new Date();
        postingDeadline.setDate(postingDeadline.getDate() + 15);

        const [apptResult] = await connection.query(
            `INSERT INTO appointments
               (applicant_id, vacancy_id, salary_grade, monthly_salary, issued_by, issued_at, notice_posting_deadline)
             VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
            [applicant_id, vacancy_id, vac.salary_grade, vac.monthly_salary, req.user.id, postingDeadline]
        );

        // ── STEP 2: UPDATE APPLICATION STATUS & STAGE ─────────────────────────
        await connection.query(
            `UPDATE applications SET status = 'appointed', current_stage = 10 WHERE id = ?`,
            [applicant_id]
        );

        // ── STEP 3: UPSERT EMPLOYEES ROW ──────────────────────────────────────
        // If a stub row already exists (created by findOrCreateEmployee),
        // UPDATE it in-place. Otherwise INSERT a fresh row. Then set employee_no
        // using insertId (or existing id) to generate EMP-YYYY-XXXX.
        const [[existingEmp]] = await connection.query(
            'SELECT id, employee_no FROM employees WHERE user_id = ?',
            [userId]
        );

        let employeeId;
        let isNewEmployee = false;

        if (existingEmp) {
            // Stub or existing row — patch with full appointment data
            employeeId = existingEmp.id;
            await connection.query(
                `UPDATE employees SET
                    first_name              = ?,
                    middle_name             = ?,
                    last_name               = ?,
                    name_extension          = ?,
                    date_of_birth           = ?,
                    place_of_birth          = ?,
                    sex                     = ?,
                    civil_status            = ?,
                    blood_type              = ?,
                    gsis_id                 = ?,
                    pagibig_id              = ?,
                    philhealth_no           = ?,
                    tin_no                  = ?,
                    mobile_no               = ?,
                    email                   = ?,
                    address                 = ?,
                    employment_type         = ?,
                    position_title          = ?,
                    salary_grade            = ?,
                    monthly_salary          = ?,
                    item_number             = ?,
                    assigned_school         = ?,
                    school_office_id        = ?,
                    date_hired              = COALESCE(date_hired, CURDATE()),
                    date_original_appointment = COALESCE(date_original_appointment, CURDATE()),
                    is_active               = 1,
                    job_status              = 'active'
                WHERE id = ?`,
                [
                    firstName, middleName, lastName, nameExtension,
                    (pds && pds.date_of_birth)    || null,
                    (pds && pds.place_of_birth)   || null,
                    (pds && pds.sex)               || null,
                    (pds && pds.civil_status)      || null,
                    (pds && pds.blood_type)        || null,
                    (pds && pds.gsis_id_no)        || null,
                    (pds && pds.pagibig_id_no)     || null,
                    (pds && pds.philhealth_no)     || null,
                    (pds && pds.tin_no)            || null,
                    (pds && pds.mobile_no)         || usr.mobile || null,
                    appointeeEmail,
                    (pds && pds.full_address)      || null,
                    vac.position_type,
                    vac.position_title,
                    String(vac.salary_grade || ''),
                    vac.monthly_salary || null,
                    vac.item_number    || null,
                    vac.assigned_school || null,
                    vac.school_office_id || null,
                    employeeId
                ]
            );
            // If this stub never had an employee_no, generate one now
            if (!existingEmp.employee_no) {
                const year       = new Date().getFullYear();
                const employeeNo = `EMP-${year}-${String(employeeId).padStart(4, '0')}`;
                await connection.query(
                    'UPDATE employees SET employee_no = ? WHERE id = ?',
                    [employeeNo, employeeId]
                );
            }
        } else {
            // No employee row at all — INSERT, get insertId, then set employee_no
            isNewEmployee = true;
            const [empResult] = await connection.query(
                `INSERT INTO employees
                   (user_id, first_name, middle_name, last_name, name_extension,
                    date_of_birth, place_of_birth, sex, civil_status, blood_type,
                    gsis_id, pagibig_id, philhealth_no, tin_no,
                    mobile_no, email, address,
                    employment_status, employment_type,
                    position_title, salary_grade, monthly_salary,
                    item_number, assigned_school, school_office_id,
                    date_hired, date_original_appointment, is_active, job_status)
                 VALUES
                   (?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?,
                    'permanent', ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    CURDATE(), CURDATE(), 1, 'active')`,
                [
                    userId,
                    firstName, middleName, lastName, nameExtension,
                    (pds && pds.date_of_birth)    || null,
                    (pds && pds.place_of_birth)   || null,
                    (pds && pds.sex)               || null,
                    (pds && pds.civil_status)      || null,
                    (pds && pds.blood_type)        || null,
                    (pds && pds.gsis_id_no)        || null,
                    (pds && pds.pagibig_id_no)     || null,
                    (pds && pds.philhealth_no)     || null,
                    (pds && pds.tin_no)            || null,
                    (pds && pds.mobile_no)         || usr.mobile || null,
                    appointeeEmail,
                    (pds && pds.full_address)      || null,
                    vac.position_type,
                    vac.position_title,
                    String(vac.salary_grade || ''),
                    vac.monthly_salary || null,
                    vac.item_number    || null,
                    vac.assigned_school || null,
                    vac.school_office_id || null
                ]
            );

            employeeId = empResult.insertId;

            // Generate employee_no from insertId: EMP-YYYY-XXXX
            const year       = new Date().getFullYear();
            const employeeNo = `EMP-${year}-${String(employeeId).padStart(4, '0')}`;
            await connection.query(
                'UPDATE employees SET employee_no = ? WHERE id = ?',
                [employeeNo, employeeId]
            );
        }

        // ── STEP 4: SEED LEAVE CREDITS (new employees only) ──────────────────
        if (isNewEmployee) {
            await connection.query(
                `INSERT IGNORE INTO leave_credits
                   (employee_id, sick_leave_balance, vacation_leave_balance,
                    forced_leave_balance, special_privilege_balance, as_of_date)
                 VALUES (?, 15, 15, 5, 3, CURDATE())`,
                [employeeId]
            );
        }

        // ── STEP 5: INSERT SERVICE RECORD ─────────────────────────────────────
        await connection.query(
            `INSERT INTO service_records
               (employee_id, user_id, date_from, date_to,
                designation, employment_status, monthly_salary,
                station_office, branch, lv_abs_without_pay, separation_date_cause)
             VALUES (?, ?, CURDATE(), NULL, ?, 'Permanent', ?, ?, 'DepEd', 'NONE', NULL)`,
            [
                employeeId,
                userId,
                vac.position_title,
                vac.monthly_salary || null,
                vac.assigned_school || null
            ]
        );

        // ── STEP 6: VACANCY STAGE / STATUS UPDATE ─────────────────────────────
        const [[countRow]] = await connection.query(
            'SELECT COUNT(*) AS cnt FROM applications WHERE vacancy_id = ? AND status = "appointed"',
            [vacancy_id]
        );
        if (countRow.cnt >= vac.no_of_vacancies) {
            await connection.query(
                'UPDATE vacancies SET current_stage = 10, status = "closed" WHERE id = ?',
                [vacancy_id]
            );
            await syncApplicationsStage(vacancy_id, 10, req.app.get('socketio'));
        }

        // ── STEP 7: STAGE HISTORY ─────────────────────────────────────────────
        await connection.query(
            `INSERT INTO stage_history (application_id, stage_number, status, completed_at)
             VALUES (?, 10, 'completed', NOW())
             ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
            [applicant_id]
        );

        // ── STEP 8: NOTIFICATIONS ─────────────────────────────────────────────
        await connection.query(
            'INSERT INTO notifications (application_id, message) VALUES (?, ?)',
            [applicant_id, 'Your appointment has been officially issued.']
        );

        // ── STEP 9: ACTIVITY LOG ──────────────────────────────────────────────
        await connection.query(
            'INSERT INTO activity_log (vacancy_id, applicant_id, actor_id, action_description) VALUES (?, ?, ?, ?)',
            [vacancy_id, applicant_id, req.user.id, `Appointment issued for ${vac.position_title}`]
        );

        // ── COMMIT ────────────────────────────────────────────────────────────
        await connection.commit();
        connection.release();

        // ── POST-COMMIT: SOCKET.IO BROADCAST ─────────────────────────────────
        const io = req.app.get('socketio');
        if (io) {
            io.emit('rsp:dashboard:update');
            io.emit('notification:admin', {
                message: `Appointment issued to ${appointeeName} for ${vac.position_title}`,
                type: 'rsp'
            });
            io.to(`application-${applicant_id}`).emit('application:stage-update', {
                applicationId: applicant_id, status: 'appointed'
            });
        }

        // ── POST-COMMIT: APPOINTMENT CONFIRMATION EMAIL (fire-and-forget) ─────
        // Re-read the generated employee_no after commit for accurate value
        db.query('SELECT employee_no FROM employees WHERE id = ?', [employeeId])
            .then(([[empRow]]) => {
                const generatedEmpNo = empRow ? empRow.employee_no : 'N/A';
                if (appointeeEmail) {
                    sendAppointmentConfirmationEmail(
                        appointeeEmail,
                        appointeeName,
                        vac.position_title,
                        vac.assigned_school || 'SDO Dapitan City',
                        generatedEmpNo
                    ).then(result => {
                        if (result) console.log(`✅ Appointment email sent → ${appointeeEmail} (${generatedEmpNo})`);
                    });
                }
            })
            .catch(err => console.error('⚠️ Post-commit email lookup failed:', err.message));

        return res.status(201).json({
            message: 'Appointment issued successfully.',
            appointmentId: apptResult.insertId,
            employeeId,
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('issueAppointment Error:', error);
        return res.status(500).json({ message: 'Server error during issuance. Transaction rolled back.' });
    }
};

module.exports = {
    getProcessingAppointees,
    issueAppointment
};
