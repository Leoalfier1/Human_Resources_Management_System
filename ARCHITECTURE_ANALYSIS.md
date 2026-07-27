# HRMS — Comprehensive Architecture & Feature Analysis

## 1. OVERVIEW

**Project**: DepEd SDO Dapitan City Human Resource Management Information System (HRMIS)
**Stack**: React 19 (Vite) + Express 5 + MySQL 8 (Laragon) + Socket.IO
**Ports**: Frontend `:5173`, Backend `:5000`, Database `:3306`
**Auth**: JWT (localStorage) with role-based portal separation

---

## 2. DIRECTORY STRUCTURE

```
HRMS/
├── client/                          # React SPA (Vite + Tailwind v4)
│   ├── .env                         # VITE_API_BASE_URL=http://localhost:5000/api
│   ├── src/
│   │   ├── main.jsx                 # Entry point, wraps App in AuthProvider
│   │   ├── App.jsx                  # Router: auth, pillars, RSP (admin), applicant routes
│   │   ├── context/AuthContext.jsx  # Global auth state (user, token, role checks)
│   │   ├── utils/api.js             # apiFetch helper (uses VITE_API_BASE_URL)
│   │   ├── hooks/                   # 8 custom hooks (RSP dashboard, CA, evaluation, etc.)
│   │   ├── pages/
│   │   │   ├── applicant/           # JobOpenings, JobDetail, ApplicationWizard, etc.
│   │   │   └── personnel/           # PersonalDataSheetForm
│   │   └── components/
│   │       ├── auth/                # Login, SignUp, ForgotPassword, VerifyEmail
│   │       ├── applicant/           # Portal layout, wizard steps, PDS gate, job card
│   │       ├── dashboard/           # PillarsLandingPage, ModuleCard, DashboardLayout
│   │       └── rsp/                 # 10 admin modules (sidebar, header, modules)
│   ├── package.json                 # React 19, react-router-dom v7, framer-motion, socket.io-client
│   └── vite.config.js               # React + Tailwind v4 plugins
│
├── server/                          # Express REST API
│   ├── .env                         # DB creds, JWT_SECRET, EMAIL creds, BASE_URL
│   ├── index.js                     # Express app bootstrap, routes, Socket.IO, health check
│   ├── db.js                        # MySQL2 connection pool
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification middleware (legacy)
│   │   ├── authMiddleware.js        # verifyToken + requireRole(...roles)
│   │   └── uploadMiddleware.js      # Multer config for division memo PDF uploads
│   ├── utils/
│   │   ├── mailer.js                # Nodemailer: verification + password reset emails
│   │   └── dateUtils.js             # Working days elapsed calculator
│   ├── routes/
│   │   ├── auth.js                  # Register, login, verify-email, forgot/reset password
│   │   ├── branding.js              # GET /api/branding/settings
│   │   ├── applicant/
│   │   │   ├── vacancies.js         # Public vacancy listing + single vacancy
│   │   │   ├── applications.js      # Apply wizard CRUD + documents + advice + appointment
│   │   │   └── pds.js               # Personal Data Sheet CRUD + submit
│   │   └── rsp/                     # 10 admin modules
│   │       ├── dashboard.js         # Consolidated dashboard data
│   │       ├── vacancies.js         # Admin CRUD for vacancies
│   │       ├── applicants.js        # Applicant list, summary, export, status update
│   │       ├── evaluation.js        # Initial evaluation queue + document verification
│   │       ├── comparative-assessment.js  # CA rubric, scores, rankings, submit
│   │       ├── results.js           # Results preview + publish
│   │       ├── deliberation.js      # BI notes, recommendation, endorse shortlist
│   │       ├── advice.js            # Congratulatory advice save + PDF
│   │       ├── appointment.js       # Document checklist + verify + issue appointment
│   │       └── notice.js            # Notice of appointment details + post + PDF
│   └── controllers/                 # Mirror route structure with business logic
│       ├── vacancyController.js     # (legacy/unused duplicate)
│       ├── applicationController.js # (legacy/unused duplicate)
│       ├── applicant/               # 4 controllers
│       └── rsp/                     # 9 controllers
│
├── database.sql                     # Full DB dump with schema + test data
└── .git/
```

