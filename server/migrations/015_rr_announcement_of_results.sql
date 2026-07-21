-- ============================================================
-- Migration 015: Announcement of Results (R&R Stage 6)
-- ============================================================

-- 1. Announcement settings per nomination call (cycle)
CREATE TABLE IF NOT EXISTS `rr_announcements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_call_id` INT NOT NULL,
  `memo_file_path` VARCHAR(500) DEFAULT NULL,
  `notify_all_nominees` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_awardees_only` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_dept_heads` TINYINT(1) NOT NULL DEFAULT 0,
  `notify_all_personnel` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('draft','published') NOT NULL DEFAULT 'draft',
  `published_at` DATETIME DEFAULT NULL,
  `published_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ran_nomination_call` (`nomination_call_id`),
  KEY `idx_ran_published_by` (`published_by`),
  CONSTRAINT `fk_ran_nomination_call` FOREIGN KEY (`nomination_call_id`) REFERENCES `rr_nomination_calls` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ran_published_by` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Audit trail for dispatched notifications
CREATE TABLE IF NOT EXISTS `rr_announcement_notifications_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `announcement_id` INT NOT NULL,
  `recipient_user_id` INT DEFAULT NULL,
  `recipient_group` VARCHAR(50) NOT NULL,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ranl_announcement` (`announcement_id`),
  KEY `idx_ranl_recipient` (`recipient_user_id`),
  CONSTRAINT `fk_ranl_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `rr_announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ranl_recipient` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
