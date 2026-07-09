-- ============================================================
-- Migration 003: Add 'teaching_related' to all ENUM columns
-- that previously only allowed 'teaching'/'non_teaching'
-- (or 'all'/'teaching'/'non_teaching' for L&D / R&R tables).
--
-- This is PURELY ADDITIVE — existing data is preserved.
-- ============================================================

-- 1. users.applicant_type
ALTER TABLE users
  MODIFY COLUMN `applicant_type`
    ENUM('teaching','non_teaching','teaching_related') DEFAULT NULL;

-- 2. vacancies.position_type
ALTER TABLE vacancies
  MODIFY COLUMN `position_type`
    ENUM('teaching','non_teaching','teaching_related') NOT NULL DEFAULT 'teaching';

-- 3. tna_forms.target_position_type
ALTER TABLE tna_forms
  MODIFY COLUMN `target_position_type`
    ENUM('all','teaching','non_teaching','teaching_related') NOT NULL DEFAULT 'all';

-- 4. ld_objectives.target_position_type
ALTER TABLE ld_objectives
  MODIFY COLUMN `target_position_type`
    ENUM('all','teaching','non_teaching','teaching_related') NOT NULL DEFAULT 'all';

-- 5. ld_programs.target_position_type
ALTER TABLE ld_programs
  MODIFY COLUMN `target_position_type`
    ENUM('all','teaching','non_teaching','teaching_related') NOT NULL DEFAULT 'all';

-- 6. ld_trainings.target_position_type (legacy table)
ALTER TABLE ld_trainings
  MODIFY COLUMN `target_position_type`
    ENUM('teaching','non_teaching','teaching_related','all') NOT NULL DEFAULT 'all';

-- 7. rr_searches.target_position_type
ALTER TABLE rr_searches
  MODIFY COLUMN `target_position_type`
    ENUM('all','teaching','non_teaching','teaching_related') NOT NULL DEFAULT 'all';

-- 8. rr_award_categories.position_type
ALTER TABLE rr_award_categories
  MODIFY COLUMN `position_type`
    ENUM('all','teaching','non_teaching','teaching_related') NOT NULL DEFAULT 'all';

-- 9. rr_nominations.position_type
ALTER TABLE rr_nominations
  MODIFY COLUMN `position_type`
    ENUM('teaching','non_teaching','teaching_related') NOT NULL;

-- 10. rr_evaluation_criteria.position_type
ALTER TABLE rr_evaluation_criteria
  MODIFY COLUMN `position_type`
    ENUM('teaching','non_teaching','teaching_related') NOT NULL;

-- 11. rr_awards.position_type
ALTER TABLE rr_awards
  MODIFY COLUMN `position_type`
    ENUM('teaching','non_teaching','teaching_related') NOT NULL;

-- 12. performance_commitments.position_type
ALTER TABLE performance_commitments
  MODIFY COLUMN `position_type`
    ENUM('teaching','non_teaching','teaching_related') NOT NULL DEFAULT 'teaching';

-- 13. rr_implementation_reports — add teaching_related_awardees column
ALTER TABLE rr_implementation_reports
  ADD COLUMN IF NOT EXISTS `teaching_related_awardees` INT NOT NULL DEFAULT 0
    AFTER `non_teaching_awardees`;

-- NOTE: employees.employment_type ALREADY includes 'teaching_related'
-- (ENUM('teaching','non-teaching','teaching_related')) — no change needed.
-- However, note the inconsistency: this table uses hyphen 'non-teaching'
-- while the rest of the system uses underscore 'non_teaching'. This is
-- a pre-existing issue and is out of scope for this migration.
