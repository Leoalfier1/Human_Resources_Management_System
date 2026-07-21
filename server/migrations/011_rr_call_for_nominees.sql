-- ============================================================
-- Migration 011: Call for Nominees (R&R Stage 2)
-- ============================================================

CREATE TABLE IF NOT EXISTS `rr_award_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_nomination_calls` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `award_type_id` INT NOT NULL,
  `eligible_category` ENUM('teaching','teaching_related','non_teaching') NOT NULL,
  `nomination_opens` DATE DEFAULT NULL,
  `nomination_closes` DATE DEFAULT NULL,
  `criteria_summary` TEXT DEFAULT NULL,
  `status` ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
  `published_at` DATETIME DEFAULT NULL,
  `published_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rnc_award_type` (`award_type_id`),
  KEY `fk_rnc_published_by` (`published_by`),
  CONSTRAINT `fk_rnc_award_type` FOREIGN KEY (`award_type_id`) REFERENCES `rr_award_types` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_rnc_published_by` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_call_nominations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `call_id` INT NOT NULL,
  `nominee_user_id` INT DEFAULT NULL,
  `nominee_name` VARCHAR(255) NOT NULL,
  `nominee_category` ENUM('teaching','teaching_related','non_teaching') NOT NULL,
  `nominated_by_label` VARCHAR(150) DEFAULT NULL,
  `nominated_by_user_id` INT DEFAULT NULL,
  `submitted_at` DATETIME DEFAULT NULL,
  `status` ENUM('pending_review','under_evaluation','advanced','rejected') NOT NULL DEFAULT 'pending_review',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rcn_call` (`call_id`),
  KEY `fk_rcn_nominee_user` (`nominee_user_id`),
  KEY `fk_rcn_nominated_by` (`nominated_by_user_id`),
  CONSTRAINT `fk_rcn_call` FOREIGN KEY (`call_id`) REFERENCES `rr_nomination_calls` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rcn_nominee_user` FOREIGN KEY (`nominee_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rcn_nominated_by` FOREIGN KEY (`nominated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_call_nomination_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_id` INT NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_label` VARCHAR(150) DEFAULT NULL,
  `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rcnd_nomination` (`nomination_id`),
  CONSTRAINT `fk_rcnd_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default award types
INSERT INTO `rr_award_types` (`id`, `name`, `is_active`) VALUES
(1, 'Outstanding Teacher of the Year', 1),
(2, 'Outstanding Non-Teaching Personnel', 1),
(3, 'Loyalty Award (25 yrs)', 1),
(4, 'Service Award (10 yrs)', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
