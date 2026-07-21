-- Migration 025: Extend document_requests for DepEd SDO Dapitan City request form
-- Adds category/sub-type structure, contact_no, purpose, retrieval fields, e-signature

-- ─────────────────────────────────────────────────
-- 1. Add new columns (nullable, safe for existing rows)
-- ─────────────────────────────────────────────────
ALTER TABLE `document_requests`
  ADD COLUMN `request_category` VARCHAR(50) DEFAULT NULL
    COMMENT 'Official category: service_record, retrieval_of_folders, certificate_of_employment, service_credits, personnel_forms, other'
    AFTER `employee_id`,
  ADD COLUMN `request_subtype` VARCHAR(255) DEFAULT NULL
    COMMENT 'Sub-select: Promotion, CTC of NOSI, etc.'
    AFTER `request_category`,
  ADD COLUMN `contact_no` VARCHAR(30) DEFAULT NULL
    COMMENT 'Requester contact number'
    AFTER `request_subtype`,
  ADD COLUMN `purpose` TEXT DEFAULT NULL
    COMMENT 'Purpose of request (required for new submissions, enforced at app layer)'
    AFTER `contact_no`,
  ADD COLUMN `position_applied` VARCHAR(255) DEFAULT NULL
    COMMENT 'Conditional: only for retrieval_of_folders'
    AFTER `purpose`,
  ADD COLUMN `date_applied` DATE DEFAULT NULL
    COMMENT 'Conditional: only for retrieval_of_folders'
    AFTER `position_applied`,
  ADD COLUMN `esignature_consented` TINYINT(1) DEFAULT 0
    COMMENT 'E-signature consent checkbox'
    AFTER `date_applied`,
  ADD COLUMN `esignature_ip` VARCHAR(45) DEFAULT NULL
    AFTER `esignature_consented`,
  ADD COLUMN `esignature_timestamp` DATETIME DEFAULT NULL
    AFTER `esignature_ip`;

-- ─────────────────────────────────────────────────
-- 2. Backfill request_category from old request_type
-- ─────────────────────────────────────────────────
UPDATE `document_requests` SET `request_category` = 'service_record'               WHERE `request_type` = 'service_record';
UPDATE `document_requests` SET `request_category` = 'certificate_of_employment'    WHERE `request_type` IN ('coe', 'coe_with_compensation');

-- CoE with compensation → mark in subtype
UPDATE `document_requests` SET `request_subtype` = 'with_compensation'             WHERE `request_type` = 'coe_with_compensation';

-- Three old values with no direct equivalent → 'other'
UPDATE `document_requests` SET `request_category` = 'other'                        WHERE `request_type` IN ('id_replacement', 'correction_personal_info', 'employment_verification');

-- Plain 'other' stays 'other'
UPDATE `document_requests` SET `request_category` = 'other'                        WHERE `request_type` = 'other';

-- ─────────────────────────────────────────────────
-- 3. Backfill purpose from details (nullable-safe)
--    For 'other' category with old edge-case types, prepend the original type label
-- ─────────────────────────────────────────────────

-- service_record → purpose = details
UPDATE `document_requests` SET `purpose` = `details`
  WHERE `request_category` = 'service_record' AND `purpose` IS NULL;

-- coe / coe_with_compensation → purpose = details
UPDATE `document_requests` SET `purpose` = `details`
  WHERE `request_category` = 'certificate_of_employment' AND `purpose` IS NULL;

-- id_replacement → purpose = 'ID Replacement — [details]'
UPDATE `document_requests` SET `purpose` = CONCAT('ID Replacement — ', COALESCE(`details`, ''))
  WHERE `request_type` = 'id_replacement' AND `purpose` IS NULL;

-- correction_personal_info → purpose = 'Correction of Personal Info — [details]'
UPDATE `document_requests` SET `purpose` = CONCAT('Correction of Personal Info — ', COALESCE(`details`, ''))
  WHERE `request_type` = 'correction_personal_info' AND `purpose` IS NULL;

-- employment_verification → purpose = 'Employment Verification — [details]'
UPDATE `document_requests` SET `purpose` = CONCAT('Employment Verification — ', COALESCE(`details`, ''))
  WHERE `request_type` = 'employment_verification' AND `purpose` IS NULL;

-- plain other → purpose = details
UPDATE `document_requests` SET `purpose` = `details`
  WHERE `request_type` = 'other' AND `request_category` = 'other' AND `purpose` IS NULL
    AND `request_type` NOT IN ('id_replacement', 'correction_personal_info', 'employment_verification');

-- ─────────────────────────────────────────────────
-- 4. Drop old request_type ENUM column (all data migrated)
-- ─────────────────────────────────────────────────
ALTER TABLE `document_requests` DROP COLUMN `request_type`;
