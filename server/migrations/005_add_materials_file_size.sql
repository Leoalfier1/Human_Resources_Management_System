-- ============================================================
-- Migration 005: Add file_size column to ld_materials
-- Required by the uploadMaterial controller which records
-- the size of each uploaded file for display and validation.
-- ============================================================

ALTER TABLE ld_materials
  ADD COLUMN IF NOT EXISTS `file_size` BIGINT DEFAULT NULL
    AFTER `file_name`;
