-- ============================================================
-- Migration 007: Complete flat rubric support for CA workspace
-- Extends the category ENUM, adds display_order, and seeds
-- teaching_related/non_teaching criteria FROM ies_weight_templates
-- to keep CA and IES weight configs in sync.
-- ============================================================

-- 1. Extend category ENUM to include 'comparative_flat'
ALTER TABLE comparative_assessment_criteria
  MODIFY COLUMN `category` ENUM(
    'classroom_observable','non_classroom_observable','document_evaluation','comparative_flat'
  ) DEFAULT NULL;

-- 2. Add display_order column if not already present
SET @hasDisplayOrder := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'comparative_assessment_criteria'
    AND COLUMN_NAME = 'display_order'
    AND TABLE_SCHEMA = DATABASE()
);
SET @sql := IF(@hasDisplayOrder = 0,
  'ALTER TABLE comparative_assessment_criteria ADD COLUMN `display_order` INT DEFAULT NULL AFTER `max_score`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Seed CA criteria for every existing vacancy that has a flat rubric
--    (teaching_related or non_teaching) AND does not already have seeded
--    criteria with salary_grade_band matching its resolved bracket.
--
--    This is a one-time catch-up so existing vacancies get rows without
--    waiting for the controller seed-on-demand path.

-- Helper: map bracket_key -> salary_grade_band
-- We do this per bracket using INSERT ... SELECT FROM ies_weight_templates
-- joined to vacancies that need seeding.

-- teaching_related, SG_11_15
INSERT INTO comparative_assessment_criteria
  (vacancy_id, category, salary_grade_band, section_key, section_label, section_weight_percent,
   sub_criterion_label, weight_percent, max_score, display_order)
SELECT
  v.id,
  'comparative_flat',
  'sg11_15',
  NULL, NULL, NULL,
  iwt.criteria_key,
  iwt.max_points,
  iwt.max_points,
  iwt.display_order
FROM vacancies v
CROSS JOIN ies_weight_templates iwt
WHERE v.position_type = 'teaching_related'
  AND v.salary_grade BETWEEN 11 AND 15
  AND iwt.position_category = 'teaching_related'
  AND iwt.bracket_key = 'SG_11_15'
  AND iwt.max_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM comparative_assessment_criteria cac
    WHERE cac.vacancy_id = v.id AND cac.salary_grade_band = 'sg11_15'
    LIMIT 1
  )
ORDER BY v.id, iwt.display_order;

-- teaching_related, SG_16_23_27
INSERT INTO comparative_assessment_criteria
  (vacancy_id, category, salary_grade_band, section_key, section_label, section_weight_percent,
   sub_criterion_label, weight_percent, max_score, display_order)
SELECT
  v.id,
  'comparative_flat',
  'sg16_23_27',
  NULL, NULL, NULL,
  iwt.criteria_key,
  iwt.max_points,
  iwt.max_points,
  iwt.display_order
FROM vacancies v
CROSS JOIN ies_weight_templates iwt
WHERE v.position_type = 'teaching_related'
  AND ((v.salary_grade BETWEEN 16 AND 23) OR v.salary_grade = 27)
  AND iwt.position_category = 'teaching_related'
  AND iwt.bracket_key = 'SG_16_23_27'
  AND iwt.max_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM comparative_assessment_criteria cac
    WHERE cac.vacancy_id = v.id AND cac.salary_grade_band = 'sg16_23_27'
    LIMIT 1
  )
ORDER BY v.id, iwt.display_order;

-- teaching_related, SG_24_CHIEF
INSERT INTO comparative_assessment_criteria
  (vacancy_id, category, salary_grade_band, section_key, section_label, section_weight_percent,
   sub_criterion_label, weight_percent, max_score, display_order)
SELECT
  v.id,
  'comparative_flat',
  'sg24_chief',
  NULL, NULL, NULL,
  iwt.criteria_key,
  iwt.max_points,
  iwt.max_points,
  iwt.display_order
FROM vacancies v
CROSS JOIN ies_weight_templates iwt
WHERE v.position_type = 'teaching_related'
  AND v.salary_grade = 24
  AND iwt.position_category = 'teaching_related'
  AND iwt.bracket_key = 'SG_24_CHIEF'
  AND iwt.max_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM comparative_assessment_criteria cac
    WHERE cac.vacancy_id = v.id AND cac.salary_grade_band = 'sg24_chief'
    LIMIT 1
  )
ORDER BY v.id, iwt.display_order;

-- non_teaching, GENERAL_SERVICES
INSERT INTO comparative_assessment_criteria
  (vacancy_id, category, salary_grade_band, section_key, section_label, section_weight_percent,
   sub_criterion_label, weight_percent, max_score, display_order)
