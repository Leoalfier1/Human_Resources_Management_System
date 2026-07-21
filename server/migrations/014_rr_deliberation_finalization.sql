-- ============================================================
-- Migration 014: Deliberation & Finalization (R&R Stage 5)
-- ============================================================

-- 1. Committee member votes per nomination
CREATE TABLE IF NOT EXISTS `rr_deliberation_votes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_id` INT NOT NULL,
  `committee_member_id` INT NOT NULL,
  `vote` ENUM('approve','hold','reject') NOT NULL,
  `voted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rdv_nomination_member` (`nomination_id`, `committee_member_id`),
  KEY `idx_rdv_nomination` (`nomination_id`),
  KEY `idx_rdv_member` (`committee_member_id`),
  CONSTRAINT `fk_rdv_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rdv_member` FOREIGN KEY (`committee_member_id`) REFERENCES `rr_praise_committee_members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add deliberation columns to rr_call_nominations
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rr_call_nominations'
    AND COLUMN_NAME = 'deliberation_status'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `rr_call_nominations`
     ADD COLUMN `deliberation_status` ENUM('pending','approved','on_hold','rejected') NOT NULL DEFAULT ''pending'' AFTER `status`,
     ADD COLUMN `final_rank` INT DEFAULT NULL AFTER `deliberation_status`,
     ADD COLUMN `finalized_at` DATETIME DEFAULT NULL AFTER `final_rank`,
     ADD COLUMN `finalized_by` INT DEFAULT NULL AFTER `finalized_at`,
     ADD KEY `fk_rcn_finalized_by` (`finalized_by`),
     ADD CONSTRAINT `fk_rcn_finalized_by` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`) ON DELETE SET NULL',
  'SELECT "deliberation columns already exist"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add is_locked flag to votes (to freeze voting after finalization)
SET @lock_col = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rr_deliberation_votes'
    AND COLUMN_NAME = 'is_locked'
);
SET @sql2 = IF(@lock_col = 0,
  'ALTER TABLE `rr_deliberation_votes` ADD COLUMN `is_locked` TINYINT(1) NOT NULL DEFAULT 0 AFTER `voted_at`',
  'SELECT "is_locked column already exists"'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
