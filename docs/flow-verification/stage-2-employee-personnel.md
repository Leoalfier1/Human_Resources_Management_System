# Stage 2 Verification: Employee → Personnel

## Summary Matrix

| Check | Status | Description |
|-------|--------|-------------|
| **2.1 Directory Population** | ⚠️ WARN | Employee Directory populates via `v_appointed_employees`, but stub employees (`employee_no IS NULL`) are omitted by design |
| **2.2 PDS Field Overlay** | ✅ PASS | `employeeController.js` overlays PDS fields (highest education, eligibility, SSS, height, weight) into employee responses |
| **2.3 Migration 049 Overlay Columns** | ⚠️ WARN | Columns exist in schema (Migration 049), but are populated dynamically via SQL `LEFT JOIN personal_data_sheets` rather than static DB writes |
| **2.4 Service Record Initialization** | ❌ FAIL | Service records are not auto-generated from RSP appointment details; rely on manual entry or PDS work experience JSON |

---

## Detailed Code Trace

### A. Trigger & Request Path
- **UI Trigger**: HR Admin views Employee Directory (`c:\Users\HP\Desktop\HRMS\client\src\components\personnelAdmin\PersonnelList.jsx`) or Employee views Profile (`c:\Users\HP\Desktop\HRMS\client\src\components\personnel\MyProfile.jsx`).
- **API Call**: `GET /api/personnel/employees` or `GET /api/personnel/employees/me` (defined in `c:\Users\HP\Desktop\HRMS\server\routes\personnel\employee.js`).
- **Controller Action**: `getEmployees` / `getEmployeeMe` in `c:\Users\HP\Desktop\HRMS\server\controllers\personnel\employeeController.js` (lines 10–120).

### B. What Actually Happens
1. `employeeController.js`: Queries `v_appointed_employees` view (created in Migration 050: `SELECT * FROM employees WHERE employee_no IS NOT NULL`).
2. `employeeController.js`: Performs a `LEFT JOIN personal_data_sheets pds ON e.user_id = pds.user_id` to overlay dynamic PDS fields (`pds.college`, `pds.civil_service_eligibility`, `pds.sss_no`, etc.).
3. `employeeHelper.js:57-59`: `isAppointedEmployee()` utility function enforces `e.employee_no IS NOT NULL` across raw employee table queries.

---

## Comparison Against Intended Flow

- **Intended**: New appointee automatically populates the Personnel module with complete official employee profile, service record, initial leave balances, and 201 file record upon appointment.
- **Actual**:
  - Employee row created by `findOrCreateEmployee()` has `employee_no = NULL`, making it invisible in `v_appointed_employees` until an HR admin manually inputs `employee_no` in `PersonnelDetail.jsx`.
  - PDS overlay fields (added in Migration 049) are read dynamically via SQL join from `personal_data_sheets` rather than physically duplicated into the `employees` table rows at handoff.
  - Service Record entries are not automatically created from the RSP appointment position, salary grade, and station.

---

## GAP List

1. **Manual HR Step Required to Enable Directory Listing**: Because `v_appointed_employees` filters out rows with `employee_no IS NULL`, new appointees do not appear in the Personnel Directory until an admin opens `PersonnelDetail.jsx` and manually assigns an `employee_no`.
2. **Missing Automated Service Record Entry**: RSP appointment parameters (`position_title`, `item_number`, `monthly_salary`, `assigned_school`) are not written to an initial Service Record table entry upon appointment.
