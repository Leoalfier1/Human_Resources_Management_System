-- Migration 034: Employee Profile Change Requests
-- Adds a structured change-request table so employees can request profile edits
-- that require HR admin approval before being applied.

CREATE TABLE IF NOT EXISTS employee_profile_change_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT NOT NULL,
  user_id         INT NOT NULL,
  changes_json    JSON NOT NULL COMMENT 'Structured diff: {field: {old: ..., new: ...}}',
  reason          VARCHAR(500) DEFAULT NULL,
  status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by     INT DEFAULT NULL,
  reviewed_at     DATETIME DEFAULT NULL,
  review_notes    VARCHAR(500) DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_ecr_employee (employee_id),
  INDEX idx_ecr_status (status),
  CONSTRAINT fk_ecr_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_ecr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ecr_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
