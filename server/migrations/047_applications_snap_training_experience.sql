-- Migration 047: Add snap_training_title and snap_experience_details to applications
-- These snapshot the applicant's top training title and formatted experience details
-- at application time, so the admin table no longer depends solely on the AES row.

ALTER TABLE `applications`
  ADD COLUMN `snap_training_title` VARCHAR(500) DEFAULT NULL AFTER `snap_training_hours`,
  ADD COLUMN `snap_experience_details` TEXT DEFAULT NULL AFTER `snap_training_title`;