---

## 3. DATABASE SCHEMA (deped_hrmis — 20 tables)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | All users (applicant, staff, admin) | PK for actor/applicant refs |
| `vacancies` | Job postings with 11-stage workflow | FK → users (created_by) |
| `applications` | Applicant-vacancy join with status | FK → users, vacancies |
| `applicants` | Legacy/duplicate (not actively used) | FK → vacancies |
| `application_documents` | Uploaded requirement files | FK → applications |
| `applicant_documents` | (Not actively used) | FK → applicants |
| `minimum_qualifications_checklist` | MQ criteria per vacancy | FK → vacancies |
| `applicant_qualification_results` | Pass/fail per criterion per applicant | FK → applications, mq_checklist |
| `comparative_assessment_criteria` | CA rubric (3 categories, ~17 sub-criteria) | FK → vacancies |
| `comparative_assessment_scores` | Individual criterion scores | FK → applications, ca_criteria |
| `comparative_assessment_results` | Computed totals + subscores | FK → applications |
| `assessment_scores` | Legacy (classroom/non-classroom/document scores) | FK → applications |
| `stage_history` | Per-applicant stage tracking (stages 1-11) | FK → applications |
| `congratulatory_advices` | Selection letters | FK → applications, vacancies, users |
| `appointments` | Official appointment records | FK → applications, vacancies, users |
| `appointment_documents` | 10 required docs for appointment processing | FK → applications |
| `appointment_required_documents` | Reference list of required doc types | Standalone |
| `appointment_notice_postings` | Publishing channels (website/FB/bulletin) | FK → appointments, users |
| `results_postings` | CA results publishing log | FK → vacancies, users |
| `deliberation_notes` | Background investigation notes + recommendations | FK → applications, users |
| `notifications` | Applicant-facing messages | FK → applications |
| `activity_log` | Audit trail for all actions | FK → vacancies, applications, users |
| `settings` | Office branding (name, region, contact) | Singleton row |
| `schools` | School reference list | Referenced by vacancies |
| `duties_responsibilities` | Per-vacancy duty list | FK → vacancies |
| `qualification_standards` | Per-vacancy qualification list | FK → vacancies |
| `vacancy_required_documents` | Per-vacancy required document checklist | FK → vacancies |

**Key Observation**: `applicants` table and `applicant_documents` table exist in schema but the code uses `applications` + `application_documents` instead. These are dead tables.

---

## 4. THE 11-STAGE RSP WORKFLOW

The entire system is organized around a Recruitment, Selection, and Placement (RSP) 11-stage workflow:

| Stage | Name | Trigger | Data |
|-------|------|---------|------|
| 1 | Publication | Admin creates vacancy | Vacancy record |
| 2 | Submission | Applicant submits application | Application + documents |
| 3 | Initial Evaluation | HR evaluates MQ documents | qualification_results |
| 4 | Validation | (Skipped in digital workflow) | — |
| 5 | Posting Qual List | Finalize initial eval | (Status update) |
| 6 | Comparative Assessment | HRMPSB scores rubric | CA scores + results |
| 7 | Post CA Results | Publish results | results_postings |
| 8 | Deliberation | HRMPSB reviews top 5 | deliberation_notes |
| 9 | Selection | Issue congratulatory advice | congratulatory_advices |
| 10 | Doc Submission | Appointee uploads 10 required docs | appointment_documents |
| 11 | Issue Appointment | Issue + post notice of appointment | appointments + notice_postings |

---

## 5. REQUEST FLOW (End-to-End Example)

### Applicant Applies for a Job

