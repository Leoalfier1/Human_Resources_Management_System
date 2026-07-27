-- Migration 006: Pre-Test & Post-Test Questions and Submissions for PD Programs

CREATE TABLE IF NOT EXISTS `ld_program_questions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `program_id` INT NOT NULL,
  `test_type` ENUM('pre_test', 'post_test') NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('multiple_choice', 'true_false') NOT NULL DEFAULT 'multiple_choice',
  `options` JSON DEFAULT NULL,
  `correct_answer` VARCHAR(255) NOT NULL,
  `order_no` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_pq_program_test` (`program_id`, `test_type`),
  CONSTRAINT `fk_ld_pq_program` FOREIGN KEY (`program_id`) REFERENCES `ld_programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_program_test_submissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `program_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `test_type` ENUM('pre_test', 'post_test') NOT NULL,
  `score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `total_questions` INT NOT NULL DEFAULT 0,
  `correct_count` INT NOT NULL DEFAULT 0,
  `answers` JSON DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_program_test` (`user_id`, `program_id`, `test_type`),
  KEY `idx_ld_pts_user` (`user_id`),
  CONSTRAINT `fk_ld_pts_program` FOREIGN KEY (`program_id`) REFERENCES `ld_programs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ld_pts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
