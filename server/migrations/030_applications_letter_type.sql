-- Migration 030: Add letter_type and advice_sent_at to applications for Annex E advice tracking
-- letter_type: 'qualified' | 'disqualified' — overrides default derivation from status when set
-- advice_sent_at: timestamp when the Annex E letter was emailed to the applicant

ALTER TABLE `applications`
  ADD COLUMN IF NOT EXISTS `letter_type` ENUM('qualified','disqualified') DEFAULT NULL
    COMMENT 'Admin-overridden letter type for Annex E. NULL = derive from application status.',
  ADD COLUMN IF NOT EXISTS `advice_sent_at` DATETIME DEFAULT NULL
    COMMENT 'Timestamp when Annex E advice letter was emailed to the applicant';
