-- ============================================================
-- Migration 010: PRAISE Committee Meeting (R&R Stage 1)
-- ============================================================

CREATE TABLE IF NOT EXISTS `rr_praise_meetings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `meeting_date` DATETIME DEFAULT NULL,
  `venue` VARCHAR(255) DEFAULT NULL,
  `presiding_officer_id` INT DEFAULT NULL,
  `status` ENUM('draft','finalized') NOT NULL DEFAULT 'draft',
  `minutes` TEXT DEFAULT NULL,
  `finalized_at` DATETIME DEFAULT NULL,
  `finalized_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pm_presiding` (`presiding_officer_id`),
  KEY `fk_pm_finalized_by` (`finalized_by`),
  CONSTRAINT `fk_pm_presiding` FOREIGN KEY (`presiding_officer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pm_finalized_by` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_praise_committee_members` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `role_label` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fk_pcm_user` (`user_id`),
  CONSTRAINT `fk_pcm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_meeting_attendance` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `meeting_id` INT NOT NULL,
  `committee_member_id` INT NOT NULL,
  `is_present` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ma_meeting_member` (`meeting_id`, `committee_member_id`),
  KEY `fk_ma_meeting` (`meeting_id`),
  KEY `fk_ma_member` (`committee_member_id`),
  CONSTRAINT `fk_ma_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `rr_praise_meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ma_member` FOREIGN KEY (`committee_member_id`) REFERENCES `rr_praise_committee_members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_meeting_agenda_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `meeting_id` INT NOT NULL,
  `item_text` VARCHAR(500) NOT NULL,
  `is_resolved` TINYINT(1) NOT NULL DEFAULT 0,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mai_meeting` (`meeting_id`),
  CONSTRAINT `fk_mai_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `rr_praise_meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