```
Browser                          React SPA (:5173)           Express API (:5000)            MySQL
  │                                    │                            │                         │
  │  Click "Apply" on JobDetail        │                            │                         │
  │ ─────────────────────────────────► │                            │                         │
  │                                    │                            │                         │
  │                                    │  PDS Gate Check            │                         │
  │                                    │  GET /api/applicant/pds/status                       │
  │                                    │ ────────────────────────►  │                         │
  │                                    │                            │  SELECT FROM             │
  │                                    │                            │  personal_data_sheets    │
  │                                    │                            │ ───────────────────────► │
  │                                    │                            │ ◄─────────────────────── │
  │                                    │ ◄────────────────────────  │                         │
  │                                    │                            │                         │
  │                                    │  Wizard Step 1: POST /api/applications               │
  │                                    │  {vacancy_id, full_name, ...}                         │
  │                                    │ ────────────────────────►  │                         │
  │                                    │                            │  INSERT INTO             │
  │                                    │                            │  applications (draft)    │
  │                                    │                            │ ───────────────────────► │
  │                                    │ ◄────────────────────────  │                         │
  │                                    │                            │                         │
  │                                    │  Wizard Step 2: POST /api/applications/:id/documents   │
  │                                    │  (multipart: file + document_type)                    │
  │                                    │ ────────────────────────►  │                         │
  │                                    │                            │  Multer saves file       │
  │                                    │                            │  INSERT INTO             │
  │                                    │                            │  application_documents   │
  │                                    │                            │ ───────────────────────► │
  │                                    │ ◄────────────────────────  │                         │
  │                                    │                            │                         │
  │                                    │  Wizard Step 4: PATCH /api/applications/:id            │
  │                                    │  {status: "submitted"}                                │
  │                                    │ ────────────────────────►  │                         │
  │                                    │                            │  UPDATE applications     │
  │                                    │                            │  SET status='submitted'  │
  │                                    │                            │  + ref_no auto-gen       │
  │                                    │                            │ ───────────────────────► │
  │                                    │                            │                         │
  │                                    │                            │  INSERT INTO             │
  │                                    │                            │  activity_log            │
  │                                    │                            │  INSERT INTO             │
  │                                    │                            │  notifications           │
  │                                    │                            │  io.emit(...)            │
  │                                    │                            │                         │
  │                                    │ ◄────────────────────────  │  {message, ref_no}       │
  │                                    │                            │                         │
  │  Show success + ref_no             │                            │                         │
  │ ◄───────────────────────────────── │                            │                         │
```

### Admin Evaluates (Full Admin Flow)

```
Admin clicks "Initial Evaluation" → GET /api/rsp/evaluation/queue?vacancy_id=X
  → Controller joins applications + documents counts
  → HR verifies documents: PATCH /api/rsp/evaluation/document/:docId/verify
  → HR marks pass/fail per criterion: PATCH /api/rsp/evaluation/applicant/:id/criterion/:criterionId
  → HR submits decision: POST /api/rsp/evaluation/applicant/:id/decision {qualified/disqualified}
  → HR finalizes: POST /api/rsp/evaluation/finalize → advances vacancy to Stage 5

Admin clicks "Comparative Assessment" → loads rubric + qualified applicants
  → HRMPSB scores each criterion: PUT /api/rsp/comparative-assessment/score
  → caController.updateScore → upserts score → recalculates weighted totals → updates results table
  → Socket.IO broadcasts real-time ranking update
  → HRMPSB submits: POST /api/rsp/comparative-assessment/submit → Stage 7

Admin clicks "Results Posting" → preview + publish
  → POST /api/rsp/results/publish → creates results_postings → notifies all applicants
  → Advances to Stage 8

Admin clicks "Deliberation" → reviews top-5 ranked
  → Updates BI notes: PUT /api/rsp/deliberation/notes
  → Toggles recommend: PUT /api/rsp/deliberation/recommend
  → Endorses to SDS: POST /api/rsp/deliberation/endorse → Stage 9

Admin clicks "Congratulatory Advice" → generates letter → issues appointment
  → POST /api/rsp/congratulatory-advice → creates advice + updates status to 'selected'
  → Stage 9-10

Admin clicks "Appointment Processing" → verifies 10 required docs
  → Issues appointment: POST /api/rsp/appointment/issue → Stage 11

Admin clicks "Notice of Appointment" → posts to channels (website, FB, bulletin board)
  → POST /api/rsp/notice-of-appointment/:id/post
```

