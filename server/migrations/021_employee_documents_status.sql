-- Migration 021: Add status ENUM to employee_documents for 201 File checklist workflow
-- Supports: pending (default), approved, rejected (with remarks for rejection reason)

ALTER TABLE `employee_documents`
  ADD COLUMN `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'
  AFTER `is_verified`;

-- Backfill from existing is_verified boolean
UPDATE `employee_documents` SET `status` = 'approved' WHERE `is_verified` = 1;
UPDATE `employee_documents` SET `status` = 'pending' WHERE `is_verified` = 0;
