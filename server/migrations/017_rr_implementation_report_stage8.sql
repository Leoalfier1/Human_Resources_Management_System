-- ============================================================
-- Migration 017: Implementation Report (R&R Stage 8)
-- ============================================================

-- Add new columns to existing rr_implementation_reports table
-- (table already has: id, search_id, generated_by, generated_at,
--  total_nominees, total_awardees, teaching_awardees,
--  non_teaching_awardees, teaching_related_awardees, report_data)

-- 1. Add nomination_call_id for the new cycle-based paradigm
SET @col1 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rr_implementation_reports'
    AND COLUMN_NAME = 'nomination_call_id'
);
SET @sql1 = IF(@col1 = 0,
  'ALTER TABLE `rr_implementation_reports`
     ADD COLUMN `nomination_call_id` INT DEFAULT NULL AFTER `search_id`,
     ADD KEY `idx_rrir_nomination_call` (`nomination_call_id`),
     ADD CONSTRAINT `fk_rrir_nomination_call` FOREIGN KEY (`nomination_call_id`)
       REFERENCES `rr_nomination_calls` (`id`) ON DELETE CASCADE',
  'SELECT "nomination_call_id already exists"'
);
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- 2. Add narrative_report TEXT column
SET @col2 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rr_implementation_reports'
    AND COLUMN_NAME = 'narrative_report'
);
SET @sql2 = IF(@col2 = 0,
  'ALTER TABLE `rr_implementation_reports` ADD COLUMN `narrative_report` TEXT DEFAULT NULL AFTER `report_data`',
  'SELECT "narrative_report already exists"'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 3. Add budget columns
SET @col3 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rr_implementation_reports'
    AND COLUMN_NAME = 'budget_allocated'
);
SET @sql3 = IF(@col3 = 0,
  'ALTER TABLE `rr_implementation_reports`
     ADD COLUMN `budget_allocated` DECIMAL(10,2) DEFAULT NULL AFTER `narrative_report`,
     ADD COLUMN `budget_utilized` DECIMAL(10,2) DEFAULT NULL AFTER `budget_allocated`',
  'SELECT "budget columns already exist"'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- 4. Add status + submission columns
SET @col4 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rr_implementation_reports'
    AND COLUMN_NAME = 'status'
);
SET @sql4 = IF(@col4 = 0,
  'ALTER TABLE `rr_implementation_reports`
     ADD COLUMN `status` ENUM('draft','submitted') NOT NULL DEFAULT ''draft'' AFTER `budget_utilized`,
     ADD COLUMN `submitted_at` DATETIME DEFAULT NULL AFTER `status`,
     ADD COLUMN `submitted_by` INT DEFAULT NULL AFTER `submitted_at`,
     ADD KEY `idx_rrir_submitted_by` (`submitted_by`),
     ADD CONSTRAINT `fk_rrir_submitted_by` FOREIGN KEY (`submitted_by`)
       REFERENCES `users` (`id`) ON DELETE SET NULL',
  'SELECT "status columns already exists"'
);
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;
