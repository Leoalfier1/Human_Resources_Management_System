# Stage 1 Verification: RSP → Appointment → Employee

## Summary Matrix

| Check | Status | Description |
|-------|--------|-------------|
| **1.1 Trigger Identification** | ✅ PASS | Triggers correctly via `issueAppointment` in `appointmentController.js` |
| **1.2 Appointee Record Linkage** | ❌ FAIL | `issueAppointment` creates `appointments` row & updates `applications.status='appointed'`, but **does NOT write to `employees` table** |
| **1.3 Stub Record Generation** | ⚠️ WARN | `employees` row is only stub-created later when user visits personnel pages (`findOrCreateEmployee`), leaving `employee_no = NULL` |
| **1.4 Application Closeout** | ⚠️ WARN | Sets `applications.status = 'appointed'`, but `vacancies.status` remains `'active'` unless manually closed or slots filled |
| **1.5 Advice / Notice Binding** | ⚠️ WARN | Congratulatory Advice and Notice of Appointment run on separate independent endpoints rather than a single unified atomic pipeline |

---

## Detailed Code Trace

### A. Trigger & Request Path
- **UI Trigger**: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\AppointmentProcessing.jsx` (Issue Appointment button)
- **API Call**: `POST /api/rsp/appointment/issue` (defined in `c:\Users\HP\Desktop\HRMS\server\routes\rsp\appointment.js`)
- **Controller Action**: `issueAppointment` in `c:\Users\HP\Desktop\HRMS\server\controllers\rsp\appointmentController.js` (lines 35–100)

### B. What Actually Happens
1. `appointmentController.js:43-47`: Inserts row into `appointments` table (`applicant_id`, `vacancy_id`, `issued_by`, `issued_at`, `notice_posting_deadline`).
2. `appointmentController.js:49`: Updates `applications` table setting `status = 'appointed'` where `id = applicant_id`.
3. `appointmentController.js:52-58`: Checks `COUNT(*)` of appointed applicants. If count equals `no_of_vacancies`, updates `vacancies` setting `current_stage = 10`.
4. `appointmentController.js:60-65`: Inserts/updates `stage_history` for Stage 10 and updates `applications.current_stage = 10`.
5. `appointmentController.js:67-70`: Inserts in-app notification into `notifications` (`message = 'Your appointment has been officially issued.'`).
6. `appointmentController.js:81-88`: Emits Socket.IO events (`rsp:dashboard:update`, `notification:admin`, `application:stage-update`).

---

## Comparison Against Intended Flow

- **Intended**: Appointing a candidate should officially create an active `employees` record with assigned `employee_no`, update applicant role, populate core PDS fields, close out vacancy if slots filled, and emit notifications.
- **Actual**: `issueAppointment` only updates `appointments` and `applications` tables. It **does not create or link a record in `employees`**. The `employees` record is only stub-created later when the appointed user manually navigates to the Personnel portal via `findOrCreateEmployee(userId)` in `server/utils/employeeHelper.js:10-35`, where `employee_no` is left `NULL`.

---

## GAP List

1. **Missing Employee Creation at Appointment Issuance**: `issueAppointment` in `appointmentController.js:35-100` does not insert into `employees` or set an `employee_no`, leaving the appointee out of `v_appointed_employees` until manual HR onboarding.
2. **Missing Email Notification on Appointment**: `issueAppointment` emits a Socket.IO event and inserts an in-app `notifications` row, but does not send an email via Resend API (`mailer.js`).
3. **Vacancy Status Remains Active**: `vacancies.status` remains `'active'` even when `current_stage` reaches 10 or 11, requiring manual closure.
