-- ============================================================
-- Migration 038: Add presiding_officer_other to rr_praise_meetings
-- ============================================================
-- Supports "Other Authorized Representative" as a presiding
-- officer option without creating a fake user row.
-- When set, presiding_officer_id should be NULL (mutually exclusive).

-- MySQL does not support ADD COLUMN IF NOT EXISTS, so we use a procedure.
DROP PROCEDURE IF EXISTS `add_presiding_officer_other`;
DELIMITER //
CREATE PROCEDURE `add_presiding_officer_other`()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'rr_praise_meetings'
        AND COLUMN_NAME = 'presiding_officer_other'
    ) THEN
        ALTER TABLE `rr_praise_meetings`
            ADD COLUMN `presiding_officer_other` VARCHAR(255) DEFAULT NULL
            AFTER `presiding_officer_id`;
    END IF;
END //
DELIMITER ;
CALL `add_presiding_officer_other`();
DROP PROCEDURE IF EXISTS `add_presiding_officer_other`;
