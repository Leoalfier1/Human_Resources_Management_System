-- ============================================================
-- Migration 019: Create rsp_mqs_criteria table
-- Stores the four Qualification Standards per vacancy
-- used by the Initial Evaluation Result (IER) header block
-- (Annex D, DO 007, s. 2023)
-- ============================================================

CREATE TABLE IF NOT EXISTS `rsp_mqs_criteria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT NOT NULL,
  `education` TEXT DEFAULT NULL,
  `training` TEXT DEFAULT NULL,
  `experience` TEXT DEFAULT NULL,
  `eligibility` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mqs_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_mqs_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
