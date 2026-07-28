-- Migration 049: Add PDS-sourced overlay columns to employees table
-- These columns are populated at read time by the employee controller
-- (LEFT JOIN personal_data_sheets + overlay logic), NOT manually entered.
-- They close the gap between what the PDS form captures and what the
-- Employee Directory can display.

SET @exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'employees'
    AND COLUMN_NAME = 'highest_education'
);

SET @sql = IF(@exists = 0,
  'ALTER TABLE employees
     ADD COLUMN highest_education   VARCHAR(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER eligibility,
     ADD COLUMN eligibility_details JSON          DEFAULT NULL AFTER highest_education,
     ADD COLUMN sss_no              VARCHAR(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER tin_no,
     ADD COLUMN agency_employee_no  VARCHAR(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER sss_no,
     ADD COLUMN height_m            DECIMAL(3,2) DEFAULT NULL AFTER blood_type,
     ADD COLUMN weight_kg           DECIMAL(5,2) DEFAULT NULL AFTER height_m,
     ADD COLUMN religion            VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER civil_status,
     ADD COLUMN disability          VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER religion,
     ADD COLUMN ethnic_group        VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER disability',
  'SELECT "columns already exists" AS status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
