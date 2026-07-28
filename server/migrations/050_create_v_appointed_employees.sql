-- 050: Create a VIEW that excludes auto-created stub employees.
-- Stubs are rows inserted by findOrCreateEmployee() that have employee_no IS NULL
-- (never properly onboarded). Every "list employees" query should reference this
-- view instead of the raw `employees` table so stubs are excluded by construction.
CREATE OR REPLACE VIEW v_appointed_employees AS
    SELECT * FROM employees WHERE employee_no IS NOT NULL;
