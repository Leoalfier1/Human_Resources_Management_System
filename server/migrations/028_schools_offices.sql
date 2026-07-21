-- 028_schools_offices.sql
-- Schools & Offices master reference table + FK on employees + backfill

-- 1. Reference table
CREATE TABLE IF NOT EXISTS schools_offices (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    type        ENUM('school','office') NOT NULL,
    district    VARCHAR(100) DEFAULT NULL,
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_schools_offices_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Seed data (intentionally incomplete — ~7 of ~61 known schools)
--    HR will add the rest via the admin management page.
--    'SDO Dapitan City' is included because it already exists in employees.assigned_school.
INSERT IGNORE INTO schools_offices (name, type, district) VALUES
    ('Dapitan City Central School',                'school', 'Dapitan City Central'),
    ('Ma. Cristina Elementary School',             'school', 'Dapitan City Central'),
    ('Capucao Primary School',                     'school', 'Dapitan City Central'),
    ('Dapitan City Experimental Elementary School', 'school', 'Dapitan City Central'),
    ('Lawaan Elementary School',                   'school', 'Dapitan City Central'),
    ('Polo Elementary School',                     'school', 'Dapitan City Central'),
    ('Division Office',                            'office', NULL),
    ('SDO Dapitan City',                           'office', NULL);

-- 3. Add FK column to employees (nullable, no breaking changes)
ALTER TABLE employees
    ADD COLUMN school_office_id INT DEFAULT NULL AFTER assigned_school;

-- 4. Backfill: link existing employees whose assigned_school matches a schools_offices row
--    COLLATE needed because employees may use utf8mb4_0900_ai_ci while schools_offices uses utf8mb4_unicode_ci
UPDATE employees e
    INNER JOIN schools_offices so ON so.name COLLATE utf8mb4_0900_ai_ci = e.assigned_school COLLATE utf8mb4_0900_ai_ci
    SET e.school_office_id = so.id
    WHERE e.assigned_school IS NOT NULL AND e.assigned_school != '' AND e.school_office_id IS NULL;

-- 5. FK constraint (ON DELETE SET NULL so deleting a school doesn't cascade-kill employee records)
ALTER TABLE employees
    ADD CONSTRAINT fk_emp_school_office
        FOREIGN KEY (school_office_id) REFERENCES schools_offices(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
