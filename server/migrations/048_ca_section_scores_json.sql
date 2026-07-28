-- Add section_scores JSON column to comparative_assessment_results
-- Stores the full sectionScores object (any keys, any count) so rankings
-- work for rubrics with non-ABC section keys.

SET @exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'comparative_assessment_results'
    AND COLUMN_NAME = 'section_scores'
);

SET @sql = IF(@exists = 0,
  'ALTER TABLE comparative_assessment_results ADD COLUMN section_scores JSON DEFAULT NULL AFTER total_score',
  'SELECT "column already exists" AS status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