SELECT
  v.id,
  'comparative_flat',
  'general_services',
  NULL, NULL, NULL,
  iwt.criteria_key,
  iwt.max_points,
  iwt.max_points,
  iwt.display_order
FROM vacancies v
CROSS JOIN ies_weight_templates iwt
WHERE v.position_type = 'non_teaching'
  AND (LOWER(v.position_title) LIKE '%general services%'
    OR LOWER(v.position_title) LIKE '%utility worker%'
    OR LOWER(v.position_title) LIKE '%security guard%'
    OR LOWER(v.position_title) LIKE '%driver%'
    OR LOWER(v.position_title) LIKE '%administrative aide%'
    OR LOWER(v.position_title) LIKE '%clerk%'
    OR LOWER(v.position_title) LIKE '%messenger%'
    OR LOWER(v.position_title) LIKE '%janitor%')
  AND iwt.position_category = 'non_teaching'
  AND iwt.bracket_key = 'GENERAL_SERVICES'
  AND iwt.max_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM comparative_assessment_criteria cac
    WHERE cac.vacancy_id = v.id AND cac.salary_grade_band = 'general_services'
    LIMIT 1
  )
ORDER BY v.id, iwt.display_order;

-- non_teaching, SG_1_9
INSERT INTO comparative_assessment_criteria
  (vacancy_id, category, salary_grade_band, section_key, section_label, section_weight_percent,
   sub_criterion_label, weight_percent, max_score, display_order)
SELECT
  v.id,
  'comparative_flat',
  'sg1_9',
  NULL, NULL, NULL,
  iwt.criteria_key,
  iwt.max_points,
  iwt.max_points,
  iwt.display_order
FROM vacancies v
CROSS JOIN ies_weight_templates iwt
WHERE v.position_type = 'non_teaching'
  AND v.salary_grade BETWEEN 1 AND 9
  AND NOT (LOWER(v.position_title) LIKE '%general services%'
    OR LOWER(v.position_title) LIKE '%utility worker%'
    OR LOWER(v.position_title) LIKE '%security guard%'
    OR LOWER(v.position_title) LIKE '%driver%'
    OR LOWER(v.position_title) LIKE '%administrative aide%'
    OR LOWER(v.position_title) LIKE '%clerk%'
    OR LOWER(v.position_title) LIKE '%messenger%'
    OR LOWER(v.position_title) LIKE '%janitor%')
  AND iwt.position_category = 'non_teaching'
  AND iwt.bracket_key = 'SG_1_9_NON_GS'
  AND iwt.max_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM comparative_assessment_criteria cac
    WHERE cac.vacancy_id = v.id AND cac.salary_grade_band = 'sg1_9'
    LIMIT 1
  )
ORDER BY v.id, iwt.display_order;

-- non_teaching, SG_10_22_27
INSERT INTO comparative_assessment_criteria
  (vacancy_id, category, salary_grade_band, section_key, section_label, section_weight_percent,
   sub_criterion_label, weight_percent, max_score, display_order)
SELECT
  v.id,
  'comparative_flat',
  'sg10_22_27',
  NULL, NULL, NULL,
  iwt.criteria_key,
  iwt.max_points,
  iwt.max_points,
  iwt.display_order
FROM vacancies v
CROSS JOIN ies_weight_templates iwt
WHERE v.position_type = 'non_teaching'
  AND ((v.salary_grade BETWEEN 10 AND 22) OR v.salary_grade = 27)
  AND iwt.position_category = 'non_teaching'
  AND iwt.bracket_key = 'SG_10_22_27'
  AND iwt.max_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM comparative_assessment_criteria cac
    WHERE cac.vacancy_id = v.id AND cac.salary_grade_band = 'sg10_22_27'
    LIMIT 1
  )
ORDER BY v.id, iwt.display_order;

-- non_teaching, SG_24_CHIEF
INSERT INTO comparative_assessment_criteria
  (vacancy_id, category, salary_grade_band, section_key, section_label, section_weight_percent,
   sub_criterion_label, weight_percent, max_score, display_order)
SELECT
  v.id,
  'comparative_flat',
  'sg24_chief',
  NULL, NULL, NULL,
  iwt.criteria_key,
  iwt.max_points,
  iwt.max_points,
  iwt.display_order
FROM vacancies v
CROSS JOIN ies_weight_templates iwt
WHERE v.position_type = 'non_teaching'
  AND v.salary_grade = 24
  AND iwt.position_category = 'non_teaching'
  AND iwt.bracket_key = 'SG_24_CHIEF'
  AND iwt.max_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM comparative_assessment_criteria cac
    WHERE cac.vacancy_id = v.id AND cac.salary_grade_band = 'sg24_chief'
    LIMIT 1
  )
ORDER BY v.id, iwt.display_order;
