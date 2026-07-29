# PM Module Flow Analysis (Performance Management)

## 1. Flow Diagram

```
[Cycle Setup & Performance Period]
  Trigger: Admin configures rating period in PMDashboard.jsx / periods.js
  API: POST /api/pm/periods
  Tables: performance_periods (status='active', SY/Semester details)
       │
       ▼
[Stage 1: Performance Planning & Commitment (IPCRF / OPCRF)]
  Trigger: Employee & Supervisor set targets in PlanningCommitment.jsx
  API: POST /api/pm/commitments, POST /api/pm/planning/targets
  Tables: performance_commitments (type='IPCRF'/'OPCRF', status='submitted'), performance_targets
       │
       ▼
[Stage 2: Performance Monitoring & Coaching]
  Trigger: Supervisor logs coaching sessions in MonitoringCoaching.jsx
  API: POST /api/pm/coaching, POST /api/pm/monitoring/logs
  Tables: coaching_logs, performance_commitments
       │
       ▼
[Stage 3: Performance Review & Evaluation]
  Trigger: Supervisor rates targets (Quality, Efficiency, Timeliness) in ReviewEvaluation.jsx
  API: POST /api/pm/review/submit, POST /api/pm/ratings
  Tables: performance_ratings (numerical_rating, adjectival_rating: 'Outstanding'/'Very Satisfactory'/etc.)
       │
       ▼
[Stage 4: Rewarding & Development Planning]
  Trigger: HR Admin analyzes ratings in RewardingDevPlanning.jsx
  API: GET /api/pm/rewarding/summary, POST /api/pm/rewards
  Tables: rewards_recognition, performance_ratings
  Handoff to R&R: Outstanding ratings (>= 4.50) flagged for R&R award nomination eligibility
  Handoff to L&D: Identified development gaps pushed to L&D IPCRF records / TNA input (ld_ipcrf_records)
```

---

## 2. Files Involved

### Frontend
- Admin Layout: `c:\Users\HP\Desktop\HRMS\client\src\components\pm\PMAdminLayout.jsx`
- Admin Pages: `c:\Users\HP\Desktop\HRMS\client\src\pages\PMDashboard.jsx`, `PlanningCommitment.jsx`, `MonitoringCoaching.jsx`, `ReviewEvaluation.jsx`, `RewardingDevPlanning.jsx`, `FormConfiguration.jsx`, `PerformanceEvaluationList.jsx`, `PerformanceEvaluationForm.jsx`
- Employee Portal: `c:\Users\HP\Desktop\HRMS\client\src\components\dashboard\ModuleCard.jsx` (PM Card -> `/pm/dashboard` for Admin, `/jobs/my-performance` for Staff)

### Backend
- Routes: `c:\Users\HP\Desktop\HRMS\server\routes\pm\periods.js`, `commitments.js`, `coaching.js`, `dashboard.js`, `planning.js`, `review.js`, `monitoring.js`, `rewarding.js`, `form-config.js`, `ratings.js`, `rewards.js`, `notifications.js`, `employee.js`, `performance.js`, `ld.js`
- Controllers: `c:\Users\HP\Desktop\HRMS\server\controllers\pm\periodController.js`, `commitmentController.js`, `coachingController.js`, `performanceController.js`, `ratingsController.js`, `rewardsController.js`

---

## 3. Discrepancies & Red Flags

1. **Parallel Route Architecture**: The PM backend contains 15 route files. Simple legacy endpoints (`commitments.js`, `ratings.js`, `coaching.js`, `rewards.js`) coexist with complex workflow endpoints (`planning.js`, `review.js`, `monitoring.js`, `rewarding.js`, `form-config.js`). Both sets write to the same core tables (`performance_commitments`, `performance_targets`, `performance_ratings`), leading to potential payload format mismatches between older and newer frontend forms.
2. **Schema Adjectival Rating ENUM Limits**: `performance_ratings.adjectival_rating` is defined in schema as `varchar(50)` or ENUM. Mismatches exist where some forms pass `"Outstanding"` while others pass `"OUTSTANDING"` (uppercase vs title case).
3. **Implicit Cross-Module Handoff**: The handoffs from PM to R&R (for Outstanding ratings) and PM to L&D (for Development Plans) are queried directly on-demand in R&R/L&D controllers rather than through explicit event triggers or DB foreign key links.

---

## 4. Open Questions

1. Are OPCRF (Office Performance Commitment and Review Form) ratings aggregated directly from child IPCRFs or independently entered by Office Heads?
2. Does approval of an IPCRF rating automatically lock `performance_targets` against further edits?
