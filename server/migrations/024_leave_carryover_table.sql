-- Migration 024: Create leave_carryover table for year-end balance snapshots
-- Each row is a point-in-time snapshot of one employee's balances for one fiscal year.

CREATE TABLE IF NOT EXISTS `leave_carryover` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `fiscal_year` YEAR NOT NULL
    COMMENT 'The year whose balances are being locked',
  -- Snapshot of balances at year-end
  `sick_leave_balance` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  `vacation_leave_balance` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  `forced_leave_balance` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  `special_privilege_balance` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  -- Usage during the year
  `sick_leave_used` DECIMAL(6,3) NOT NULL DEFAULT 0.000
    COMMENT 'Total sick leave days used in this fiscal year',
  `vacation_leave_used` DECIMAL(6,3) NOT NULL DEFAULT 0.000
    COMMENT 'Total vacation leave days used in this fiscal year',
  -- Days carried forward into next year (admin-adjustable)
  `sick_leave_carryover` DECIMAL(6,3) NOT NULL DEFAULT 0.000
    COMMENT 'Days carried into next year (per DepEd rules, max typically 10)',
  `vacation_leave_carryover` DECIMAL(6,3) NOT NULL DEFAULT 0.000
    COMMENT 'Days carried into next year (per DepEd rules, max typically 10)',
  -- Audit
  `locked_by` INT NOT NULL
    COMMENT 'user_id of the admin who triggered the lock',
  `locked_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_carryover_employee_year` (`employee_id`, `fiscal_year`),
  CONSTRAINT `fk_carryover_employee` FOREIGN KEY (`employee_id`)
    REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_carryover_user` FOREIGN KEY (`locked_by`)
    REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