---

## 6. API ENDPOINTS COMPLETE MAP

### Public / Mixed Auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/health | Health check (DB ping) |
| GET | /api/branding/settings | Office settings (public) |
| GET | /api/vacancies | List vacancies (optional auth for filtering) |
| GET | /api/vacancies/:id | Single vacancy detail |
| GET | /api/vacancies/settings | Office settings for public |
| GET | /api/vacancies/:id/has-applied | Check if user already applied |

### Auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Register new applicant |
| POST | /api/auth/login | Login (with portal type check) |
| GET | /api/auth/verify-email | Email verification + applicant type selection |
| POST | /api/auth/forgot-password | Send reset email |
| GET | /api/auth/reset-password-page | Serve HTML reset form |
| POST | /api/auth/update-password | Save new password |

### Applicant (all require JWT + `applicant` role)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/applicant/pds/status | Check PDS completeness |
| GET | /api/applicant/pds | Get full PDS |
| PATCH | /api/applicant/pds | Save PDS draft |
| POST | /api/applicant/pds/submit | Lock PDS |
| GET | /api/applications/my-latest | Get latest application |
| POST | /api/applications | Create draft |
| PATCH | /api/applications/:id | Update/submit application |
| GET | /api/applications/:id | Get application with documents |
| GET | /api/applications/:id/status | Status + stages + scores + notifications |
| POST | /api/applications/:id/documents | Upload document |
| DELETE | /api/applications/:id/documents/:docId | Delete document |
| GET | /api/applications/:id/advice | Get congratulatory advice |
| GET | /api/applications/:id/advice/pdf | Download advice PDF |
| POST | /api/applications/:id/appointment-documents | Upload appointment doc |
| GET | /api/applications/:id/appointment | Get appointment details |
| GET | /api/applications/:id/appointment/pdf | Download appointment PDF |

