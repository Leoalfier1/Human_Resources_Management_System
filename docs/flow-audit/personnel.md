# Personnel Module Flow Analysis

## 1. Flow Diagram

```
[Employee Creation / Handoff from RSP]
  Trigger: Issued Appointment in RSP / findOrCreateEmployee(userId) on first login
  API: Helper findOrCreateEmployee() in server/utils/employeeHelper.js
  Tables: employees (stub row: employee_no IS NULL), leave_credits (auto-seeded: VL=15, SL=15, FL=5, SPL=3)
       │
       ▼
[Official Onboarding & Employee Number Assignment]
  Trigger: HR Admin assigns official employee_no, station, SG/step in PersonnelDetail.jsx
  API: PUT /api/personnel/employees/:id
  Tables: employees (employee_no='EMP-XXXX', is_active=1) -> Now visible in v_appointed_employees view
       │
       ▼
[Personal Data Sheet (PDS) & Profile Management]
  Trigger: Employee updates PDS in MyPDS.jsx or requests profile update in MyProfile.jsx
  API: PATCH /api/applicant/pds, POST /api/personnel/employees/profile-change-request
  Tables: personal_data_sheets, employee_profile_change_requests
  Approval: HR Admin reviews & approves in ProfileChangeRequests.jsx -> updates employees / PDS table
       │
       ▼
[Leave Application Workflow]
  Trigger: Employee submits leave request in LeavePortal.jsx
  API: POST /api/personnel/leave
  Tables: leave_applications (status='pending'), personnel_activity_log, personnel_notifications
  Approval: HR Admin reviews in LeaveManagement.jsx (Recommend -> Approve)
  API: PATCH /api/personnel/leave/:id/recommend, PATCH /api/personnel/leave/:id/approve
  Tables: leave_applications (status='approved'), leave_credits (deducts balance)
       │
       ▼
[Service Records, 201 Files & Document Requests]
  Trigger: Employee requests COE/Service Record in Files201.jsx or HR releases document
  API: POST /api/personnel/documents/request, GET /api/personnel/employees/:id/service-record
  Tables: document_requests, employee_documents, signatories, schools_offices
```

---

## 2. Files Involved

### Frontend
- Admin Layout: `c:\Users\HP\Desktop\HRMS\client\src\components\personnelAdmin\PersonnelAdminLayout.jsx`
- Admin Views: `c:\Users\HP\Desktop\HRMS\client\src\components\personnelAdmin\PersonnelList.jsx`, `PersonnelDetail.jsx`, `ProfileChangeRequests.jsx`, `SignatoryManagement.jsx`, `SchoolsOfficesManagement.jsx`, `AdminTools.jsx`
- Admin Leave Page: `c:\Users\HP\Desktop\HRMS\client\src\pages\personnelAdmin\LeaveManagement.jsx`
- Employee Layout: `c:\Users\HP\Desktop\HRMS\client\src\components\personnel\PersonnelLayout.jsx`, `PersonnelNavbar.jsx`
- Employee Portals: `c:\Users\HP\Desktop\HRMS\client\src\components\personnel\MyPDS.jsx`, `MyProfile.jsx`, `Files201.jsx`, `LeavePortal.jsx`, `CertificatesPortal.jsx`, `NotificationsPortal.jsx`

### Backend
- Routes: `c:\Users\HP\Desktop\HRMS\server\routes\personnel\employee.js`, `documents.js`, `leave.js`, `travel.js`, `certificates.js`, `notifications.js`, `reports.js`, `signatory.js`, `adminTools.js`, `schoolsOffices.js`
- Controllers: `c:\Users\HP\Desktop\HRMS\server\controllers\personnel\employeeController.js`, `documentsController.js`, `leaveController.js`, `travelController.js`, `certificateController.js`, `notificationController.js`, `reportController.js`, `signatoryController.js`, `adminToolsController.js`, `schoolsOfficesController.js`
- Helpers: `c:\Users\HP\Desktop\HRMS\server\utils\employeeHelper.js` (`isAppointedEmployee`, `findOrCreateEmployee`)

---

## 3. Discrepancies & Red Flags

1. **Stub Employee Contamination**: `findOrCreateEmployee(userId)` automatically inserts a row into `employees` for any registered user who accesses a personnel endpoint, setting `employee_no = NULL`. If the user is an un-appointed applicant, this stub row persists indefinitely. The helper function `isAppointedEmployee()` (`WHERE e.employee_no IS NOT NULL`) and database view `v_appointed_employees` (Migration 050) were implemented as a patch to filter out these stubs in list queries.
2. **Dual Identity References**: Certain endpoints reference `user_id` while others reference `employee_id`. For example, `personal_data_sheets` maps via `user_id`, whereas `leave_applications` and `leave_credits` map via `employee_id`. Controllers must constantly convert between `user_id` and `employee_id`.
3. **PDS Overlay Schema Drift**: Migration 049 added overlay columns to `employees` (`pds_surname`, `pds_first_name`, etc.) to mirror data from `personal_data_sheets`, leading to redundant source-of-truth logic between `employees` table and `personal_data_sheets` table.

---

## 4. Open Questions

1. Should stub employee rows (where `employee_no IS NULL`) be automatically purged if an applicant's application is rejected or inactive for a period of time?
2. Are `leave_carryover` credits automatically computed at fiscal year-end or manually entered via `AdminTools.jsx`?
