-- Migration 043: Add snapshot columns to applications for applicant-at-submission data
-- The admin Applicant Management table should display data as it was at the time of
-- application, not live PDS values. These columns store that snapshot.

ALTER TABLE applications
  ADD COLUMN snap_address VARCHAR(500) DEFAULT NULL AFTER years_experience,
  ADD COLUMN snap_age INT DEFAULT NULL AFTER snap_address,
  ADD COLUMN snap_sex ENUM('male','female') DEFAULT NULL AFTER snap_age,
  ADD COLUMN snap_civil_status ENUM('single','married','widowed','separated','others') DEFAULT NULL AFTER snap_sex,
  ADD COLUMN snap_religion VARCHAR(100) DEFAULT NULL AFTER snap_civil_status,
  ADD COLUMN snap_disability VARCHAR(100) DEFAULT NULL AFTER snap_religion,
  ADD COLUMN snap_ethnic_group VARCHAR(100) DEFAULT NULL AFTER snap_disability,
  ADD COLUMN snap_education VARCHAR(200) DEFAULT NULL AFTER snap_ethnic_group,
  ADD COLUMN snap_training_hours DECIMAL(8,2) DEFAULT NULL AFTER snap_education,
  ADD COLUMN snap_eligibility VARCHAR(200) DEFAULT NULL AFTER snap_training_hours;
