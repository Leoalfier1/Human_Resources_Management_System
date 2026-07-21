-- ============================================================
-- Migration 013: Validation & Interview (R&R Stage 4)
-- ============================================================

-- 1. Configurable criteria per award type
CREATE TABLE IF NOT EXISTS `rr_validation_criteria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `award_type_id` INT NOT NULL,
  `criterion_label` VARCHAR(255) NOT NULL,
  `weight_percent` DECIMAL(5,2) NOT NULL,
  `max_raw_score` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `display_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_rvc_award_type` (`award_type_id`),
  CONSTRAINT `fk_rvc_award_type` FOREIGN KEY (`award_type_id`) REFERENCES `rr_award_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Per-criterion scores per nomination
CREATE TABLE IF NOT EXISTS `rr_validation_scores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_id` INT NOT NULL,
  `criterion_id` INT NOT NULL,
  `raw_score` DECIMAL(5,2) DEFAULT NULL,
  `scored_by` INT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rvs_nomination_criterion` (`nomination_id`, `criterion_id`),
  KEY `idx_rvs_nomination` (`nomination_id`),
  KEY `idx_rvs_criterion` (`criterion_id`),
  KEY `idx_rvs_scored_by` (`scored_by`),
  CONSTRAINT `fk_rvs_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rvs_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `rr_validation_criteria` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rvs_scored_by` FOREIGN KEY (`scored_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Interview notes + cached weighted total per nomination
CREATE TABLE IF NOT EXISTS `rr_validation_interviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_id` INT NOT NULL,
  `interview_notes` TEXT DEFAULT NULL,
  `weighted_total` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('in_progress','saved') NOT NULL DEFAULT 'in_progress',
  `last_saved_at` DATETIME DEFAULT NULL,
  `last_saved_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rvi_nomination` (`nomination_id`),
  KEY `idx_rvi_last_saved_by` (`last_saved_by`),
  CONSTRAINT `fk_rvi_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rvi_last_saved_by` FOREIGN KEY (`last_saved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED: Validation criteria for Award Type 1
-- Outstanding Teacher of the Year (Teaching category)
-- ============================================================

INSERT INTO `rr_validation_criteria`
  (`award_type_id`, `criterion_label`, `weight_percent`, `max_raw_score`, `display_order`)
VALUES
  (1, 'Academic Performance & Output',                40.00, 10.00, 1),
  (1, 'Research & Publications',                      15.00, 10.00, 2),
  (1, 'Community Extension Services',                 10.00, 10.00, 3),
  (1, 'Student Performance & Feedback',               15.00, 10.00, 4),
  (1, 'Co-Curricular & Administrative Involvement',   10.00, 10.00, 5),
  (1, 'Professional Development & Trainings',         10.00, 10.00, 6)
ON DUPLICATE KEY UPDATE
  `criterion_label` = VALUES(`criterion_label`),
  `weight_percent`  = VALUES(`weight_percent`),
  `max_raw_score`   = VALUES(`max_raw_score`),
  `display_order`   = VALUES(`display_order`);

-- ============================================================
-- SEED: Validation criteria for Award Type 2
-- Outstanding Non-Teaching Personnel
-- ============================================================

INSERT INTO `rr_validation_criteria`
  (`award_type_id`, `criterion_label`, `weight_percent`, `max_raw_score`, `display_order`)
VALUES
  (2, 'Job Performance & Output Quality',             35.00, 10.00, 1),
  (2, 'Efficiency & Initiative',                      20.00, 10.00, 2),
  (2, 'Interpersonal & Communication Skills',         15.00, 10.00, 3),
  (2, 'Adherence to Policies & Procedures',           15.00, 10.00, 4),
  (2, 'Professional Development & Trainings',         15.00, 10.00, 5)
ON DUPLICATE KEY UPDATE
  `criterion_label` = VALUES(`criterion_label`),
  `weight_percent`  = VALUES(`weight_percent`),
  `max_raw_score`   = VALUES(`max_raw_score`),
  `display_order`   = VALUES(`display_order`);

-- ============================================================
-- SEED: Validation criteria for Award Type 3 & 4
-- Loyalty Award / Service Award (simplified criteria)
-- ============================================================

INSERT INTO `rr_validation_criteria`
  (`award_type_id`, `criterion_label`, `weight_percent`, `max_raw_score`, `display_order`)
VALUES
  (3, 'Length of Service & Loyalty',                  40.00, 10.00, 1),
  (3, 'Consistent Performance Record',                30.00, 10.00, 2),
  (3, 'Contribution to the Organization',             30.00, 10.00, 3),
  (4, 'Length of Service & Loyalty',                  40.00, 10.00, 1),
  (4, 'Consistent Performance Record',                30.00, 10.00, 2),
  (4, 'Contribution to the Organization',             30.00, 10.00, 3)
ON DUPLICATE KEY UPDATE
  `criterion_label` = VALUES(`criterion_label`),
  `weight_percent`  = VALUES(`weight_percent`),
  `max_raw_score`   = VALUES(`max_raw_score`),
  `display_order`   = VALUES(`display_order`);