### Admin RSP (all require JWT + role check)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/rsp/dashboard/consolidated | Dashboard stats, active postings, TAT, activity |
| GET/POST | /api/rsp/vacancies | List / Create vacancies |
| GET | /api/rsp/vacancies/:id | Single vacancy |
| PATCH | /api/rsp/vacancies/:id | Update vacancy |
| PATCH | /api/rsp/vacancies/:id/advance | Advance to next stage |
| DELETE | /api/rsp/vacancies/:id | Delete vacancy |
| GET | /api/rsp/applicants | List with search, filter, pagination |
| GET | /api/rsp/applicants/summary | Status counts |
| GET | /api/rsp/applicants/export | CSV export |
| PATCH | /api/rsp/applicants/:id/status | Manual status change |
| GET | /api/rsp/evaluation/queue | Evaluation queue per vacancy |
| GET | /api/rsp/evaluation/applicant/:id | Applicant details + docs + criteria |
| PATCH | /api/rsp/evaluation/document/:docId/verify | Verify document |
| PATCH | /api/rsp/evaluation/applicant/:id/criterion/:criterionId | Update pass/fail |
| POST | /api/rsp/evaluation/applicant/:id/decision | Qualify/disqualify |
| POST | /api/rsp/evaluation/finalize | Finalize stage 3 → 5 |
| GET | /api/rsp/comparative-assessment/criteria | Get rubric |
| GET | /api/rsp/comparative-assessment/rankings | Get ranked list |
| GET | /api/rsp/comparative-assessment/scores | Get individual scores |
| PUT | /api/rsp/comparative-assessment/score | Update score (real-time) |
| POST | /api/rsp/comparative-assessment/submit | Finalize assessment |
| POST | /api/rsp/comparative-assessment/reset | Clear scores |
| GET | /api/rsp/results/preview | Preview results before publishing |
| POST | /api/rsp/results/publish | Publish results |
| GET | /api/rsp/deliberation/ranked-list | Top 5 ranked list |
| PUT | /api/rsp/deliberation/notes | Save BI notes |
| PUT | /api/rsp/deliberation/recommend | Toggle recommend |
| POST | /api/rsp/deliberation/endorse | Endorse shortlist to SDS |
| GET | /api/rsp/congratulatory-advice/eligible-appointees | Eligible applicants |
| GET | /api/rsp/congratulatory-advice/:id | Advice detail |
| POST | /api/rsp/congratulatory-advice | Save and generate advice |
| GET | /api/rsp/congratulatory-advice/:id/pdf | Download advice PDF |
| GET | /api/rsp/appointment/processing | Appointment processing list |
| GET | /api/rsp/appointment/documents/:applicantId | Document checklist |
| PATCH | /api/rsp/appointment/documents/:id/verify | Verify document |
| POST | /api/rsp/appointment/documents/:id/upload | Upload document (HR side) |
| POST | /api/rsp/appointment/issue | Issue appointment |
| GET | /api/rsp/notice-of-appointment/vacancy/:vacancyId | List appointees |
| GET | /api/rsp/notice-of-appointment/:applicantId | Notice details |
| POST | /api/rsp/notice-of-appointment/:appointmentId/post | Post to channels |
| GET | /api/rsp/notice-of-appointment/:applicantId/pdf | Download notice PDF |

---

## 7. FEATURES IMPLEMENTED (Complete)

### Authentication & User Management
- [x] Applicant registration with email verification (with applicant type selection: teaching/non-teaching)
- [x] Login with portal separation (Staff/Admin vs Applicant)
- [x] JWT-based authentication with localStorage persistence
- [x] Role-based access (applicant, admin, hr_staff, hrmpsb, appointing_authority)
- [x] Forgot / reset password via email link
- [x] Protected routes with redirect logic

### Applicant Portal
- [x] Job vacancy listing with search/filter (by school, closing soon, position type)
- [x] Single vacancy detail view (qualifications, duties, required docs)
- [x] PDS (Personal Data Sheet) — full CS Form 212 with 40+ fields
- [x] PDS completeness gate (must complete before applying)
- [x] Application wizard (Step 1: Personal info → Step 2: Document upload → Step 3: Review → Step 4: Confirm)
- [x] Document upload/delete per application
- [x] Auto-generated reference number (APP-XXX-YYYY)
- [x] Application status tracker with 11-stage timeline
- [x] CA score display with rank
- [x] Notifications panel
- [x] Congratulatory advice letter view + PDF download
- [x] Appointment document upload (10 required docs)
- [x] Appointment notice view + PDF download
- [x] Real-time socket notifications (stage updates, score updates)

### Admin RSP Module (11-Stage Workflow)
- [x] **Dashboard**: Consolidated stats, TAT tracking, deadline monitoring, activity log, vacancy progress tracker
- [x] **Vacancy Posting**: Create with auto ref-no, division memo upload, publishing channels, auto deadline (+10 days)
- [x] **Applicant Management**: List with search/filter/pagination, status summary, CSV export, manual status update
- [x] **Initial Evaluation**: Queue per vacancy, document verification, MQ criterion pass/fail, qualify/disqualify, auto-notifications, finalize
- [x] **Comparative Assessment**: Auto-seeded DepEd rubric (3 categories, 17 criteria), weighted scoring, real-time ranking, recalculated subscores, reset scores, submit to SDS
- [x] **Results Posting**: Preview ranked results with org letterhead, publish to channels, auto-notify all applicants
- [x] **Deliberation & Shortlist**: Top-5 ranked list, background investigation notes, recommend toggle, endorse to SDS with notifications
- [x] **Congratulatory Advice**: Select eligible appointees, configure report date/station, generate letter + PDF, auto-update status to 'selected'
- [x] **Appointment Processing**: 10-document checklist with upload/verify, completeness ring, issue appointment (gated on all docs verified), auto-advance vacancy when slots filled
- [x] **Notice of Appointment**: Full notice details with timeline, TAT calculator, publish to channels (website/Facebook/bulletin), prevent duplicate postings, PDF generation

