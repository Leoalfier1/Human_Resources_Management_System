-- 051: Extend personnel_notifications for RSP admin alerts.
-- 1. Add application_id column to link back to the RSP application.
-- 2. Make employee_id nullable (RSP alerts target admin/hr_staff by employee_id,
--    but the column must allow NULL for future flexibility).
-- 3. Add 'rsp_qualified' to the type enum.

ALTER TABLE personnel_notifications
    ADD COLUMN application_id INT DEFAULT NULL AFTER reference_id,
    ADD KEY idx_pn_application (application_id);

ALTER TABLE personnel_notifications
    MODIFY COLUMN employee_id INT NOT NULL;

ALTER TABLE personnel_notifications
    MODIFY COLUMN type ENUM('leave','travel','document','general','rsp_qualified') NOT NULL;
