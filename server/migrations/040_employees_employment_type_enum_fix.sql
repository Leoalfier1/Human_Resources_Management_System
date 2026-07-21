-- Migration 040: Fix employees.employment_type ENUM
-- The ENUM was 'teaching','non-teaching' (hyphenated, missing teaching_related).
-- Every other position-type field in the system uses underscored 3-value ENUMs.
-- This migration aligns employees.employment_type with the rest of the system.
--
-- NOTE: MySQL strict mode blocks ALTER TABLE ENUM when existing values don't
-- match the new ENUM. We disable strict mode for the ALTER, then UPDATE.
-- The old 'non-teaching' values become empty strings after ALTER, then we
-- UPDATE them to 'non_teaching'.

-- 1. Capture BEFORE state
SELECT 'BEFORE migration:' AS info;
SELECT employment_type, COUNT(*) AS cnt FROM employees GROUP BY employment_type;

-- 2. Schema change: replace ENUM with correct 3-value underscore version
-- Disable strict mode to allow ENUM modification with existing non-matching values
SET @old_sql_mode = @@sql_mode;
SET sql_mode = '';
ALTER TABLE employees
  MODIFY COLUMN employment_type
    ENUM('teaching','non_teaching','teaching_related')
    NOT NULL DEFAULT 'teaching';
SET sql_mode = @old_sql_mode;

-- 3. Value translation: old 'non-teaching' became empty strings after ALTER
-- UPDATE all non-teaching, non-empty rows to 'non_teaching'
UPDATE employees SET employment_type = 'non_teaching' WHERE employment_type != 'teaching';

-- 4. Verify AFTER state
SELECT 'AFTER migration:' AS info;
SELECT employment_type, COUNT(*) AS cnt FROM employees GROUP BY employment_type;

-- 5. Confirm column definition
SHOW COLUMNS FROM employees WHERE Field = 'employment_type';
