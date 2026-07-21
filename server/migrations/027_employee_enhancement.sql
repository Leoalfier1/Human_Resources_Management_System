-- 027_employee_enhancement.sql
-- Add photo upload, salary split, step, eligibility, office, and job_status
-- to the employees table. All columns are nullable/defaulted — zero breaking changes.
-- NOTE: CONSTRAINT cannot be inline with ADD COLUMN in MySQL; added separately.

ALTER TABLE employees
    ADD COLUMN photo_path        VARCHAR(500)  DEFAULT NULL AFTER address,
    ADD COLUMN authorized_salary  DECIMAL(12,2) DEFAULT NULL AFTER salary_grade,
    ADD COLUMN actual_salary      DECIMAL(12,2) DEFAULT NULL AFTER authorized_salary,
    ADD COLUMN salary_step        TINYINT       DEFAULT NULL AFTER actual_salary,
    ADD COLUMN eligibility        VARCHAR(255)  DEFAULT NULL AFTER salary_step,
    ADD COLUMN office             VARCHAR(200)  DEFAULT NULL AFTER assigned_school,
    ADD COLUMN job_status         ENUM('active','on_leave','suspended','resigned','retired','terminated') NOT NULL DEFAULT 'active' AFTER is_active;

ALTER TABLE employees ADD CONSTRAINT chk_salary_step CHECK (salary_step BETWEEN 1 AND 8);
