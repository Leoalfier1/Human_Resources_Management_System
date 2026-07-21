-- ============================================================
-- Migration 033: CA Rubric Rebuild — Fix Weight Templates
-- ============================================================
-- Fixes two data errors in ies_weight_templates where the
-- "experience" values were swapped between SG1-9 and SG10-22/27
-- for non_teaching positions, causing incorrect totals.
--
-- SG_1_9_NON_GS:  experience was 15, should be 20  (total 95→100)
-- SG_10_22_27:    experience was 20, should be 15  (total 105→100)
--
-- Teaching-related and other non-teaching brackets are already
-- correct (all sum to 100). No changes needed for those.
-- ============================================================

-- Fix SG1-9 Non-GS experience: 15 → 20
UPDATE `ies_weight_templates`
SET `max_points` = 20.00
WHERE `position_category` = 'non_teaching'
  AND `bracket_key` = 'SG_1_9_NON_GS'
  AND `criteria_key` = 'experience';

-- Fix SG10-22/27 experience: 20 → 15
UPDATE `ies_weight_templates`
SET `max_points` = 15.00
WHERE `position_category` = 'non_teaching'
  AND `bracket_key` = 'SG_10_22_27'
  AND `criteria_key` = 'experience';
