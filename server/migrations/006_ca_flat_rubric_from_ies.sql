-- ============================================================
-- Migration 006: Extend CA criteria for flat rubric structure
-- Derive criteria rows for teaching_related/non_teaching from ies_weight_templates
-- to ensure weight sync between Individual Evaluation and Comparative Assessment
-- ============================================================

-- Add section_key, section_label, section_weight_percent for flat structure support
-- These are NULL for flat rubrics (teaching_related/non_teaching) and populated for teacher_i
ALTER TABLE comparative_assessment_criteria
  ADD COLUMN IF NOT EXISTS `section_key` CHAR(1) DEFAULT NULL AFTER `salary_grade_band`,
  ADD COLUMN IF NOT EXISTS `section_label` VARCHAR(100) DEFAULT NULL AFTER `section_key`,
  ADD COLUMN IF NOT EXISTS `section_weight_percent` DECIMAL(5,2) DEFAULT NULL AFTER `section_label`;

-- Create a helper function to generate CA criteria from IES weight templates
-- This will be called by the controller during seedDefaultRubric
DELIMITER //

CREATE PROCEDURE seed_ca_criteria_from_ies(
  IN p_vacancy_id INT,
  IN p_position_category VARCHAR(50),
  IN p_bracket_key VARCHAR(50)
)
BEGIN
  DECLARE EXIT HANDANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  INSERT INTO comparative_assessment_criteria 
    (vacancy_id, category, salary_grade_band, section_key, section_label, section_weight_percent,
     sub_criterion_label, weight_percent, max_score)
  SELECT 
    p_vacancy_id,
    'comparative_flat',
    CASE 
      WHEN p_bracket_key = 'SG_11_15' THEN 'sg11_15'
      WHEN p_bracket_key = 'SG_16_23_27' THEN 'sg16_23_27'
      WHEN p_bracket_key = 'SG_24_CHIEF' THEN 'sg24_chief'
      WHEN p_bracket_key = 'GENERAL_SERVICES' THEN 'general_services'
      WHEN p_bracket_key = 'SG_1_9_NON_GS' THEN 'sg1_9'
      WHEN p_bracket_key = 'SG_10_22_27' THEN 'sg10_22_27'
      ELSE NULL
    END,
    NULL AS section_key,
    NULL AS section_label,
    NULL AS section_weight_percent,
    iwt.criteria_key,
    iwt.max_points AS weight_percent,
    iwt.max_points AS max_score,
    iwt.display_order
  FROM ies_weight_templates iwt
  WHERE iwt.position_category = p_position_category
    AND (p_bracket_key IS NULL OR iwt.bracket_key = p_bracket_key)
    AND iwt.max_points > 0
  ORDER BY iwt.display_order;
  
  COMMIT;
END //

DELIMITER ;