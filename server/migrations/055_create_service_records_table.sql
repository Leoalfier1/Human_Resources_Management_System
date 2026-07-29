-- Migration 055: Create service_records table
-- Stores one row per appointment entry in an employee's service history.
-- Seeded automatically by issueAppointment() when an appointment is issued
-- via the RSP pipeline.

CREATE TABLE IF NOT EXISTS `service_records` (
  `id`                   INT           NOT NULL AUTO_INCREMENT,
  `employee_id`          INT           NOT NULL COMMENT 'FK → employees.id',
  `user_id`              INT           NOT NULL COMMENT 'FK → users.id (redundant shortcut for portal queries)',
  `date_from`            DATE          NOT NULL COMMENT 'Effective start date of this entry',
  `date_to`              DATE          DEFAULT NULL COMMENT 'NULL = still in service / current position',
  `designation`          VARCHAR(255)  NOT NULL COMMENT 'Position title at time of appointment',
  `employment_status`    VARCHAR(100)  NOT NULL DEFAULT 'Permanent' COMMENT 'Permanent / Temporary / Casual…',
  `monthly_salary`       DECIMAL(12,2) DEFAULT NULL,
  `station_office`       VARCHAR(255)  DEFAULT NULL COMMENT 'School / office assigned',
  `branch`               VARCHAR(100)  DEFAULT 'DepEd',
  `lv_abs_without_pay`   VARCHAR(50)   NOT NULL DEFAULT 'NONE' COMMENT 'Leave/absence without pay',
  `separation_date_cause` VARCHAR(255) DEFAULT NULL COMMENT 'NULL while still in service',
  `remarks`              TEXT          DEFAULT NULL,
  `created_at`           TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sr_employee` (`employee_id`),
  KEY `idx_sr_user`     (`user_id`),
  CONSTRAINT `fk_sr_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sr_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`     (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
