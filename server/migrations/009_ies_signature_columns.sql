-- ============================================================
-- Migration 009: Add signature name columns to ies_evaluations
-- ============================================================

-- Add applicant signature name column (typed name for digital attestation)
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ies_evaluations'
      AND COLUMN_NAME = 'attested_by_applicant_signature_name'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE ies_evaluations ADD COLUMN attested_by_applicant_signature_name VARCHAR(200) DEFAULT NULL AFTER attested_by_applicant_at',
    'SELECT "Column attested_by_applicant_signature_name already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add chair signature name column (typed name + credentials for digital attestation)
SET @col_exists2 = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ies_evaluations'
      AND COLUMN_NAME = 'attested_by_chair_signature_name'
);
SET @sql2 = IF(@col_exists2 = 0,
    'ALTER TABLE ies_evaluations ADD COLUMN attested_by_chair_signature_name VARCHAR(200) DEFAULT NULL AFTER attested_by_chair_at',
    'SELECT "Column attested_by_chair_signature_name already exists"'
);
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;
