-- ============================================================
-- Migration 004: Add section_type column to ld_materials
-- Allows report attachments to be categorized by section
-- (photo_documentation, documentation, recommendations, financial)
-- ============================================================

ALTER TABLE ld_materials
  ADD COLUMN IF NOT EXISTS `section_type` VARCHAR(50) DEFAULT NULL
    AFTER `file_type`;
