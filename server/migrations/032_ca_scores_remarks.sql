-- ============================================================
-- Migration 032: Add remarks/justification to CA scores.
-- Stores evaluator notes per criterion for each applicant.
-- ============================================================

ALTER TABLE comparative_assessment_scores
  ADD COLUMN `remarks` TEXT DEFAULT NULL
  AFTER `score_given`;
