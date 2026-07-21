-- Migration 023: Create signatories table for authorized officials
-- Stores name, position, designation, and digital signature image

CREATE TABLE IF NOT EXISTS `signatories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `position` VARCHAR(255) NOT NULL
    COMMENT 'e.g. Schools Division Superintendent, Administrative Officer',
  `designation` VARCHAR(255) DEFAULT NULL
    COMMENT 'Additional designation or office assignment',
  `signature_path` VARCHAR(500) DEFAULT NULL
    COMMENT 'Path to uploaded signature image: /uploads/signatories/SIG-{ts}-{rand}.{ext}',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
