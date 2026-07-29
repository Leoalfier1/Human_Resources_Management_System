# R&R Module Flow Analysis (Rewards & Recognition - PRAISE System)

## 1. Flow Diagram

```
[PRAISE Committee Setup & Meetings]
  Trigger: HR Admin manages PRAISE committee & logs meetings in PraiseCommitteeMeeting.jsx
  API: POST /api/rr/praise-meetings
  Tables: rr_praise_meetings, rr_praise_committee_members, rr_meeting_attendance, rr_meeting_agenda_items
       │
       ▼
[Call for Nominations]
  Trigger: Admin opens nomination call in CallForNominees.jsx
  API: POST /api/rr/call-for-nominees
  Tables: rr_nomination_calls (status='published'), rr_award_types, rr_award_document_requirements
       │
       ▼
[Nomination Submission]
  Trigger: Employee / Department Head submits nomination in RROpportunities.jsx
  API: POST /api/rr/nominations, POST /api/rr/call-for-nominees/:id/nominate
  Tables: rr_call_nominations (status='pending_review'), rr_call_nomination_documents
       │
       ▼
[Stage 1: Preliminary Evaluation & Document Screening]
  Trigger: HR Admin screens requirements in PreliminaryEvaluation.jsx
  API: POST /api/rr/preliminary-evaluation/verify
  Tables: rr_call_nominations (status='under_evaluation'/'rejected')
       │
       ▼
[Stage 2: Validation & Interview Scoring]
  Trigger: PRAISE Committee conducts validation & interview in ValidationInterview.jsx
  API: POST /api/rr/validation/score
  Tables: rr_validation_criteria, rr_validation_scores, rr_validation_interviews (weighted_total)
       │
       ▼
[Stage 3: Deliberation & Finalization]
  Trigger: Committee votes & finalizes awardees in DeliberationFinalization.jsx
  API: POST /api/rr/deliberation2/vote, POST /api/rr/deliberation2/finalize
  Tables: rr_deliberation_votes, rr_call_nominations (deliberation_status='approved', final_rank), rr_awards
       │
       ▼
[Stage 4: Announcement of Results]
  Trigger: HR publishes official memo & notifies nominees in AnnouncementOfResults.jsx
  API: POST /api/rr/announcement/publish
  Tables: rr_announcements (status='published'), rr_announcement_notifications_log
       │
       ▼
[Stage 5: Award Ceremony Management]
  Trigger: Admin manages ceremony venue, theme, photos, & status in CeremonyStage.jsx
  API: POST /api/rr/ceremony/save, POST /api/rr/ceremony/photos
  Tables: rr_ceremonies, rr_ceremony_photos, rr_awardee_ceremony_status
       │
       ▼
[Stage 6: Implementation Report]
  Trigger: Admin generates annual PRAISE report in ImplementationReport.jsx
  API: POST /api/rr/implementation-report/generate
  Tables: rr_implementation_reports (report_data JSON)
```

---

## 2. Files Involved

### Frontend
- Admin Layout: `c:\Users\HP\Desktop\HRMS\client\src\components\rr\RRAdminLayout.jsx`
- Admin Stages: `c:\Users\HP\Desktop\HRMS\client\src\components\rr\PraiseCommitteeMeeting.jsx`, `CallForNominees.jsx`, `PreliminaryEvaluation.jsx`, `ValidationInterview.jsx`, `DeliberationFinalization.jsx`, `AnnouncementOfResults.jsx`, `CeremonyStage.jsx`, `ImplementationReport.jsx`
- Applicant / Employee Portal: `c:\Users\HP\Desktop\HRMS\client\src\components\rr\RROpportunities.jsx`

### Backend
- Routes: `c:\Users\HP\Desktop\HRMS\server\routes\rr\` (15 files: `praise-meetings.js`, `call-for-nominees.js`, `preliminary-evaluation.js`, `searches.js`, `nominations.js`, `evaluation.js`, `validation-interview.js`, `deliberation.js`, `deliberation-finalization.js`, `awards.js`, `announcement.js`, `ceremony.js`, `implementation-report.js`, `reports.js`, `opportunities.js`)
- Controllers: `c:\Users\HP\Desktop\HRMS\server\controllers\rr\` (15 files: `praiseMeetingController.js`, `callForNomineesController.js`, `preliminaryEvaluationController.js`, `searchController.js`, `nominationController.js`, `evaluationController.js`, `validationInterviewController.js`, `deliberationController.js`, `deliberationFinalizationController.js`, `awardController.js`, `announcementController.js`, `ceremonyController.js`, `implementationReportController.js`, `reportController.js`, `opportunitiesController.js`)

---

## 3. Discrepancies & Red Flags

1. **Dual Schema Coexistence (Legacy Searches vs New Nomination Calls)**:
   - Schema contains legacy tables: `rr_searches`, `rr_award_categories`, `rr_nominations`, `rr_evaluation_criteria`, `rr_evaluation_scores`, `rr_deliberation_notes`, `rr_ceremony`.
   - Schema also contains newer PRAISE tables (Migrations 010-017): `rr_nomination_calls`, `rr_call_nominations`, `rr_call_nomination_documents`, `rr_validation_criteria`, `rr_validation_scores`, `rr_validation_interviews`, `rr_deliberation_votes`, `rr_announcements`, `rr_ceremonies`.
   - Both sets of routes (`searches.js` vs `call-for-nominees.js`) exist in parallel, leading to confusing data models where old searches and new calls operate independently.
2. **Duplicate Ceremony Tables**: Both `rr_ceremony` (single search ref) and `rr_ceremonies` (nomination call ref) exist in `database.sql`. `ceremonyController.js` targets `rr_ceremonies`.
3. **Route Name Conflict**: Notice `/api/rr/deliberation` (`routes/rr/deliberation.js`) vs `/api/rr/deliberation2` (`routes/rr/deliberation-finalization.js`). The suffix `2` was appended to avoid a route collision during development.

---

## 4. Open Questions

1. Should legacy search endpoints (`/api/rr/searches`) be formally deprecated in favor of `rr_nomination_calls`?
2. Are awardees' certificates automatically stored in Personnel 201 files (`employee_documents`) upon ceremony finalization?
