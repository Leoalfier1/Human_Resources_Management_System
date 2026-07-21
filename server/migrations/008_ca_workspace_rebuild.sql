-- ============================================================
-- Migration 008: Comparative Assessment Workspace Rebuild
-- Adds ca_sessions for draft/submit lifecycle, ensures
-- comparative_assessment_scores has updated_at, and extends
-- comparative_assessment_criteria with section_weight_percent.
-- ============================================================

-- 1. Create ca_sessions table for draft/submit lifecycle
CREATE TABLE IF NOT EXISTS `ca_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT NOT NULL,
  `status` ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  `submitted_by` INT DEFAULT NULL,
  `submitted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ca_session_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_casession_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_casession_submitter` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Ensure comparative_assessment_scores has updated_at column
SET @hasUpdatedAt := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'comparative_assessment_scores'
    AND COLUMN_NAME = 'updated_at'
    AND TABLE_SCHEMA = DATABASE()
);
SET @sql := IF(@hasUpdatedAt = 0,
  'ALTER TABLE comparative_assessment_scores ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `scored_at`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Ensure comparative_assessment_criteria has section_weight_percent column
SET @hasSectionWeight := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'comparative_assessment_criteria'
    AND COLUMN_NAME = 'section_weight_percent'
    AND TABLE_SCHEMA = DATABASE()
);
SET @sql2 := IF(@hasSectionWeight = 0,
  'ALTER TABLE comparative_assessment_criteria ADD COLUMN `section_weight_percent` DECIMAL(5,2) DEFAULT NULL AFTER `section_label`',
  'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 4. Ensure ca_sessions index for quick vacancy lookups
SET @hasIndex := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_NAME = 'ca_sessions'
    AND INDEX_NAME = 'idx_casession_vacancy'
    AND TABLE_SCHEMA = DATABASE()
);
SET @sql3 := IF(@hasIndex = 0,
  'CREATE INDEX idx_casession_vacancy ON ca_sessions (vacancy_id, status)',
  'SELECT 1');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
