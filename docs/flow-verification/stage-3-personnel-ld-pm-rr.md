# Stage 3 Verification: Personnel → L&D / PM / R&R

## Summary Matrix

| Check | Status | Description |
|-------|--------|-------------|
| **3.1 Personnel → PM Linkage** | ⚠️ WARN | PM commitments map via `user_id` in `performance_commitments`, querying `users` table directly rather than `employees` |
| **3.2 Personnel → L&D Linkage** | ⚠️ WARN | L&D TNA / e-SAT and Training Records map via `user_id`, connecting to PDS data rather than official employee station/title |
| **3.3 Personnel → R&R Linkage** | ⚠️ WARN | R&R nominations map via `nominee_user_id` in `rr_call_nominations`, linking `users` table without verifying active appointment status |
| **3.4 PM → R&R Cross-Handoff** | ❌ FAIL | No automatic trigger from Outstanding PM ratings ($\ge 4.50$) to R&R nomination eligibility; HR must manually cross-reference |
| **3.5 PM → L&D Cross-Handoff** | ⚠️ WARN | IPCRF development plans are stored in `ld_ipcrf_records`, but no automated trigger pushes low PM ratings to mandatory L&D training |

---

## Detailed Code Trace

### A. Trigger & Request Path
- **PM Module**: `c:\Users\HP\Desktop\HRMS\server\controllers\pm\commitmentController.js` (lines 30-55) & `performanceController.js` (lines 20-80).
- **L&D Module**: `c:\Users\HP\Desktop\HRMS\server\controllers\ld\tnaController.js` (lines 40-100) & `programController.js` (lines 50-120).
- **R&R Module**: `c:\Users\HP\Desktop\HRMS\server\controllers\rr\callForNomineesController.js` (lines 45-110).

### B. What Actually Happens
1. **PM Schema**: `performance_commitments` table references `user_id` (`FOREIGN KEY (user_id) REFERENCES users(id)`). Commitments and targets query `users.full_name` and `users.applicant_type` rather than `employees.position_title` or `employees.assigned_school`.
2. **L&D Schema**: `tna_responses` and `ld_program_proposals` reference `user_id`. `ld_ipcrf_records` stores e-SAT development areas, but is populated independently by the employee in `/ld-employee/self-assessment`.
3. **R&R Schema**: `rr_call_nominations` references `nominee_user_id` (`FOREIGN KEY (nominee_user_id) REFERENCES users(id)`). Category validation checks `nominee_category` (`teaching`, `non_teaching`, `teaching_related`) from `users.applicant_type`.

---

## Comparison Against Intended Flow

- **Intended**: Personnel employee records (station, position title, salary grade, employment status) should seamlessly feed PM appraisal forms, L&D training eligibility, and R&R PRAISE nominations. High PM ratings should automatically qualify employees for R&R award calls, and low PM ratings should trigger L&D intervention.
- **Actual**:
  - The 3 pillars (PM, L&D, R&R) operate on `user_id` foreign keys to the `users` table rather than unified `employee_id` keys to `employees` or `v_appointed_employees`.
  - There is no automated trigger or database hook connecting high PM ratings ($\ge 4.50$) to R&R nomination eligibility lists.
  - There is no automated trigger connecting poor PM ratings to mandatory L&D program enrolment.

---

## GAP List

1. **Decoupled User Identity vs Employee Entity**: PM, L&D, and R&R tables use `user_id` foreign keys, bypassing `employees` table data (`position_title`, `item_number`, `assigned_school`, `employee_no`).
2. **Missing PM → R&R Automated Qualification Bridge**: No code path automatically nominates or flags high-performing employees from `performance_ratings` into `rr_call_nominations`.
3. **Missing PM → L&D Remedial Training Trigger**: No code path automatically flags employees with unsatisfactory PM ratings for required L&D TNA or training enrollment.