### Cross-Cutting
- [x] Real-time Socket.IO (dashboard refresh, applicant notifications, score updates)
- [x] Activity log (audit trail for all major actions)
- [x] Stage history per applicant (tracks completion of each stage)
- [x] PDF generation (Congratulatory Advice + Notice of Appointment using PDFKit)
- [x] File uploads (Multer: division memos, application docs, appointment docs)
- [x] Email notifications via Nodemailer (Gmail SMTP)
- [x] Working days calculation (TAT tracking)

---

## 8. CRITICAL ISSUES & BUGS

### 🔴 HIGH PRIORITY

1. **Hardcoded API URLs in all hooks** (`http://localhost:5000`) — The `.env` file defines `VITE_API_BASE_URL=http://localhost:5000/api`, and `api.js` uses it, but every single hook file (`useRSPDashboard.js`, `useComparativeAssessment.js`, `useInitialEvaluation.js`, `useDeliberation.js`, `useCongratulatoryAdvice.js`, `useResultsPosting.js`, `useNoticeOfAppointment.js`, `usePersonalDataSheet.js`) and the `LoginForm.jsx` hardcode `http://localhost:5000` directly. The `apiFetch` utility is never used. This means changing the API URL requires editing 9+ files.

2. **`createVacancy` in `vacancyController.js` (server/controllers/) references `filePath` instead of `finalFilePath`** (line 104): The variable `filePath` is used but the actual variable defined is `finalFilePath`. This will cause a `ReferenceError` when creating a vacancy with a division memo upload.

3. **`req.user.name` and `req.user.email` undefined in `createOrGetDraft`** (`applicationController.js` line 43): The JWT payload only contains `{ id, role }` (set in `auth.js` line 110), but the code tries to read `req.user.name` and `req.user.email`. This will insert `undefined` into the `full_name` and `email` columns.

4. **Duplicate controller files cause confusion**: `server/controllers/vacancyController.js` and `server/controllers/applicationController.js` exist at the top level but are never imported by any route. The actual routes use the controllers under `applicant/` and `rsp/` subdirectories. These are dead code.

