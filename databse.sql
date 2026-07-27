-- ============================================================
-- HRMS (Human Resources Management System) — Full Schema
-- Database: deped_hrmis
-- Version: Clean (no warnings, no errors, all modules covered)
-- Generation Date: 2026-07-06
--
-- MODULES COVERED:
--   1. Auth / Users
--   2. RSP — Recruitment, Selection & Placement
--   3. L&D — Learning & Development
--   4. PM  — Performance Management
--   5. R&R — Rewards & Recognition
--   6. Personnel — Employee Portal
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

-- Create and use database
CREATE DATABASE IF NOT EXISTS `deped_hrmis`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `deped_hrmis`;


-- ============================================================
-- MODULE 0: FOUNDATION — USERS & SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `office_name` VARCHAR(255) NOT NULL DEFAULT 'Schools Division Office of Dapitan City',
  `region` VARCHAR(100) NOT NULL DEFAULT 'Region IX – Zamboanga Peninsula',
  `contact_number` VARCHAR(50) DEFAULT '065-908-1234',
  `logo_path` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(20) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('applicant','staff','admin','hr_staff','hrmpsb','appointing_authority') NOT NULL DEFAULT 'applicant',
  `applicant_type` ENUM('teaching','non_teaching') DEFAULT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- MODULE 1: RSP — RECRUITMENT, SELECTION & PLACEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS `schools` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vacancies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ref_no` VARCHAR(50) NOT NULL,
  `position_title` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(100) DEFAULT NULL,
  `item_number` VARCHAR(100) DEFAULT NULL,
  `salary_grade` INT DEFAULT NULL,
  `monthly_salary` DECIMAL(10,2) DEFAULT NULL,
  `assigned_school` VARCHAR(255) DEFAULT NULL,
  `no_of_vacancies` INT NOT NULL DEFAULT 1,
  `minimum_qualifications` TEXT DEFAULT NULL,
  `division_memo_file_path` VARCHAR(500) DEFAULT NULL,
  `posting_date` DATE DEFAULT NULL,
  `deadline_date` DATE DEFAULT NULL,
  `status` ENUM('active','closed') NOT NULL DEFAULT 'active',
  `position_type` ENUM('teaching','non_teaching') NOT NULL DEFAULT 'teaching',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `publish_division_website` TINYINT(1) NOT NULL DEFAULT 0,
  `publish_facebook` TINYINT(1) NOT NULL DEFAULT 0,
  `publish_bulletin` TINYINT(1) NOT NULL DEFAULT 0,
  `current_stage` INT NOT NULL DEFAULT 1,
  `created_by` INT DEFAULT NULL,
  `assessment_submitted_at` TIMESTAMP NULL DEFAULT NULL,
  `shortlist_endorsed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vacancies_ref_no` (`ref_no`),
  KEY `idx_vacancies_status` (`status`),
  KEY `idx_vacancies_stage` (`current_stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT NOT NULL,
  `applicant_id` INT NOT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `current_school` VARCHAR(255) DEFAULT NULL,
  `years_experience` INT NOT NULL DEFAULT 0,
  `status` ENUM('draft','submitted','under_review','qualified','disqualified','shortlisted','selected','appointed') NOT NULL DEFAULT 'draft',
  `ref_no` VARCHAR(50) DEFAULT NULL,
  `submitted_at` DATETIME DEFAULT NULL,
  `current_stage` INT NOT NULL DEFAULT 1,
  `evaluated_at` DATETIME DEFAULT NULL,
  `evaluated_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_applications_ref_no` (`ref_no`),
  KEY `idx_applications_vacancy` (`vacancy_id`),
  KEY `idx_applications_applicant` (`applicant_id`),
  CONSTRAINT `fk_applications_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_applications_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `application_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `document_type` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_docs_application` (`application_id`),
  CONSTRAINT `fk_app_docs_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stage_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `stage_number` INT NOT NULL,
  `status` ENUM('completed','in_progress','upcoming') NOT NULL DEFAULT 'upcoming',
  `completed_at` DATETIME DEFAULT NULL,
  `eta_label` VARCHAR(100) DEFAULT NULL,
  `updated_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stage_history` (`application_id`,`stage_number`),
  CONSTRAINT `fk_stage_history_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vacancy_required_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT DEFAULT NULL,
  `document_type` VARCHAR(255) NOT NULL,
  `is_mandatory` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_vrd_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_vrd_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `minimum_qualifications_checklist` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT DEFAULT NULL,
  `criterion_label` VARCHAR(255) DEFAULT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_mqc_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_mqc_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `applicant_qualification_results` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_id` INT DEFAULT NULL,
  `criterion_id` INT DEFAULT NULL,
  `passed` TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_aqr` (`applicant_id`,`criterion_id`),
  KEY `idx_aqr_criterion` (`criterion_id`),
  CONSTRAINT `fk_aqr_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aqr_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `minimum_qualifications_checklist` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qualification_standards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT DEFAULT NULL,
  `label` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_qs_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_qs_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `duties_responsibilities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT DEFAULT NULL,
  `label` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dr_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_dr_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `applicant_eligibility_screening` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT DEFAULT NULL,
  `application_code` VARCHAR(50) DEFAULT NULL,
  `applicant_name` VARCHAR(200) DEFAULT NULL,
  `address` VARCHAR(300) DEFAULT NULL,
  `age` INT DEFAULT NULL,
  `sex` ENUM('male','female') DEFAULT NULL,
  `civil_status` VARCHAR(50) DEFAULT NULL,
  `religion` VARCHAR(100) DEFAULT NULL,
  `disability` VARCHAR(100) DEFAULT NULL,
  `ethnic_group` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `contact_no` VARCHAR(50) DEFAULT NULL,
  `education` VARCHAR(200) DEFAULT NULL,
  `training_title` VARCHAR(300) DEFAULT NULL,
  `training_hours` DECIMAL(8,2) DEFAULT NULL,
  `experience_years` DECIMAL(5,2) DEFAULT NULL,
  `eligibility` VARCHAR(200) DEFAULT NULL,
  `remarks` ENUM('qualified','disqualified') DEFAULT NULL,
  `vacancy_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_aes_application` (`application_id`),
  KEY `idx_aes_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_aes_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_aes_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comparative_assessment_criteria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT DEFAULT NULL,
  `category` ENUM('classroom_observable','non_classroom_observable','document_evaluation') DEFAULT NULL,
  `sub_criterion_label` VARCHAR(255) DEFAULT NULL,
  `weight_percent` DECIMAL(5,2) DEFAULT NULL,
  `max_score` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cac_vacancy_label` (`vacancy_id`,`sub_criterion_label`),
  CONSTRAINT `fk_cac_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comparative_assessment_results` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_id` INT DEFAULT NULL,
  `category_subscore_classroom` DECIMAL(5,2) DEFAULT NULL,
  `category_subscore_nonclassroom` DECIMAL(5,2) DEFAULT NULL,
  `category_subscore_document` DECIMAL(5,2) DEFAULT NULL,
  `total_score` DECIMAL(5,2) DEFAULT NULL,
  `rank_val` INT DEFAULT NULL,
  `is_qualified` TINYINT(1) NOT NULL DEFAULT 0,
  `is_top5` TINYINT(1) NOT NULL DEFAULT 0,
  `computed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_car_applicant` (`applicant_id`),
  CONSTRAINT `fk_car_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comparative_assessment_scores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_id` INT DEFAULT NULL,
  `criterion_id` INT DEFAULT NULL,
  `score_given` DECIMAL(5,2) DEFAULT NULL,
  `scored_by` INT DEFAULT NULL,
  `scored_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cas_applicant_criterion` (`applicant_id`,`criterion_id`),
  KEY `idx_cas_criterion` (`criterion_id`),
  CONSTRAINT `fk_cas_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cas_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `comparative_assessment_criteria` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `assessment_scores` (
  `application_id` INT NOT NULL,
  `classroom_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `classroom_max` DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  `nonclassroom_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `nonclassroom_max` DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  `document_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `document_max` DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  `total_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `rank_position` INT DEFAULT NULL,
  `rank_total` INT DEFAULT NULL,
  PRIMARY KEY (`application_id`),
  CONSTRAINT `fk_as_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `results_postings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT DEFAULT NULL,
  `published_division_website` TIMESTAMP NULL DEFAULT NULL,
  `published_facebook` TIMESTAMP NULL DEFAULT NULL,
  `published_bulletin` TIMESTAMP NULL DEFAULT NULL,
  `published_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rp_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_rp_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_user` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `deliberation_notes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_id` INT DEFAULT NULL,
  `background_investigation_notes` TEXT DEFAULT NULL,
  `is_recommended` TINYINT(1) NOT NULL DEFAULT 0,
  `recommended_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dn_applicant` (`applicant_id`),
  CONSTRAINT `fk_dn_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dn_user` FOREIGN KEY (`recommended_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `congratulatory_advices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_id` INT DEFAULT NULL,
  `vacancy_id` INT DEFAULT NULL,
  `place_of_assignment` VARCHAR(255) DEFAULT NULL,
  `report_date` DATE DEFAULT NULL,
  `document_submission_deadline` DATE DEFAULT NULL,
  `appointing_authority_name` VARCHAR(255) DEFAULT NULL,
  `letter_content` TEXT DEFAULT NULL,
  `sent_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ca_applicant` (`applicant_id`),
  KEY `idx_ca_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_ca_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ca_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ca_user` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_id` INT DEFAULT NULL,
  `vacancy_id` INT DEFAULT NULL,
  `salary_grade` INT DEFAULT NULL,
  `monthly_salary` DECIMAL(10,2) DEFAULT NULL,
  `nature_of_appointment` ENUM('Permanent','Temporary','Provisional') NOT NULL DEFAULT 'Permanent',
  `issued_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `issued_by` INT DEFAULT NULL,
  `notice_posted_at` TIMESTAMP NULL DEFAULT NULL,
  `notice_posting_deadline` DATE DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_appointments` (`applicant_id`,`vacancy_id`),
  KEY `idx_appt_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_appt_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appt_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_user` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `appointment_required_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `document_type` VARCHAR(255) NOT NULL,
  `is_mandatory` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `appointment_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_id` INT DEFAULT NULL,
  `document_type` VARCHAR(255) NOT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 1,
  `file_path` VARCHAR(500) DEFAULT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `verification_status` ENUM('not_uploaded','uploaded_pending_review','verified') NOT NULL DEFAULT 'not_uploaded',
  `verified_at` DATETIME DEFAULT NULL,
  `uploaded_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ad_applicant` (`applicant_id`),
  CONSTRAINT `fk_ad_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `appointment_notice_postings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `appointment_id` INT DEFAULT NULL,
  `channel` ENUM('division_website','facebook','bulletin_board') DEFAULT NULL,
  `posted_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `posted_by` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_anp_appointment` (`appointment_id`),
  CONSTRAINT `fk_anp_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_anp_user` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_application` (`application_id`),
  CONSTRAINT `fk_notif_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `appeals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `applicant_id` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_response` TEXT DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appeals_application` (`application_id`),
  KEY `idx_appeals_applicant` (`applicant_id`),
  CONSTRAINT `fk_appeals_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appeals_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vacancy_id` INT DEFAULT NULL,
  `applicant_id` INT DEFAULT NULL,
  `actor_id` INT DEFAULT NULL,
  `action_description` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_al_vacancy` (`vacancy_id`),
  KEY `idx_al_actor` (`actor_id`),
  CONSTRAINT `fk_al_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_al_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RSP: Personal Data Sheet (PDS) — from applicant module
CREATE TABLE IF NOT EXISTS `personal_data_sheets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `surname` VARCHAR(100) DEFAULT NULL,
  `first_name` VARCHAR(100) DEFAULT NULL,
  `middle_name` VARCHAR(100) DEFAULT NULL,
  `name_extension` VARCHAR(20) DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `place_of_birth` VARCHAR(150) DEFAULT NULL,
  `sex` ENUM('male','female') DEFAULT NULL,
  `civil_status` ENUM('single','married','widowed','separated','others') DEFAULT NULL,
  `civil_status_other` VARCHAR(100) DEFAULT NULL,
  `height_m` DECIMAL(3,2) DEFAULT NULL,
  `weight_kg` DECIMAL(5,2) DEFAULT NULL,
  `blood_type` VARCHAR(5) DEFAULT NULL,
  `gsis_id_no` VARCHAR(50) DEFAULT NULL,
  `pagibig_id_no` VARCHAR(50) DEFAULT NULL,
  `philhealth_no` VARCHAR(50) DEFAULT NULL,
  `sss_no` VARCHAR(50) DEFAULT NULL,
  `tin_no` VARCHAR(50) DEFAULT NULL,
  `agency_employee_no` VARCHAR(50) DEFAULT NULL,
  `citizenship` ENUM('filipino','dual_citizen') NOT NULL DEFAULT 'filipino',
  `dual_citizenship_country` VARCHAR(100) DEFAULT NULL,
  `dual_citizenship_type` ENUM('by_birth','by_naturalization') DEFAULT NULL,
  `res_house_block_lot` VARCHAR(150) DEFAULT NULL,
  `res_street` VARCHAR(150) DEFAULT NULL,
  `res_subdivision_village` VARCHAR(150) DEFAULT NULL,
  `res_barangay` VARCHAR(150) DEFAULT NULL,
  `res_city_municipality` VARCHAR(150) DEFAULT NULL,
  `res_province` VARCHAR(150) DEFAULT NULL,
  `res_zip_code` VARCHAR(10) DEFAULT NULL,
  `perm_same_as_residential` TINYINT(1) NOT NULL DEFAULT 0,
  `perm_house_block_lot` VARCHAR(150) DEFAULT NULL,
  `perm_street` VARCHAR(150) DEFAULT NULL,
  `perm_subdivision_village` VARCHAR(150) DEFAULT NULL,
  `perm_barangay` VARCHAR(150) DEFAULT NULL,
  `perm_city_municipality` VARCHAR(150) DEFAULT NULL,
  `perm_province` VARCHAR(150) DEFAULT NULL,
  `perm_zip_code` VARCHAR(10) DEFAULT NULL,
  `telephone_no` VARCHAR(50) DEFAULT NULL,
  `mobile_no` VARCHAR(50) DEFAULT NULL,
  `email_address` VARCHAR(150) DEFAULT NULL,
  `spouse_surname` VARCHAR(100) DEFAULT NULL,
  `spouse_first_name` VARCHAR(100) DEFAULT NULL,
  `spouse_middle_name` VARCHAR(100) DEFAULT NULL,
  `spouse_name_extension` VARCHAR(20) DEFAULT NULL,
  `spouse_occupation` VARCHAR(150) DEFAULT NULL,
  `spouse_employer_business_name` VARCHAR(150) DEFAULT NULL,
  `spouse_business_address` VARCHAR(255) DEFAULT NULL,
  `spouse_telephone_no` VARCHAR(50) DEFAULT NULL,
  `father_surname` VARCHAR(100) DEFAULT NULL,
  `father_first_name` VARCHAR(100) DEFAULT NULL,
  `father_middle_name` VARCHAR(100) DEFAULT NULL,
  `father_name_extension` VARCHAR(20) DEFAULT NULL,
  `mother_maiden_surname` VARCHAR(100) DEFAULT NULL,
  `mother_first_name` VARCHAR(100) DEFAULT NULL,
  `mother_middle_name` VARCHAR(100) DEFAULT NULL,
  `children` JSON DEFAULT NULL,
  `elementary` JSON DEFAULT NULL,
  `secondary` JSON DEFAULT NULL,
  `vocational` JSON DEFAULT NULL,
  `college` JSON DEFAULT NULL,
  `graduate_studies` JSON DEFAULT NULL,
  `civil_service_eligibility` JSON DEFAULT NULL,
  `work_experience` JSON DEFAULT NULL,
  `voluntary_work` JSON DEFAULT NULL,
  `ld_training` JSON DEFAULT NULL,
  `special_skills` JSON DEFAULT NULL,
  `non_academic_distinctions` JSON DEFAULT NULL,
  `membership_associations` JSON DEFAULT NULL,
  `q34a_answer` ENUM('yes','no') DEFAULT NULL,
  `q34a_details` TEXT DEFAULT NULL,
  `q34b_answer` ENUM('yes','no') DEFAULT NULL,
  `q34b_details` TEXT DEFAULT NULL,
  `q35a_answer` ENUM('yes','no') DEFAULT NULL,
  `q35a_details` TEXT DEFAULT NULL,
  `q35b_answer` ENUM('yes','no') DEFAULT NULL,
  `q35b_details` TEXT DEFAULT NULL,
  `q35b_date_filed` DATE DEFAULT NULL,
  `q35b_case_status` VARCHAR(255) DEFAULT NULL,
  `q36_answer` ENUM('yes','no') DEFAULT NULL,
  `q36_details` TEXT DEFAULT NULL,
  `q37_answer` ENUM('yes','no') DEFAULT NULL,
  `q37_details` TEXT DEFAULT NULL,
  `q38a_answer` ENUM('yes','no') DEFAULT NULL,
  `q38a_details` TEXT DEFAULT NULL,
  `q38b_answer` ENUM('yes','no') DEFAULT NULL,
  `q38b_details` TEXT DEFAULT NULL,
  `q39_answer` ENUM('yes','no') DEFAULT NULL,
  `q39_details` VARCHAR(255) DEFAULT NULL,
  `q40a_answer` ENUM('yes','no') DEFAULT NULL,
  `q40a_details` VARCHAR(255) DEFAULT NULL,
  `q40b_answer` ENUM('yes','no') DEFAULT NULL,
  `q40b_details` VARCHAR(255) DEFAULT NULL,
  `q40c_answer` ENUM('yes','no') DEFAULT NULL,
  `q40c_details` VARCHAR(255) DEFAULT NULL,
  `references` JSON DEFAULT NULL,
  `govt_ids` JSON DEFAULT NULL,
  `date_accomplished` DATE DEFAULT NULL,
  `status` ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  `submitted_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pds_user` (`user_id`),
  CONSTRAINT `fk_pds_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RSP: Legacy applicants table (used by old screening workflows)
CREATE TABLE IF NOT EXISTS `applicants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_code` VARCHAR(50) DEFAULT NULL,
  `vacancy_id` INT DEFAULT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `id_number` VARCHAR(100) DEFAULT NULL,
  `school_station` VARCHAR(255) DEFAULT NULL,
  `date_submitted` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('submitted','under_evaluation','qualified','disqualified','shortlisted','selected','appointed') NOT NULL DEFAULT 'submitted',
  `qualified_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_applicants_code` (`applicant_code`),
  KEY `idx_applicants_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_applicants_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `applicant_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `applicant_id` INT DEFAULT NULL,
  `document_type` VARCHAR(255) DEFAULT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 1,
  `file_path` VARCHAR(500) DEFAULT NULL,
  `verification_status` ENUM('not_uploaded','uploaded_pending_review','verified') NOT NULL DEFAULT 'not_uploaded',
  `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_applicant_docs` (`applicant_id`),
  CONSTRAINT `fk_applicant_docs` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- MODULE 2: L&D — LEARNING & DEVELOPMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS `tna_forms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `school_year` VARCHAR(20) NOT NULL,
  `target_position_type` ENUM('all','teaching','non_teaching') NOT NULL DEFAULT 'all',
  `status` ENUM('draft','active','closed') NOT NULL DEFAULT 'draft',
  `deadline_date` DATE DEFAULT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tna_forms_created_by` (`created_by`),
  CONSTRAINT `fk_tna_forms_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tna_questions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `form_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('text','rating','multiple_choice','checkbox') NOT NULL DEFAULT 'text',
  `options` JSON DEFAULT NULL,
  `category` VARCHAR(255) DEFAULT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_tna_questions_form` (`form_id`),
  CONSTRAINT `fk_tna_questions_form` FOREIGN KEY (`form_id`) REFERENCES `tna_forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tna_responses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `form_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `status` ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  `submitted_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tna_responses` (`form_id`,`user_id`),
  KEY `idx_tna_responses_user` (`user_id`),
  CONSTRAINT `fk_tna_responses_form` FOREIGN KEY (`form_id`) REFERENCES `tna_forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tna_responses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tna_answers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `response_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `answer_text` TEXT DEFAULT NULL,
  `answer_rating` TINYINT DEFAULT NULL,
  `answer_options` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tna_answers` (`response_id`,`question_id`),
  KEY `idx_tna_answers_question` (`question_id`),
  CONSTRAINT `fk_tna_answers_response` FOREIGN KEY (`response_id`) REFERENCES `tna_responses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tna_answers_question` FOREIGN KEY (`question_id`) REFERENCES `tna_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_objectives` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `school_year` VARCHAR(20) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `target_position_type` ENUM('all','teaching','non_teaching') NOT NULL DEFAULT 'all',
  `professional_standard` VARCHAR(255) DEFAULT NULL,
  `priority_level` ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  `tna_form_id` INT DEFAULT NULL,
  `status` ENUM('draft','approved') NOT NULL DEFAULT 'draft',
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_obj_tna` (`tna_form_id`),
  KEY `idx_ld_obj_created_by` (`created_by`),
  CONSTRAINT `fk_ld_obj_tna` FOREIGN KEY (`tna_form_id`) REFERENCES `tna_forms` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ld_obj_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_plans` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `school_year` VARCHAR(20) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('draft','approved','completed') NOT NULL DEFAULT 'draft',
  `approved_by` INT DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_plans_created_by` (`created_by`),
  KEY `idx_ld_plans_approved_by` (`approved_by`),
  CONSTRAINT `fk_ld_plans_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ld_plans_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_programs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `plan_id` INT NOT NULL,
  `objective_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `methodology` VARCHAR(150) DEFAULT NULL,
  `target_position_type` ENUM('all','teaching','non_teaching') NOT NULL DEFAULT 'all',
  `duration_hours` DECIMAL(6,1) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `venue` VARCHAR(255) DEFAULT NULL,
  `resource_person` VARCHAR(255) DEFAULT NULL,
  `provider` VARCHAR(255) DEFAULT NULL,
  `budget_estimate` DECIMAL(12,2) DEFAULT NULL,
  `attendance_sheet_path` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_programs_plan` (`plan_id`),
  KEY `idx_ld_programs_objective` (`objective_id`),
  CONSTRAINT `fk_ld_programs_plan` FOREIGN KEY (`plan_id`) REFERENCES `ld_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ld_programs_objective` FOREIGN KEY (`objective_id`) REFERENCES `ld_objectives` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_materials` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `program_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_type` VARCHAR(100) DEFAULT NULL,
  `uploaded_by` INT DEFAULT NULL,
  `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_materials_program` (`program_id`),
  CONSTRAINT `fk_ld_materials_program` FOREIGN KEY (`program_id`) REFERENCES `ld_programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_attendance` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `program_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `status` ENUM('present','absent','excused') DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `certificate_path` VARCHAR(500) DEFAULT NULL,
  `acknowledged_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ld_attendance` (`program_id`,`user_id`),
  KEY `idx_ld_attendance_user` (`user_id`),
  CONSTRAINT `fk_ld_attendance_program` FOREIGN KEY (`program_id`) REFERENCES `ld_programs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ld_attendance_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_evaluation_forms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `program_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `instructions` TEXT DEFAULT NULL,
  `status` ENUM('draft','active','closed') NOT NULL DEFAULT 'draft',
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ld_eval_forms_program` (`program_id`),
  CONSTRAINT `fk_ld_eval_forms_program` FOREIGN KEY (`program_id`) REFERENCES `ld_programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_evaluation_questions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eval_form_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('text','rating') NOT NULL DEFAULT 'rating',
  `category` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_ld_eval_q_form` (`eval_form_id`),
  CONSTRAINT `fk_ld_eval_q_form` FOREIGN KEY (`eval_form_id`) REFERENCES `ld_evaluation_forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_evaluation_responses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eval_form_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `overall_rating` DECIMAL(4,2) DEFAULT NULL,
  `submitted_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ld_eval_response` (`eval_form_id`,`user_id`),
  KEY `idx_ld_eval_resp_user` (`user_id`),
  CONSTRAINT `fk_ld_eval_resp_form` FOREIGN KEY (`eval_form_id`) REFERENCES `ld_evaluation_forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ld_eval_resp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_evaluation_answers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `response_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `rating_value` TINYINT DEFAULT NULL,
  `text_answer` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ld_eval_ans_response` (`response_id`),
  KEY `idx_ld_eval_ans_question` (`question_id`),
  CONSTRAINT `fk_ld_eval_ans_response` FOREIGN KEY (`response_id`) REFERENCES `ld_evaluation_responses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ld_eval_ans_question` FOREIGN KEY (`question_id`) REFERENCES `ld_evaluation_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Legacy tables (from old ld_trainings-based approach, kept for backward compat)
CREATE TABLE IF NOT EXISTS `ld_trainings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ld_plan_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `methodology` VARCHAR(150) DEFAULT NULL,
  `target_position_type` ENUM('teaching','non_teaching','all') NOT NULL DEFAULT 'all',
  `facilitator` VARCHAR(255) DEFAULT NULL,
  `venue` VARCHAR(255) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `total_hours` DECIMAL(6,1) NOT NULL DEFAULT 0.0,
  `budget_actual` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_training_participants` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `training_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `attendance_status` ENUM('present','absent','excused') DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ldtp_training` (`training_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ld_evaluations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `training_id` INT UNSIGNED NOT NULL,
  `participant_id` INT UNSIGNED NOT NULL,
  `relevance_rating` TINYINT UNSIGNED DEFAULT NULL,
  `effectiveness_rating` TINYINT UNSIGNED DEFAULT NULL,
  `applicability_rating` TINYINT UNSIGNED DEFAULT NULL,
  `comments` TEXT DEFAULT NULL,
  `impact_assessment` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_eval_training` (`training_id`),
  KEY `idx_ld_eval_participant` (`participant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- MODULE 3: PM — PERFORMANCE MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS `performance_periods` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `school_year` VARCHAR(20) NOT NULL,
  `phase` TINYINT NOT NULL COMMENT '1=Midyear, 2=Yearend, 3=Q1, 4=Q2',
  `period_label` VARCHAR(100) DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('upcoming','active','closed') NOT NULL DEFAULT 'upcoming',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `performance_commitments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `period_id` INT NOT NULL,
  `form_type` ENUM('ipcrf','opcrf') NOT NULL DEFAULT 'ipcrf',
  `position_type` ENUM('teaching','non_teaching') NOT NULL DEFAULT 'teaching',
  `status` ENUM('draft','submitted','rated','finalized') NOT NULL DEFAULT 'draft',
  `overall_rating` DECIMAL(4,2) DEFAULT NULL,
  `adjectival_rating` ENUM('Outstanding','Very Satisfactory','Satisfactory','Unsatisfactory','Poor') DEFAULT NULL,
  `submitted_at` TIMESTAMP NULL DEFAULT NULL,
  `rated_at` TIMESTAMP NULL DEFAULT NULL,
  `finalized_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pc_user` (`user_id`),
  KEY `idx_pc_period` (`period_id`),
  CONSTRAINT `fk_pc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pc_period` FOREIGN KEY (`period_id`) REFERENCES `performance_periods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `performance_targets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `commitment_id` INT NOT NULL,
  `kra_label` VARCHAR(255) DEFAULT NULL,
  `mfo_label` VARCHAR(255) DEFAULT NULL,
  `success_indicator` TEXT DEFAULT NULL,
  `weight` DECIMAL(5,2) DEFAULT NULL,
  `q1_rating` DECIMAL(4,2) DEFAULT NULL,
  `q2_rating` DECIMAL(4,2) DEFAULT NULL,
  `q3_rating` DECIMAL(4,2) DEFAULT NULL,
  `q4_rating` DECIMAL(4,2) DEFAULT NULL,
  `average_rating` DECIMAL(4,2) DEFAULT NULL,
  `means_of_verification` TEXT DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pt_commitment` (`commitment_id`),
  CONSTRAINT `fk_pt_commitment` FOREIGN KEY (`commitment_id`) REFERENCES `performance_commitments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `performance_ratings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `commitment_id` INT NOT NULL,
  `rated_by` INT NOT NULL,
  `numerical_rating` DECIMAL(4,2) DEFAULT NULL,
  `adjectival_rating` VARCHAR(50) DEFAULT NULL,
  `rater_remarks` TEXT DEFAULT NULL,
  `ratee_remarks` TEXT DEFAULT NULL,
  `rated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pr_commitment` (`commitment_id`),
  KEY `idx_pr_rated_by` (`rated_by`),
  CONSTRAINT `fk_pr_commitment` FOREIGN KEY (`commitment_id`) REFERENCES `performance_commitments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pr_rated_by` FOREIGN KEY (`rated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coaching_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ratee_id` INT NOT NULL,
  `rater_id` INT NOT NULL,
  `period_id` INT NOT NULL,
  `coaching_date` DATE DEFAULT NULL,
  `observations` TEXT DEFAULT NULL,
  `agreed_actions` TEXT DEFAULT NULL,
  `follow_up_date` DATE DEFAULT NULL,
  `status` ENUM('scheduled','completed') NOT NULL DEFAULT 'scheduled',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cl_ratee` (`ratee_id`),
  KEY `idx_cl_rater` (`rater_id`),
  KEY `idx_cl_period` (`period_id`),
  CONSTRAINT `fk_cl_ratee` FOREIGN KEY (`ratee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cl_rater` FOREIGN KEY (`rater_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cl_period` FOREIGN KEY (`period_id`) REFERENCES `performance_periods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rewards_recognition` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `period_id` INT NOT NULL,
  `award_type` VARCHAR(255) DEFAULT NULL,
  `award_level` ENUM('school','division','regional','national') NOT NULL DEFAULT 'division',
  `description` TEXT DEFAULT NULL,
  `awarded_at` DATE DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rr_user` (`user_id`),
  KEY `idx_rr_period` (`period_id`),
  CONSTRAINT `fk_rr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rr_period` FOREIGN KEY (`period_id`) REFERENCES `performance_periods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- MODULE 4: R&R — REWARDS & RECOGNITION
-- ============================================================

CREATE TABLE IF NOT EXISTS `rr_searches` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `school_year` VARCHAR(20) NOT NULL,
  `search_type` VARCHAR(255) NOT NULL,
  `target_position_type` ENUM('all','teaching','non_teaching') NOT NULL DEFAULT 'all',
  `nomination_start` DATE DEFAULT NULL,
  `nomination_end` DATE DEFAULT NULL,
  `evaluation_start` DATE DEFAULT NULL,
  `evaluation_end` DATE DEFAULT NULL,
  `ceremony_date` DATE DEFAULT NULL,
  `status` ENUM('draft','open','evaluation','deliberation','announced','completed') NOT NULL DEFAULT 'draft',
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rrs_created_by` (`created_by`),
  CONSTRAINT `fk_rrs_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_award_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `search_id` INT NOT NULL,
  `category_name` VARCHAR(255) NOT NULL,
  `category_level` ENUM('school','division','regional','national') NOT NULL DEFAULT 'division',
  `position_type` ENUM('all','teaching','non_teaching') NOT NULL DEFAULT 'all',
  `max_awardees` INT NOT NULL DEFAULT 1,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rrac_search` (`search_id`),
  CONSTRAINT `fk_rrac_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_nominations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `search_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `nominee_id` INT NOT NULL,
  `nominator_id` INT DEFAULT NULL,
  `position_type` ENUM('teaching','non_teaching') NOT NULL,
  `justification` TEXT DEFAULT NULL,
  `eligibility_status` ENUM('pending','eligible','ineligible') NOT NULL DEFAULT 'pending',
  `ineligibility_reason` TEXT DEFAULT NULL,
  `is_self_nomination` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nominee_category` (`nominee_id`,`category_id`),
  KEY `idx_rrn_search` (`search_id`),
  KEY `idx_rrn_category` (`category_id`),
  CONSTRAINT `fk_rrn_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrn_category` FOREIGN KEY (`category_id`) REFERENCES `rr_award_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrn_nominee` FOREIGN KEY (`nominee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrn_nominator` FOREIGN KEY (`nominator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_nomination_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_id` INT NOT NULL,
  `document_type` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `uploaded_by` INT DEFAULT NULL,
  `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rrnd_nomination` (`nomination_id`),
  CONSTRAINT `fk_rrnd_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrnd_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_evaluation_criteria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `search_id` INT NOT NULL,
  `position_type` ENUM('teaching','non_teaching') NOT NULL,
  `criterion_label` VARCHAR(500) NOT NULL,
  `weight_percent` DECIMAL(5,2) NOT NULL,
  `max_score` DECIMAL(8,2) NOT NULL DEFAULT 100.00,
  `description` TEXT DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_rrec_search` (`search_id`),
  CONSTRAINT `fk_rrec_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_evaluation_scores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_id` INT NOT NULL,
  `criterion_id` INT NOT NULL,
  `score_given` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `scored_by` INT DEFAULT NULL,
  `scored_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rres` (`nomination_id`,`criterion_id`),
  KEY `idx_rres_criterion` (`criterion_id`),
  CONSTRAINT `fk_rres_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rres_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `rr_evaluation_criteria` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rres_user` FOREIGN KEY (`scored_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_deliberation_notes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_id` INT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `is_selected` TINYINT(1) NOT NULL DEFAULT 0,
  `selected_by` INT DEFAULT NULL,
  `selected_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rrdn_nomination` (`nomination_id`),
  KEY `idx_rrdn_selected_by` (`selected_by`),
  CONSTRAINT `fk_rrdn_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrdn_user` FOREIGN KEY (`selected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_awards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomination_id` INT NOT NULL,
  `search_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `award_title` VARCHAR(500) NOT NULL,
  `award_level` ENUM('school','division','regional','national') NOT NULL DEFAULT 'division',
  `position_type` ENUM('teaching','non_teaching') NOT NULL,
  `is_awarded` TINYINT(1) NOT NULL DEFAULT 0,
  `awarded_at` DATE DEFAULT NULL,
  `certificate_path` VARCHAR(500) DEFAULT NULL,
  `announced_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rra_nomination` (`nomination_id`),
  KEY `idx_rra_search` (`search_id`),
  CONSTRAINT `fk_rra_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rra_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rra_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rra_category` FOREIGN KEY (`category_id`) REFERENCES `rr_award_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_ceremony` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `search_id` INT NOT NULL,
  `ceremony_date` DATE NOT NULL,
  `venue` VARCHAR(500) DEFAULT NULL,
  `program_of_activities` TEXT DEFAULT NULL,
  `guest_of_honor` VARCHAR(255) DEFAULT NULL,
  `photos_path` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rrc_search` (`search_id`),
  CONSTRAINT `fk_rrc_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rr_implementation_reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `search_id` INT NOT NULL,
  `generated_by` INT DEFAULT NULL,
  `generated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `total_nominees` INT NOT NULL DEFAULT 0,
  `total_awardees` INT NOT NULL DEFAULT 0,
  `teaching_awardees` INT NOT NULL DEFAULT 0,
  `non_teaching_awardees` INT NOT NULL DEFAULT 0,
  `report_data` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rrir_search` (`search_id`),
  CONSTRAINT `fk_rrir_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrir_user` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- MODULE 5: PERSONNEL — EMPLOYEE PORTAL & HR ADMIN
-- ============================================================

CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `employee_no` VARCHAR(50) DEFAULT NULL,
  `first_name` VARCHAR(100) DEFAULT NULL,
  `middle_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) DEFAULT NULL,
  `name_extension` VARCHAR(20) DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `place_of_birth` VARCHAR(200) DEFAULT NULL,
  `sex` ENUM('male','female') DEFAULT NULL,
  `civil_status` ENUM('single','married','widowed','separated','others') DEFAULT NULL,
  `blood_type` VARCHAR(5) DEFAULT NULL,
  `gsis_id` VARCHAR(50) DEFAULT NULL,
  `pagibig_id` VARCHAR(50) DEFAULT NULL,
  `philhealth_no` VARCHAR(50) DEFAULT NULL,
  `tin_no` VARCHAR(50) DEFAULT NULL,
  `mobile_no` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `employment_status` ENUM('permanent','temporary','casual','contractual','coterminous') NOT NULL DEFAULT 'permanent',
  `employment_type` ENUM('teaching','non-teaching','teaching_related') NOT NULL DEFAULT 'teaching',
  `position_title` VARCHAR(150) DEFAULT NULL,
  `salary_grade` VARCHAR(10) DEFAULT NULL,
  `monthly_salary` DECIMAL(12,2) DEFAULT NULL,
  `item_number` VARCHAR(50) DEFAULT NULL,
  `assigned_school` VARCHAR(200) DEFAULT NULL,
  `date_hired` DATE DEFAULT NULL,
  `date_original_appointment` DATE DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employees_user` (`user_id`),
  UNIQUE KEY `uq_employees_no` (`employee_no`),
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leave_credits` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `sick_leave_balance` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  `vacation_leave_balance` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  `forced_leave_balance` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  `special_privilege_balance` DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  `as_of_date` DATE DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leave_credits_employee` (`employee_id`),
  CONSTRAINT `fk_lc_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leave_applications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `leave_type` ENUM('sick','vacation','special_privilege','maternity','paternity','forced','study','rehabilitation','vawc','solo_parent') NOT NULL,
  `date_from` DATE NOT NULL,
  `date_to` DATE NOT NULL,
  `num_days` DECIMAL(5,1) DEFAULT NULL,
  `reason` TEXT DEFAULT NULL,
  `status` ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `approved_by` INT DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `supporting_file_path` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_la_employee` (`employee_id`),
  CONSTRAINT `fk_la_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `travel_authority_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `purpose` TEXT NOT NULL,
  `destination` VARCHAR(300) NOT NULL,
  `date_from` DATE NOT NULL,
  `date_to` DATE NOT NULL,
  `transport_mode` VARCHAR(100) DEFAULT NULL,
  `estimated_expense` DECIMAL(12,2) DEFAULT NULL,
  `supporting_file_path` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `approved_by` INT DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `travel_order_path` VARCHAR(500) DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tar_employee` (`employee_id`),
  CONSTRAINT `fk_tar_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `employee_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `document_type` VARCHAR(150) NOT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_path` VARCHAR(500) DEFAULT NULL,
  `file_size_kb` INT DEFAULT NULL,
  `uploaded_by` INT DEFAULT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `verified_by` INT DEFAULT NULL,
  `verified_at` DATETIME DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ed_employee` (`employee_id`),
  CONSTRAINT `fk_ed_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `request_type` ENUM('service_record','coe','coe_with_compensation','id_replacement','correction_personal_info','employment_verification','other') NOT NULL,
  `details` TEXT DEFAULT NULL,
  `status` ENUM('pending','processing','ready','released','rejected') NOT NULL DEFAULT 'pending',
  `processed_by` INT DEFAULT NULL,
  `processed_at` DATETIME DEFAULT NULL,
  `released_file_path` VARCHAR(500) DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dr_employee` (`employee_id`),
  CONSTRAINT `fk_dr_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `personnel_notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL,
  `type` ENUM('leave','travel','document','general') NOT NULL,
  `reference_id` INT DEFAULT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pn_employee` (`employee_id`),
  CONSTRAINT `fk_pn_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `personnel_activity_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `actor_id` INT DEFAULT NULL,
  `employee_id` INT DEFAULT NULL,
  `action_type` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pal_actor` (`actor_id`),
  KEY `idx_pal_employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SEED DATA — Minimal required data
-- ============================================================

-- Default office settings
INSERT INTO `settings` (`id`, `office_name`, `region`, `contact_number`) VALUES
  (1, 'Schools Division Office of Dapitan City', 'Region IX – Zamboanga Peninsula', '065-908-1234')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Default appointment required documents
INSERT INTO `appointment_required_documents` (`document_type`, `is_mandatory`) VALUES
  ('Original/Authenticated Transcript of Records', 1),
  ('Original/Authenticated Diploma', 1),
  ('Updated Personal Data Sheet (CS Form 212)', 1),
  ('NBI Clearance (issued within 6 months)', 1),
  ('Medical Certificate (from government hospital)', 1),
  ('Dental Certificate', 1),
  ('4 pcs. Passport-size ID photos', 1),
  ('Authenticated Service Record', 1),
  ('Certificate of No Pending Administrative Case', 1);


SET FOREIGN_KEY_CHECKS = 1;
