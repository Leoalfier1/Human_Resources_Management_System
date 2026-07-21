-- ============================================================
-- Migration 016: Awarding Ceremony (R&R Stage 7)
-- ============================================================

-- 1. Event logistics per nomination call (cycle)
CREATE TABLE IF NOT EXISTS `rr_ceremonies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_call_id` INT NOT NULL,
  `ceremony_datetime` DATETIME DEFAULT NULL,
  `venue` VARCHAR(255) DEFAULT NULL,
  `program_theme` VARCHAR(255) DEFAULT NULL,
  `master_of_ceremonies_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rrceremo_nomination_call` (`nomination_call_id`),
  KEY `idx_rrceremo_moc` (`master_of_ceremonies_id`),
  CONSTRAINT `fk_rrceremo_nomination_call` FOREIGN KEY (`nomination_call_id`) REFERENCES `rr_nomination_calls` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrceremo_moc` FOREIGN KEY (`master_of_ceremonies_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Photo gallery per ceremony
CREATE TABLE IF NOT EXISTS `rr_ceremony_photos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ceremony_id` INT NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rrcph_ceremony` (`ceremony_id`),
  KEY `idx_rrcph_uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_rrcph_ceremony` FOREIGN KEY (`ceremony_id`) REFERENCES `rr_ceremonies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrcph_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Per-awardee attendance / cert / plaque tracking
CREATE TABLE IF NOT EXISTS `rr_awardee_ceremony_status` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_id` INT NOT NULL,
  `ceremony_id` INT NOT NULL,
  `attendance_confirmed` TINYINT(1) NOT NULL DEFAULT 0,
  `certificate_status` ENUM('pending','printed','distributed') NOT NULL DEFAULT 'pending',
  `plaque_status` ENUM('pending','printed','distributed') NOT NULL DEFAULT 'pending',
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rracs_nomination` (`nomination_id`),
  KEY `idx_rracs_ceremony` (`ceremony_id`),
  CONSTRAINT `fk_rracs_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rracs_ceremony` FOREIGN KEY (`ceremony_id`) REFERENCES `rr_ceremonies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
