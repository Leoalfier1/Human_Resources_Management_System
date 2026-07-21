-- ============================================================
-- Migration 012: Preliminary Evaluation (R&R Stage 3)
-- ============================================================

-- 1. Document requirements per award type (configurable checklist)
CREATE TABLE IF NOT EXISTS `rr_award_document_requirements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `award_type_id` INT NOT NULL,
  `document_label` VARCHAR(255) NOT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_required` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_radr_award_type` (`award_type_id`),
  CONSTRAINT `fk_radr_award_type` FOREIGN KEY (`award_type_id`) REFERENCES `rr_award_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add requirement_id to rr_call_nomination_documents (link uploaded doc to a requirement)
--    Only add if column doesn't already exist (idempotent)
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rr_call_nomination_documents'
    AND COLUMN_NAME = 'requirement_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `rr_call_nomination_documents` ADD COLUMN `requirement_id` INT DEFAULT NULL AFTER `nomination_id`,
   ADD KEY `fk_rcnd_requirement` (`requirement_id`),
   ADD CONSTRAINT `fk_rcnd_requirement` FOREIGN KEY (`requirement_id`) REFERENCES `rr_award_document_requirements` (`id`) ON DELETE SET NULL',
  'SELECT "requirement_id column already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add flag + preliminary_status columns to rr_call_nominations
SET @flag_col = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rr_call_nominations'
    AND COLUMN_NAME = 'is_flagged'
);
SET @sql2 = IF(@flag_col = 0,
  'ALTER TABLE `rr_call_nominations`
     ADD COLUMN `is_flagged` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`,
     ADD COLUMN `flagged_note` TEXT DEFAULT NULL AFTER `is_flagged`,
     ADD COLUMN `flagged_at` DATETIME DEFAULT NULL AFTER `flagged_note`,
     ADD COLUMN `flagged_by` INT DEFAULT NULL AFTER `flagged_at`,
     ADD KEY `fk_rcn_flagged_by` (`flagged_by`),
     ADD CONSTRAINT `fk_rcn_flagged_by` FOREIGN KEY (`flagged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL',
  'SELECT "flag columns already exist"'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 4. Seed document requirements for each award type

-- Award Type 1: Outstanding Teacher of the Year
INSERT INTO `rr_award_document_requirements` (`award_type_id`, `document_label`, `display_order`, `is_required`) VALUES
(1, 'Personal Data Sheet (CS Form 212)', 1, 1),
(1, 'Service Record', 2, 1),
(1, 'Performance Rating (last 2 semesters)', 3, 1),
(1, 'Certificate of No Pending Case', 4, 1),
(1, 'Accomplishment Report', 5, 1),
(1, 'Supporting Documents / Citations', 6, 1)
ON DUPLICATE KEY UPDATE `document_label` = VALUES(`document_label`);

-- Award Type 2: Outstanding Non-Teaching Personnel
INSERT INTO `rr_award_document_requirements` (`award_type_id`, `document_label`, `display_order`, `is_required`) VALUES
(2, 'Personal Data Sheet (CS Form 212)', 1, 1),
(2, 'Service Record', 2, 1),
(2, 'Performance Rating (last 2 semesters)', 3, 1),
(2, 'Certificate of No Pending Case', 4, 1),
(2, 'Accomplishment Report', 5, 1),
(2, 'Supporting Documents / Citations', 6, 1)
ON DUPLICATE KEY UPDATE `document_label` = VALUES(`document_label`);

-- Award Type 3: Loyalty Award (25 yrs)
INSERT INTO `rr_award_document_requirements` (`award_type_id`, `document_label`, `display_order`, `is_required`) VALUES
(3, 'Personal Data Sheet (CS Form 212)', 1, 1),
(3, 'Service Record (25 years continuous)', 2, 1),
(3, 'Certificate of No Pending Case', 3, 1),
(3, 'Agency Certification of Employment', 4, 1)
ON DUPLICATE KEY UPDATE `document_label` = VALUES(`document_label`);

-- Award Type 4: Service Award (10 yrs)
INSERT INTO `rr_award_document_requirements` (`award_type_id`, `document_label`, `display_order`, `is_required`) VALUES
(4, 'Personal Data Sheet (CS Form 212)', 1, 1),
(4, 'Service Record (10 years continuous)', 2, 1),
(4, 'Certificate of No Pending Case', 3, 1),
(4, 'Agency Certification of Employment', 4, 1)
ON DUPLICATE KEY UPDATE `document_label` = VALUES(`document_label`);
