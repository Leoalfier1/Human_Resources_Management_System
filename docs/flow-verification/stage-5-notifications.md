# Stage 5 Verification: Notifications & Email Integration

## Summary Matrix

| Check | Status | Description |
|-------|--------|-------------|
| **5.1 Account Verification Email** | ✅ PASS | Sends email via Resend API (`sendVerificationEmail` in `server/utils/mailer.js`) with position type links |
| **5.2 Password Reset Email** | ✅ PASS | Sends password reset link via Resend API (`sendResetPasswordEmail`) |
| **5.3 Initial Evaluation (Annex E) Email** | ✅ PASS | Sends PDF advice attachment via Resend API (`sendAnnexEEmail` in `annexEController.js`) |
| **5.4 Appointment Issuance Email** | ❌ FAIL | `issueAppointment` inserts in-app notification & emits Socket.IO event, but **does NOT fire an email** |
| **5.5 In-App Notifications DB** | ✅ PASS | Writes to `notifications` (RSP), `personnel_notifications` (Personnel), `pm_notifications` (PM), `ld_notifications` (L&D) |
| **5.6 Real-Time Socket.IO Updates** | ✅ PASS | Emits Socket.IO room events (`application-${id}`, `ld-user-${id}`, `notification:admin`) |

---

## Detailed Code Trace

### A. Resend Email Utility (`server/utils/mailer.js`)
- `sendVerificationEmail(email, token)`: Sends HTML email via `resend.emails.send` with 3 verification links (`teaching`, `non_teaching`, `teaching_related`).
- `sendResetPasswordEmail(email, token)`: Sends reset password link.
- `sendAnnexEEmail(email, applicantName, positionTitle, letterType, pdfBuffer, applicationCode)`: Attaches generated Annex E PDF to qualification outcome email.

### B. In-App Notification Tables Across Modules
1. **RSP**: Inserts into `notifications` table (`application_id`, `message`, `is_read`, `created_at`). Emits `application:notification` & `application:stage-update` via Socket.IO.
2. **Personnel**: Inserts into `personnel_notifications` table (`employee_id`, `type`, `reference_id`, `message`, `is_read`). Emits `personnel:notification:update`.
3. **L&D**: Inserts into `ld_notifications` table (`user_id`, `message`, `type`, `link`). Emits `ld:notification:admin` & `ld:proposal:updated`.
4. **PM**: Inserts into `pm_notifications` table (`user_id`, `message`, `type`).
5. **R&R**: Inserts into `rr_announcement_notifications_log` table upon publishing award announcement.

---

## Comparison Against Intended Flow

- **Intended**: Every major milestone transition (Registration, Stage 3 Evaluation, Congratulatory Selection, Appointment Issuance, Leave Approval, R&R Award Announcement) should trigger both an in-app notification AND an official email notification via Resend API.
- **Actual**:
  - Email notification via Resend API is **only implemented for 3 actions**: Registration Verification, Password Reset, and Stage 3 Annex E Evaluation.
  - Appointment Issuance (Stage 11), Congratulatory Advice (Stage 9), Leave Approvals, PM Period Openings, and R&R Award Announcements write to in-app notification tables and Socket.IO, but **do NOT trigger email delivery**.

---

## GAP List

1. **Missing Email Delivery on Appointment Issuance**: `issueAppointment` in `appointmentController.js` does not call `mailer.js` to email the appointee their official appointment confirmation.
2. **Missing Email Delivery on Congratulatory Advice**: `saveAndGenerate` in `adviceController.js` saves the selection letter and creates an in-app notification, but does not send an email via Resend API.
3. **Missing Email Delivery for Personnel Leave Approvals**: `leaveController.js` updates `leave_applications` and inserts into `personnel_notifications`, but does not notify the employee by email.
