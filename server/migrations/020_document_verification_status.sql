-- ============================================================
-- Migration 020: Document Verification Status & Revision Tracking
-- Extends application_documents with verification_status ENUM,
-- revision tracking fields, and verification audit fields.
-- ============================================================

ALTER TABLE `application_documents`
  ADD COLUMN `verification_status` ENUM('not_submitted','pending_review','verified','needs_revision','superseded')
    NOT NULL DEFAULT 'pending_review'
    AFTER `is_verified`,
  ADD COLUMN `verification_note` TEXT NULL
    AFTER `verification_status`,
  ADD COLUMN `verified_by` INT NULL
    AFTER `verification_note`,
  ADD COLUMN `verified_at` DATETIME NULL
    AFTER `verified_by`,
  ADD COLUMN `revision_note` TEXT NULL
    AFTER `verified_at`,
  ADD COLUMN `revision_requested_by` INT NULL
    AFTER `revision_note`,
  ADD COLUMN `revision_requested_at` DATETIME NULL
    AFTER `revision_requested_by`;

-- Backfill: set verification_status based on existing is_verified flag
UPDATE `application_documents`
   SET `verification_status` = IF(`is_verified` = 1, 'verified', 'pending_review');

-- Add FK constraints (ignore if already exist via safe naming)
SET @exists_vb = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                  WHERE CONSTRAINT_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'application_documents'
                    AND CONSTRAINT_NAME = 'fk_ad_verified_by');
SET @exists_rb = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                  WHERE CONSTRAINT_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'application_documents'
                    AND CONSTRAINT_NAME = 'fk_ad_revision_requested_by');

SET @sql_vb = IF(@exists_vb = 0,
  'ALTER TABLE `application_documents` ADD CONSTRAINT `fk_ad_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL',
  'SELECT 1');
SET @sql_rb = IF(@exists_rb = 0,
  'ALTER TABLE `application_documents` ADD CONSTRAINT `fk_ad_revision_requested_by` FOREIGN KEY (`revision_requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL',
  'SELECT 1');

PREPARE stmt_vb FROM @sql_vb; EXECUTE stmt_vb; DEALLOCATE PREPARE stmt_vb;
PREPARE stmt_rb FROM @sql_rb; EXECUTE stmt_rb; DEALLOCATE PREPARE stmt_rb;

-- Sync is_verified = 1 when verification_status = 'verified' (trigger-like safety)
-- This keeps the legacy boolean in sync for any code still reading is_verified directly
UPDATE `application_documents`
   SET `is_verified` = 1
 WHERE `verification_status` = 'verified';
UPDATE `application_documents`
   SET `is_verified` = 0
 WHERE `verification_status` IN ('pending_review', 'needs_revision', 'not_submitted', 'superseded');
