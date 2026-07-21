-- Migration 031: Add Annex E letter override columns to applications
-- Stores per-letter-instance recipient details that do NOT modify the master applicant profile.
-- When NULL, the Annex E payload falls back to PDS-derived values.

ALTER TABLE `applications`
  ADD COLUMN `letter_salutation` VARCHAR(10) DEFAULT NULL
    COMMENT 'Salutation for Annex E letter: Mr., Ms., or Mrs.',
  ADD COLUMN `letter_last_name` VARCHAR(255) DEFAULT NULL
    COMMENT 'Recipient last name override for Annex E letter',
  ADD COLUMN `letter_first_name` VARCHAR(255) DEFAULT NULL
    COMMENT 'Recipient first name + middle initial override for Annex E letter',
  ADD COLUMN `letter_address` TEXT DEFAULT NULL
    COMMENT 'Recipient address override for Annex E letter',
  ADD COLUMN `letter_date` DATE DEFAULT NULL
    COMMENT 'Date printed on the Annex E letter (defaults to today if null)';
