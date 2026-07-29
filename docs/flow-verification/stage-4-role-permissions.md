# Stage 4 Verification: Role Permissions

## Summary Matrix

| Check | Status | Description |
|-------|--------|-------------|
| **4.1 Role Middleware Enforcement** | ✅ PASS | `requireRole(...roles)` in `server/middleware/authMiddleware.js` verifies token role claims |
| **4.2 RSP Admin Endpoints** | ✅ PASS | Protected by `requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority')` |
| **4.3 Personnel Admin Endpoints** | ✅ PASS | Protected by `requireRole('admin', 'hr_staff')` |
| **4.4 Self-Service Employee Scoping** | ⚠️ WARN | Endpoints rely on `req.user.id` from JWT, but some endpoints lack explicit role checks ensuring `role === 'applicant'` or `role === 'staff'` |
| **4.5 Granular Role Separation (HRMPSB vs SDS)** | ⚠️ WARN | HRMPSB and Appointing Authority share access to several RSP routes without granular action-level restriction |

---

## Detailed Code Trace

### A. Middleware Definition
- **File**: `c:\Users\HP\Desktop\HRMS\server\middleware\authMiddleware.js`
```javascript
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        next();
    };
};
```

### B. Role Map Across Modules

1. **RSP Routes** (`server/routes/rsp/`):
   - `vacancies.js`, `applicants.js`, `evaluation.js`, `comparative-assessment.js`: Protected with `verifyToken`, `requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority')`.
   - Issue Appointment (`appointment.js`): Protected with `requireRole('admin', 'appointing_authority')`.
2. **Personnel Routes** (`server/routes/personnel/`):
   - `employee.js`, `leave.js` (approval), `signatory.js`, `adminTools.js`: Protected with `verifyToken`, `requireRole('admin', 'hr_staff')`.
   - Employee self-service (`/api/personnel/leave`, `/api/personnel/documents`): Protected with `verifyToken`.
3. **PM Routes** (`server/routes/pm/`):
   - `periods.js`, `form-config.js`, `review.js`: Protected with `verifyToken`, `requireRole('admin', 'hr_staff')`.
4. **R&R Routes** (`server/routes/rr/`):
   - `praise-meetings.js`, `call-for-nominees.js`, `deliberation.js`: Protected with `verifyToken`, `requireRole('admin', 'hr_staff')`.
5. **L&D Routes** (`server/routes/ld/`):
   - `proposals.js` (review), `programs.js` (create/QA): Protected with `verifyToken`, `requireRole('admin', 'hr_staff')`.

---

## Comparison Against Intended Flow

- **Intended**: Strictly enforced role-based access control where applicants can only view/submit their own applications, HRMPSB can score CA rubrics but not issue appointments, Appointing Authority (SDS) approves appointments, and HR Staff manage operational document processing.
- **Actual**:
  - Middleware properly checks roles on all admin routes.
  - However, role definitions in database ENUM (`users.role`: `'applicant'`, `'staff'`, `'admin'`, `'hr_staff'`, `'hrmpsb'`, `'appointing_authority'`) overlap; for instance, `'admin'` has blanket access to almost all routes.
  - Some self-service endpoints (e.g. `/api/applications/my-latest`) rely on `verifyToken` without checking `requireRole('applicant')`, relying solely on the JWT payload matching.

---

## GAP List

1. **Overlapping Admin Privileges**: The `'admin'` role has blanket permission to trigger actions meant exclusively for the Appointing Authority (e.g. `issueAppointment` in `appointmentController.js`).
2. **Coarse Role Checks in R&R Deliberation**: PRAISE committee voting (`/api/rr/deliberation2/vote`) checks `requireRole('admin', 'hr_staff')` rather than checking membership in `rr_praise_committee_members`.
