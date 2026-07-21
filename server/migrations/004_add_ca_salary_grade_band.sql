-- ============================================================
-- Migration 004: Add salary_grade_band to CA criteria.
--
-- Non-destructive: preserves legacy category-based criteria,
-- scores, and results so in-progress assessments are not dropped.
-- Official DO 007 s. 2023 rubrics will seed rows per vacancy + SG band.
-- ============================================================

ALTER TABLE comparative_assessment_criteria
  ADD COLUMN IF NOT EXISTS `salary_grade_band`
    ENUM('general_services','sg1_9','sg10_22_27','sg24_chief','sg11_15','sg16_23_27','teaching_flat')
    DEFAULT NULL
    AFTER `category`;

CREATE INDEX IF NOT EXISTS `idx_cac_vacancy_sg_band`
  ON comparative_assessment_criteria (`vacancy_id`, `salary_grade_band`);