5. **Route file inconsistency**: `server/routes/rsp/comparative-assessment.js` reimports controllers and middleware inline (effectively duplicating what's in `server/controllers/rsp/comparative-assessment.js`). The `controllers/rsp/comparative-assessment.js` file is actually a **route file** that was placed in the wrong directory, and `routes/rsp/comparative-assessment.js` also exists as another route file. Only one is actually used (`routes/rsp/`).

6. **`getScores` query has wrong column**: `caController.js` line 201 queries `comparative_assessment_scores` with `applicant_id` but the schema (and the `updateScore` function) clearly show this column references the `applications.id` (aliased as `applicant_id`). The `getScores` endpoint works for this case but the column name ambiguity is confusing.

7. **Activity log duplicates**: The seed data shows entries 2-10 as exact duplicates ("Comparative Assessment finalized and submitted to SDS."), suggesting the frontend submits the `submitAssessment` action multiple times or there's no debounce protection.

8. **No rate limiting or input validation**: The `/api/auth/register` endpoint has no rate limiting. An attacker could spam registrations. Password complexity rules are absent.

### 🟡 MEDIUM PRIORITY

9. **`applicant_type` column missing from `users` table** — The `verify-email` endpoint tries to `UPDATE users SET applicant_type = ?`, but the `users` table schema (SQL lines 560-571) does not include an `applicant_type` column. This ALTER TABLE statement was never added to the SQL dump.

10. **`personal_data_sheets` table missing from SQL dump** — The full PDS system references this table, but it's not in the provided `database.sql`. This would cause a 1146 error on first PDS access.

11. **Backend has no `npm start` script** — `package.json` only has `"test"` script. There's no `"start"` or `"dev"` script. The developer presumably runs `node index.js` or `nodemon index.js` manually.

12. **`nodemon.json` references `uploads/*` ignore pattern** but all file paths use different upload directories (`uploads/division-memos/`, `uploads/applications/`, `uploads/rsp/appointment-docs/`). This is fine but worth noting for restart behavior.

13. **`updateApplication` in applicant's `applicationController.js` line 107**: The auto-generated ref_no uses `String(id).padStart(3, '0')` but the placeholder value `${String(id).padStart(3, '0')}` would produce numbers like `001`, `002`. The seeded data shows `APP-001-2026` and `APP-002-2026`, which happens to match. But the `id` is the auto-increment primary key of `applications`, which could theoretically differ from a sequential 3-digit number if gaps exist.

14. **Socket.IO room naming inconsistency**: Some controllers emit to `application-${id}` (with lowercase 'application'), while the client-side hook joins `join-application-room`. These must match for real-time features to work.

### 🟢 LOW PRIORITY

15. **Typos**: `databse.sql` (should be `database.sql`)
16. **`school_abbreviation` field mapped from `current_school`** in applicant controller — this is just a display field, not a bug.
17. **Mixed `require` and inline imports**: `routes/applicant/vacancies.js` does `const jwt = require('jsonwebtoken')` inside the `optionalAuth` middleware function instead of at the top of the file.
18. **No error handling for missing `.env`**: `dotenv` is required but if `.env` is missing, `JWT_SECRET` would be undefined.

---

## 9. MISSING FEATURES / INCOMPLETE MODULES

1. **No "Summary" or "Export" page on applicant side** for their own data
2. **No admin user creation/signup** — Only the database seed has admin accounts. No UI for creating staff/admin accounts.
3. **No profile management** — Users cannot update their profile (name, email, password) after registration.
4. **No dashboard for the `staff` role** — The `staffRoles` array includes `'staff'`, but the UI labels and sidebar only reference specific role labels.
5. **No multi-vacancy support for a single applicant** — `getLatestApplication` returns only the most recent application.
6. **No withdrawal/cancellation** — Applicants cannot withdraw their application once submitted.
7. **No interview scheduling** — The RSP workflow mentions "Behavioral Event Interview" in the rubric but there's no scheduling, calendar, or interview management module.
8. **No appeal mechanism** — Disqualified applicants have no formal appeal process.
9. **No data archiving** — No mechanism to archive or purge old vacancies/applications after the fiscal year.
10. **No bulk operations** — Admin cannot bulk-qualify, bulk-disqualify, or send bulk notifications.
11. **No advanced reporting** — Dashboard shows basic stats but no charts/graphs, pivot tables, or configurable reports.
12. **No multi-language support** — All text is in English.
13. **No SMS notifications** — The schema includes `mobile` on users table but only email notifications are implemented.
14. **No OAuth/SSO integration** — Only email/password authentication.
15. **No session management** — No "logout all sessions" or "view active sessions" feature.
16. **No CAPTCHA or bot protection** on registration or login forms.
17. **No test suite** — No unit, integration, or E2E tests anywhere in the project.

---

## 10. ARCHITECTURE DIAGRAM (Text)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React SPA)                              │
│                                                                         │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────────────┐   │
│  │ AuthContext  │  │  React Router v7 │  │  8 Custom Hooks          │   │
│  │ (JWT state)  │  │                  │  │  (useRSPDashboard,       │   │
│  └─────────────┘  │  / → AuthPage    │  │   useComparativeAssess,  │   │
│                   │  /pillars → 5     │  │   useDeliberation...)    │   │
│                   │  /rsp/* → Admin   │  └───────────────────────────┘   │
│                   │  /jobs/* → Applicant                                 │
│                   └──────────────────┘                                   │
│                           │                                              │
│                    fetch() / socket.io-client                             │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │         REST API            │
              │     http://localhost:5000    │
              │                            │
              │  ┌──────────────────────┐  │
              │  │  Express 5 Server    │  │
              │  │  (index.js)          │  │
              │  │                     │  │
              │  │  Middleware:         │  │
              │  │  • cors             │  │
              │  │  • json/urlencoded  │  │
              │  │  • JWT auth         │  │
              │  │  • Multer (files)   │  │
              │  │  • Role guard       │  │
              │  └────────┬─────────────┘  │
              │           │                │
              │  ┌────────┴─────────────┐  │
              │  │   Route Handlers     │  │
              │  │   (17 route files)   │  │
              │  └────────┬─────────────┘  │
              │           │                │
              │  ┌────────┴─────────────┐  │
              │  │    Controllers       │  │
              │  │   (business logic)   │  │
              │  └────────┬─────────────┘  │
              │           │                │
              │  ┌────────┴─────────────┐  │
              │  │   MySQL2 Pool        │  │
              │  │   (db.js)            │  │
              │  └────────┬─────────────┘  │
              └───────────┼────────────────┘
                          │
              ┌───────────┴──────────────────┐
              │   MySQL 8 (Laragon)          │
              │   Database: deped_hrmis      │
              │   20 tables                  │
              │   Port 3306                  │
              └──────────────────────────────┘

              Socket.IO (WebSocket)
              ────────────────────
              Express app → http.Server → Socket.IO Server
              Events: rsp:dashboard:update,
                      rsp:ca:scoreUpdate:{vacancy_id},
                      application:stage-update,
                      application:notification,
                      application:document-update,
                      application:score-update
```

---

## 11. CONNECTIONS BETWEEN MODULES

- **AuthContext (client)** → Wraps entire app, provides `user`, `token`, `isAuthenticated`, `isAdmin`, `isApplicant` → consumed by `ProtectedRoute`, `RSPAdminLayout`, `ApplicantPortalLayout`, and the `/pillars` landing page
- **Hooks (client)** → Each RSP module has a dedicated hook that fetches data and manages state → consumed by corresponding component (e.g., `useRSPDashboard` → `RSPDashboard.jsx`)
- **Socket.IO** → Server controllers emit events after state changes → Client hooks listen and silently refresh → UI updates without page reload
- **PDF Generation** → `PDFKit` runs server-side, streams PDF response directly to client download
- **File Uploads** → `Multer` middleware intercepts multipart requests → saves to `/uploads/` → stores relative path in DB → served as static files via `express.static`
- **Email** → `nodemailer` (Gmail SMTP) called from auth routes for verification and password reset
- **Stage Progression** → Each controller advances `vacancies.current_stage` and inserts into `stage_history` and `activity_log`, creating a complete audit trail

---

## 12. KEY TECHNICAL DECISIONS & TRADE-OFFS

| Decision | Trade-off |
|----------|-----------|
| JWT stored in localStorage | Vulnerable to XSS; HttpOnly cookies would be more secure |
| Hardcoded `http://localhost:5000` in hooks | Works locally but fails when deployed to different domains |
| No ORM (raw SQL queries) | Full control but SQL injection risk if not careful (uses parameterized queries ✅) |
| React state in hooks (no Redux/Zustand) | Simpler but no shared global state beyond auth |
| PDFKit for PDF generation | No templating engine; each PDF is manually constructed |
| Monolithic Express backend | Simple to develop but hard to scale horizontally |
| Multer local file storage | Loses uploads on redeploy; S3/GCS would be better for production |
| MySQL instead of PostgreSQL | Common in DepEd/LGU environments (Laragon) |
