# RSP Module Flow Analysis (Recruitment, Selection & Placement)

## 1. Flow Diagram

```
[Vacancy Creation] 
  Trigger: Admin creates vacancy in VacancyManagement.jsx
  API: POST /api/rsp/vacancies
  Tables: vacancies, minimum_qualifications_checklist, vacancy_required_documents, duties_responsibilities
       │
       ▼
[Stage 1: Publication]
  Trigger: Admin sets publishing channels (Website, FB, Bulletin)
  API: PATCH /api/rsp/vacancies/:id
  Tables: vacancies (status='active', current_stage=1)
       │
       ▼
[Stage 2: Submission]
  Trigger: Applicant applies via ApplicationWizard.jsx
  API: POST /api/applications, POST /api/applications/:id/documents
  Tables: applications (status='submitted', current_stage=2), application_documents, stage_history
       │
       ▼
[Stage 3: Initial Evaluation & MQ Screening]
  Trigger: HR verifies docs & assesses MQ in InitialEvaluationQueue.jsx
  API: PATCH /api/rsp/evaluation/document/:docId/verify, POST /api/rsp/evaluation/applicant/:id/decision
  Tables: applicant_qualification_results, applications (status='qualified'/'disqualified')
  Email: Annex E PDF via Resend API (sendAnnexEEmail)
       │
       ▼
[Stage 5: Posting Qualified List]
  Trigger: HR finalizes evaluation (POST /api/rsp/evaluation/finalize)
  API: Helper syncApplicationsStage(vacancyId, 5, io)
  Tables: vacancies (current_stage=5), applications (current_stage=5), stage_history
       │
       ▼
[Stage 6: Comparative Assessment & IES]
  Trigger: HRMPSB scores candidates in ComparativeAssessment.jsx / CAWorkspace.jsx
  API: PUT /api/rsp/comparative-assessment/score, POST /api/rsp/ca-workspace/session
  Tables: comparative_assessment_scores, comparative_assessment_results, ies_evaluations, ies_criterion_scores, ca_sessions
       │
       ▼
[Stage 7: Results Posting]
  Trigger: HR previews & publishes CA rankings in ResultsPosting.jsx
  API: POST /api/rsp/results/publish
  Tables: results_postings, vacancies (current_stage=7), applications (current_stage=7)
       │
       ▼
[Stage 8: Deliberation & Shortlisting]
  Trigger: HRMPSB reviews top candidates in DeliberationList.jsx & endorses to SDS
  API: PUT /api/rsp/deliberation/notes, POST /api/rsp/deliberation/endorse
  Tables: deliberation_notes, vacancies (current_stage=8, shortlist_endorsed_at=NOW())
       │
       ▼
[Stage 9: Selection & Congratulatory Advice]
  Trigger: Admin issues congratulatory advice in CongratulatoryAdvice.jsx
  API: POST /api/rsp/congratulatory-advice
  Tables: congratulatory_advices, applications (status='selected', current_stage=9)
       │
       ▼
[Stage 10: Appointment Document Submission]
  Trigger: Appointee uploads required 10 appointment documents
  API: POST /api/applications/:id/appointment-documents
  Tables: appointment_documents
       │
       ▼
[Stage 11: Appointment Issuance & Posting]
  Trigger: HR verifies 10 docs & issues appointment in AppointmentProcessing.jsx
  API: POST /api/rsp/appointment/issue, POST /api/rsp/notice-of-appointment/:id/post
  Tables: appointments, appointment_notice_postings, vacancies (current_stage=11, status='closed')
  Handoff: Calls findOrCreateEmployee(user_id) -> creates/links row in employees table
```

---

## 2. Files Involved

### Frontend
- Admin Layout: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\RSPAdminLayout.jsx`
- Dashboard: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\RSPDashboard.jsx`
- Vacancy Management: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\VacancyManagement.jsx`
- Applicant Management: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\ApplicantManagement.jsx`
- Initial Evaluation: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\InitialEvaluationQueue.jsx`
- Comparative Assessment: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\ComparativeAssessment.jsx`
- CA Workspace / IES: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\CAWorkspace.jsx`
- Results Posting: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\ResultsPosting.jsx`
- Deliberation: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\DeliberationList.jsx`
- Congratulatory Advice: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\CongratulatoryAdvice.jsx`
- Appointment Processing: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\AppointmentProcessing.jsx`
- Notice of Appointment: `c:\Users\HP\Desktop\HRMS\client\src\components\rsp\NoticeOfAppointment.jsx`
- Applicant Side: `c:\Users\HP\Desktop\HRMS\client\src\pages\applicant\JobOpenings.jsx`, `JobDetail.jsx`, `ApplicationWizard.jsx`, `MyApplications.jsx`, `ApplicationStatusTracker.jsx`

### Backend
- Routes: `c:\Users\HP\Desktop\HRMS\server\routes\applicant\vacancies.js`, `applications.js`, `pds.js`
- Admin RSP Routes: `c:\Users\HP\Desktop\HRMS\server\routes\rsp\dashboard.js`, `vacancies.js`, `applicants.js`, `evaluation.js`, `comparative-assessment.js`, `ca-workspace.js`, `ies.js`, `results.js`, `advice.js`, `appointment.js`, `eligibility.js`, `notifications.js`
- Controllers: `c:\Users\HP\Desktop\HRMS\server\controllers\rsp\dashboardController.js`, `vacancyController.js`, `applicantController.js`, `evaluationController.js`, `caController.js`, `caWorkspaceController.js`, `iesController.js`, `resultsController.js`, `adviceController.js`, `appointmentController.js`, `eligibilityController.js`, `annexEController.js`
- Applicant Controller: `c:\Users\HP\Desktop\HRMS\server\controllers\applicant\applicantController.js`
- Helpers: `c:\Users\HP\Desktop\HRMS\server\utils\syncApplicationsStage.js`, `employeeHelper.js`, `mailer.js`, `positionClassifier.js`

---

## 3. Discrepancies & Red Flags

1. **Dead / Legacy Tables in Schema**: `database.sql` contains `applicants` and `applicant_documents` tables. However, active controllers solely read and write to `applications` and `application_documents`.
2. **Stage Alignment Gap**: Vacancies track `current_stage` (1-11), while individual applications track `current_stage`. `syncApplicationsStage.js` handles bulk stage advancement for Stages 3 and 5, but for Stages 6-11, per-applicant sync relies on separate endpoints which can cause mismatched stage indicators if an endpoint fails mid-batch.
3. **Dual MQ Criteria Structure**: Both `minimum_qualifications_checklist` and `rsp_mqs_criteria` exist in the database (Migration 019 & backfill script), leading to dual-read paths in evaluation controllers.
4. **Annex E Email Generation**: `annexEController.js` creates Annex E PDF buffers on the fly and emails applicants using `sendAnnexEEmail` (Resend API). If `RESEND_API_KEY` is not set or fails, the API call completes but email logging silently returns `null`.

---

## 4. Open Questions

1. Is `Stage 4 (Validation)` intentionally skipped in the digital workflow (advancing directly from Stage 3 evaluation to Stage 5 qualified list posting)?
2. When an appointee is issued an appointment (Stage 11), `findOrCreateEmployee` creates a stub employee record without an `employee_no`. Should the appointment workflow automatically assign an `employee_no` or leave it to HR Personnel onboarding?
