-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for deped_hrmis
CREATE DATABASE IF NOT EXISTS `deped_hrmis` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `deped_hrmis`;

-- Dumping structure for table deped_hrmis.activity_log
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `applicant_id` int DEFAULT NULL,
  `actor_id` int DEFAULT NULL,
  `action_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_al_vacancy` (`vacancy_id`),
  KEY `idx_al_actor` (`actor_id`),
  CONSTRAINT `fk_al_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_al_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.activity_log: ~40 rows (approximately)
INSERT INTO `activity_log` (`id`, `vacancy_id`, `applicant_id`, `actor_id`, `action_description`, `created_at`) VALUES
	(1, 1, 1, 2, 'Application moved to shortlisted status', '2026-07-06 03:56:29'),
	(2, 1, NULL, 1, 'Comparative Assessment finalized and submitted to SDS.', '2026-07-06 04:43:37'),
	(3, 1, NULL, 1, 'Shortlist finalized - top 1 endorsed to SDS', '2026-07-06 04:43:57'),
	(4, 1, NULL, 1, 'Congratulatory Advice issued to Liza Fernandez for Teacher I', '2026-07-06 04:44:06'),
	(5, 2, NULL, 1, 'New vacancy posted: IT support (V-2026-001)', '2026-07-06 06:39:42'),
	(6, 2, NULL, 6, 'New application submitted for IT support (APP-002-2026) by leo alfier antipuesto', '2026-07-06 06:58:16'),
	(7, 2, NULL, 1, 'Comparative Assessment finalized and submitted to SDS.', '2026-07-06 07:02:38'),
	(8, 2, NULL, 1, 'Comparative assessment results posted for V-2026-001', '2026-07-06 07:03:00'),
	(9, 2, NULL, 1, 'Shortlist finalized - top 1 endorsed to SDS', '2026-07-06 07:03:08'),
	(10, 1, NULL, 1, 'Congratulatory Advice issued to Liza Fernandez for Teacher I', '2026-07-06 07:03:16'),
	(11, 2, NULL, 1, 'Congratulatory Advice issued to leo alfier antipuesto for IT support', '2026-07-06 07:20:03'),
	(12, 2, 2, 1, 'Appointment issued for IT support', '2026-07-06 07:20:32'),
	(13, 2, NULL, 1, 'Notice of Appointment posted to: bulletin_board, division_website', '2026-07-06 07:20:41'),
	(14, 3, NULL, 1, 'New vacancy posted: School Head (V-2026-002)', '2026-07-09 21:30:50'),
	(15, 1, NULL, 1, 'Initial Evaluation finalized. Process advanced to Stage 5.', '2026-07-11 07:03:42'),
	(16, 3, NULL, 1, 'Vacancy soft-deleted: V-2026-002 — School Head', '2026-07-13 00:40:21'),
	(17, 3, NULL, 1, 'Vacancy restored: V-2026-002 — School Head (status: active)', '2026-07-13 00:40:28'),
	(18, 1, NULL, 1, 'Vacancy soft-deleted: DCC-2026-001 — Teacher I', '2026-07-13 00:40:55'),
	(19, 1, NULL, 1, 'Vacancy restored: DCC-2026-001 — Teacher I (status: closed)', '2026-07-13 00:56:17'),
	(20, 1, NULL, 1, 'Vacancy soft-deleted: DCC-2026-001 — Teacher I', '2026-07-13 01:04:41'),
	(21, 3, NULL, 1, 'Vacancy soft-deleted: V-2026-002 — School Head', '2026-07-13 01:05:23'),
	(22, 2, NULL, 1, 'Vacancy soft-deleted: V-2026-001 — IT support', '2026-07-13 01:05:26'),
	(23, 3, NULL, 1, 'Vacancy restored: V-2026-002 — School Head (status: active)', '2026-07-13 01:06:13'),
	(24, 2, NULL, 1, 'Vacancy restored: V-2026-001 — IT support (status: active)', '2026-07-13 01:06:15'),
	(25, 1, NULL, 1, 'Vacancy restored: DCC-2026-001 — Teacher I (status: closed)', '2026-07-13 01:06:18'),
	(26, 3, NULL, 1, 'Vacancy soft-deleted: V-2026-002 — School Head', '2026-07-13 07:28:23'),
	(27, 1, NULL, 1, 'IES scores updated for Juan Santos', '2026-07-13 08:01:00'),
	(28, 1, NULL, 1, 'IES evaluation status changed to submitted for Juan Santos', '2026-07-13 08:01:00'),
	(29, 1, NULL, 1, 'IES evaluation status changed to submitted for Juan Santos', '2026-07-13 08:01:10'),
	(30, 1, NULL, 1, 'IES evaluation status changed to attested for Juan Santos', '2026-07-13 08:03:10'),
	(31, 1, NULL, 1, 'IES scores updated for Liza Fernandez', '2026-07-13 08:45:06'),
	(32, 1, NULL, 1, 'IES evaluation status changed to submitted for Liza Fernandez', '2026-07-13 08:45:06'),
	(33, 1, NULL, 1, 'IES evaluation status changed to submitted for Liza Fernandez', '2026-07-13 08:45:32'),
	(34, 1, NULL, 1, 'IES evaluation status changed to attested for Liza Fernandez', '2026-07-13 08:45:52'),
	(35, 2, NULL, 1, 'Congratulatory Advice issued to leo alfier antipuesto for IT support', '2026-07-17 17:25:25'),
	(36, 3, NULL, 10, 'New application submitted for School Head (TR-001) by jhustyn ', '2026-07-19 07:12:18'),
	(37, 3, NULL, 1, 'Comparative Assessment submitted to HRMPSB.', '2026-07-19 09:11:50'),
	(38, 3, NULL, 1, 'Comparative Assessment submitted to HRMPSB.', '2026-07-19 09:12:03'),
	(39, 3, NULL, 1, 'IES evaluation created for jhustyn ', '2026-07-19 09:12:12'),
	(40, 3, NULL, 1, 'IES scores updated for jhustyn ', '2026-07-19 09:13:46'),
	(41, 3, NULL, 1, 'IES evaluation status changed to submitted for jhustyn ', '2026-07-19 09:13:46'),
	(42, 3, NULL, 1, 'IES evaluation status changed to submitted for jhustyn ', '2026-07-19 09:13:53'),
	(43, 3, NULL, 1, 'IES evaluation status changed to attested for jhustyn ', '2026-07-19 09:14:11'),
	(44, 3, NULL, 1, 'Comparative assessment results posted for V-2026-002', '2026-07-19 10:03:07'),
	(45, 3, NULL, 1, 'Shortlist finalized - top 1 endorsed to SDS', '2026-07-19 10:03:24'),
	(46, NULL, NULL, 1, 'Annex E (qualified) advice letter emailed to jhustyn jhustyn at leoalfier68@gmail.com', '2026-07-19 15:32:03'),
	(47, NULL, NULL, 1, 'Annex E (qualified) advice letter emailed to leo alfier antipuesto at leoalfier68@gmail.com', '2026-07-19 15:33:07'),
	(48, 3, NULL, 1, 'Congratulatory Advice issued to jhustyn  for School Head', '2026-07-20 04:30:25'),
	(49, 3, 5, 1, 'Appointment issued for School Head', '2026-07-21 04:24:07'),
	(50, 3, NULL, 1, 'Notice of Appointment posted to: bulletin_board, facebook, division_website', '2026-07-21 04:24:21');

-- Dumping structure for table deped_hrmis.appeals
CREATE TABLE IF NOT EXISTS `appeals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `applicant_id` int NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `admin_response` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_appeals_application` (`application_id`),
  KEY `fk_appeals_applicant` (`applicant_id`),
  CONSTRAINT `fk_appeals_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appeals_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.appeals: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.applicants
CREATE TABLE IF NOT EXISTS `applicants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vacancy_id` int DEFAULT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_station` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_submitted` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('submitted','under_evaluation','qualified','disqualified','shortlisted','selected','appointed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `qualified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_applicants_code` (`applicant_code`),
  KEY `idx_applicants_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_applicants_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.applicants: ~1 rows (approximately)
INSERT INTO `applicants` (`id`, `applicant_code`, `vacancy_id`, `full_name`, `id_number`, `school_station`, `date_submitted`, `status`, `qualified_at`) VALUES
	(1, 'LEG-0001', 1, 'Liza Fernandez', 'ID-0001', 'Dapitan City National High School', '2026-07-06 03:56:29', 'submitted', NULL),
	(4, 'LEG-0003', 1, 'Juan Santos', 'ID-0003', 'Dapitan City East Elementary School', '2026-07-06 09:02:45', 'submitted', NULL);

-- Dumping structure for table deped_hrmis.applicant_documents
CREATE TABLE IF NOT EXISTS `applicant_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_status` enum('not_uploaded','uploaded_pending_review','verified') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_uploaded',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_applicant_docs` (`applicant_id`),
  CONSTRAINT `fk_applicant_docs` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.applicant_documents: ~0 rows (approximately)
INSERT INTO `applicant_documents` (`id`, `applicant_id`, `document_type`, `is_required`, `file_path`, `verification_status`, `uploaded_at`) VALUES
	(1, 1, 'Diploma', 1, '/uploads/legacy/1/diploma.pdf', 'verified', '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.applicant_eligibility_screening
CREATE TABLE IF NOT EXISTS `applicant_eligibility_screening` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int DEFAULT NULL,
  `application_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applicant_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `sex` enum('male','female') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `civil_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disability` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ethnic_group` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `training_title` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `training_hours` decimal(8,2) DEFAULT NULL,
  `experience_years` decimal(5,2) DEFAULT NULL,
  `experience_details` text COLLATE utf8mb4_unicode_ci,
  `eligibility` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` enum('qualified','disqualified') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vacancy_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_aes_application` (`application_id`),
  KEY `idx_aes_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_aes_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aes_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.applicant_eligibility_screening: ~2 rows (approximately)
INSERT INTO `applicant_eligibility_screening` (`id`, `application_id`, `application_code`, `applicant_name`, `address`, `age`, `sex`, `civil_status`, `religion`, `disability`, `ethnic_group`, `email`, `contact_no`, `education`, `training_title`, `training_hours`, `experience_years`, `experience_details`, `eligibility`, `remarks`, `vacancy_id`, `created_at`) VALUES
	(1, 1, 'APP-2026-0001', 'Liza Fernandez', '', 28, 'female', 'single', NULL, NULL, NULL, 'applicant.teaching@depedhrmis.test', '09171234505', '', '', NULL, 3.00, '', '', 'qualified', 1, '2026-07-06 03:56:28'),
	(2, 2, 'APP-002-2026', 'leo alfier antipuesto', 'rjfoeuirjgioejtgoitg, N/A, oowejfiojeorfjoirf, rj3ifjwiorfjoifj, calamba district hospital misamis occidental, misamis occidental, 7101', 25, 'male', 'single', NULL, NULL, NULL, 'leoalfier68@gmail.com', '09123456789', 'EUDJHWEUIHWEUI', '', NULL, 7.00, '; ; ; ; ; ; ', '', NULL, 2, '2026-07-18 20:22:28'),
	(3, 4, 'APP-2026-0003', 'Juan Santos', '', 31, 'male', 'single', NULL, NULL, NULL, 'applicant.teaching2@depedhrmis.test', '09179988776', '', '', NULL, 5.00, '', '', NULL, 1, '2026-07-18 20:22:28'),
	(7, 5, 'TR-001', 'jhustyn ', 'ajsdaiednajhd, ajsdaiednajhd, ajsdaiednajhd, ajsdaiednajhd, ajsdaiednajhd, ajsdaiednajhd, 1233', 0, 'male', 'single', 'hjsdnaidjasdnasdi', 'hjsdnaidjasdnasdi', 'hjsdnaidjasdnasdi', 'leoalfier68@gmail.com', '09123456789', 'JSIJNWN', '', NULL, 0.00, '; ; ; ; ; ; ', '', NULL, 3, '2026-07-19 07:12:18');

-- Dumping structure for table deped_hrmis.applicant_qualification_results
CREATE TABLE IF NOT EXISTS `applicant_qualification_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `criterion_id` int DEFAULT NULL,
  `passed` tinyint(1) DEFAULT NULL,
  `evaluated_by` int DEFAULT NULL,
  `evaluated_at` datetime DEFAULT NULL,
  `criterion_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_aqr` (`applicant_id`,`criterion_id`),
  KEY `idx_aqr_criterion` (`criterion_id`),
  KEY `idx_aqr_evaluated_by` (`evaluated_by`),
  CONSTRAINT `fk_aqr_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aqr_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `minimum_qualifications_checklist` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aqr_evaluated_by` FOREIGN KEY (`evaluated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.applicant_qualification_results: ~2 rows (approximately)
INSERT INTO `applicant_qualification_results` (`id`, `applicant_id`, `criterion_id`, `passed`, `evaluated_by`, `evaluated_at`, `criterion_reason`) VALUES
	(1, 1, 1, 1, NULL, NULL, NULL),
	(2, 1, 2, 1, NULL, NULL, NULL);

-- Dumping structure for table deped_hrmis.applications
CREATE TABLE IF NOT EXISTS `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int NOT NULL,
  `applicant_id` int NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `years_experience` int NOT NULL DEFAULT '0',
  `snap_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snap_age` int DEFAULT NULL,
  `snap_sex` enum('male','female') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snap_civil_status` enum('single','married','widowed','separated','others') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snap_religion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snap_disability` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snap_ethnic_group` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snap_education` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snap_training_hours` decimal(8,2) DEFAULT NULL,
  `snap_eligibility` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','submitted','under_review','qualified','disqualified','shortlisted','selected','appointed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `ref_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `current_stage` int NOT NULL DEFAULT '1',
  `evaluated_at` datetime DEFAULT NULL,
  `evaluated_by` int DEFAULT NULL,
  `initial_evaluation_remarks` text COLLATE utf8mb4_unicode_ci,
  `disqualification_recorded_by` int DEFAULT NULL,
  `disqualification_recorded_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `letter_type` enum('qualified','disqualified') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `advice_sent_at` datetime DEFAULT NULL,
  `letter_salutation` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `letter_last_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `letter_first_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `letter_address` text COLLATE utf8mb4_unicode_ci,
  `letter_date` date DEFAULT NULL,
  `table_rows_override` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_applications_ref_no` (`ref_no`),
  KEY `idx_applications_vacancy` (`vacancy_id`),
  KEY `idx_applications_applicant` (`applicant_id`),
  CONSTRAINT `fk_applications_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_applications_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.applications: ~4 rows (approximately)
INSERT INTO `applications` (`id`, `vacancy_id`, `applicant_id`, `full_name`, `email`, `phone`, `current_school`, `years_experience`, `snap_address`, `snap_age`, `snap_sex`, `snap_civil_status`, `snap_religion`, `snap_disability`, `snap_ethnic_group`, `snap_education`, `snap_training_hours`, `snap_eligibility`, `status`, `ref_no`, `submitted_at`, `current_stage`, `evaluated_at`, `evaluated_by`, `initial_evaluation_remarks`, `disqualification_recorded_by`, `disqualification_recorded_at`, `created_at`, `updated_at`, `letter_type`, `advice_sent_at`, `letter_salutation`, `letter_last_name`, `letter_first_name`, `letter_address`, `letter_date`, `table_rows_override`) VALUES
	(1, 1, 5, 'Liza Fernandez', 'applicant.teaching@depedhrmis.test', '09171234505', 'Dapitan City Central Elementary School', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'disqualified', 'APP-2026-0001', '2026-06-05 09:00:00', 9, '2026-07-11 15:03:15', 1, NULL, NULL, NULL, '2026-07-06 03:56:28', '2026-07-17 19:07:47', 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(2, 2, 6, 'leo alfier antipuesto', 'leoalfier68@gmail.com', '09123456789', 'N/A', 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'qualified', 'APP-002-2026', '2026-07-06 14:58:16', 9, '2026-07-18 03:08:29', 1, NULL, NULL, NULL, '2026-07-06 06:56:56', '2026-07-19 15:33:07', NULL, '2026-07-19 23:33:07', NULL, NULL, NULL, NULL, NULL, NULL),
	(4, 1, 9, 'Juan Santos', 'applicant.teaching2@depedhrmis.test', '09179988776', 'Dapitan City East Elementary School', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'qualified', 'APP-2026-0003', '2026-07-06 17:02:45', 1, '2026-07-11 15:03:38', 1, NULL, NULL, NULL, '2026-07-06 09:02:45', '2026-07-19 10:24:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(5, 3, 10, 'jhustyn ', 'leoalfier68@gmail.com', '09123456789', 'N/A', 0, 'ajsdaiednajhd, ajsdaiednajhd, ajsdaiednajhd, ajsdaiednajhd, ajsdaiednajhd, ajsdaiednajhd, 1233', 21, 'male', 'single', 'hjsdnaidjasdnasdi', 'hjsdnaidjasdnasdi', 'hjsdnaidjasdnasdi', 'JSIJNWN', NULL, 'CSC', 'appointed', 'TR-001', '2026-07-19 15:12:18', 11, '2026-07-19 18:04:05', 1, NULL, 1, '2026-07-19 16:13:22', '2026-07-19 07:01:21', '2026-07-21 04:24:07', 'qualified', '2026-07-19 23:32:03', 'Mrs.', 'jhustyn', 'jhustyn', 'TR001', '2026-07-15', '[{"cs_qs": "Education", "passed": 1, "reason": null, "remarks": "QUALIFIED", "is_required": true, "criterion_id": null, "criterion_label": "Education", "your_qualifications": "None"}, {"cs_qs": "Experience", "passed": 1, "reason": null, "remarks": "QUALIFIED", "is_required": true, "criterion_id": null, "criterion_label": "Experience", "your_qualifications": "None"}, {"cs_qs": "Training", "passed": 1, "reason": null, "remarks": "QUALIFIED", "is_required": true, "criterion_id": null, "criterion_label": "Training", "your_qualifications": "None"}, {"cs_qs": "Eligibility", "passed": 1, "reason": null, "remarks": "QUALIFIED", "is_required": true, "criterion_id": null, "criterion_label": "Eligibility", "your_qualifications": "None"}]');

-- Dumping structure for table deped_hrmis.application_disqualification_history
CREATE TABLE IF NOT EXISTS `application_disqualification_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `reason` text COLLATE utf8mb4_general_ci NOT NULL,
  `recorded_by` int DEFAULT NULL,
  `recorded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_disq_history` (`application_id`),
  KEY `fk_disq_history_actor` (`recorded_by`),
  CONSTRAINT `fk_disq_history_actor` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_disq_history_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table deped_hrmis.application_disqualification_history: ~0 rows (approximately)
INSERT INTO `application_disqualification_history` (`id`, `application_id`, `reason`, `recorded_by`, `recorded_at`) VALUES
	(1, 5, 'AHHH DADI ROB', 1, '2026-07-19 16:13:22');

-- Dumping structure for table deped_hrmis.application_documents
CREATE TABLE IF NOT EXISTS `application_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `verification_status` enum('not_submitted','pending_review','verified','needs_revision','superseded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_review',
  `verification_note` text COLLATE utf8mb4_unicode_ci,
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `revision_note` text COLLATE utf8mb4_unicode_ci,
  `revision_requested_by` int DEFAULT NULL,
  `revision_requested_at` datetime DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_docs_application` (`application_id`),
  KEY `fk_ad_verified_by` (`verified_by`),
  KEY `fk_ad_revision_requested_by` (`revision_requested_by`),
  CONSTRAINT `fk_ad_revision_requested_by` FOREIGN KEY (`revision_requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ad_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_app_docs_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.application_documents: ~24 rows (approximately)
INSERT INTO `application_documents` (`id`, `application_id`, `document_type`, `file_name`, `file_path`, `is_verified`, `verification_status`, `verification_note`, `verified_by`, `verified_at`, `revision_note`, `revision_requested_by`, `revision_requested_at`, `uploaded_at`) VALUES
	(1, 1, 'Transcript of Records', 'tor_liza.pdf', '/uploads/applications/1/tor_liza.pdf', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 03:56:28'),
	(2, 1, 'PRC License', 'prc_liza.pdf', '/uploads/applications/1/prc_liza.pdf', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 03:56:28'),
	(3, 2, 'Personal Data Sheet (CS Form 212, latest revision)', 'Appointment_Notice_Leo (1).pdf', '/uploads/applications/DOC-1783321024613-309502407.pdf', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 06:57:04'),
	(4, 2, 'Service Record (duly signed by authorized official)', 'Congratulatory_Advice.pdf', '/uploads/applications/DOC-1783321036699-455772531.pdf', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 06:57:16'),
	(5, 2, 'Performance Evaluation Reports (last 3 rating periods)', '311229344_870436670963552_6984268498114236204_n-768x432 (1).png', '/uploads/applications/DOC-1783321049500-397667929.png', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 06:57:29'),
	(6, 2, 'Transcript of Records (certified true copy)', 'ad3d9de9-6375-4ff6-9b55-e9e1c3fe7f2c.jpg', '/uploads/applications/DOC-1783321055043-310410663.jpg', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 06:57:35'),
	(7, 2, 'Diploma (certified true copy)', '64aede20-2233-42be-8a1f-3f8adfcb18e4.jpg', '/uploads/applications/DOC-1783321060732-857226246.jpg', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 06:57:40'),
	(8, 2, 'CSC Eligibility Certificate (Career Service Professional/Sub-Professional)', 'ddcb1852-c2ce-4e97-a6db-c4f479897eca.jpg', '/uploads/applications/DOC-1783321065749-559733880.jpg', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 06:57:45'),
	(9, 2, 'NBI Clearance (issued within the last 6 months)', '41f35897-8bb7-458e-b30b-dc23bbd5b99e.jpg', '/uploads/applications/DOC-1783321072036-601721144.jpg', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 06:57:52'),
	(10, 2, 'CSC MC 10 s. 2013 Omnibus Sworn Statement', 'Appointment_Notice_Leo (1).pdf', '/uploads/applications/DOC-1783321079188-801670533.pdf', 1, 'verified', 'okay', 1, '2026-07-14 13:18:35', 'blury i cannot see the files clearly', 1, '2026-07-14 13:03:53', '2026-07-06 06:57:59'),
	(11, 2, 'Medical Certificate (from government hospital)', 'Lab-Exercise-Checklist-2.pdf', '/uploads/applications/DOC-1783321086101-381025936.pdf', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 06:58:06'),
	(12, 2, 'Certificates of Training / Seminars (relevant)', 'ad3d9de9-6375-4ff6-9b55-e9e1c3fe7f2c.jpg', '/uploads/applications/DOC-1783321091769-798823521.jpg', 1, 'verified', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06 06:58:11'),
	(13, 5, 'Personal Data Sheet (CS Form 212, latest revision)', 'AnnexE_Fernandez (1).pdf', '/uploads/applications/DOC-1784444489239-813513435.pdf', 1, 'verified', NULL, 1, '2026-07-19 16:42:18', NULL, NULL, NULL, '2026-07-19 07:01:29'),
	(14, 5, 'Service Record (duly signed by authorized official)', 'AnnexE_Fernandez (2).pdf', '/uploads/applications/DOC-1784444495532-43803691.pdf', 1, 'verified', NULL, 1, '2026-07-19 16:42:14', NULL, NULL, NULL, '2026-07-19 07:01:35'),
	(15, 5, 'Performance Evaluation Reports (last 3 rating periods)', '915b4dee-55b8-4276-b363-1e7a2d52be8c.jpg', '/uploads/applications/DOC-1784444502566-619681629.jpg', 1, 'verified', NULL, 1, '2026-07-19 16:42:17', NULL, NULL, NULL, '2026-07-19 07:01:42'),
	(16, 5, 'Transcript of Records (certified true copy)', '674407690_954839890804159_7607003492885431419_n.jpg', '/uploads/applications/DOC-1784444512680-562749746.jpg', 1, 'verified', NULL, 1, '2026-07-19 17:10:06', NULL, NULL, NULL, '2026-07-19 07:01:52'),
	(17, 5, 'Diploma (certified true copy)', '915b4dee-55b8-4276-b363-1e7a2d52be8c.jpg', '/uploads/applications/DOC-1784444519671-338238400.jpg', 1, 'verified', NULL, 1, '2026-07-19 16:42:15', NULL, NULL, NULL, '2026-07-19 07:01:59'),
	(18, 5, 'CSC Eligibility Certificate (Career Service Professional/Sub-Professional)', '674407690_954839890804159_7607003492885431419_n.jpg', '/uploads/applications/DOC-1784444526775-276876748.jpg', 1, 'verified', NULL, 1, '2026-07-19 16:41:25', NULL, NULL, NULL, '2026-07-19 07:02:06'),
	(19, 5, 'NBI Clearance (issued within the last 6 months)', '412b73d2-319a-4bc7-a091-96a047a618e6.jpg', '/uploads/applications/DOC-1784444534231-3739842.jpg', 0, 'superseded', NULL, NULL, NULL, 'ahhh basta', 1, '2026-07-19 16:41:56', '2026-07-19 07:02:14'),
	(20, 5, 'CSC MC 10 s. 2013 Omnibus Sworn Statement', 'IES_Juan Santos (8).pdf', '/uploads/applications/DOC-1784444540153-6662045.pdf', 0, 'superseded', NULL, NULL, NULL, 'dili makita naunsaman sab ka oi', 1, '2026-07-19 16:30:23', '2026-07-19 07:02:20'),
	(21, 5, 'Medical Certificate (from government hospital)', 'Congratulatory_Advice_leo_alfier_antipuesto.pdf', '/uploads/applications/DOC-1784444547460-985884307.pdf', 1, 'verified', NULL, 1, '2026-07-19 16:41:59', NULL, NULL, NULL, '2026-07-19 07:02:27'),
	(22, 5, 'Certificates of Training / Seminars (relevant)', '311229344_870436670963552_6984268498114236204_n-768x432 (1).png', '/uploads/applications/DOC-1784444553556-225640746.png', 1, 'verified', NULL, 1, '2026-07-19 16:41:23', NULL, NULL, NULL, '2026-07-19 07:02:33'),
	(23, 5, 'CSC MC 10 s. 2013 Omnibus Sworn Statement', 'RR-process-flow-1-768x910 (1).png', '/uploads/applications/DOC-1784450634785-844504201.png', 1, 'verified', NULL, 1, '2026-07-19 16:44:50', NULL, NULL, NULL, '2026-07-19 08:43:54'),
	(24, 5, 'NBI Clearance (issued within the last 6 months)', 'RR-process-flow-1-768x910.png', '/uploads/applications/DOC-1784450642971-447746843.png', 1, 'verified', NULL, 1, '2026-07-19 16:44:48', NULL, NULL, NULL, '2026-07-19 08:44:02');

-- Dumping structure for table deped_hrmis.appointments
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `vacancy_id` int DEFAULT NULL,
  `salary_grade` int DEFAULT NULL,
  `monthly_salary` decimal(10,2) DEFAULT NULL,
  `nature_of_appointment` enum('Permanent','Temporary','Provisional') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Permanent',
  `issued_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `issued_by` int DEFAULT NULL,
  `notice_posted_at` timestamp NULL DEFAULT NULL,
  `notice_posting_deadline` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_appointments` (`applicant_id`,`vacancy_id`),
  KEY `idx_appt_vacancy` (`vacancy_id`),
  KEY `fk_appt_user` (`issued_by`),
  CONSTRAINT `fk_appt_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appt_user` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.appointments: ~0 rows (approximately)
INSERT INTO `appointments` (`id`, `applicant_id`, `vacancy_id`, `salary_grade`, `monthly_salary`, `nature_of_appointment`, `issued_at`, `issued_by`, `notice_posted_at`, `notice_posting_deadline`) VALUES
	(1, 1, 1, 11, 27608.00, 'Permanent', '2026-07-06 03:56:29', 4, '2026-07-16 00:00:00', '2026-07-20'),
	(4, 2, 2, NULL, NULL, 'Permanent', '2026-07-06 07:20:32', 1, NULL, '2026-07-21'),
	(6, 5, 3, NULL, NULL, 'Permanent', '2026-07-21 04:24:07', 1, NULL, '2026-08-05');

-- Dumping structure for table deped_hrmis.appointment_documents
CREATE TABLE IF NOT EXISTS `appointment_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_status` enum('not_uploaded','uploaded_pending_review','verified','needs_revision') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_uploaded',
  `revision_note` text COLLATE utf8mb4_unicode_ci,
  `verified_at` datetime DEFAULT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ad_applicant` (`applicant_id`),
  CONSTRAINT `fk_ad_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.appointment_documents: ~22 rows (approximately)
INSERT INTO `appointment_documents` (`id`, `applicant_id`, `document_type`, `is_required`, `file_path`, `file_name`, `verification_status`, `revision_note`, `verified_at`, `uploaded_at`) VALUES
	(1, 1, 'NBI Clearance', 1, 'uploads/rsp/appointment-docs/APPT-1783313059536.png', 'RR-process-flow-1-768x910.png', 'verified', NULL, '2026-07-06 12:44:33', NULL),
	(2, 1, 'Medical Certificate', 1, 'uploads/rsp/appointment-docs/APPT-1783313071210.pdf', 'Appointment_Notice_Leo (1).pdf', 'verified', NULL, '2026-07-06 12:44:36', NULL),
	(3, 2, 'Original/Authenticated Transcript of Records', 1, '/uploads/applications/appointment-docs/APPT-1783321478058-275181522.pdf', 'Appointment_Notice_Leo (1).pdf', 'verified', NULL, '2026-07-06 15:20:21', '2026-07-06 15:04:38'),
	(4, 2, 'Original/Authenticated BSEd/BSE Diploma', 1, '/uploads/applications/appointment-docs/APPT-1783321496447-480399721.png', '311229344_870436670963552_6984268498114236204_n-768x432 (1).png', 'verified', NULL, '2026-07-06 15:20:22', '2026-07-06 15:04:56'),
	(5, 2, 'Updated Personal Data Sheet (CS Form 212)', 1, '/uploads/applications/appointment-docs/APPT-1783321503359-143281471.png', '311229344_870436670963552_6984268498114236204_n-768x432 (1).png', 'verified', NULL, '2026-07-06 15:20:23', '2026-07-06 15:05:03'),
	(6, 2, 'NBI Clearance (issued within 6 months)', 1, '/uploads/applications/appointment-docs/APPT-1783321519125-249889419.jpg', 'ad3d9de9-6375-4ff6-9b55-e9e1c3fe7f2c.jpg', 'verified', NULL, '2026-07-06 15:20:24', '2026-07-06 15:05:19'),
	(7, 2, 'Medical Certificate (from government hospital)', 1, '/uploads/applications/appointment-docs/APPT-1783321527475-478128598.png', 'Process-Flow-768x1174.png', 'verified', NULL, '2026-07-06 15:20:25', '2026-07-06 15:05:27'),
	(8, 2, 'Dental Certificate', 1, '/uploads/applications/appointment-docs/APPT-1783321536183-765466276.jpg', 'ddcb1852-c2ce-4e97-a6db-c4f479897eca.jpg', 'verified', NULL, '2026-07-06 15:20:26', '2026-07-06 15:05:36'),
	(9, 2, '4 pcs. Passport-size ID photos (white background)', 1, '/uploads/applications/appointment-docs/APPT-1783321543700-411326863.jpg', '900ce895-9970-4a9c-bb2f-496b8e20f596.jpg', 'verified', NULL, '2026-07-06 15:20:27', '2026-07-06 15:05:43'),
	(10, 2, 'Marriage Certificate (for married female)', 1, '/uploads/applications/appointment-docs/APPT-1783321552275-940206450.jpg', 'ddcb1852-c2ce-4e97-a6db-c4f479897eca.jpg', 'verified', NULL, '2026-07-06 15:20:29', '2026-07-06 15:05:52'),
	(11, 2, 'Authenticated Service Record', 1, '/uploads/applications/appointment-docs/APPT-1783321559104-593117601.jpg', 'e0678db3-da68-4bf6-a719-c583774f7bed.jpg', 'verified', NULL, '2026-07-06 15:20:30', '2026-07-06 15:05:59'),
	(12, 2, 'Certificate of No Pending Administrative Case', 1, '/uploads/applications/appointment-docs/APPT-1783321567611-607657670.png', 'RR-process-flow-1-768x910.png', 'verified', NULL, '2026-07-06 15:20:31', '2026-07-06 15:06:07'),
	(13, 5, 'Original/Authenticated Transcript of Records', 1, NULL, NULL, 'verified', NULL, '2026-07-21 11:49:51', NULL),
	(14, 5, 'Original/Authenticated BSEd/BSE Diploma', 1, NULL, NULL, 'verified', NULL, '2026-07-21 12:22:13', NULL),
	(15, 5, 'Updated Personal Data Sheet (CS Form 212)', 1, NULL, NULL, 'verified', NULL, '2026-07-21 11:34:29', NULL),
	(16, 5, 'NBI Clearance (issued within 6 months)', 1, NULL, NULL, 'verified', NULL, '2026-07-21 12:22:22', NULL),
	(17, 5, 'Medical Certificate (from government hospital)', 1, NULL, NULL, 'verified', NULL, '2026-07-21 12:22:21', NULL),
	(18, 5, 'Dental Certificate', 1, '/uploads/applications/appointment-docs/APPT-1784607784177-898615562.pdf', 'Congratulatory_Advice (6).pdf', 'verified', NULL, '2026-07-21 12:24:01', '2026-07-21 12:23:04'),
	(19, 5, '4 pcs. Passport-size ID photos (white background)', 1, '/uploads/applications/appointment-docs/APPT-1784607790951-667372970.pdf', 'Congratulatory_Advice (6).pdf', 'verified', NULL, '2026-07-21 12:24:04', '2026-07-21 12:23:10'),
	(20, 5, 'Marriage Certificate (for married female)', 1, '/uploads/applications/appointment-docs/APPT-1784607797837-450118452.pdf', 'Congratulatory_Advice (6).pdf', 'verified', NULL, '2026-07-21 12:24:05', '2026-07-21 12:23:17'),
	(21, 5, 'Authenticated Service Record', 1, NULL, NULL, 'verified', NULL, '2026-07-21 12:22:18', NULL),
	(22, 5, 'Certificate of No Pending Administrative Case', 1, NULL, NULL, 'verified', NULL, '2026-07-21 12:22:19', NULL);

-- Dumping structure for table deped_hrmis.appointment_notice_postings
CREATE TABLE IF NOT EXISTS `appointment_notice_postings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int DEFAULT NULL,
  `channel` enum('division_website','facebook','bulletin_board') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `posted_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_anp_appointment` (`appointment_id`),
  KEY `fk_anp_user` (`posted_by`),
  CONSTRAINT `fk_anp_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_anp_user` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.appointment_notice_postings: ~3 rows (approximately)
INSERT INTO `appointment_notice_postings` (`id`, `appointment_id`, `channel`, `posted_at`, `posted_by`) VALUES
	(1, 1, 'division_website', '2026-07-06 03:56:29', 2),
	(2, 4, 'bulletin_board', '2026-07-06 07:20:41', 1),
	(3, 4, 'division_website', '2026-07-06 07:20:41', 1),
	(4, 6, 'bulletin_board', '2026-07-21 04:24:21', 1),
	(5, 6, 'facebook', '2026-07-21 04:24:21', 1),
	(6, 6, 'division_website', '2026-07-21 04:24:21', 1);

-- Dumping structure for table deped_hrmis.appointment_required_documents
CREATE TABLE IF NOT EXISTS `appointment_required_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.appointment_required_documents: ~27 rows (approximately)
INSERT INTO `appointment_required_documents` (`id`, `document_type`, `is_mandatory`) VALUES
	(1, 'Original/Authenticated Transcript of Records', 1),
	(2, 'Original/Authenticated Diploma', 1),
	(3, 'Updated Personal Data Sheet (CS Form 212)', 1),
	(4, 'NBI Clearance (issued within 6 months)', 1),
	(5, 'Medical Certificate (from government hospital)', 1),
	(6, 'Dental Certificate', 1),
	(7, '4 pcs. Passport-size ID photos', 1),
	(8, 'Authenticated Service Record', 1),
	(9, 'Certificate of No Pending Administrative Case', 1),
	(10, 'Original/Authenticated Transcript of Records', 1),
	(11, 'Original/Authenticated Diploma', 1),
	(12, 'Updated Personal Data Sheet (CS Form 212)', 1),
	(13, 'NBI Clearance (issued within 6 months)', 1),
	(14, 'Medical Certificate (from government hospital)', 1),
	(15, 'Dental Certificate', 1),
	(16, '4 pcs. Passport-size ID photos', 1),
	(17, 'Authenticated Service Record', 1),
	(18, 'Certificate of No Pending Administrative Case', 1),
	(19, 'Original/Authenticated Transcript of Records', 1),
	(20, 'Original/Authenticated Diploma', 1),
	(21, 'Updated Personal Data Sheet (CS Form 212)', 1),
	(22, 'NBI Clearance (issued within 6 months)', 1),
	(23, 'Medical Certificate (from government hospital)', 1),
	(24, 'Dental Certificate', 1),
	(25, '4 pcs. Passport-size ID photos', 1),
	(26, 'Authenticated Service Record', 1),
	(27, 'Certificate of No Pending Administrative Case', 1);

-- Dumping structure for table deped_hrmis.assessment_scores
CREATE TABLE IF NOT EXISTS `assessment_scores` (
  `application_id` int NOT NULL,
  `classroom_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `classroom_max` decimal(5,2) NOT NULL DEFAULT '60.00',
  `nonclassroom_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `nonclassroom_max` decimal(5,2) NOT NULL DEFAULT '20.00',
  `document_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `document_max` decimal(5,2) NOT NULL DEFAULT '20.00',
  `total_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `rank_position` int DEFAULT NULL,
  `rank_total` int DEFAULT NULL,
  PRIMARY KEY (`application_id`),
  CONSTRAINT `fk_as_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.assessment_scores: ~0 rows (approximately)
INSERT INTO `assessment_scores` (`application_id`, `classroom_score`, `classroom_max`, `nonclassroom_score`, `nonclassroom_max`, `document_score`, `document_max`, `total_score`, `rank_position`, `rank_total`) VALUES
	(1, 54.00, 60.00, 18.00, 20.00, 9.00, 20.00, 81.00, 1, 5);

-- Dumping structure for table deped_hrmis.ca_sessions
CREATE TABLE IF NOT EXISTS `ca_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int NOT NULL,
  `status` enum('draft','submitted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `submitted_by` int DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ca_session_vacancy` (`vacancy_id`),
  KEY `fk_casession_submitter` (`submitted_by`),
  CONSTRAINT `fk_casession_submitter` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_casession_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=180 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ca_sessions: ~2 rows (approximately)
INSERT INTO `ca_sessions` (`id`, `vacancy_id`, `status`, `submitted_by`, `submitted_at`, `created_at`, `updated_at`) VALUES
	(1, 3, 'submitted', 1, '2026-07-19 09:12:03', '2026-07-10 17:13:39', '2026-07-19 10:03:44'),
	(3, 2, 'draft', NULL, NULL, '2026-07-10 17:13:50', '2026-07-18 11:43:49'),
	(8, 1, 'draft', NULL, NULL, '2026-07-10 17:20:39', '2026-07-18 11:43:53');

-- Dumping structure for table deped_hrmis.coaching_logs
CREATE TABLE IF NOT EXISTS `coaching_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ratee_id` int NOT NULL,
  `rater_id` int NOT NULL,
  `period_id` int NOT NULL,
  `coaching_date` date DEFAULT NULL,
  `observations` text COLLATE utf8mb4_unicode_ci,
  `agreed_actions` text COLLATE utf8mb4_unicode_ci,
  `follow_up_date` date DEFAULT NULL,
  `status` enum('scheduled','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cl_ratee` (`ratee_id`),
  KEY `idx_cl_rater` (`rater_id`),
  KEY `idx_cl_period` (`period_id`),
  CONSTRAINT `fk_cl_period` FOREIGN KEY (`period_id`) REFERENCES `performance_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cl_ratee` FOREIGN KEY (`ratee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cl_rater` FOREIGN KEY (`rater_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.coaching_logs: ~0 rows (approximately)
INSERT INTO `coaching_logs` (`id`, `ratee_id`, `rater_id`, `period_id`, `coaching_date`, `observations`, `agreed_actions`, `follow_up_date`, `status`, `created_at`) VALUES
	(1, 5, 2, 1, '2026-02-10', 'Needs improvement in formative assessment strategies', 'Attend ICT integration training and apply new formative assessment tools', '2026-03-10', 'completed', '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.comparative_assessment_criteria
CREATE TABLE IF NOT EXISTS `comparative_assessment_criteria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `category` enum('classroom_observable','non_classroom_observable','document_evaluation','comparative_flat') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_grade_band` enum('general_services','sg1_9','sg10_22_27','sg24_chief','sg11_15','sg16_23_27','teaching_flat') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section_key` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section_weight_percent` decimal(5,2) DEFAULT NULL,
  `sub_criterion_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight_percent` decimal(5,2) DEFAULT NULL,
  `max_score` decimal(5,2) NOT NULL DEFAULT '5.00',
  `display_order` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cac_vacancy_label` (`vacancy_id`,`sub_criterion_label`),
  KEY `idx_cac_vacancy_sg_band` (`vacancy_id`,`salary_grade_band`),
  CONSTRAINT `fk_cac_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.comparative_assessment_criteria: ~33 rows (approximately)
INSERT INTO `comparative_assessment_criteria` (`id`, `vacancy_id`, `category`, `salary_grade_band`, `section_key`, `section_label`, `section_weight_percent`, `sub_criterion_label`, `weight_percent`, `max_score`, `display_order`) VALUES
	(26, 1, 'classroom_observable', 'teaching_flat', 'A', 'Classroom Observable Indicators', 60.00, 'Content Knowledge and Pedagogy', 10.00, 10.00, 1),
	(27, 1, 'classroom_observable', 'teaching_flat', 'A', 'Classroom Observable Indicators', 60.00, 'Learning Environment and Management', 10.00, 10.00, 2),
	(28, 1, 'classroom_observable', 'teaching_flat', 'A', 'Classroom Observable Indicators', 60.00, 'Learner Diversity and Inclusion', 8.00, 10.00, 3),
	(29, 1, 'classroom_observable', 'teaching_flat', 'A', 'Classroom Observable Indicators', 60.00, 'Curriculum and Planning', 8.00, 10.00, 4),
	(30, 1, 'classroom_observable', 'teaching_flat', 'A', 'Classroom Observable Indicators', 60.00, 'Assessment and Reporting', 8.00, 10.00, 5),
	(31, 1, 'classroom_observable', 'teaching_flat', 'A', 'Classroom Observable Indicators', 60.00, 'Community Linkages and Professional Engagement', 8.00, 10.00, 6),
	(32, 1, 'classroom_observable', 'teaching_flat', 'A', 'Classroom Observable Indicators', 60.00, 'Personal Growth and Professional Development', 8.00, 10.00, 7),
	(33, 1, 'classroom_observable', 'teaching_flat', 'B', 'Non-Classroom Observable Indicators', 20.00, 'Behavioral Event Interview — Leadership', 5.00, 10.00, 8),
	(34, 1, 'classroom_observable', 'teaching_flat', 'B', 'Non-Classroom Observable Indicators', 20.00, 'Behavioral Event Interview — Communication', 5.00, 10.00, 9),
	(35, 1, 'classroom_observable', 'teaching_flat', 'B', 'Non-Classroom Observable Indicators', 20.00, 'Written Reflection — Self-Awareness', 4.00, 10.00, 10),
	(36, 1, 'classroom_observable', 'teaching_flat', 'B', 'Non-Classroom Observable Indicators', 20.00, 'Written Reflection — Problem-Solving', 3.00, 10.00, 11),
	(37, 1, 'classroom_observable', 'teaching_flat', 'B', 'Non-Classroom Observable Indicators', 20.00, 'Interpersonal Skills & Professionalism', 3.00, 10.00, 12),
	(38, 1, 'classroom_observable', 'teaching_flat', 'C', 'Document Evaluation', 20.00, 'Education (Master\'s/Doctor\'s Degree)', 5.00, 10.00, 13),
	(39, 1, 'classroom_observable', 'teaching_flat', 'C', 'Document Evaluation', 20.00, 'Training/Seminars (hrs)', 4.00, 10.00, 14),
	(40, 1, 'classroom_observable', 'teaching_flat', 'C', 'Document Evaluation', 20.00, 'Experience (years in service)', 4.00, 10.00, 15),
	(41, 1, 'classroom_observable', 'teaching_flat', 'C', 'Document Evaluation', 20.00, 'Performance Rating (last 3 ratings)', 4.00, 10.00, 16),
	(42, 1, 'classroom_observable', 'teaching_flat', 'C', 'Document Evaluation', 20.00, 'Outstanding Accomplishments/Awards', 3.00, 10.00, 17),
	(51, 2, 'comparative_flat', 'sg1_9', 'A', 'Qualifications', 30.00, 'Education', 5.00, 5.00, 1),
	(52, 2, 'comparative_flat', 'sg1_9', 'A', 'Qualifications', 30.00, 'Training', 5.00, 5.00, 2),
	(53, 2, 'comparative_flat', 'sg1_9', 'A', 'Qualifications', 30.00, 'Experience', 20.00, 20.00, 3),
	(54, 2, 'comparative_flat', 'sg1_9', 'B', 'Performance & Accomplishments', 30.00, 'Performance', 20.00, 20.00, 4),
	(55, 2, 'comparative_flat', 'sg1_9', 'B', 'Performance & Accomplishments', 30.00, 'Outstanding Accomplishments', 10.00, 10.00, 5),
	(56, 2, 'comparative_flat', 'sg1_9', 'C', 'Application & Potential', 40.00, 'Application of Education', 10.00, 10.00, 6),
	(57, 2, 'comparative_flat', 'sg1_9', 'C', 'Application & Potential', 40.00, 'Application of L&D', 10.00, 10.00, 7),
	(58, 2, 'comparative_flat', 'sg1_9', 'C', 'Application & Potential', 40.00, 'Potential (Written Test, BEI, Work Sample Test)', 20.00, 20.00, 8),
	(59, 3, 'comparative_flat', 'sg11_15', 'A', 'Qualifications', 30.00, 'Education', 10.00, 10.00, 1),
	(60, 3, 'comparative_flat', 'sg11_15', 'A', 'Qualifications', 30.00, 'Training', 10.00, 10.00, 2),
	(61, 3, 'comparative_flat', 'sg11_15', 'A', 'Qualifications', 30.00, 'Experience', 10.00, 10.00, 3),
	(62, 3, 'comparative_flat', 'sg11_15', 'B', 'Performance & Accomplishments', 30.00, 'Performance', 20.00, 20.00, 4),
	(63, 3, 'comparative_flat', 'sg11_15', 'B', 'Performance & Accomplishments', 30.00, 'Outstanding Accomplishments', 10.00, 10.00, 5),
	(64, 3, 'comparative_flat', 'sg11_15', 'C', 'Application & Potential', 40.00, 'Application of Education', 10.00, 10.00, 6),
	(65, 3, 'comparative_flat', 'sg11_15', 'C', 'Application & Potential', 40.00, 'Application of L&D', 10.00, 10.00, 7),
	(66, 3, 'comparative_flat', 'sg11_15', 'C', 'Application & Potential', 40.00, 'Potential (Written Test, BEI, Work Sample Test)', 20.00, 20.00, 8);

-- Dumping structure for table deped_hrmis.comparative_assessment_results
CREATE TABLE IF NOT EXISTS `comparative_assessment_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `category_subscore_classroom` decimal(5,2) DEFAULT NULL,
  `category_subscore_nonclassroom` decimal(5,2) DEFAULT NULL,
  `category_subscore_document` decimal(5,2) DEFAULT NULL,
  `total_score` decimal(5,2) DEFAULT NULL,
  `rank_val` int DEFAULT NULL,
  `is_qualified` tinyint(1) NOT NULL DEFAULT '0',
  `is_top5` tinyint(1) NOT NULL DEFAULT '0',
  `computed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_car_applicant` (`applicant_id`),
  CONSTRAINT `fk_car_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.comparative_assessment_results: ~0 rows (approximately)
INSERT INTO `comparative_assessment_results` (`id`, `applicant_id`, `category_subscore_classroom`, `category_subscore_nonclassroom`, `category_subscore_document`, `total_score`, `rank_val`, `is_qualified`, `is_top5`, `computed_at`) VALUES
	(1, 1, 27.00, 18.00, 9.00, 54.00, 1, 1, 1, '2026-07-06 03:56:29'),
	(2, 2, NULL, NULL, 5.00, 5.00, NULL, 0, 0, '2026-07-18 11:25:00'),
	(44, 4, 2.00, NULL, NULL, 2.00, NULL, 0, 0, '2026-07-18 11:10:11'),
	(65, 5, 20.00, 29.00, 31.00, 80.00, NULL, 0, 0, '2026-07-19 09:11:41');

-- Dumping structure for table deped_hrmis.comparative_assessment_scores
CREATE TABLE IF NOT EXISTS `comparative_assessment_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `criterion_id` int DEFAULT NULL,
  `score_given` decimal(5,2) DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `scored_by` int DEFAULT NULL,
  `scored_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cas_applicant_criterion` (`applicant_id`,`criterion_id`),
  KEY `idx_cas_criterion` (`criterion_id`),
  CONSTRAINT `fk_cas_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cas_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `comparative_assessment_criteria` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.comparative_assessment_scores: ~12 rows (approximately)
INSERT INTO `comparative_assessment_scores` (`id`, `applicant_id`, `criterion_id`, `score_given`, `remarks`, `scored_by`, `scored_at`, `updated_at`) VALUES
	(61, 4, 26, 2.00, NULL, 1, '2026-07-18 11:10:11', '2026-07-18 11:10:11'),
	(71, 4, 28, 0.00, NULL, 1, '2026-07-17 19:42:56', '2026-07-17 19:42:56'),
	(72, 4, 31, 0.00, NULL, 1, '2026-07-17 19:44:54', '2026-07-17 19:44:54'),
	(79, 4, 27, 0.00, NULL, 1, '2026-07-18 10:58:40', '2026-07-18 10:58:40'),
	(81, 2, 56, 5.00, NULL, 1, '2026-07-18 11:25:00', '2026-07-18 11:25:00'),
	(82, 5, 59, 3.00, NULL, 1, '2026-07-19 09:10:34', '2026-07-19 09:10:34'),
	(83, 5, 60, 7.00, NULL, 1, '2026-07-19 09:10:42', '2026-07-19 09:10:42'),
	(85, 5, 61, 10.00, NULL, 1, '2026-07-19 09:10:46', '2026-07-19 09:10:46'),
	(86, 5, 62, 19.00, NULL, 1, '2026-07-19 09:11:02', '2026-07-19 09:11:02'),
	(87, 5, 63, 10.00, NULL, 1, '2026-07-19 09:11:13', '2026-07-19 09:11:13'),
	(90, 5, 64, 7.00, NULL, 1, '2026-07-19 09:11:25', '2026-07-19 09:11:25'),
	(93, 5, 65, 8.00, NULL, 1, '2026-07-19 09:11:28', '2026-07-19 09:11:28'),
	(94, 5, 66, 16.00, NULL, 1, '2026-07-19 09:11:41', '2026-07-19 09:11:41');

-- Dumping structure for table deped_hrmis.congratulatory_advices
CREATE TABLE IF NOT EXISTS `congratulatory_advices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `vacancy_id` int DEFAULT NULL,
  `place_of_assignment` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `report_date` date DEFAULT NULL,
  `document_submission_deadline` date DEFAULT NULL,
  `appointing_authority_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `letter_content` text COLLATE utf8mb4_unicode_ci,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ca_applicant` (`applicant_id`),
  KEY `idx_ca_vacancy` (`vacancy_id`),
  KEY `fk_ca_user` (`sent_by`),
  CONSTRAINT `fk_ca_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ca_user` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ca_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.congratulatory_advices: ~3 rows (approximately)
INSERT INTO `congratulatory_advices` (`id`, `applicant_id`, `vacancy_id`, `place_of_assignment`, `report_date`, `document_submission_deadline`, `appointing_authority_name`, `letter_content`, `sent_at`, `sent_by`) VALUES
	(1, 1, 1, 'Dapitan City National High School', '2026-07-13', '2026-07-08', 'Roberto Lim', 'Congratulations! It is with great pleasure that I inform you of your selection for appointment to the position of Teacher I at Dapitan City National High School, effective July 13, 2026.', '2026-07-06 03:56:29', 1),
	(4, 2, 2, 'ICT Office', '2026-07-31', '2026-07-12', 'Schools Division Superintendent', 'Congratulations! It is with great pleasure that I inform you of your selection for appointment to the position of IT support at ICT Office, effective July 31, 2026.', '2026-07-06 07:20:03', 1),
	(6, 5, 3, 'Dapitan City Central School', '2026-08-19', '2026-07-27', 'Schools Division Superintendent', 'Congratulations! It is with great pleasure that I inform you of your selection for appointment to the position of School Head at TR001, effective August 19, 2026.', '2026-07-20 04:30:25', 1);

-- Dumping structure for table deped_hrmis.deliberation_notes
CREATE TABLE IF NOT EXISTS `deliberation_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `background_investigation_notes` text COLLATE utf8mb4_unicode_ci,
  `is_recommended` tinyint(1) NOT NULL DEFAULT '0',
  `recommended_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dn_applicant` (`applicant_id`),
  KEY `fk_dn_user` (`recommended_by`),
  CONSTRAINT `fk_dn_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dn_user` FOREIGN KEY (`recommended_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.deliberation_notes: ~0 rows (approximately)
INSERT INTO `deliberation_notes` (`id`, `applicant_id`, `background_investigation_notes`, `is_recommended`, `recommended_by`) VALUES
	(1, 1, 'No pending administrative or criminal cases found.', 1, 1),
	(4, 2, NULL, 1, 1),
	(7, 5, NULL, 1, 1);

-- Dumping structure for table deped_hrmis.document_requests
CREATE TABLE IF NOT EXISTS `document_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `request_category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_subtype` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_no` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purpose` text COLLATE utf8mb4_unicode_ci,
  `position_applied` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_applied` date DEFAULT NULL,
  `esignature_consented` tinyint(1) DEFAULT '0',
  `esignature_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `esignature_timestamp` datetime DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','processing','ready','released','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `processed_by` int DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `released_file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dr_employee` (`employee_id`),
  CONSTRAINT `fk_dr_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.document_requests: ~1 rows (approximately)
INSERT INTO `document_requests` (`id`, `employee_id`, `request_category`, `request_subtype`, `contact_no`, `purpose`, `position_applied`, `date_applied`, `esignature_consented`, `esignature_ip`, `esignature_timestamp`, `details`, `status`, `processed_by`, `processed_at`, `released_file_path`, `rejection_reason`, `created_at`, `updated_at`) VALUES
	(1, 1, 'certificate_of_employment', NULL, NULL, 'Certificate of Employment for bank loan application', NULL, NULL, 0, NULL, NULL, 'Certificate of Employment for bank loan application', 'released', 2, '2026-06-05 14:00:00', NULL, NULL, '2026-07-06 03:56:30', '2026-07-15 02:52:00'),
	(2, 2, 'service_record', 'Loan Application', '09123456789', 'basta lang oi', NULL, NULL, 1, '::1', '2026-07-15 11:02:27', 'none', 'released', 1, '2026-07-15 16:48:10', '/api/personnel/certificates/2/service-record', NULL, '2026-07-15 03:02:27', '2026-07-15 08:48:10');

-- Dumping structure for table deped_hrmis.duties_responsibilities
CREATE TABLE IF NOT EXISTS `duties_responsibilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `label` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dr_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_dr_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.duties_responsibilities: ~0 rows (approximately)
INSERT INTO `duties_responsibilities` (`id`, `vacancy_id`, `label`) VALUES
	(1, 1, 'Prepares and delivers lesson plans aligned with the K-12 curriculum');

-- Dumping structure for table deped_hrmis.employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `employee_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name_extension` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `place_of_birth` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sex` enum('male','female') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `civil_status` enum('single','married','widowed','separated','others') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_type` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gsis_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagibig_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `philhealth_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tin_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile_no` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `photo_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employment_status` enum('permanent','temporary','casual','contractual','coterminous') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'permanent',
  `employment_type` enum('teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'teaching',
  `position_title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_grade` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `authorized_salary` decimal(12,2) DEFAULT NULL,
  `actual_salary` decimal(12,2) DEFAULT NULL,
  `salary_step` tinyint DEFAULT NULL,
  `eligibility` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monthly_salary` decimal(12,2) DEFAULT NULL,
  `item_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_school` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_office_id` int DEFAULT NULL,
  `office` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_hired` date DEFAULT NULL,
  `date_original_appointment` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `job_status` enum('active','on_leave','suspended','resigned','retired','terminated') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employees_user` (`user_id`),
  UNIQUE KEY `uq_employees_no` (`employee_no`),
  KEY `fk_emp_school_office` (`school_office_id`),
  CONSTRAINT `fk_emp_school_office` FOREIGN KEY (`school_office_id`) REFERENCES `schools_offices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_salary_step` CHECK ((`salary_step` between 1 and 8))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.employees: ~7 rows (approximately)
INSERT INTO `employees` (`id`, `user_id`, `employee_no`, `first_name`, `middle_name`, `last_name`, `name_extension`, `date_of_birth`, `place_of_birth`, `sex`, `civil_status`, `blood_type`, `gsis_id`, `pagibig_id`, `philhealth_no`, `tin_no`, `mobile_no`, `email`, `address`, `photo_path`, `employment_status`, `employment_type`, `position_title`, `salary_grade`, `authorized_salary`, `actual_salary`, `salary_step`, `eligibility`, `monthly_salary`, `item_number`, `assigned_school`, `school_office_id`, `office`, `date_hired`, `date_original_appointment`, `is_active`, `job_status`, `created_at`, `updated_at`) VALUES
	(1, 7, 'EMP-2026-0001', 'Carmela', NULL, 'Ocampo', NULL, '1990-05-20', NULL, 'female', 'married', NULL, NULL, NULL, NULL, NULL, '09171234507', 'staff@depedhrmis.test', NULL, NULL, 'permanent', 'non_teaching', 'Administrative Officer II', '11', NULL, NULL, NULL, NULL, 27608.00, 'ITEM-0001', 'SDO Dapitan City', 8, NULL, '2015-06-01', '2015-06-01', 1, 'active', '2026-07-06 03:56:29', '2026-07-18 16:21:51'),
	(2, 6, NULL, 'Mark', NULL, 'Villanueva', NULL, NULL, NULL, 'male', 'single', 'O+', NULL, NULL, NULL, NULL, '09171234506', 'applicant.nonteaching@depedhrmis.test', NULL, '/uploads/personnel/employees/EMP-1784379727967-950429660.jpg', 'permanent', 'teaching', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-12', NULL, 1, 'active', '2026-07-12 05:48:02', '2026-07-21 00:34:52'),
	(3, 10, NULL, 'kiki', 'jidjid', 'okay', 'namename', '2002-01-21', NULL, 'female', 'married', 'O+', '12098765', '12098765', '12098765', '12098765', '09998887777', 'maxsonpuerto@gmail.com', NULL, '/uploads/personnel/employees/EMP-1784594866296-284160785.png', 'permanent', 'teaching', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-13', NULL, 1, 'active', '2026-07-13 02:44:11', '2026-07-21 02:04:38'),
	(4, 5, NULL, 'TestNewA', NULL, 'Fernandez', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '09171234505', 'applicant.teaching@depedhrmis.test', NULL, NULL, 'permanent', 'teaching', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-13', NULL, 1, 'active', '2026-07-13 03:34:31', '2026-07-21 01:13:49'),
	(5, 11, 'EMP-2027', 'Felix Romy', NULL, 'Triambulo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'permanent', 'non_teaching', 'Schools Division Superintendent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'active', '2026-07-18 14:55:08', '2026-07-18 16:21:51'),
	(6, 12, 'EMP-20271', 'Rosalio', NULL, 'Conturno', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'permanent', 'non_teaching', 'OIC - Assistant Schools Division Superintendent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'active', '2026-07-18 14:55:08', '2026-07-18 16:21:51'),
	(7, 13, NULL, 'judel', NULL, 'judel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '09123456789', 'jakealthon123@gmail.com', NULL, NULL, 'permanent', 'teaching', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-21', NULL, 1, 'active', '2026-07-21 03:32:12', '2026-07-21 03:32:12');

-- Dumping structure for table deped_hrmis.employee_documents
CREATE TABLE IF NOT EXISTS `employee_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `document_type` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size_kb` int DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ed_employee` (`employee_id`),
  CONSTRAINT `fk_ed_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.employee_documents: ~3 rows (approximately)
INSERT INTO `employee_documents` (`id`, `employee_id`, `document_type`, `file_name`, `file_path`, `file_size_kb`, `uploaded_by`, `is_verified`, `status`, `verified_by`, `verified_at`, `remarks`, `created_at`) VALUES
	(1, 1, 'Service Record', 'service_record.pdf', '/uploads/employees/1/service_record.pdf', 245, 2, 1, 'approved', 2, '2026-06-01 10:00:00', NULL, '2026-07-06 03:56:30'),
	(2, 2, 'General', '412b73d2-319a-4bc7-a091-96a047a618e6.jpg', '/uploads/personnel/201/DOC-1783836141269-460819184.jpg', 169, 6, 0, 'pending', NULL, NULL, NULL, '2026-07-12 06:02:21'),
	(3, 2, 'General', 'Congratulatory_Advice_leo_alfier_antipuesto (2).pdf', '/uploads/personnel/201/DOC-1784016738112-910925685.pdf', 3, 6, 0, 'pending', NULL, NULL, NULL, '2026-07-14 08:12:18');

-- Dumping structure for table deped_hrmis.employee_profile_change_requests
CREATE TABLE IF NOT EXISTS `employee_profile_change_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `user_id` int NOT NULL,
  `changes_json` json NOT NULL COMMENT 'Structured diff: {field: {old: ..., new: ...}}',
  `reason` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_notes` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ecr_employee` (`employee_id`),
  KEY `idx_ecr_status` (`status`),
  KEY `fk_ecr_user` (`user_id`),
  KEY `fk_ecr_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_ecr_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ecr_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ecr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.employee_profile_change_requests: ~5 rows (approximately)
INSERT INTO `employee_profile_change_requests` (`id`, `employee_id`, `user_id`, `changes_json`, `reason`, `status`, `reviewed_by`, `reviewed_at`, `review_notes`, `created_at`, `updated_at`) VALUES
	(1, 2, 6, '{"sex": {"new": "[object Object]", "old": null}, "blood_type": {"new": "[object Object]", "old": null}, "civil_status": {"new": "[object Object]", "old": null}}', 'Profile update requested by employee', 'rejected', NULL, '2026-07-18 21:17:37', 'Auto-rejected: changes_json was corrupted ([object Object] values) due to frontend bug. Employee can resubmit.', '2026-07-18 21:02:26', '2026-07-18 21:17:37'),
	(2, 2, 6, '{"sex": {"new": "Male", "old": null}, "blood_type": {"new": "O+", "old": null}, "civil_status": {"new": "Single", "old": null}}', 'Profile update requested by employee', 'approved', NULL, '2026-07-21 08:34:52', 'Approved via one-time data repair', '2026-07-18 21:21:39', '2026-07-21 08:34:52'),
	(3, 3, 10, '{"sex": {"new": "Male", "old": null}, "blood_type": {"new": "A+", "old": null}}', 'Profile update requested by employee', 'approved', 1, '2026-07-21 09:17:40', 'yes sure', '2026-07-21 08:48:11', '2026-07-21 09:17:40'),
	(9, 3, 10, '{"sex": {"new": "Female", "old": "male"}, "tin_no": {"new": "12098765", "old": null}, "gsis_id": {"new": "12098765", "old": null}, "last_name": {"new": "okay", "old": "jhustyn"}, "mobile_no": {"new": "09124353531", "old": "09123456789"}, "first_name": {"new": "kiki", "old": "jhustyn"}, "pagibig_id": {"new": "12098765", "old": null}, "middle_name": {"new": "jidjid", "old": null}, "civil_status": {"new": "widowed", "old": null}, "date_of_birth": {"new": "2002-01-21", "old": null}, "philhealth_no": {"new": "12098765", "old": null}, "name_extension": {"new": "namename", "old": null}}', 'Profile update requested by employee', 'approved', 1, '2026-07-21 09:45:26', 'okay gong', '2026-07-21 09:43:21', '2026-07-21 09:45:26'),
	(10, 3, 10, '{"mobile_no": {"new": "09998887777", "old": "09124353531"}, "blood_type": {"new": "O+", "old": "A+"}, "civil_status": {"new": "married", "old": "widowed"}}', 'E2E Automated Verification Test', 'approved', 1, '2026-07-21 10:04:38', 'E2E Approved', '2026-07-21 10:04:38', '2026-07-21 10:04:38');

-- Dumping structure for table deped_hrmis.ies_criterion_scores
CREATE TABLE IF NOT EXISTS `ies_criterion_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ies_evaluation_id` int NOT NULL,
  `criteria_key` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight_allocation` decimal(5,2) NOT NULL DEFAULT '0.00',
  `qualification_notes` text COLLATE utf8mb4_unicode_ci,
  `computation_notes` text COLLATE utf8mb4_unicode_ci,
  `actual_score` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ics_eval_criteria` (`ies_evaluation_id`,`criteria_key`),
  CONSTRAINT `fk_ics_eval` FOREIGN KEY (`ies_evaluation_id`) REFERENCES `ies_evaluations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ies_criterion_scores: ~28 rows (approximately)
INSERT INTO `ies_criterion_scores` (`id`, `ies_evaluation_id`, `criteria_key`, `weight_allocation`, `qualification_notes`, `computation_notes`, `actual_score`) VALUES
	(1, 1, 'education', 10.00, 'oejioejgrt', '', 4.00),
	(2, 1, 'training', 10.00, 'igjriotgjriotg', '', 3.00),
	(3, 1, 'experience', 10.00, 'uijhruithrt', '', 8.00),
	(4, 1, 'pbet_let_lept_rating', 10.00, 'iojgiorjotgirjhtg', '', 8.00),
	(5, 1, 'ppst_coi', 35.00, 'kjgnmriotgjrotg', '', 30.00),
	(6, 1, 'ppst_ncoi', 25.00, 'joigtejoigjegf', '', 25.00),
	(7, 2, 'education', 10.00, 'hdusfhefu', '', 10.00),
	(8, 2, 'training', 10.00, 'sjianuasidh', '', 10.00),
	(9, 2, 'experience', 10.00, 'sjianuasidh', '', 10.00),
	(10, 2, 'pbet_let_lept_rating', 10.00, 'sjianuasidh', '', 10.00),
	(11, 2, 'ppst_coi', 35.00, 'sjianuasidh', '', 23.00),
	(12, 2, 'ppst_ncoi', 25.00, 'sjianuasidh', '', 23.00),
	(13, 3, 'education', 5.00, '', '', NULL),
	(14, 3, 'training', 5.00, '', '', NULL),
	(15, 3, 'experience', 20.00, '', '', NULL),
	(16, 3, 'performance', 20.00, '', '', NULL),
	(17, 3, 'outstanding_accomplishments', 10.00, '', '', NULL),
	(18, 3, 'application_of_education', 10.00, '', '', NULL),
	(19, 3, 'application_of_ld', 10.00, '', '', NULL),
	(20, 3, 'potential', 20.00, '', '', NULL),
	(21, 4, 'education', 10.00, 'uhdheuidw', '', 9.99),
	(22, 4, 'training', 10.00, 'uhdheuidw', '', 10.00),
	(23, 4, 'experience', 10.00, 'uhdheuidw', '', 10.00),
	(24, 4, 'performance', 20.00, 'uhdheuidw', '', 9.98),
	(25, 4, 'outstanding_accomplishments', 10.00, 'uhdheuidw', '', 9.99),
	(26, 4, 'application_of_education', 10.00, 'uhdheuidw', '', 10.00),
	(27, 4, 'application_of_ld', 10.00, 'uhdheuidw', '', 10.00),
	(28, 4, 'potential', 20.00, 'uhdheuidw', '', 19.00);

-- Dumping structure for table deped_hrmis.ies_evaluations
CREATE TABLE IF NOT EXISTS `ies_evaluations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applicant_id` int NOT NULL,
  `vacancy_id` int NOT NULL,
  `position_category` enum('teaching_related','non_teaching','teacher_i') COLLATE utf8mb4_unicode_ci NOT NULL,
  `bracket_key` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_group_sg_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `office` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `evaluated_by` int NOT NULL,
  `total_score` decimal(6,2) NOT NULL DEFAULT '0.00',
  `attested_by_applicant_at` datetime DEFAULT NULL,
  `attested_by_applicant_signature_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attested_by_chair_id` int DEFAULT NULL,
  `attested_by_chair_at` datetime DEFAULT NULL,
  `attested_by_chair_signature_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','submitted','attested') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ies_application_code` (`application_code`),
  KEY `idx_ies_applicant` (`applicant_id`),
  KEY `idx_ies_vacancy` (`vacancy_id`),
  KEY `idx_ies_evaluated_by` (`evaluated_by`),
  KEY `idx_ies_chair` (`attested_by_chair_id`),
  CONSTRAINT `fk_ies_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ies_chair` FOREIGN KEY (`attested_by_chair_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ies_evaluated_by` FOREIGN KEY (`evaluated_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ies_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ies_evaluations: ~4 rows (approximately)
INSERT INTO `ies_evaluations` (`id`, `application_code`, `applicant_id`, `vacancy_id`, `position_category`, `bracket_key`, `job_group_sg_level`, `office`, `contact_number`, `evaluated_by`, `total_score`, `attested_by_applicant_at`, `attested_by_applicant_signature_name`, `attested_by_chair_id`, `attested_by_chair_at`, `attested_by_chair_signature_name`, `status`, `created_at`, `updated_at`) VALUES
	(1, 'APP-2026-0003', 4, 1, 'teacher_i', NULL, 'SG-11', 'Dapitan City East Elementary School', '09179988776', 1, 78.00, '2026-07-13 16:01:10', 'Juan Santos', 1, '2026-07-13 16:03:10', 'Aurelio A. Satisas, CESO VI', 'attested', '2026-07-11 06:57:11', '2026-07-13 08:03:10'),
	(2, 'APP-2026-0001', 1, 1, 'teacher_i', NULL, 'SG-11', 'Dapitan City Central Elementary School', '09171234505', 1, 86.00, '2026-07-13 16:45:32', 'Liza Fernandez', 1, '2026-07-13 16:45:52', 'ajfisuejhwfueh', 'attested', '2026-07-11 06:57:16', '2026-07-13 08:45:52'),
	(3, 'APP-002-2026', 2, 2, 'non_teaching', 'SG_1_9_NON_GS', 'SG-1', 'N/A', '09123456789', 1, 0.00, NULL, NULL, NULL, NULL, NULL, 'draft', '2026-07-11 06:57:49', '2026-07-11 06:57:49'),
	(4, 'TR-001', 5, 3, 'teaching_related', 'SG_11_15', 'SG-11', 'N/A', '09123456789', 1, 88.96, '2026-07-19 17:13:52', 'jhustyn ', 1, '2026-07-19 17:14:11', 'sir olario', 'attested', '2026-07-19 09:12:12', '2026-07-19 09:14:11');

-- Dumping structure for table deped_hrmis.ies_weight_templates
CREATE TABLE IF NOT EXISTS `ies_weight_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `position_category` enum('teaching_related','non_teaching','teacher_i') COLLATE utf8mb4_unicode_ci NOT NULL,
  `bracket_key` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bracket_key_norm` varchar(50) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (ifnull(`bracket_key`,_utf8mb4'__FLAT__')) STORED,
  `criteria_key` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_points` decimal(5,2) NOT NULL DEFAULT '0.00',
  `display_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_iwt_category_bracket_criteria` (`position_category`,`bracket_key_norm`,`criteria_key`),
  KEY `idx_iwt_lookup` (`position_category`,`bracket_key`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ies_weight_templates: ~62 rows (approximately)
INSERT INTO `ies_weight_templates` (`id`, `position_category`, `bracket_key`, `criteria_key`, `max_points`, `display_order`) VALUES
	(1, 'teaching_related', 'SG_11_15', 'education', 10.00, 1),
	(2, 'teaching_related', 'SG_11_15', 'training', 10.00, 2),
	(3, 'teaching_related', 'SG_11_15', 'experience', 10.00, 3),
	(4, 'teaching_related', 'SG_11_15', 'performance', 20.00, 4),
	(5, 'teaching_related', 'SG_11_15', 'outstanding_accomplishments', 10.00, 5),
	(6, 'teaching_related', 'SG_11_15', 'application_of_education', 10.00, 6),
	(7, 'teaching_related', 'SG_11_15', 'application_of_ld', 10.00, 7),
	(8, 'teaching_related', 'SG_11_15', 'potential', 20.00, 8),
	(9, 'teaching_related', 'SG_16_23_27', 'education', 10.00, 1),
	(10, 'teaching_related', 'SG_16_23_27', 'training', 10.00, 2),
	(11, 'teaching_related', 'SG_16_23_27', 'experience', 10.00, 3),
	(12, 'teaching_related', 'SG_16_23_27', 'performance', 20.00, 4),
	(13, 'teaching_related', 'SG_16_23_27', 'outstanding_accomplishments', 5.00, 5),
	(14, 'teaching_related', 'SG_16_23_27', 'application_of_education', 15.00, 6),
	(15, 'teaching_related', 'SG_16_23_27', 'application_of_ld', 10.00, 7),
	(16, 'teaching_related', 'SG_16_23_27', 'potential', 20.00, 8),
	(17, 'teaching_related', 'SG_24_CHIEF', 'education', 10.00, 1),
	(18, 'teaching_related', 'SG_24_CHIEF', 'training', 10.00, 2),
	(19, 'teaching_related', 'SG_24_CHIEF', 'experience', 10.00, 3),
	(20, 'teaching_related', 'SG_24_CHIEF', 'performance', 25.00, 4),
	(21, 'teaching_related', 'SG_24_CHIEF', 'outstanding_accomplishments', 10.00, 5),
	(22, 'teaching_related', 'SG_24_CHIEF', 'application_of_education', 10.00, 6),
	(23, 'teaching_related', 'SG_24_CHIEF', 'application_of_ld', 10.00, 7),
	(24, 'teaching_related', 'SG_24_CHIEF', 'potential', 15.00, 8),
	(25, 'non_teaching', 'GENERAL_SERVICES', 'education', 5.00, 1),
	(26, 'non_teaching', 'GENERAL_SERVICES', 'training', 5.00, 2),
	(27, 'non_teaching', 'GENERAL_SERVICES', 'experience', 20.00, 3),
	(28, 'non_teaching', 'GENERAL_SERVICES', 'performance', 10.00, 4),
	(29, 'non_teaching', 'GENERAL_SERVICES', 'outstanding_accomplishments', 5.00, 5),
	(30, 'non_teaching', 'GENERAL_SERVICES', 'application_of_education', 0.00, 6),
	(31, 'non_teaching', 'GENERAL_SERVICES', 'application_of_ld', 0.00, 7),
	(32, 'non_teaching', 'GENERAL_SERVICES', 'potential', 55.00, 8),
	(33, 'non_teaching', 'SG_1_9_NON_GS', 'education', 5.00, 1),
	(34, 'non_teaching', 'SG_1_9_NON_GS', 'training', 5.00, 2),
	(35, 'non_teaching', 'SG_1_9_NON_GS', 'experience', 20.00, 3),
	(36, 'non_teaching', 'SG_1_9_NON_GS', 'performance', 20.00, 4),
	(37, 'non_teaching', 'SG_1_9_NON_GS', 'outstanding_accomplishments', 10.00, 5),
	(38, 'non_teaching', 'SG_1_9_NON_GS', 'application_of_education', 10.00, 6),
	(39, 'non_teaching', 'SG_1_9_NON_GS', 'application_of_ld', 10.00, 7),
	(40, 'non_teaching', 'SG_1_9_NON_GS', 'potential', 20.00, 8),
	(41, 'non_teaching', 'SG_10_22_27', 'education', 5.00, 1),
	(42, 'non_teaching', 'SG_10_22_27', 'training', 10.00, 2),
	(43, 'non_teaching', 'SG_10_22_27', 'experience', 15.00, 3),
	(44, 'non_teaching', 'SG_10_22_27', 'performance', 20.00, 4),
	(45, 'non_teaching', 'SG_10_22_27', 'outstanding_accomplishments', 10.00, 5),
	(46, 'non_teaching', 'SG_10_22_27', 'application_of_education', 10.00, 6),
	(47, 'non_teaching', 'SG_10_22_27', 'application_of_ld', 10.00, 7),
	(48, 'non_teaching', 'SG_10_22_27', 'potential', 20.00, 8),
	(49, 'non_teaching', 'SG_24_CHIEF', 'education', 10.00, 1),
	(50, 'non_teaching', 'SG_24_CHIEF', 'training', 5.00, 2),
	(51, 'non_teaching', 'SG_24_CHIEF', 'experience', 15.00, 3),
	(52, 'non_teaching', 'SG_24_CHIEF', 'performance', 20.00, 4),
	(53, 'non_teaching', 'SG_24_CHIEF', 'outstanding_accomplishments', 10.00, 5),
	(54, 'non_teaching', 'SG_24_CHIEF', 'application_of_education', 10.00, 6),
	(55, 'non_teaching', 'SG_24_CHIEF', 'application_of_ld', 10.00, 7),
	(56, 'non_teaching', 'SG_24_CHIEF', 'potential', 20.00, 8),
	(57, 'teacher_i', NULL, 'education', 10.00, 1),
	(58, 'teacher_i', NULL, 'training', 10.00, 2),
	(59, 'teacher_i', NULL, 'experience', 10.00, 3),
	(60, 'teacher_i', NULL, 'pbet_let_lept_rating', 10.00, 4),
	(61, 'teacher_i', NULL, 'ppst_coi', 35.00, 5),
	(62, 'teacher_i', NULL, 'ppst_ncoi', 25.00, 6);

-- Dumping structure for table deped_hrmis.ld_attendance
CREATE TABLE IF NOT EXISTS `ld_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `user_id` int NOT NULL,
  `status` enum('present','absent','excused') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `certificate_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `acknowledged_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ld_attendance` (`program_id`,`user_id`),
  KEY `idx_ld_attendance_user` (`user_id`),
  CONSTRAINT `fk_ld_attendance_program` FOREIGN KEY (`program_id`) REFERENCES `ld_programs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ld_attendance_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_attendance: ~1 rows (approximately)
INSERT INTO `ld_attendance` (`id`, `program_id`, `user_id`, `status`, `remarks`, `updated_at`, `certificate_path`, `acknowledged_at`) VALUES
	(1, 1, 5, 'present', NULL, '2026-07-06 03:56:29', NULL, NULL),
	(3, 2, 5, 'present', NULL, '2026-07-06 08:55:16', NULL, NULL);

-- Dumping structure for table deped_hrmis.ld_evaluations
CREATE TABLE IF NOT EXISTS `ld_evaluations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `training_id` int unsigned NOT NULL,
  `participant_id` int unsigned NOT NULL,
  `relevance_rating` tinyint unsigned DEFAULT NULL,
  `effectiveness_rating` tinyint unsigned DEFAULT NULL,
  `applicability_rating` tinyint unsigned DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `impact_assessment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_eval_training` (`training_id`),
  KEY `idx_ld_eval_participant` (`participant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_evaluations: ~0 rows (approximately)
INSERT INTO `ld_evaluations` (`id`, `training_id`, `participant_id`, `relevance_rating`, `effectiveness_rating`, `applicability_rating`, `comments`, `impact_assessment`, `created_at`) VALUES
	(1, 1, 1, 5, 4, 5, 'Very useful training', 'Expected to improve ICT use in weekly lesson plans', '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.ld_evaluation_answers
CREATE TABLE IF NOT EXISTS `ld_evaluation_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `response_id` int NOT NULL,
  `question_id` int NOT NULL,
  `rating_value` tinyint DEFAULT NULL,
  `text_answer` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_ld_eval_ans_response` (`response_id`),
  KEY `idx_ld_eval_ans_question` (`question_id`),
  CONSTRAINT `fk_ld_eval_ans_question` FOREIGN KEY (`question_id`) REFERENCES `ld_evaluation_questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ld_eval_ans_response` FOREIGN KEY (`response_id`) REFERENCES `ld_evaluation_responses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_evaluation_answers: ~2 rows (approximately)
INSERT INTO `ld_evaluation_answers` (`id`, `response_id`, `question_id`, `rating_value`, `text_answer`) VALUES
	(1, 1, 1, 5, NULL),
	(2, 1, 2, NULL, 'More hands-on practice time');

-- Dumping structure for table deped_hrmis.ld_evaluation_forms
CREATE TABLE IF NOT EXISTS `ld_evaluation_forms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','active','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ld_eval_forms_program` (`program_id`),
  CONSTRAINT `fk_ld_eval_forms_program` FOREIGN KEY (`program_id`) REFERENCES `ld_programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_evaluation_forms: ~0 rows (approximately)
INSERT INTO `ld_evaluation_forms` (`id`, `program_id`, `title`, `instructions`, `status`, `created_by`, `created_at`) VALUES
	(1, 1, 'ICT Training Evaluation Form', 'Please rate your experience honestly', 'active', 2, '2026-07-06 03:56:29'),
	(2, 2, 'Modern Classroom Management Evaluation Form', 'Please evaluate the training program objectively to help improve future sessions.', 'active', 1, '2026-07-06 08:55:16');

-- Dumping structure for table deped_hrmis.ld_evaluation_questions
CREATE TABLE IF NOT EXISTS `ld_evaluation_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eval_form_id` int NOT NULL,
  `question_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_type` enum('text','rating') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'rating',
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_ld_eval_q_form` (`eval_form_id`),
  CONSTRAINT `fk_ld_eval_q_form` FOREIGN KEY (`eval_form_id`) REFERENCES `ld_evaluation_forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_evaluation_questions: ~6 rows (approximately)
INSERT INTO `ld_evaluation_questions` (`id`, `eval_form_id`, `question_text`, `question_type`, `category`, `sort_order`) VALUES
	(1, 1, 'How relevant was the training to your role?', 'rating', 'Relevance', 1),
	(2, 1, 'What suggestions do you have for improvement?', 'text', 'Feedback', 2),
	(3, 2, 'The content of the seminar was highly relevant to my teaching duties.', 'rating', 'relevance', 1),
	(4, 2, 'The resource person demonstrated deep mastery of the classroom management techniques.', 'rating', 'resource_person', 2),
	(5, 2, 'The training venue and materials were conducive to learning.', 'rating', 'facilities', 3),
	(6, 2, 'What was the most useful part of this training program?', 'text', 'general', 4);

-- Dumping structure for table deped_hrmis.ld_evaluation_responses
CREATE TABLE IF NOT EXISTS `ld_evaluation_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eval_form_id` int NOT NULL,
  `user_id` int NOT NULL,
  `overall_rating` decimal(4,2) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ld_eval_response` (`eval_form_id`,`user_id`),
  KEY `idx_ld_eval_resp_user` (`user_id`),
  CONSTRAINT `fk_ld_eval_resp_form` FOREIGN KEY (`eval_form_id`) REFERENCES `ld_evaluation_forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ld_eval_resp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_evaluation_responses: ~0 rows (approximately)
INSERT INTO `ld_evaluation_responses` (`id`, `eval_form_id`, `user_id`, `overall_rating`, `submitted_at`, `created_at`) VALUES
	(1, 1, 5, 4.50, '2026-07-21 16:00:00', '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.ld_materials
CREATE TABLE IF NOT EXISTS `ld_materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_materials_program` (`program_id`),
  CONSTRAINT `fk_ld_materials_program` FOREIGN KEY (`program_id`) REFERENCES `ld_programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_materials: ~0 rows (approximately)
INSERT INTO `ld_materials` (`id`, `program_id`, `title`, `file_path`, `file_name`, `file_type`, `uploaded_by`, `uploaded_at`) VALUES
	(1, 1, 'ICT Integration Training Module', '/uploads/ld/materials/ict_module.pdf', 'ict_module.pdf', 'pdf', 2, '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.ld_objectives
CREATE TABLE IF NOT EXISTS `ld_objectives` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `target_position_type` enum('all','teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `professional_standard` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority_level` enum('high','medium','low') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `tna_form_id` int DEFAULT NULL,
  `status` enum('draft','approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_obj_tna` (`tna_form_id`),
  KEY `idx_ld_obj_created_by` (`created_by`),
  CONSTRAINT `fk_ld_obj_tna` FOREIGN KEY (`tna_form_id`) REFERENCES `tna_forms` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ld_obj_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_objectives: ~0 rows (approximately)
INSERT INTO `ld_objectives` (`id`, `school_year`, `title`, `description`, `target_position_type`, `professional_standard`, `priority_level`, `tna_form_id`, `status`, `created_by`, `created_at`) VALUES
	(1, '2025-2026', 'Improve ICT Integration in Classroom Instruction', 'Address gaps identified in the 2026 TNA', 'teaching', 'Domain 4 - Curriculum and Planning', 'high', 1, 'approved', 2, '2026-07-06 03:56:29'),
	(2, '2026', 'Enhance Teacher Competency in Differentiated Instruction & Tech Integration', 'Equip classroom teachers with standard skills in positive discipline and digital lesson design tools to improve student engagement.', 'teaching', 'Philippine Professional Standards for Teachers (PPST)', 'high', 3, 'approved', 1, '2026-07-06 08:55:16');

-- Dumping structure for table deped_hrmis.ld_plans
CREATE TABLE IF NOT EXISTS `ld_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','approved','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_plans_created_by` (`created_by`),
  KEY `idx_ld_plans_approved_by` (`approved_by`),
  CONSTRAINT `fk_ld_plans_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ld_plans_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_plans: ~0 rows (approximately)
INSERT INTO `ld_plans` (`id`, `title`, `school_year`, `description`, `status`, `approved_by`, `approved_at`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 'SDO Dapitan City L&D Plan SY 2025-2026', '2025-2026', 'Consolidated learning and development plan', 'approved', 1, '2026-06-15 10:00:00', 2, '2026-07-06 03:56:29', '2026-07-06 03:56:29'),
	(2, '2026 In-Service Training (INSET) Plan for Teachers', '2026', 'Annual capability building plan focused on upgrading pedagogy, digital skills, and classroom management for SDO teachers.', 'approved', 1, '2026-07-06 16:55:16', 1, '2026-07-06 08:55:16', '2026-07-06 08:55:16');

-- Dumping structure for table deped_hrmis.ld_programs
CREATE TABLE IF NOT EXISTS `ld_programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_id` int NOT NULL,
  `objective_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `methodology` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_position_type` enum('all','teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `duration_hours` decimal(6,1) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `venue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget_estimate` decimal(12,2) DEFAULT NULL,
  `attendance_sheet_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ld_programs_plan` (`plan_id`),
  KEY `idx_ld_programs_objective` (`objective_id`),
  CONSTRAINT `fk_ld_programs_objective` FOREIGN KEY (`objective_id`) REFERENCES `ld_objectives` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ld_programs_plan` FOREIGN KEY (`plan_id`) REFERENCES `ld_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_programs: ~0 rows (approximately)
INSERT INTO `ld_programs` (`id`, `plan_id`, `objective_id`, `title`, `description`, `methodology`, `target_position_type`, `duration_hours`, `start_date`, `end_date`, `venue`, `resource_person`, `provider`, `budget_estimate`, `attendance_sheet_path`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 'ICT Integration Training for Teachers', 'Hands-on training on using digital tools in the classroom', 'Workshop', 'teaching', 16.0, '2026-07-20', '2026-07-21', 'SDO Dapitan City Training Center', 'Dr. Ana Reyes', 'DepEd Regional Office IX', 25000.00, NULL, 'upcoming', 2, '2026-07-06 03:56:29', '2026-07-06 03:56:29'),
	(2, 2, 2, 'Modern Classroom Management & Pedagogy Seminar-Workshop', 'A 3-day training covering positive reinforcement, active learning strategies, and Google Classroom suite integration.', 'Workshop', 'teaching', 24.0, '2026-07-20', '2026-07-22', 'SDO Social Hall', 'Dr. Amelia Vance', 'Schools Division Office', 45000.00, NULL, 'ongoing', 1, '2026-07-06 08:55:16', '2026-07-06 08:55:16');

-- Dumping structure for table deped_hrmis.ld_trainings
CREATE TABLE IF NOT EXISTS `ld_trainings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ld_plan_id` int unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `methodology` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_position_type` enum('teaching','non_teaching','teaching_related','all') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `facilitator` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_hours` decimal(6,1) NOT NULL DEFAULT '0.0',
  `budget_actual` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('upcoming','ongoing','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `created_by` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_trainings: ~0 rows (approximately)
INSERT INTO `ld_trainings` (`id`, `ld_plan_id`, `title`, `description`, `methodology`, `target_position_type`, `facilitator`, `venue`, `start_date`, `end_date`, `total_hours`, `budget_actual`, `status`, `created_by`, `created_at`) VALUES
	(1, 1, 'ICT Integration Training for Teachers (Legacy Record)', 'Migrated from old system', 'Workshop', 'teaching', 'Dr. Ana Reyes', 'SDO Dapitan City Training Center', '2026-07-20', '2026-07-21', 16.0, 24500.00, 'upcoming', 2, '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.ld_training_participants
CREATE TABLE IF NOT EXISTS `ld_training_participants` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `training_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `attendance_status` enum('present','absent','excused') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ldtp_training` (`training_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.ld_training_participants: ~0 rows (approximately)
INSERT INTO `ld_training_participants` (`id`, `training_id`, `user_id`, `attendance_status`, `completed_at`) VALUES
	(1, 1, 5, 'present', NULL);

-- Dumping structure for table deped_hrmis.leave_applications
CREATE TABLE IF NOT EXISTS `leave_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type` enum('sick','vacation','special_privilege','maternity','paternity','forced','study','rehabilitation','vawc','solo_parent','special_benefits_women','special_emergency','adoption','others') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `num_days` decimal(5,1) DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `leave_details` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '6.B conditional detail: illness, location, study type, others spec',
  `commutation` enum('requested','not_requested') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_requested' COMMENT '6.D commutation',
  `status` enum('pending','recommended','approved','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `recommended_by` int DEFAULT NULL COMMENT 'First-level approver (hr_staff/admin) per 7.B',
  `recommended_at` datetime DEFAULT NULL,
  `recommendation_remark` text COLLATE utf8mb4_unicode_ci COMMENT '7.B: For disapproval due to [reason]',
  `final_action_by` int DEFAULT NULL COMMENT 'Final approver (appointing_authority/admin) per 7.C/7.D',
  `signatory_id` int DEFAULT NULL,
  `final_action_at` datetime DEFAULT NULL,
  `final_action_days_type` enum('with_pay','without_pay','others') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '7.C: Approved for days with/without pay',
  `final_action_remark` text COLLATE utf8mb4_unicode_ci COMMENT '7.C others specify or 7.D disapproval reason',
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `supporting_file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `esignature_consented` tinyint(1) NOT NULL DEFAULT '0',
  `esignature_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `esignature_timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_la_employee` (`employee_id`),
  KEY `fk_leave_signatory` (`signatory_id`),
  CONSTRAINT `fk_la_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leave_signatory` FOREIGN KEY (`signatory_id`) REFERENCES `signatories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.leave_applications: ~2 rows (approximately)
INSERT INTO `leave_applications` (`id`, `employee_id`, `leave_type`, `date_from`, `date_to`, `num_days`, `reason`, `leave_details`, `commutation`, `status`, `approved_by`, `recommended_by`, `recommended_at`, `recommendation_remark`, `final_action_by`, `signatory_id`, `final_action_at`, `final_action_days_type`, `final_action_remark`, `approved_at`, `rejection_reason`, `supporting_file_path`, `created_at`, `updated_at`, `esignature_consented`, `esignature_ip`, `esignature_timestamp`) VALUES
	(1, 1, 'vacation', '2026-08-03', '2026-08-05', 3.0, 'Family vacation', NULL, 'not_requested', 'approved', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-20 09:00:00', NULL, NULL, '2026-07-06 03:56:30', '2026-07-06 03:56:30', 0, NULL, NULL),
	(2, 2, 'adoption', '2026-07-15', '2026-07-05', 5.0, 'ahh basta kapuy', NULL, 'not_requested', 'recommended', NULL, 1, '2026-07-15 16:46:50', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-15 02:12:36', '2026-07-15 08:46:50', 1, '::1', '2026-07-15 10:12:36');

-- Dumping structure for table deped_hrmis.leave_carryover
CREATE TABLE IF NOT EXISTS `leave_carryover` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `fiscal_year` year NOT NULL COMMENT 'The year whose balances are being locked',
  `sick_leave_balance` decimal(6,3) NOT NULL DEFAULT '0.000',
  `vacation_leave_balance` decimal(6,3) NOT NULL DEFAULT '0.000',
  `forced_leave_balance` decimal(6,3) NOT NULL DEFAULT '0.000',
  `special_privilege_balance` decimal(6,3) NOT NULL DEFAULT '0.000',
  `sick_leave_used` decimal(6,3) NOT NULL DEFAULT '0.000' COMMENT 'Total sick leave days used in this fiscal year',
  `vacation_leave_used` decimal(6,3) NOT NULL DEFAULT '0.000' COMMENT 'Total vacation leave days used in this fiscal year',
  `sick_leave_carryover` decimal(6,3) NOT NULL DEFAULT '0.000' COMMENT 'Days carried into next year (per DepEd rules, max typically 10)',
  `vacation_leave_carryover` decimal(6,3) NOT NULL DEFAULT '0.000' COMMENT 'Days carried into next year (per DepEd rules, max typically 10)',
  `locked_by` int NOT NULL COMMENT 'user_id of the admin who triggered the lock',
  `locked_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_carryover_employee_year` (`employee_id`,`fiscal_year`),
  KEY `fk_carryover_user` (`locked_by`),
  CONSTRAINT `fk_carryover_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_carryover_user` FOREIGN KEY (`locked_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.leave_carryover: ~4 rows (approximately)
INSERT INTO `leave_carryover` (`id`, `employee_id`, `fiscal_year`, `sick_leave_balance`, `vacation_leave_balance`, `forced_leave_balance`, `special_privilege_balance`, `sick_leave_used`, `vacation_leave_used`, `sick_leave_carryover`, `vacation_leave_carryover`, `locked_by`, `locked_at`) VALUES
	(1, 1, '2026', 15.000, 15.000, 5.000, 3.000, 0.000, 0.000, 10.000, 10.000, 1, '2026-07-19 00:35:22'),
	(2, 2, '2026', 15.000, 15.000, 5.000, 3.000, 0.000, 0.000, 10.000, 10.000, 1, '2026-07-19 00:35:22'),
	(3, 3, '2026', 15.000, 15.000, 5.000, 3.000, 0.000, 0.000, 10.000, 10.000, 1, '2026-07-19 00:35:22'),
	(4, 4, '2026', 15.000, 15.000, 5.000, 3.000, 0.000, 0.000, 10.000, 10.000, 1, '2026-07-19 00:35:22');

-- Dumping structure for table deped_hrmis.leave_credits
CREATE TABLE IF NOT EXISTS `leave_credits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `sick_leave_balance` decimal(6,3) NOT NULL DEFAULT '0.000',
  `vacation_leave_balance` decimal(6,3) NOT NULL DEFAULT '0.000',
  `forced_leave_balance` decimal(6,3) NOT NULL DEFAULT '0.000',
  `special_privilege_balance` decimal(6,3) NOT NULL DEFAULT '0.000',
  `as_of_date` date DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leave_credits_employee` (`employee_id`),
  CONSTRAINT `fk_lc_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.leave_credits: ~1 rows (approximately)
INSERT INTO `leave_credits` (`id`, `employee_id`, `sick_leave_balance`, `vacation_leave_balance`, `forced_leave_balance`, `special_privilege_balance`, `as_of_date`, `updated_at`) VALUES
	(1, 1, 10.000, 10.000, 5.000, 3.000, '2026-06-30', '2026-07-18 16:35:22'),
	(2, 2, 10.000, 10.000, 5.000, 3.000, '2026-07-12', '2026-07-18 16:35:22'),
	(3, 3, 10.000, 10.000, 5.000, 3.000, '2026-07-13', '2026-07-18 16:35:22'),
	(4, 4, 10.000, 10.000, 5.000, 3.000, '2026-07-13', '2026-07-18 16:35:22'),
	(5, 7, 15.000, 15.000, 5.000, 3.000, '2026-07-21', '2026-07-21 03:32:12');

-- Dumping structure for table deped_hrmis.minimum_qualifications_checklist
CREATE TABLE IF NOT EXISTS `minimum_qualifications_checklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `criterion_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_mqc_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_mqc_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.minimum_qualifications_checklist: ~2 rows (approximately)
INSERT INTO `minimum_qualifications_checklist` (`id`, `vacancy_id`, `criterion_label`, `is_required`) VALUES
	(1, 1, 'BEED/BSED Degree', 1),
	(2, 1, 'LET/PRC License', 1);

-- Dumping structure for table deped_hrmis.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_application` (`application_id`),
  CONSTRAINT `fk_notif_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.notifications: ~33 rows (approximately)
INSERT INTO `notifications` (`id`, `application_id`, `message`, `created_at`) VALUES
	(1, 1, 'Your application has been shortlisted for the next stage.', '2026-07-06 03:56:29'),
	(2, 1, 'Your application for Teacher I has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.', '2026-07-06 04:43:20'),
	(3, 1, 'Congratulations! You are ranked #1 out of 1 qualified applicants for Teacher I. The HRMPSB has endorsed your name to the appointing authority.', '2026-07-06 04:43:57'),
	(4, 1, 'Congratulations! You have been selected for Teacher I. Please review your appointment requirements.', '2026-07-06 04:44:06'),
	(5, 2, 'Your application for IT support at ICT Office has been successfully received. Reference No: APP-002-2026. Your documents are now under review.', '2026-07-06 06:58:16'),
	(6, 2, 'Your application for IT support has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.', '2026-07-06 07:00:25'),
	(7, 2, 'The HRMPSB Secretariat has officially posted the Comparative Assessment Results for V-2026-001. Your total score is 77.45/100, placing you at Rank #1 of 1.', '2026-07-06 07:03:00'),
	(8, 2, 'Congratulations! You are ranked #1 out of 1 qualified applicants for IT support. The HRMPSB has endorsed your name to the appointing authority.', '2026-07-06 07:03:08'),
	(9, 1, 'Congratulations! You have been selected for Teacher I. Please review your appointment requirements.', '2026-07-06 07:03:16'),
	(10, 2, 'Congratulations! You have been selected for IT support. Please review your appointment requirements.', '2026-07-06 07:20:03'),
	(11, 2, 'Your appointment has been officially issued.', '2026-07-06 07:20:32'),
	(12, 1, 'Your application for Teacher I has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.', '2026-07-11 07:03:15'),
	(13, 4, 'Your application for Teacher I has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.', '2026-07-11 07:03:22'),
	(14, 4, 'Your application for Teacher I has been evaluated. Unfortunately, you did not meet the minimum qualification standards required for this position.', '2026-07-11 07:03:38'),
	(15, 2, 'Your CSC MC 10 s. 2013 Omnibus Sworn Statement needs revision: blury i cannot see the files clearly. Please resubmit the corrected document.', '2026-07-14 05:03:53'),
	(16, 2, 'Your CSC MC 10 s. 2013 Omnibus Sworn Statement has been verified. Note: okay', '2026-07-14 05:18:35'),
	(17, 2, 'Your application for IT support has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.', '2026-07-14 05:18:59'),
	(18, 2, 'Congratulations! You have been selected for IT support. Please review your appointment requirements.', '2026-07-17 17:25:25'),
	(19, 2, 'Your application for IT support has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.', '2026-07-17 19:08:29'),
	(20, 5, 'Your application for School Head at TR001 has been successfully received. Reference No: TR-001. Your documents are now under review.', '2026-07-19 07:12:18'),
	(21, 5, 'Your CSC MC 10 s. 2013 Omnibus Sworn Statement needs revision: dili makita naunsaman sab ka oi. Please resubmit the corrected document.', '2026-07-19 08:30:23'),
	(22, 5, 'Your Certificates of Training / Seminars (relevant) has been verified.', '2026-07-19 08:41:23'),
	(23, 5, 'Your CSC Eligibility Certificate (Career Service Professional/Sub-Professional) has been verified.', '2026-07-19 08:41:25'),
	(24, 5, 'Your NBI Clearance (issued within the last 6 months) needs revision: ahhh basta. Please resubmit the corrected document.', '2026-07-19 08:41:56'),
	(25, 5, 'Your Medical Certificate (from government hospital) has been verified.', '2026-07-19 08:41:59'),
	(26, 5, 'Your Service Record (duly signed by authorized official) has been verified.', '2026-07-19 08:42:14'),
	(27, 5, 'Your Diploma (certified true copy) has been verified.', '2026-07-19 08:42:15'),
	(28, 5, 'Your Performance Evaluation Reports (last 3 rating periods) has been verified.', '2026-07-19 08:42:17'),
	(29, 5, 'Your Personal Data Sheet (CS Form 212, latest revision) has been verified.', '2026-07-19 08:42:18'),
	(30, 5, 'Your NBI Clearance (issued within the last 6 months) has been verified.', '2026-07-19 08:44:48'),
	(31, 5, 'Your CSC MC 10 s. 2013 Omnibus Sworn Statement has been verified.', '2026-07-19 08:44:50'),
	(32, 5, 'Your Transcript of Records (certified true copy) has been verified.', '2026-07-19 09:10:06'),
	(33, 5, 'Your application for School Head has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.', '2026-07-19 09:10:21'),
	(34, 5, 'The HRMPSB Secretariat has officially posted the Comparative Assessment Results for V-2026-002. Your total score is 80.00/100, placing you at Rank #1 of 1.', '2026-07-19 10:03:07'),
	(35, 5, 'Congratulations! You are ranked #1 out of 1 qualified applicants for School Head. The HRMPSB has endorsed your name to the appointing authority.', '2026-07-19 10:03:24'),
	(36, 5, 'Your application for School Head has been evaluated and you have been found to meet all minimum qualification standards. You are cleared to proceed to the Comparative Assessment stage.', '2026-07-19 10:04:05'),
	(37, 5, 'Congratulations! You have been selected for School Head. Please review your appointment requirements.', '2026-07-20 04:30:25'),
	(38, 5, 'Your appointment has been officially issued.', '2026-07-21 04:24:07');

-- Dumping structure for table deped_hrmis.performance_commitments
CREATE TABLE IF NOT EXISTS `performance_commitments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `period_id` int NOT NULL,
  `form_type` enum('ipcrf','opcrf') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ipcrf',
  `position_type` enum('teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'teaching',
  `status` enum('draft','submitted','rated','finalized') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `overall_rating` decimal(4,2) DEFAULT NULL,
  `adjectival_rating` enum('Outstanding','Very Satisfactory','Satisfactory','Unsatisfactory','Poor') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `rated_at` timestamp NULL DEFAULT NULL,
  `finalized_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pc_user` (`user_id`),
  KEY `idx_pc_period` (`period_id`),
  CONSTRAINT `fk_pc_period` FOREIGN KEY (`period_id`) REFERENCES `performance_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.performance_commitments: ~0 rows (approximately)
INSERT INTO `performance_commitments` (`id`, `user_id`, `period_id`, `form_type`, `position_type`, `status`, `overall_rating`, `adjectival_rating`, `submitted_at`, `rated_at`, `finalized_at`, `created_at`) VALUES
	(1, 5, 1, 'ipcrf', 'teaching', 'rated', 4.20, 'Very Satisfactory', '2026-04-15 01:00:00', NULL, NULL, '2026-07-06 03:56:29'),
	(2, 6, 1, 'ipcrf', 'non_teaching', 'draft', NULL, NULL, NULL, NULL, NULL, '2026-07-06 05:06:18');

-- Dumping structure for table deped_hrmis.performance_periods
CREATE TABLE IF NOT EXISTS `performance_periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phase` tinyint NOT NULL COMMENT '1=Midyear, 2=Yearend, 3=Q1, 4=Q2',
  `period_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('upcoming','active','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.performance_periods: ~0 rows (approximately)
INSERT INTO `performance_periods` (`id`, `school_year`, `phase`, `period_label`, `start_date`, `end_date`, `status`, `created_at`) VALUES
	(1, '2025-2026', 1, 'SY 2025-2026 Midyear Review', '2025-11-01', '2026-04-30', 'active', '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.performance_ratings
CREATE TABLE IF NOT EXISTS `performance_ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `commitment_id` int NOT NULL,
  `rated_by` int NOT NULL,
  `numerical_rating` decimal(4,2) DEFAULT NULL,
  `adjectival_rating` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rater_remarks` text COLLATE utf8mb4_unicode_ci,
  `ratee_remarks` text COLLATE utf8mb4_unicode_ci,
  `rated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pr_commitment` (`commitment_id`),
  KEY `idx_pr_rated_by` (`rated_by`),
  CONSTRAINT `fk_pr_commitment` FOREIGN KEY (`commitment_id`) REFERENCES `performance_commitments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pr_rated_by` FOREIGN KEY (`rated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.performance_ratings: ~0 rows (approximately)
INSERT INTO `performance_ratings` (`id`, `commitment_id`, `rated_by`, `numerical_rating`, `adjectival_rating`, `rater_remarks`, `ratee_remarks`, `rated_at`) VALUES
	(1, 1, 2, 4.20, 'Very Satisfactory', 'Consistently meets targets with strong classroom management', NULL, '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.performance_targets
CREATE TABLE IF NOT EXISTS `performance_targets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `commitment_id` int NOT NULL,
  `kra_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mfo_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `success_indicator` text COLLATE utf8mb4_unicode_ci,
  `weight` decimal(5,2) DEFAULT NULL,
  `q1_rating` decimal(4,2) DEFAULT NULL,
  `q2_rating` decimal(4,2) DEFAULT NULL,
  `q3_rating` decimal(4,2) DEFAULT NULL,
  `q4_rating` decimal(4,2) DEFAULT NULL,
  `average_rating` decimal(4,2) DEFAULT NULL,
  `means_of_verification` text COLLATE utf8mb4_unicode_ci,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pt_commitment` (`commitment_id`),
  CONSTRAINT `fk_pt_commitment` FOREIGN KEY (`commitment_id`) REFERENCES `performance_commitments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.performance_targets: ~6 rows (approximately)
INSERT INTO `performance_targets` (`id`, `commitment_id`, `kra_label`, `mfo_label`, `success_indicator`, `weight`, `q1_rating`, `q2_rating`, `q3_rating`, `q4_rating`, `average_rating`, `means_of_verification`, `remarks`, `created_at`) VALUES
	(1, 1, 'Content Knowledge and Pedagogy', 'Instruction', 'At least 95% of lessons delivered per curriculum guide', 25.00, 4.00, 4.50, NULL, NULL, 4.25, NULL, NULL, '2026-07-06 03:56:29'),
	(2, 2, 'Core Function 1 – Quality Service Delivery', '', '', 25.00, NULL, NULL, NULL, NULL, NULL, '', '', '2026-07-06 05:06:18'),
	(3, 2, 'Core Function 2 – Operational Efficiency', '', '', 25.00, NULL, NULL, NULL, NULL, NULL, '', '', '2026-07-06 05:06:18'),
	(4, 2, 'Core Function 3 – Client Satisfaction', '', '', 20.00, NULL, NULL, NULL, NULL, NULL, '', '', '2026-07-06 05:06:18'),
	(5, 2, 'Support Function 1 – Documentation & Reporting', '', '', 15.00, NULL, NULL, NULL, NULL, NULL, '', '', '2026-07-06 05:06:18'),
	(6, 2, 'Support Function 2 – Team Collaboration', '', '', 15.00, NULL, NULL, NULL, NULL, NULL, '', '', '2026-07-06 05:06:18');

-- Dumping structure for table deped_hrmis.personal_data_sheets
CREATE TABLE IF NOT EXISTS `personal_data_sheets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `surname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name_extension` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `place_of_birth` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sex` enum('male','female') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `civil_status` enum('single','married','widowed','separated','others') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `civil_status_other` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disability` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ethnic_group` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `height_m` decimal(3,2) DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `blood_type` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gsis_id_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagibig_id_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `philhealth_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sss_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tin_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agency_employee_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `citizenship` enum('filipino','dual_citizen') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'filipino',
  `dual_citizenship_country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dual_citizenship_type` enum('by_birth','by_naturalization') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `res_house_block_lot` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `res_street` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `res_subdivision_village` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `res_barangay` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `res_city_municipality` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `res_province` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `res_zip_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perm_same_as_residential` tinyint(1) NOT NULL DEFAULT '0',
  `perm_house_block_lot` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perm_street` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perm_subdivision_village` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perm_barangay` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perm_city_municipality` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perm_province` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perm_zip_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_address` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spouse_surname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spouse_first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spouse_middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spouse_name_extension` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spouse_occupation` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spouse_employer_business_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spouse_business_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spouse_telephone_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_surname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_name_extension` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_maiden_surname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `children` json DEFAULT NULL,
  `elementary` json DEFAULT NULL,
  `secondary` json DEFAULT NULL,
  `vocational` json DEFAULT NULL,
  `college` json DEFAULT NULL,
  `graduate_studies` json DEFAULT NULL,
  `civil_service_eligibility` json DEFAULT NULL,
  `work_experience` json DEFAULT NULL,
  `voluntary_work` json DEFAULT NULL,
  `ld_training` json DEFAULT NULL,
  `special_skills` json DEFAULT NULL,
  `non_academic_distinctions` json DEFAULT NULL,
  `membership_associations` json DEFAULT NULL,
  `q34a_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q34a_details` text COLLATE utf8mb4_unicode_ci,
  `q34b_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q34b_details` text COLLATE utf8mb4_unicode_ci,
  `q35a_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q35a_details` text COLLATE utf8mb4_unicode_ci,
  `q35b_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q35b_details` text COLLATE utf8mb4_unicode_ci,
  `q35b_date_filed` date DEFAULT NULL,
  `q35b_case_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q36_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q36_details` text COLLATE utf8mb4_unicode_ci,
  `q37_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q37_details` text COLLATE utf8mb4_unicode_ci,
  `q38a_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q38a_details` text COLLATE utf8mb4_unicode_ci,
  `q38b_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q38b_details` text COLLATE utf8mb4_unicode_ci,
  `q39_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q39_details` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q40a_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q40a_details` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q40b_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q40b_details` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q40c_answer` enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `q40c_details` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `references` json DEFAULT NULL,
  `govt_ids` json DEFAULT NULL,
  `date_accomplished` date DEFAULT NULL,
  `photo_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thumbmark_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','submitted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pds_user` (`user_id`),
  CONSTRAINT `fk_pds_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.personal_data_sheets: ~4 rows (approximately)
INSERT INTO `personal_data_sheets` (`id`, `user_id`, `surname`, `first_name`, `middle_name`, `name_extension`, `date_of_birth`, `place_of_birth`, `sex`, `civil_status`, `civil_status_other`, `religion`, `disability`, `ethnic_group`, `height_m`, `weight_kg`, `blood_type`, `gsis_id_no`, `pagibig_id_no`, `philhealth_no`, `sss_no`, `tin_no`, `agency_employee_no`, `citizenship`, `dual_citizenship_country`, `dual_citizenship_type`, `res_house_block_lot`, `res_street`, `res_subdivision_village`, `res_barangay`, `res_city_municipality`, `res_province`, `res_zip_code`, `perm_same_as_residential`, `perm_house_block_lot`, `perm_street`, `perm_subdivision_village`, `perm_barangay`, `perm_city_municipality`, `perm_province`, `perm_zip_code`, `telephone_no`, `mobile_no`, `email_address`, `spouse_surname`, `spouse_first_name`, `spouse_middle_name`, `spouse_name_extension`, `spouse_occupation`, `spouse_employer_business_name`, `spouse_business_address`, `spouse_telephone_no`, `father_surname`, `father_first_name`, `father_middle_name`, `father_name_extension`, `mother_maiden_surname`, `mother_first_name`, `mother_middle_name`, `children`, `elementary`, `secondary`, `vocational`, `college`, `graduate_studies`, `civil_service_eligibility`, `work_experience`, `voluntary_work`, `ld_training`, `special_skills`, `non_academic_distinctions`, `membership_associations`, `q34a_answer`, `q34a_details`, `q34b_answer`, `q34b_details`, `q35a_answer`, `q35a_details`, `q35b_answer`, `q35b_details`, `q35b_date_filed`, `q35b_case_status`, `q36_answer`, `q36_details`, `q37_answer`, `q37_details`, `q38a_answer`, `q38a_details`, `q38b_answer`, `q38b_details`, `q39_answer`, `q39_details`, `q40a_answer`, `q40a_details`, `q40b_answer`, `q40b_details`, `q40c_answer`, `q40c_details`, `references`, `govt_ids`, `date_accomplished`, `photo_path`, `signature_path`, `thumbmark_path`, `status`, `submitted_at`, `created_at`, `updated_at`) VALUES
	(1, 5, 'Fernandez', 'Liza', NULL, NULL, '1998-03-14', 'Dapitan City', 'female', 'single', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'filipino', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '09171234505', 'applicant.teaching@depedhrmis.test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'submitted', NULL, '2026-07-06 03:56:29', '2026-07-06 03:56:29'),
	(2, 6, 'antipuesto', 'leo', 'alfier', 'N/A', '2000-08-23', 'Calamba ', 'male', 'single', NULL, NULL, NULL, NULL, 1.68, 74.00, 'O', '3234234234234', '34234234234', '234234234234', '43242342342', '2342342342', '42342342342', 'filipino', NULL, NULL, 'rjfoeuirjgioejtgoitg', 'N/A', 'oowejfiojeorfjoirf', 'rj3ifjwiorfjoifj', 'calamba district hospital misamis occidental', 'misamis occidental', '7101', 1, 'rjfoeuirjgioejtgoitg', 'N/A', 'oowejfiojeorfjoirf', 'rj3ifjwiorfjoifj', 'calamba district hospital misamis occidental', 'misamis occidental', '7101', 'N/A', '09123456789', 'leoalfier68@gmail.com', 'DMJCEJIFOCEJR', 'UREFHUIWERHFE', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'ASHDUEIWHDFUIWE', 'YUEHFWUIHEFUIWHE', 'UHEUIW', 'N/A', 'N/A', 'N/A', 'N/A', '[]', '{"period_to": "2003", "period_from": "2001", "school_name": "NIDUEHDUIWE", "degree_course": "NWUEDNWUIED", "year_graduated": "N/A", "scholarship_honors": "N/A", "highest_level_units": "N/A"}', '{"period_to": "2006", "period_from": "2004", "school_name": "UERFUENRF", "degree_course": "JKRFNEJRF", "year_graduated": "N/A", "scholarship_honors": "N/A", "highest_level_units": "N/A"}', NULL, '[{"period_to": "2010", "period_from": "2007", "school_name": "DWJEDIWOJED", "degree_course": "EUDJHWEUIHWEUI", "year_graduated": "N/A", "scholarship_honors": "N/A", "highest_level_units": "N/A"}]', '[]', '[{"rating": "", "exam_date": "", "exam_place": "", "license_number": "", "eligibility_name": "", "license_validity": ""}, {"rating": "", "exam_date": "", "exam_place": "", "license_number": "", "eligibility_name": "", "license_validity": ""}]', '[{"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}]', '[{"date_to": "", "date_from": "", "num_hours": "", "position_nature": "", "org_name_address": ""}, {"date_to": "", "date_from": "", "num_hours": "", "position_nature": "", "org_name_address": ""}, {"date_to": "", "date_from": "", "num_hours": "", "position_nature": "", "org_name_address": ""}]', '[{"title": "", "date_to": "", "ld_type": "", "date_from": "", "num_hours": "", "conducted_by": ""}, {"title": "", "date_to": "", "ld_type": "", "date_from": "", "num_hours": "", "conducted_by": ""}, {"title": "", "date_to": "", "ld_type": "", "date_from": "", "num_hours": "", "conducted_by": ""}]', '[{"skill": ""}, {"skill": ""}, {"skill": ""}]', '[{"distinction": ""}, {"distinction": ""}]', '[{"organization": ""}, {"organization": ""}, {"organization": ""}]', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[{"name": "", "tel_no": "", "address": ""}, {"name": "", "tel_no": "", "address": ""}, {"name": "", "tel_no": "", "address": ""}]', '[{"id_type": "", "id_license_no": "", "date_place_issuance": ""}]', NULL, NULL, NULL, NULL, 'submitted', '2026-07-06 14:55:48', '2026-07-06 05:06:42', '2026-07-06 06:55:48'),
	(3, 9, 'Santos', 'Juan', 'Reyes', NULL, '1995-04-12', NULL, 'male', 'single', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'filipino', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-06', NULL, NULL, NULL, 'submitted', '2026-07-06 17:02:45', '2026-07-06 09:02:45', '2026-07-06 09:02:45'),
	(4, 10, 'okay', 'kiki', 'jidjid', 'namename', '2002-01-21', 'hjsdnaidjasdnasdi', 'female', 'married', NULL, 'hjsdnaidjasdnasdi', 'hjsdnaidjasdnasdi', 'hjsdnaidjasdnasdi', 1.40, 39.00, 'O+', '12098765', '12098765', '12098765', '1234567', '12098765', '1234567', 'filipino', NULL, NULL, 'ajsdaiednajhd', 'ajsdaiednajhd', 'ajsdaiednajhd', 'ajsdaiednajhd', 'ajsdaiednajhd', 'ajsdaiednajhd', '1233', 1, 'ajsdaiednajhd', 'ajsdaiednajhd', 'ajsdaiednajhd', 'ajsdaiednajhd', 'ajsdaiednajhd', 'ajsdaiednajhd', '1233', 'N/A', '09998887777', 'maxsonpuerto@gmail.com', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'jnnjnjknjnii', 'jnnjnjknjnii', 'jnnjnjknjnii', 'N/A', 'jnnjnjknjnii', 'jnnjnjknjnii', 'jnnjnjknjnii', '[]', '{"period_to": "2002", "period_from": "2000", "school_name": "leo alfier antipuesto", "degree_course": "JSIJNWN", "year_graduated": "N/A", "scholarship_honors": "N/A", "highest_level_units": "N/A"}', '{"period_to": "2004", "period_from": "2003", "school_name": "Antipuesto, Leo Alfier S.", "degree_course": "JSIJNWN", "year_graduated": "N/A", "scholarship_honors": "N/A", "highest_level_units": "N/A"}', '[]', '[{"period_to": "2006", "period_from": "2005", "school_name": "leo alfier antipuesto", "degree_course": "JSIJNWN", "year_graduated": "N/A", "scholarship_honors": "N/A", "highest_level_units": "N/A"}]', '[]', '[{"rating": "", "exam_date": "", "exam_place": "", "license_number": "", "eligibility_name": "", "license_validity": ""}, {"rating": "", "exam_date": "", "exam_place": "", "license_number": "", "eligibility_name": "", "license_validity": ""}]', '[{"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}, {"date_to": "", "date_from": "", "salary_grade": "", "monthly_salary": "", "position_title": "", "is_govt_service": "", "department_agency": "", "status_of_appointment": ""}]', '[{"date_to": "", "date_from": "", "num_hours": "", "position_nature": "", "org_name_address": ""}, {"date_to": "", "date_from": "", "num_hours": "", "position_nature": "", "org_name_address": ""}, {"date_to": "", "date_from": "", "num_hours": "", "position_nature": "", "org_name_address": ""}]', '[{"title": "", "date_to": "", "ld_type": "", "date_from": "", "num_hours": "", "conducted_by": ""}, {"title": "", "date_to": "", "ld_type": "", "date_from": "", "num_hours": "", "conducted_by": ""}, {"title": "", "date_to": "", "ld_type": "", "date_from": "", "num_hours": "", "conducted_by": ""}]', '[{"skill": ""}, {"skill": ""}, {"skill": ""}]', '[{"distinction": ""}, {"distinction": ""}]', '[{"organization": ""}, {"organization": ""}, {"organization": ""}]', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[{"name": "", "tel_no": "", "address": ""}, {"name": "", "tel_no": "", "address": ""}, {"name": "", "tel_no": "", "address": ""}]', '[{"id_type": "", "id_license_no": "", "date_place_issuance": ""}]', NULL, 'pds/PDS-10-PHOTO-1784404660462-772538001.png', 'pds/PDS-10-SIGNATURE-1784404733780-460278559.jpg', 'pds/PDS-10-THUMBMARK-1784404739586-731270795.jpg', 'submitted', '2026-07-19 03:59:14', '2026-07-09 21:31:43', '2026-07-21 02:04:38');

-- Dumping structure for table deped_hrmis.personnel_activity_log
CREATE TABLE IF NOT EXISTS `personnel_activity_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `actor_id` int DEFAULT NULL,
  `employee_id` int DEFAULT NULL,
  `action_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pal_actor` (`actor_id`),
  KEY `idx_pal_employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.personnel_activity_log: ~7 rows (approximately)
INSERT INTO `personnel_activity_log` (`id`, `actor_id`, `employee_id`, `action_type`, `description`, `created_at`) VALUES
	(1, 2, 1, 'document_release', 'Released Certificate of Employment to employee', '2026-07-06 03:56:30'),
	(2, 6, 2, 'leave_submitted', 'Leave application #2 submitted', '2026-07-15 02:12:37'),
	(3, 1, 2, 'leave_recommended', 'Leave #2 recommended for approval', '2026-07-15 08:46:50'),
	(11, 1, 4, 'profile_change_approved', 'approved profile change request #7', '2026-07-21 01:13:49'),
	(12, 1, 4, 'profile_change_rejected', 'rejected profile change request #8', '2026-07-21 01:13:49'),
	(13, 1, 3, 'profile_change_approved', 'approved profile change request #3', '2026-07-21 01:17:40'),
	(14, 1, 3, 'profile_change_approved', 'approved profile change request #9', '2026-07-21 01:45:26');

-- Dumping structure for table deped_hrmis.personnel_notifications
CREATE TABLE IF NOT EXISTS `personnel_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `type` enum('leave','travel','document','general') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pn_employee` (`employee_id`),
  CONSTRAINT `fk_pn_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.personnel_notifications: ~9 rows (approximately)
INSERT INTO `personnel_notifications` (`id`, `employee_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES
	(1, 1, 'leave', 1, 'Your leave application has been approved.', 0, '2026-07-06 03:56:30'),
	(2, 2, 'leave', 2, 'Leave application submitted: adoption (2026-07-15 to 2026-07-05)', 1, '2026-07-15 02:12:37'),
	(3, 2, 'document', 2, 'Document request submitted: Service Record', 1, '2026-07-15 03:02:27'),
	(4, 2, 'leave', 2, 'Your leave application has been recommended for approval.', 1, '2026-07-15 08:46:50'),
	(5, 2, 'document', 2, 'Your Service Record request is ready.', 1, '2026-07-15 08:48:10'),
	(6, 4, 'general', 7, 'Your profile change request has been approved. Your information has been updated.', 0, '2026-07-21 01:13:49'),
	(7, 4, 'general', 8, 'Your profile change request was rejected: E2E test rejection.', 0, '2026-07-21 01:13:49'),
	(8, 3, 'general', 3, 'Your profile change request has been approved. Your information has been updated.', 1, '2026-07-21 01:17:40'),
	(9, 3, 'general', 9, 'Your profile change request has been approved. Your information has been updated.', 1, '2026-07-21 01:45:26');

-- Dumping structure for table deped_hrmis.qualification_standards
CREATE TABLE IF NOT EXISTS `qualification_standards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `label` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_qs_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_qs_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.qualification_standards: ~0 rows (approximately)
INSERT INTO `qualification_standards` (`id`, `vacancy_id`, `label`) VALUES
	(1, 1, 'Bachelor\'s Degree in Education');

-- Dumping structure for table deped_hrmis.results_postings
CREATE TABLE IF NOT EXISTS `results_postings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `published_division_website` timestamp NULL DEFAULT NULL,
  `published_facebook` timestamp NULL DEFAULT NULL,
  `published_bulletin` timestamp NULL DEFAULT NULL,
  `published_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rp_vacancy` (`vacancy_id`),
  KEY `fk_rp_user` (`published_by`),
  CONSTRAINT `fk_rp_user` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rp_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.results_postings: ~0 rows (approximately)
INSERT INTO `results_postings` (`id`, `vacancy_id`, `published_division_website`, `published_facebook`, `published_bulletin`, `published_by`) VALUES
	(1, 1, '2026-06-20 02:00:00', '2026-06-20 02:00:00', NULL, 2),
	(2, 2, '2026-07-06 07:03:00', '2026-07-06 07:03:00', '2026-07-06 07:03:00', 1),
	(3, 3, '2026-07-19 10:03:08', '2026-07-19 10:03:08', '2026-07-19 10:03:08', 1);

-- Dumping structure for table deped_hrmis.rewards_recognition
CREATE TABLE IF NOT EXISTS `rewards_recognition` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `period_id` int NOT NULL,
  `award_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `award_level` enum('school','division','regional','national') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'division',
  `description` text COLLATE utf8mb4_unicode_ci,
  `awarded_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rr_user` (`user_id`),
  KEY `idx_rr_period` (`period_id`),
  CONSTRAINT `fk_rr_period` FOREIGN KEY (`period_id`) REFERENCES `performance_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rewards_recognition: ~0 rows (approximately)
INSERT INTO `rewards_recognition` (`id`, `user_id`, `period_id`, `award_type`, `award_level`, `description`, `awarded_at`, `created_at`) VALUES
	(1, 5, 1, 'Outstanding Teacher Award', 'division', 'Recognized for exemplary performance in SY 2025-2026 midyear review', '2026-05-01', '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.rr_announcements
CREATE TABLE IF NOT EXISTS `rr_announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_call_id` int NOT NULL,
  `memo_file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notify_all_nominees` tinyint(1) NOT NULL DEFAULT '1',
  `notify_awardees_only` tinyint(1) NOT NULL DEFAULT '1',
  `notify_dept_heads` tinyint(1) NOT NULL DEFAULT '0',
  `notify_all_personnel` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('draft','published') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `published_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ran_nomination_call` (`nomination_call_id`),
  KEY `idx_ran_published_by` (`published_by`),
  CONSTRAINT `fk_ran_nomination_call` FOREIGN KEY (`nomination_call_id`) REFERENCES `rr_nomination_calls` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ran_published_by` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_announcements: ~0 rows (approximately)
INSERT INTO `rr_announcements` (`id`, `nomination_call_id`, `memo_file_path`, `notify_all_nominees`, `notify_awardees_only`, `notify_dept_heads`, `notify_all_personnel`, `status`, `published_at`, `published_by`, `created_at`, `updated_at`) VALUES
	(1, 1, 'uploads/division-memos/MEMO-1784385457625-339783222.pdf', 1, 1, 1, 1, 'draft', NULL, NULL, '2026-07-18 14:37:37', '2026-07-18 14:37:57');

-- Dumping structure for table deped_hrmis.rr_announcement_notifications_log
CREATE TABLE IF NOT EXISTS `rr_announcement_notifications_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `announcement_id` int NOT NULL,
  `recipient_user_id` int DEFAULT NULL,
  `recipient_group` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ranl_announcement` (`announcement_id`),
  KEY `idx_ranl_recipient` (`recipient_user_id`),
  CONSTRAINT `fk_ranl_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `rr_announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ranl_recipient` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_announcement_notifications_log: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.rr_awardee_ceremony_status
CREATE TABLE IF NOT EXISTS `rr_awardee_ceremony_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_id` int NOT NULL,
  `ceremony_id` int NOT NULL,
  `attendance_confirmed` tinyint(1) NOT NULL DEFAULT '0',
  `certificate_status` enum('pending','printed','distributed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `plaque_status` enum('pending','printed','distributed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rracs_nomination` (`nomination_id`),
  KEY `idx_rracs_ceremony` (`ceremony_id`),
  CONSTRAINT `fk_rracs_ceremony` FOREIGN KEY (`ceremony_id`) REFERENCES `rr_ceremonies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rracs_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_awardee_ceremony_status: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.rr_awards
CREATE TABLE IF NOT EXISTS `rr_awards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_id` int NOT NULL,
  `search_id` int NOT NULL,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `award_title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_level` enum('school','division','regional','national') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'division',
  `position_type` enum('teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_awarded` tinyint(1) NOT NULL DEFAULT '0',
  `awarded_at` date DEFAULT NULL,
  `certificate_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `announced_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rra_nomination` (`nomination_id`),
  KEY `idx_rra_search` (`search_id`),
  KEY `fk_rra_user` (`user_id`),
  KEY `fk_rra_category` (`category_id`),
  CONSTRAINT `fk_rra_category` FOREIGN KEY (`category_id`) REFERENCES `rr_award_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rra_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rra_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rra_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_awards: ~0 rows (approximately)
INSERT INTO `rr_awards` (`id`, `nomination_id`, `search_id`, `user_id`, `category_id`, `award_title`, `award_level`, `position_type`, `is_awarded`, `awarded_at`, `certificate_path`, `announced_at`, `created_at`) VALUES
	(1, 1, 1, 5, 1, 'Outstanding Teacher - Elementary 2026', 'division', 'teaching', 1, '2026-07-01', '/uploads/rr/certificates/1.pdf', '2026-06-25 09:00:00', '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.rr_award_categories
CREATE TABLE IF NOT EXISTS `rr_award_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `search_id` int NOT NULL,
  `category_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_level` enum('school','division','regional','national') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'division',
  `position_type` enum('all','teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `max_awardees` int NOT NULL DEFAULT '1',
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_rrac_search` (`search_id`),
  CONSTRAINT `fk_rrac_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_award_categories: ~0 rows (approximately)
INSERT INTO `rr_award_categories` (`id`, `search_id`, `category_name`, `category_level`, `position_type`, `max_awardees`, `description`) VALUES
	(1, 1, 'Outstanding Teacher - Elementary', 'division', 'teaching', 3, 'For elementary level teaching personnel');

-- Dumping structure for table deped_hrmis.rr_award_document_requirements
CREATE TABLE IF NOT EXISTS `rr_award_document_requirements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `award_type_id` int NOT NULL,
  `document_label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_radr_award_type` (`award_type_id`),
  CONSTRAINT `fk_radr_award_type` FOREIGN KEY (`award_type_id`) REFERENCES `rr_award_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_award_document_requirements: ~40 rows (approximately)
INSERT INTO `rr_award_document_requirements` (`id`, `award_type_id`, `document_label`, `display_order`, `is_required`) VALUES
	(1, 1, 'Personal Data Sheet (CS Form 212)', 1, 1),
	(2, 1, 'Service Record', 2, 1),
	(3, 1, 'Performance Rating (last 2 semesters)', 3, 1),
	(4, 1, 'Certificate of No Pending Case', 4, 1),
	(5, 1, 'Accomplishment Report', 5, 1),
	(6, 1, 'Supporting Documents / Citations', 6, 1),
	(7, 2, 'Personal Data Sheet (CS Form 212)', 1, 1),
	(8, 2, 'Service Record', 2, 1),
	(9, 2, 'Performance Rating (last 2 semesters)', 3, 1),
	(10, 2, 'Certificate of No Pending Case', 4, 1),
	(11, 2, 'Accomplishment Report', 5, 1),
	(12, 2, 'Supporting Documents / Citations', 6, 1),
	(13, 3, 'Personal Data Sheet (CS Form 212)', 1, 1),
	(14, 3, 'Service Record (25 years continuous)', 2, 1),
	(15, 3, 'Certificate of No Pending Case', 3, 1),
	(16, 3, 'Agency Certification of Employment', 4, 1),
	(17, 4, 'Personal Data Sheet (CS Form 212)', 1, 1),
	(18, 4, 'Service Record (10 years continuous)', 2, 1),
	(19, 4, 'Certificate of No Pending Case', 3, 1),
	(20, 4, 'Agency Certification of Employment', 4, 1),
	(21, 1, 'Personal Data Sheet (CS Form 212)', 1, 1),
	(22, 1, 'Service Record', 2, 1),
	(23, 1, 'Performance Rating (last 2 semesters)', 3, 1),
	(24, 1, 'Certificate of No Pending Case', 4, 1),
	(25, 1, 'Accomplishment Report', 5, 1),
	(26, 1, 'Supporting Documents / Citations', 6, 1),
	(27, 2, 'Personal Data Sheet (CS Form 212)', 1, 1),
	(28, 2, 'Service Record', 2, 1),
	(29, 2, 'Performance Rating (last 2 semesters)', 3, 1),
	(30, 2, 'Certificate of No Pending Case', 4, 1),
	(31, 2, 'Accomplishment Report', 5, 1),
	(32, 2, 'Supporting Documents / Citations', 6, 1),
	(33, 3, 'Personal Data Sheet (CS Form 212)', 1, 1),
	(34, 3, 'Service Record (25 years continuous)', 2, 1),
	(35, 3, 'Certificate of No Pending Case', 3, 1),
	(36, 3, 'Agency Certification of Employment', 4, 1),
	(37, 4, 'Personal Data Sheet (CS Form 212)', 1, 1),
	(38, 4, 'Service Record (10 years continuous)', 2, 1),
	(39, 4, 'Certificate of No Pending Case', 3, 1),
	(40, 4, 'Agency Certification of Employment', 4, 1);

-- Dumping structure for table deped_hrmis.rr_award_types
CREATE TABLE IF NOT EXISTS `rr_award_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_level` enum('school','division','regional','national') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'division',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_award_types: ~4 rows (approximately)
INSERT INTO `rr_award_types` (`id`, `name`, `award_level`, `is_active`) VALUES
	(1, 'Outstanding Teacher of the Year', 'division', 1),
	(2, 'Outstanding Non-Teaching Personnel', 'division', 1),
	(3, 'Loyalty Award (25 yrs)', 'division', 1),
	(4, 'Service Award (10 yrs)', 'division', 1);

-- Dumping structure for table deped_hrmis.rr_call_nominations
CREATE TABLE IF NOT EXISTS `rr_call_nominations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `call_id` int NOT NULL,
  `nominee_user_id` int DEFAULT NULL,
  `nominee_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nominee_category` enum('teaching','teaching_related','non_teaching') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nominated_by_label` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nominated_by_user_id` int DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `status` enum('pending_review','under_evaluation','advanced','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_review',
  `deliberation_status` enum('pending','approved','on_hold','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `final_rank` int DEFAULT NULL,
  `finalized_at` datetime DEFAULT NULL,
  `finalized_by` int DEFAULT NULL,
  `is_flagged` tinyint(1) NOT NULL DEFAULT '0',
  `flagged_note` text COLLATE utf8mb4_unicode_ci,
  `flagged_at` datetime DEFAULT NULL,
  `flagged_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rcn_call` (`call_id`),
  KEY `fk_rcn_nominee_user` (`nominee_user_id`),
  KEY `fk_rcn_nominated_by` (`nominated_by_user_id`),
  KEY `fk_rcn_flagged_by` (`flagged_by`),
  KEY `fk_rcn_finalized_by` (`finalized_by`),
  KEY `idx_rcn_status` (`status`),
  KEY `idx_rcn_deliberation_status` (`deliberation_status`),
  CONSTRAINT `fk_rcn_call` FOREIGN KEY (`call_id`) REFERENCES `rr_nomination_calls` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rcn_finalized_by` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rcn_flagged_by` FOREIGN KEY (`flagged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rcn_nominated_by` FOREIGN KEY (`nominated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rcn_nominee_user` FOREIGN KEY (`nominee_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_call_nominations: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.rr_call_nomination_documents
CREATE TABLE IF NOT EXISTS `rr_call_nomination_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_id` int NOT NULL,
  `requirement_id` int DEFAULT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_label` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rcnd_nomination` (`nomination_id`),
  KEY `fk_rcnd_requirement` (`requirement_id`),
  CONSTRAINT `fk_rcnd_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rcnd_requirement` FOREIGN KEY (`requirement_id`) REFERENCES `rr_award_document_requirements` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_call_nomination_documents: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.rr_ceremonies
CREATE TABLE IF NOT EXISTS `rr_ceremonies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_call_id` int NOT NULL,
  `ceremony_datetime` datetime DEFAULT NULL,
  `venue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `program_theme` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `master_of_ceremonies_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rrceremo_nomination_call` (`nomination_call_id`),
  KEY `idx_rrceremo_moc` (`master_of_ceremonies_id`),
  CONSTRAINT `fk_rrceremo_moc` FOREIGN KEY (`master_of_ceremonies_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rrceremo_nomination_call` FOREIGN KEY (`nomination_call_id`) REFERENCES `rr_nomination_calls` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_ceremonies: ~1 rows (approximately)
INSERT INTO `rr_ceremonies` (`id`, `nomination_call_id`, `ceremony_datetime`, `venue`, `program_theme`, `master_of_ceremonies_id`, `created_at`, `updated_at`) VALUES
	(1, 1, '2026-07-09 19:15:00', 'jrmsu main camous', 'abasta', 11, '2026-07-18 14:37:48', '2026-07-18 15:15:29');

-- Dumping structure for table deped_hrmis.rr_ceremony
CREATE TABLE IF NOT EXISTS `rr_ceremony` (
  `id` int NOT NULL AUTO_INCREMENT,
  `search_id` int NOT NULL,
  `ceremony_date` date NOT NULL,
  `venue` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `program_of_activities` text COLLATE utf8mb4_unicode_ci,
  `guest_of_honor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photos_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rrc_search` (`search_id`),
  CONSTRAINT `fk_rrc_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_ceremony: ~0 rows (approximately)
INSERT INTO `rr_ceremony` (`id`, `search_id`, `ceremony_date`, `venue`, `program_of_activities`, `guest_of_honor`, `photos_path`, `created_at`) VALUES
	(1, 1, '2026-07-01', 'SDO Dapitan City Gymnasium', 'Opening remarks, awarding ceremony, closing program', 'Schools Division Superintendent', NULL, '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.rr_ceremony_photos
CREATE TABLE IF NOT EXISTS `rr_ceremony_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ceremony_id` int NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rrcph_ceremony` (`ceremony_id`),
  KEY `idx_rrcph_uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_rrcph_ceremony` FOREIGN KEY (`ceremony_id`) REFERENCES `rr_ceremonies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrcph_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_ceremony_photos: ~5 rows (approximately)
INSERT INTO `rr_ceremony_photos` (`id`, `ceremony_id`, `file_path`, `uploaded_at`, `uploaded_by`) VALUES
	(1, 1, 'uploads/rr/ceremony-photos/CEREMONY-1784387670220-912692024.png', '2026-07-18 23:14:30', 1),
	(2, 1, 'uploads/rr/ceremony-photos/CEREMONY-1784387679417-716787670.jpg', '2026-07-18 23:14:39', 1),
	(3, 1, 'uploads/rr/ceremony-photos/CEREMONY-1784387686036-582231140.png', '2026-07-18 23:14:46', 1),
	(4, 1, 'uploads/rr/ceremony-photos/CEREMONY-1784387686051-125033022.jpg', '2026-07-18 23:14:46', 1),
	(5, 1, 'uploads/rr/ceremony-photos/CEREMONY-1784387686054-708298683.jpg', '2026-07-18 23:14:46', 1);

-- Dumping structure for table deped_hrmis.rr_deliberation_notes
CREATE TABLE IF NOT EXISTS `rr_deliberation_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_id` int NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_selected` tinyint(1) NOT NULL DEFAULT '0',
  `selected_by` int DEFAULT NULL,
  `selected_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rrdn_nomination` (`nomination_id`),
  KEY `idx_rrdn_selected_by` (`selected_by`),
  CONSTRAINT `fk_rrdn_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrdn_user` FOREIGN KEY (`selected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_deliberation_notes: ~0 rows (approximately)
INSERT INTO `rr_deliberation_notes` (`id`, `nomination_id`, `notes`, `is_selected`, `selected_by`, `selected_at`) VALUES
	(1, 1, 'Panel unanimously endorses nominee based on strong evaluation scores', 1, 3, '2026-06-20 10:00:00');

-- Dumping structure for table deped_hrmis.rr_deliberation_votes
CREATE TABLE IF NOT EXISTS `rr_deliberation_votes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_id` int NOT NULL,
  `committee_member_id` int NOT NULL,
  `vote` enum('approve','hold','reject') COLLATE utf8mb4_unicode_ci NOT NULL,
  `voted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rdv_nomination_member` (`nomination_id`,`committee_member_id`),
  KEY `idx_rdv_nomination` (`nomination_id`),
  KEY `idx_rdv_member` (`committee_member_id`),
  CONSTRAINT `fk_rdv_member` FOREIGN KEY (`committee_member_id`) REFERENCES `rr_praise_committee_members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rdv_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_deliberation_votes: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.rr_evaluation_criteria
CREATE TABLE IF NOT EXISTS `rr_evaluation_criteria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `search_id` int NOT NULL,
  `position_type` enum('teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_label` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight_percent` decimal(5,2) NOT NULL,
  `max_score` decimal(8,2) NOT NULL DEFAULT '100.00',
  `description` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_rrec_search` (`search_id`),
  CONSTRAINT `fk_rrec_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_evaluation_criteria: ~0 rows (approximately)
INSERT INTO `rr_evaluation_criteria` (`id`, `search_id`, `position_type`, `criterion_label`, `weight_percent`, `max_score`, `description`, `sort_order`) VALUES
	(1, 1, 'teaching', 'Teaching Performance and Innovation', 40.00, 100.00, NULL, 1);

-- Dumping structure for table deped_hrmis.rr_evaluation_scores
CREATE TABLE IF NOT EXISTS `rr_evaluation_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_id` int NOT NULL,
  `criterion_id` int NOT NULL,
  `score_given` decimal(8,2) NOT NULL DEFAULT '0.00',
  `scored_by` int DEFAULT NULL,
  `scored_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rres` (`nomination_id`,`criterion_id`),
  KEY `idx_rres_criterion` (`criterion_id`),
  KEY `fk_rres_user` (`scored_by`),
  CONSTRAINT `fk_rres_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `rr_evaluation_criteria` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rres_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rres_user` FOREIGN KEY (`scored_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_evaluation_scores: ~0 rows (approximately)
INSERT INTO `rr_evaluation_scores` (`id`, `nomination_id`, `criterion_id`, `score_given`, `scored_by`, `scored_at`) VALUES
	(1, 1, 1, 92.00, 3, '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.rr_implementation_reports
CREATE TABLE IF NOT EXISTS `rr_implementation_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `search_id` int DEFAULT NULL,
  `nomination_call_id` int DEFAULT NULL,
  `generated_by` int DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total_nominees` int NOT NULL DEFAULT '0',
  `total_awardees` int NOT NULL DEFAULT '0',
  `teaching_awardees` int NOT NULL DEFAULT '0',
  `non_teaching_awardees` int NOT NULL DEFAULT '0',
  `report_data` json DEFAULT NULL,
  `narrative_report` text COLLATE utf8mb4_unicode_ci,
  `budget_allocated` decimal(10,2) DEFAULT NULL,
  `budget_utilized` decimal(10,2) DEFAULT NULL,
  `status` enum('draft','submitted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `submitted_at` datetime DEFAULT NULL,
  `submitted_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rrir_search` (`search_id`),
  UNIQUE KEY `uq_rrir_nomination_call` (`nomination_call_id`),
  KEY `fk_rrir_user` (`generated_by`),
  KEY `idx_rrir_nomination_call` (`nomination_call_id`),
  KEY `idx_rrir_submitted_by` (`submitted_by`),
  CONSTRAINT `fk_rrir_nomination_call` FOREIGN KEY (`nomination_call_id`) REFERENCES `rr_nomination_calls` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrir_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrir_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rrir_user` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_implementation_reports: ~1 rows (approximately)
INSERT INTO `rr_implementation_reports` (`id`, `search_id`, `nomination_call_id`, `generated_by`, `generated_at`, `total_nominees`, `total_awardees`, `teaching_awardees`, `non_teaching_awardees`, `report_data`, `narrative_report`, `budget_allocated`, `budget_utilized`, `status`, `submitted_at`, `submitted_by`) VALUES
	(1, 1, NULL, 1, '2026-07-06 05:04:17', 1, 1, 1, 0, '{"awards": [{"id": 1, "user_id": 5, "search_id": 1, "user_name": "Liza Fernandez", "awarded_at": "2026-06-30T16:00:00.000Z", "created_at": "2026-07-06T03:56:29.000Z", "is_awarded": 1, "award_level": "division", "award_title": "Outstanding Teacher - Elementary 2026", "category_id": 1, "school_year": "2025-2026", "announced_at": "2026-06-25T01:00:00.000Z", "search_title": "Search for Outstanding Teachers 2026", "category_name": "Outstanding Teacher - Elementary", "nomination_id": 1, "position_type": "teaching", "category_level": "division", "certificate_path": "/uploads/rr/certificates/1.pdf"}], "search": {"id": 1, "title": "Search for Outstanding Teachers 2026", "status": "announced", "created_at": "2026-07-06T03:56:29.000Z", "created_by": 2, "description": "Annual division-level search for outstanding teaching personnel", "school_year": "2025-2026", "search_type": "Outstanding Teacher", "ceremony_date": "2026-06-30T16:00:00.000Z", "evaluation_end": "2026-06-14T16:00:00.000Z", "nomination_end": "2026-05-30T16:00:00.000Z", "evaluation_start": "2026-05-31T16:00:00.000Z", "nomination_start": "2026-04-30T16:00:00.000Z", "target_position_type": "teaching"}, "by_level": {"division": 1}, "by_category": {"Outstanding Teacher - Elementary": 1}, "generated_at": "2026-07-06T05:04:17.816Z", "total_awardees": 1, "total_nominees": 1, "teaching_awardees": 1, "non_teaching_awardees": 0}', NULL, NULL, NULL, 'draft', NULL, NULL),
	(3, NULL, 1, NULL, '2026-07-18 15:30:52', 0, 0, 0, 0, NULL, NULL, NULL, NULL, 'draft', NULL, NULL);

-- Dumping structure for table deped_hrmis.rr_meeting_agenda_items
CREATE TABLE IF NOT EXISTS `rr_meeting_agenda_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `item_text` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_resolved` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mai_meeting` (`meeting_id`),
  CONSTRAINT `fk_mai_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `rr_praise_meetings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_meeting_agenda_items: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.rr_meeting_attendance
CREATE TABLE IF NOT EXISTS `rr_meeting_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `committee_member_id` int NOT NULL,
  `is_present` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ma_meeting_member` (`meeting_id`,`committee_member_id`),
  KEY `fk_ma_meeting` (`meeting_id`),
  KEY `fk_ma_member` (`committee_member_id`),
  CONSTRAINT `fk_ma_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `rr_praise_meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ma_member` FOREIGN KEY (`committee_member_id`) REFERENCES `rr_praise_committee_members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_meeting_attendance: ~2 rows (approximately)
INSERT INTO `rr_meeting_attendance` (`id`, `meeting_id`, `committee_member_id`, `is_present`) VALUES
	(1, 1, 2, 1),
	(2, 1, 1, 1);

-- Dumping structure for table deped_hrmis.rr_nominations
CREATE TABLE IF NOT EXISTS `rr_nominations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `search_id` int NOT NULL,
  `category_id` int NOT NULL,
  `nominee_id` int NOT NULL,
  `nominator_id` int DEFAULT NULL,
  `position_type` enum('teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL,
  `justification` text COLLATE utf8mb4_unicode_ci,
  `eligibility_status` enum('pending','eligible','ineligible') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `ineligibility_reason` text COLLATE utf8mb4_unicode_ci,
  `is_self_nomination` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nominee_category` (`nominee_id`,`category_id`),
  KEY `idx_rrn_search` (`search_id`),
  KEY `idx_rrn_category` (`category_id`),
  KEY `fk_rrn_nominator` (`nominator_id`),
  CONSTRAINT `fk_rrn_category` FOREIGN KEY (`category_id`) REFERENCES `rr_award_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrn_nominator` FOREIGN KEY (`nominator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rrn_nominee` FOREIGN KEY (`nominee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrn_search` FOREIGN KEY (`search_id`) REFERENCES `rr_searches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_nominations: ~0 rows (approximately)
INSERT INTO `rr_nominations` (`id`, `search_id`, `category_id`, `nominee_id`, `nominator_id`, `position_type`, `justification`, `eligibility_status`, `ineligibility_reason`, `is_self_nomination`, `created_at`) VALUES
	(1, 1, 1, 5, 2, 'teaching', 'Consistently rated Very Satisfactory to Outstanding with strong community engagement', 'eligible', NULL, 0, '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.rr_nomination_calls
CREATE TABLE IF NOT EXISTS `rr_nomination_calls` (
  `id` int NOT NULL AUTO_INCREMENT,
  `award_type_id` int NOT NULL,
  `eligible_category` enum('teaching','teaching_related','non_teaching') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomination_opens` date DEFAULT NULL,
  `nomination_closes` date DEFAULT NULL,
  `criteria_summary` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','published','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `published_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rnc_award_type` (`award_type_id`),
  KEY `fk_rnc_published_by` (`published_by`),
  CONSTRAINT `fk_rnc_award_type` FOREIGN KEY (`award_type_id`) REFERENCES `rr_award_types` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_rnc_published_by` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_nomination_calls: ~1 rows (approximately)
INSERT INTO `rr_nomination_calls` (`id`, `award_type_id`, `eligible_category`, `nomination_opens`, `nomination_closes`, `criteria_summary`, `status`, `published_at`, `published_by`, `created_at`, `updated_at`) VALUES
	(1, 2, 'teaching', '2026-07-18', '2026-07-31', 'sjdaoeidjaoidhaoefhao', 'published', '2026-07-18 22:37:01', 1, '2026-07-18 14:37:01', '2026-07-18 14:37:01');

-- Dumping structure for table deped_hrmis.rr_nomination_documents
CREATE TABLE IF NOT EXISTS `rr_nomination_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_id` int NOT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_by` int DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rrnd_nomination` (`nomination_id`),
  KEY `fk_rrnd_user` (`uploaded_by`),
  CONSTRAINT `fk_rrnd_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rrnd_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_nomination_documents: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.rr_praise_committee_members
CREATE TABLE IF NOT EXISTS `rr_praise_committee_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `role_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_pcm_user` (`user_id`),
  CONSTRAINT `fk_pcm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_praise_committee_members: ~2 rows (approximately)
INSERT INTO `rr_praise_committee_members` (`id`, `user_id`, `role_label`, `is_active`) VALUES
	(1, 11, 'Schools Division Superintendent', 1),
	(2, 12, 'OIC - Assistant Schools Division Superintendent', 1);

-- Dumping structure for table deped_hrmis.rr_praise_meetings
CREATE TABLE IF NOT EXISTS `rr_praise_meetings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `meeting_date` datetime DEFAULT NULL,
  `venue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presiding_officer_id` int DEFAULT NULL,
  `presiding_officer_other` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','finalized') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `minutes` text COLLATE utf8mb4_unicode_ci,
  `finalized_at` datetime DEFAULT NULL,
  `finalized_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pm_presiding` (`presiding_officer_id`),
  KEY `fk_pm_finalized_by` (`finalized_by`),
  CONSTRAINT `fk_pm_finalized_by` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pm_presiding` FOREIGN KEY (`presiding_officer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_praise_meetings: ~1 rows (approximately)
INSERT INTO `rr_praise_meetings` (`id`, `meeting_date`, `venue`, `presiding_officer_id`, `presiding_officer_other`, `status`, `minutes`, `finalized_at`, `finalized_by`, `created_at`, `updated_at`) VALUES
	(1, '2026-07-18 22:34:00', 'Conference room', NULL, 'memememe', 'finalized', 'wduqhduheduhqeduijeqdieduaheuidauidhaei', '2026-07-18 23:12:57', 1, '2026-07-11 07:53:59', '2026-07-18 15:12:57');

-- Dumping structure for table deped_hrmis.rr_searches
CREATE TABLE IF NOT EXISTS `rr_searches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `school_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `search_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_position_type` enum('all','teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `nomination_start` date DEFAULT NULL,
  `nomination_end` date DEFAULT NULL,
  `evaluation_start` date DEFAULT NULL,
  `evaluation_end` date DEFAULT NULL,
  `ceremony_date` date DEFAULT NULL,
  `status` enum('draft','open','evaluation','deliberation','announced','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rrs_created_by` (`created_by`),
  CONSTRAINT `fk_rrs_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_searches: ~0 rows (approximately)
INSERT INTO `rr_searches` (`id`, `title`, `description`, `school_year`, `search_type`, `target_position_type`, `nomination_start`, `nomination_end`, `evaluation_start`, `evaluation_end`, `ceremony_date`, `status`, `created_by`, `created_at`) VALUES
	(1, 'Search for Outstanding Teachers 2026', 'Annual division-level search for outstanding teaching personnel', '2025-2026', 'Outstanding Teacher', 'teaching', '2026-05-01', '2026-05-31', '2026-06-01', '2026-06-15', '2026-07-01', 'announced', 2, '2026-07-06 03:56:29');

-- Dumping structure for table deped_hrmis.rr_validation_criteria
CREATE TABLE IF NOT EXISTS `rr_validation_criteria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `award_type_id` int NOT NULL,
  `criterion_label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight_percent` decimal(5,2) NOT NULL,
  `max_raw_score` decimal(5,2) NOT NULL DEFAULT '10.00',
  `display_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_rvc_award_type` (`award_type_id`),
  CONSTRAINT `fk_rvc_award_type` FOREIGN KEY (`award_type_id`) REFERENCES `rr_award_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_validation_criteria: ~34 rows (approximately)
INSERT INTO `rr_validation_criteria` (`id`, `award_type_id`, `criterion_label`, `weight_percent`, `max_raw_score`, `display_order`) VALUES
	(1, 1, 'Academic Performance & Output', 40.00, 10.00, 1),
	(2, 1, 'Research & Publications', 15.00, 10.00, 2),
	(3, 1, 'Community Extension Services', 10.00, 10.00, 3),
	(4, 1, 'Student Performance & Feedback', 15.00, 10.00, 4),
	(5, 1, 'Co-Curricular & Administrative Involvement', 10.00, 10.00, 5),
	(6, 1, 'Professional Development & Trainings', 10.00, 10.00, 6),
	(7, 2, 'Job Performance & Output Quality', 35.00, 10.00, 1),
	(8, 2, 'Efficiency & Initiative', 20.00, 10.00, 2),
	(9, 2, 'Interpersonal & Communication Skills', 15.00, 10.00, 3),
	(10, 2, 'Adherence to Policies & Procedures', 15.00, 10.00, 4),
	(11, 2, 'Professional Development & Trainings', 15.00, 10.00, 5),
	(12, 3, 'Length of Service & Loyalty', 40.00, 10.00, 1),
	(13, 3, 'Consistent Performance Record', 30.00, 10.00, 2),
	(14, 3, 'Contribution to the Organization', 30.00, 10.00, 3),
	(15, 4, 'Length of Service & Loyalty', 40.00, 10.00, 1),
	(16, 4, 'Consistent Performance Record', 30.00, 10.00, 2),
	(17, 4, 'Contribution to the Organization', 30.00, 10.00, 3),
	(18, 1, 'Academic Performance & Output', 40.00, 10.00, 1),
	(19, 1, 'Research & Publications', 15.00, 10.00, 2),
	(20, 1, 'Community Extension Services', 10.00, 10.00, 3),
	(21, 1, 'Student Performance & Feedback', 15.00, 10.00, 4),
	(22, 1, 'Co-Curricular & Administrative Involvement', 10.00, 10.00, 5),
	(23, 1, 'Professional Development & Trainings', 10.00, 10.00, 6),
	(24, 2, 'Job Performance & Output Quality', 35.00, 10.00, 1),
	(25, 2, 'Efficiency & Initiative', 20.00, 10.00, 2),
	(26, 2, 'Interpersonal & Communication Skills', 15.00, 10.00, 3),
	(27, 2, 'Adherence to Policies & Procedures', 15.00, 10.00, 4),
	(28, 2, 'Professional Development & Trainings', 15.00, 10.00, 5),
	(29, 3, 'Length of Service & Loyalty', 40.00, 10.00, 1),
	(30, 3, 'Consistent Performance Record', 30.00, 10.00, 2),
	(31, 3, 'Contribution to the Organization', 30.00, 10.00, 3),
	(32, 4, 'Length of Service & Loyalty', 40.00, 10.00, 1),
	(33, 4, 'Consistent Performance Record', 30.00, 10.00, 2),
	(34, 4, 'Contribution to the Organization', 30.00, 10.00, 3);

-- Dumping structure for table deped_hrmis.rr_validation_interviews
CREATE TABLE IF NOT EXISTS `rr_validation_interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_id` int NOT NULL,
  `interview_notes` text COLLATE utf8mb4_unicode_ci,
  `weighted_total` decimal(6,2) NOT NULL DEFAULT '0.00',
  `status` enum('in_progress','saved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_progress',
  `last_saved_at` datetime DEFAULT NULL,
  `last_saved_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rvi_nomination` (`nomination_id`),
  KEY `idx_rvi_last_saved_by` (`last_saved_by`),
  CONSTRAINT `fk_rvi_last_saved_by` FOREIGN KEY (`last_saved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rvi_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_validation_interviews: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.rr_validation_scores
CREATE TABLE IF NOT EXISTS `rr_validation_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomination_id` int NOT NULL,
  `criterion_id` int NOT NULL,
  `raw_score` decimal(5,2) DEFAULT NULL,
  `scored_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rvs_nomination_criterion` (`nomination_id`,`criterion_id`),
  KEY `idx_rvs_nomination` (`nomination_id`),
  KEY `idx_rvs_criterion` (`criterion_id`),
  KEY `idx_rvs_scored_by` (`scored_by`),
  CONSTRAINT `fk_rvs_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `rr_validation_criteria` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rvs_nomination` FOREIGN KEY (`nomination_id`) REFERENCES `rr_call_nominations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rvs_scored_by` FOREIGN KEY (`scored_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rr_validation_scores: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.rsp_mqs_criteria
CREATE TABLE IF NOT EXISTS `rsp_mqs_criteria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int NOT NULL,
  `education` text COLLATE utf8mb4_unicode_ci,
  `training` text COLLATE utf8mb4_unicode_ci,
  `experience` text COLLATE utf8mb4_unicode_ci,
  `eligibility` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mqs_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_mqs_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.rsp_mqs_criteria: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.schools
CREATE TABLE IF NOT EXISTS `schools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.schools: ~2 rows (approximately)
INSERT INTO `schools` (`id`, `name`, `address`) VALUES
	(1, 'Dapitan City Central Elementary School', 'Barangay Poblacion, Dapitan City'),
	(2, 'Dapitan City National High School', 'Sicayab, Dapitan City');

-- Dumping structure for table deped_hrmis.schools_offices
CREATE TABLE IF NOT EXISTS `schools_offices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('school','office') COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_schools_offices_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=220 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.schools_offices: ~49 rows (approximately)
INSERT INTO `schools_offices` (`id`, `name`, `type`, `district`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'Dapitan City Central School', 'school', 'Dapitan City Central', 1, '2026-07-16 06:21:19', '2026-07-16 06:21:19'),
	(2, 'Ma. Cristina Elementary School', 'school', 'Dapitan City Central', 1, '2026-07-16 06:21:19', '2026-07-16 06:21:19'),
	(3, 'Capucao Primary School', 'school', 'Dapitan City Central', 1, '2026-07-16 06:21:19', '2026-07-16 06:21:19'),
	(4, 'Dapitan City Experimental Elementary School', 'school', 'Dapitan City Central', 1, '2026-07-16 06:21:19', '2026-07-16 06:21:19'),
	(5, 'Lawaan Elementary School', 'school', 'Dapitan City Central', 1, '2026-07-16 06:21:19', '2026-07-16 06:21:19'),
	(6, 'Polo Elementary School', 'school', 'Dapitan City Central', 1, '2026-07-16 06:21:19', '2026-07-16 06:21:19'),
	(7, 'Division Office', 'office', NULL, 1, '2026-07-16 06:21:19', '2026-07-16 06:21:19'),
	(8, 'SDO Dapitan City', 'office', NULL, 1, '2026-07-16 06:21:19', '2026-07-16 06:21:19'),
	(17, 'Baylimango Central School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(18, 'Carang Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(19, 'Banbanan Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(20, 'Canlucani Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(21, 'Kauswagan Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(22, 'Napo Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(23, 'Bacong Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(24, 'Oro Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(25, 'Guimputlan Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(26, 'Sto. Niño Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(27, 'Taguilon Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(28, 'Tag-ulo Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(29, 'Selinog Elementary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(30, 'Daro Primary School', 'school', 'Baylimango', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(31, 'Barcelona Central School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(32, 'Ba-ao Elementary School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(33, 'Burgos Elementary School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(34, 'Hilltop Elementary School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(35, 'Ilaya Elementary School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(36, 'Ma. Uray Elementary School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(37, 'Oyan Elementary School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(38, 'Tamion Elementary School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(39, 'Yabu Primary School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(40, 'Diwaan Elementary School', 'school', 'Barcelona', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(41, 'Potungan Central School', 'school', 'Potungan', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(42, 'Aseniero Elementary School', 'school', 'Potungan', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(43, 'Dampalan Elementary School', 'school', 'Potungan', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(44, 'Masidlakon Elementary School', 'school', 'Potungan', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(45, 'Opao Elementary School', 'school', 'Potungan', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(46, 'San Francisco Elementary School', 'school', 'Potungan', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(47, 'San Nicolas Elementary School', 'school', 'Potungan', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(48, 'Sigayan Elementary School', 'school', 'Potungan', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(49, 'Sulangon Central School', 'school', 'Sulangon', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(50, 'Aliguay Elementary School', 'school', 'Sulangon', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(51, 'Antipolo Elementary School', 'school', 'Sulangon', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(52, 'Larayan Elementary School', 'school', 'Sulangon', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(53, 'Liyang Elementary School', 'school', 'Sulangon', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(54, 'Owaon Elementary School', 'school', 'Sulangon', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(55, 'San Pedro Elementary School', 'school', 'Sulangon', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(56, 'San Vicente Elementary School', 'school', 'Sulangon', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(57, 'Sicayab Elementary School', 'school', 'Sulangon', 1, '2026-07-16 06:27:33', '2026-07-16 06:27:33'),
	(115, 'Dapitan City National High School', 'school', 'Secondary', 1, '2026-07-16 06:28:21', '2026-07-16 06:28:21'),
	(116, 'Oro National High School', 'school', 'Secondary', 1, '2026-07-16 06:28:21', '2026-07-16 06:28:21'),
	(117, 'Potungan National High School', 'school', 'Secondary', 1, '2026-07-16 06:28:21', '2026-07-16 06:28:21');

-- Dumping structure for table deped_hrmis.settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `office_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Schools Division Office of Dapitan City',
  `region` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Region IX – Zamboanga Peninsula',
  `contact_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '065-908-1234',
  `logo_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `doc_ref_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'SDO-OSDS-F001',
  `doc_rev` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '00',
  `doc_effectivity` date DEFAULT NULL,
  `office_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT 'Sunset Boulevard, Dawo, Dapitan City',
  `office_website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'www.depeddapitancity.net',
  `office_facebook` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.settings: ~1 rows (approximately)
INSERT INTO `settings` (`id`, `office_name`, `region`, `contact_number`, `logo_path`, `created_at`, `updated_at`, `doc_ref_code`, `doc_rev`, `doc_effectivity`, `office_address`, `office_website`, `office_facebook`) VALUES
	(1, 'Schools Division Office of Dapitan City', 'Region IX – Zamboanga Peninsula', '065-908-1234', NULL, '2026-07-06 03:55:41', '2026-07-06 03:55:41', 'SDO-OSDS-F001', '00', NULL, 'Sunset Boulevard, Dawo, Dapitan City', 'www.depeddapitancity.net', NULL);

-- Dumping structure for table deped_hrmis.signatories
CREATE TABLE IF NOT EXISTS `signatories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g. Schools Division Superintendent, Administrative Officer',
  `designation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Additional designation or office assignment',
  `signature_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Path to uploaded signature image: /uploads/signatories/SIG-{ts}-{rand}.{ext}',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.signatories: ~1 rows (approximately)
INSERT INTO `signatories` (`id`, `full_name`, `position`, `designation`, `signature_path`, `is_active`, `created_at`, `updated_at`) VALUES
	(2, 'Dr. Felix Romy A. Triambulo, CESO V', 'Schools Division Superintendent', 'Schools Division Office of Dapitan City', NULL, 1, '2026-07-20 05:54:03', '2026-07-20 05:54:03');

-- Dumping structure for table deped_hrmis.stage_history
CREATE TABLE IF NOT EXISTS `stage_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `stage_number` int NOT NULL,
  `status` enum('completed','in_progress','upcoming') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `completed_at` datetime DEFAULT NULL,
  `eta_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stage_history` (`application_id`,`stage_number`),
  CONSTRAINT `fk_stage_history_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.stage_history: ~14 rows (approximately)
INSERT INTO `stage_history` (`id`, `application_id`, `stage_number`, `status`, `completed_at`, `eta_label`, `updated_by`) VALUES
	(1, 1, 3, 'completed', '2026-07-11 15:03:15', NULL, 1),
	(2, 1, 6, 'completed', '2026-07-06 12:43:37', NULL, NULL),
	(3, 1, 8, 'completed', '2026-07-06 12:43:57', NULL, NULL),
	(4, 1, 9, 'completed', '2026-07-06 15:03:16', NULL, NULL),
	(5, 2, 3, 'completed', '2026-07-18 03:08:29', NULL, 1),
	(6, 2, 6, 'completed', '2026-07-06 15:02:38', NULL, NULL),
	(7, 2, 7, 'completed', '2026-07-06 15:03:00', NULL, NULL),
	(8, 2, 8, 'completed', '2026-07-06 15:03:08', NULL, NULL),
	(10, 2, 9, 'completed', '2026-07-18 01:25:25', NULL, NULL),
	(11, 2, 11, 'completed', '2026-07-06 15:20:32', NULL, NULL),
	(13, 4, 3, 'completed', '2026-07-11 15:03:38', NULL, 1),
	(18, 5, 3, 'completed', '2026-07-19 18:04:05', NULL, 1),
	(19, 5, 7, 'completed', '2026-07-19 18:03:07', NULL, NULL),
	(20, 5, 6, 'completed', '2026-07-19 17:12:03', NULL, NULL),
	(23, 5, 8, 'completed', '2026-07-19 18:03:24', NULL, NULL),
	(25, 5, 9, 'completed', '2026-07-20 12:30:25', NULL, NULL),
	(30, 5, 11, 'completed', '2026-07-21 12:24:07', NULL, NULL);

-- Dumping structure for table deped_hrmis.tna_answers
CREATE TABLE IF NOT EXISTS `tna_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `response_id` int NOT NULL,
  `question_id` int NOT NULL,
  `answer_text` text COLLATE utf8mb4_unicode_ci,
  `answer_rating` tinyint DEFAULT NULL,
  `answer_options` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tna_answers` (`response_id`,`question_id`),
  KEY `idx_tna_answers_question` (`question_id`),
  CONSTRAINT `fk_tna_answers_question` FOREIGN KEY (`question_id`) REFERENCES `tna_questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tna_answers_response` FOREIGN KEY (`response_id`) REFERENCES `tna_responses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.tna_answers: ~2 rows (approximately)
INSERT INTO `tna_answers` (`id`, `response_id`, `question_id`, `answer_text`, `answer_rating`, `answer_options`) VALUES
	(5, 2, 8, 'Yes i have and i also fix it', NULL, NULL);

-- Dumping structure for table deped_hrmis.tna_forms
CREATE TABLE IF NOT EXISTS `tna_forms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `school_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_position_type` enum('all','teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `status` enum('draft','active','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `deadline_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tna_forms_created_by` (`created_by`),
  CONSTRAINT `fk_tna_forms_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.tna_forms: ~0 rows (approximately)
INSERT INTO `tna_forms` (`id`, `title`, `description`, `school_year`, `target_position_type`, `status`, `deadline_date`, `created_by`, `created_at`) VALUES
	(1, '2026 Training Needs Assessment', 'Annual TNA for all division personnel', '2025-2026', 'teaching', 'active', '2026-08-14', 2, '2026-07-06 03:56:29'),
	(2, 'Intalling printer', 'NEED FOR TRAINEE', '2026-2027', 'non_teaching', 'active', '2026-07-05', 1, '2026-07-06 07:23:46'),
	(3, '2026 Classroom Pedagogy & Modern Teaching Skills TNA', 'Survey to identify training needs for teachers in innovative pedagogy, classroom management, and technology integration.', '2026', 'teaching', 'active', '2026-12-31', 1, '2026-07-06 08:55:16');

-- Dumping structure for table deped_hrmis.tna_questions
CREATE TABLE IF NOT EXISTS `tna_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `form_id` int NOT NULL,
  `question_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_type` enum('text','rating','multiple_choice','checkbox') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `options` json DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_tna_questions_form` (`form_id`),
  CONSTRAINT `fk_tna_questions_form` FOREIGN KEY (`form_id`) REFERENCES `tna_forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.tna_questions: ~6 rows (approximately)
INSERT INTO `tna_questions` (`id`, `form_id`, `question_text`, `question_type`, `options`, `category`, `is_required`, `sort_order`) VALUES
	(8, 2, 'Have ever encountered ink problem?', 'text', NULL, NULL, 1, 1),
	(9, 1, '', 'text', NULL, NULL, 1, 1),
	(10, 3, 'Rate your proficiency in designing interactive, student-centered lesson plans.', 'rating', NULL, 'Pedagogy', 1, 1),
	(11, 3, 'How often do you integrate digital tools (Google Workspace, Canva) in your daily classroom instruction?', 'rating', NULL, 'ICT Integration', 1, 2),
	(12, 3, 'Rate your confidence in applying positive classroom discipline techniques.', 'rating', NULL, 'Classroom Management', 1, 3),
	(13, 3, 'In what specific area do you require the most professional development support?', 'multiple_choice', '["Lesson Planning", "ICT Tools Integration", "Student Assessment & Evaluation", "Differentiated Instruction"]', 'General', 1, 4);

-- Dumping structure for table deped_hrmis.tna_responses
CREATE TABLE IF NOT EXISTS `tna_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `form_id` int NOT NULL,
  `user_id` int NOT NULL,
  `status` enum('draft','submitted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tna_responses` (`form_id`,`user_id`),
  KEY `idx_tna_responses_user` (`user_id`),
  CONSTRAINT `fk_tna_responses_form` FOREIGN KEY (`form_id`) REFERENCES `tna_forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tna_responses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.tna_responses: ~3 rows (approximately)
INSERT INTO `tna_responses` (`id`, `form_id`, `user_id`, `status`, `submitted_at`, `created_at`) VALUES
	(1, 1, 5, 'submitted', '2026-07-06 14:28:46', '2026-07-06 03:56:29'),
	(2, 2, 6, 'submitted', '2026-07-06 15:59:17', '2026-07-06 07:58:54'),
	(15, 3, 5, 'draft', NULL, '2026-07-06 08:55:16');

-- Dumping structure for table deped_hrmis.travel_authority_requests
CREATE TABLE IF NOT EXISTS `travel_authority_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `purpose` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `transport_mode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_expense` decimal(12,2) DEFAULT NULL,
  `supporting_file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `travel_order_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tar_employee` (`employee_id`),
  CONSTRAINT `fk_tar_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.travel_authority_requests: ~0 rows (approximately)
INSERT INTO `travel_authority_requests` (`id`, `employee_id`, `purpose`, `destination`, `date_from`, `date_to`, `transport_mode`, `estimated_expense`, `supporting_file_path`, `status`, `approved_by`, `approved_at`, `travel_order_path`, `rejection_reason`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Attend regional HR conference', 'Zamboanga City', '2026-08-10', '2026-08-12', 'Van', 5000.00, NULL, 'approved', 1, '2026-07-25 10:00:00', NULL, NULL, '2026-07-06 03:56:30', '2026-07-06 03:56:30');

-- Dumping structure for table deped_hrmis.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('applicant','staff','admin','hr_staff','hrmpsb','appointing_authority') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'applicant',
  `applicant_type` enum('teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.users: ~11 rows (approximately)
INSERT INTO `users` (`id`, `full_name`, `email`, `mobile`, `password`, `role`, `applicant_type`, `is_verified`, `created_at`) VALUES
	(1, 'Maria Santos', 'admin@depedhrmis.test', '09171234501', '$2b$10$0Tx60GKjGq27G1rU.eE./.sRNIq47s44A3LUSK8l3ZOK4xtJ7f0m6', 'admin', NULL, 1, '2026-07-06 03:56:28'),
	(2, 'Juan Dela Cruz', 'hrstaff@depedhrmis.test', '09171234502', '$2b$10$Q.rgXdpls6Dyyrz2DStwJOiWpNJ5jsgMLyPHN41b/MIboubwUu3dC', 'hr_staff', NULL, 1, '2026-07-06 03:56:28'),
	(3, 'Ana Reyes', 'hrmpsb@depedhrmis.test', '09171234503', '$2b$10$0Tx60GKjGq27G1rU.eE./.sRNIq47s44A3LUSK8l3ZOK4xtJ7f0m6', 'hrmpsb', NULL, 1, '2026-07-06 03:56:28'),
	(4, 'Roberto Lim', 'appointingauthority@depedhrmis.test', '09171234504', '$2b$10$0Tx60GKjGq27G1rU.eE./.sRNIq47s44A3LUSK8l3ZOK4xtJ7f0m6', 'appointing_authority', NULL, 1, '2026-07-06 03:56:28'),
	(5, 'Liza Fernandez', 'applicant.teaching@depedhrmis.test', '09171234505', '$2b$10$0Tx60GKjGq27G1rU.eE./.sRNIq47s44A3LUSK8l3ZOK4xtJ7f0m6', 'applicant', 'teaching', 1, '2026-07-06 03:56:28'),
	(6, 'Mark Villanueva', 'applicant.nonteaching@depedhrmis.test', '09171234506', '$2b$10$0Tx60GKjGq27G1rU.eE./.sRNIq47s44A3LUSK8l3ZOK4xtJ7f0m6', 'applicant', 'non_teaching', 1, '2026-07-06 03:56:28'),
	(7, 'Carmela Ocampo', 'staff@depedhrmis.test', '09171234507', '$2b$10$17qiIq1ptPxIIW5l.3DZNOxVWYJK9OIN4J.qS9K87LGmNdp7Ufe1y', 'staff', NULL, 1, '2026-07-06 03:56:28'),
	(9, 'Juan Santos', 'applicant.teaching2@depedhrmis.test', NULL, '$2b$10$HUdmaxAvgg1jhMXZX2pM4.zXfJKp1T8LaMzaef5RfvKiTmi3ghqxu', 'applicant', 'teaching', 1, '2026-07-06 09:02:45'),
	(10, 'jhustyn ', 'maxsonpuerto@gmail.com', '09123456789', '$2b$10$0Tx60GKjGq27G1rU.eE./.sRNIq47s44A3LUSK8l3ZOK4xtJ7f0m6', 'applicant', 'teaching_related', 1, '2026-07-09 21:26:02'),
	(11, 'Dr. Felix Romy A. Triambulo, CESO V', 'felix.triambulo@depeddapitan.test', NULL, '$2b$10$RI5h22eVdqUodTt5fSZNBeHO9a/QmADAvcUcgfDC1Z0w7yRUugRZK', 'staff', NULL, 1, '2026-07-18 14:55:08'),
	(12, 'Rosalio B. Conturno, Jr., PhD', 'rosalio.conturno@depeddapitan.test', NULL, '$2b$10$RI5h22eVdqUodTt5fSZNBeHO9a/QmADAvcUcgfDC1Z0w7yRUugRZK', 'staff', NULL, 1, '2026-07-18 14:55:08'),
	(13, 'judel', 'jakealthon123@gmail.com', '09123456789', '$2b$10$TPAahMLXCiNhjL0xx6pPaeQpHGXd0xIG5ZTWb1ouxSrUngxSFSpBC', 'applicant', NULL, 0, '2026-07-21 03:32:12');

-- Dumping structure for table deped_hrmis.vacancies
CREATE TABLE IF NOT EXISTS `vacancies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ref_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_grade` int DEFAULT NULL,
  `monthly_salary` decimal(10,2) DEFAULT NULL,
  `assigned_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_of_vacancies` int NOT NULL DEFAULT '1',
  `minimum_qualifications` text COLLATE utf8mb4_unicode_ci,
  `division_memo_file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posting_date` date DEFAULT NULL,
  `deadline_date` date DEFAULT NULL,
  `status` enum('active','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `previous_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `position_type` enum('teaching','non_teaching','teaching_related') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'teaching',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `publish_division_website` tinyint(1) NOT NULL DEFAULT '0',
  `publish_facebook` tinyint(1) NOT NULL DEFAULT '0',
  `publish_bulletin` tinyint(1) NOT NULL DEFAULT '0',
  `current_stage` int NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `assessment_submitted_at` timestamp NULL DEFAULT NULL,
  `shortlist_endorsed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vacancies_ref_no` (`ref_no`),
  KEY `idx_vacancies_status` (`status`),
  KEY `idx_vacancies_stage` (`current_stage`),
  KEY `fk_vacancies_deleted_by` (`deleted_by`),
  KEY `idx_vacancies_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_vacancies_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.vacancies: ~3 rows (approximately)
INSERT INTO `vacancies` (`id`, `ref_no`, `position_title`, `subject`, `item_number`, `salary_grade`, `monthly_salary`, `assigned_school`, `no_of_vacancies`, `minimum_qualifications`, `division_memo_file_path`, `posting_date`, `deadline_date`, `status`, `is_deleted`, `previous_status`, `deleted_at`, `deleted_by`, `position_type`, `is_featured`, `publish_division_website`, `publish_facebook`, `publish_bulletin`, `current_stage`, `created_by`, `assessment_submitted_at`, `shortlist_endorsed_at`, `created_at`, `updated_at`) VALUES
	(1, 'DCC-2026-001', 'Teacher I', 'Mathematics', NULL, 11, 27608.00, 'Dapitan City National High School', 1, 'BEED/BSED graduate with LET eligibility', NULL, '2026-06-01', '2026-06-30', 'closed', 0, NULL, NULL, NULL, 'teaching', 1, 1, 1, 0, 5, 2, '2026-07-06 04:43:37', NULL, '2026-07-06 03:56:28', '2026-07-13 01:06:18'),
	(2, 'V-2026-001', 'IT support', NULL, '001', 1, NULL, 'ICT Office', 1, 'ANY RELATED COURSE OR PROGRAM IN TECHNOLOGY', 'uploads/division-memos/MEMO-1783319982797-133095313.pdf', '2026-07-06', '2026-07-16', 'active', 0, NULL, NULL, NULL, 'non_teaching', 0, 1, 1, 1, 11, 1, '2026-07-06 07:02:38', NULL, '2026-07-06 06:39:42', '2026-07-13 01:06:15'),
	(3, 'V-2026-002', 'School Head', NULL, 'OSEC-DECSB-SH1-540001-2023', 11, NULL, 'Dapitan City Central School', 1, 'Experience', 'uploads/division-memos/MEMO-1783632650595-921182655.pdf', '2026-07-09', '2026-07-19', 'active', 0, 'active', NULL, NULL, 'teaching_related', 0, 1, 1, 1, 11, 1, '2026-07-19 09:12:03', NULL, '2026-07-09 21:30:50', '2026-07-21 04:24:07');

-- Dumping structure for table deped_hrmis.vacancy_required_documents
CREATE TABLE IF NOT EXISTS `vacancy_required_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_vrd_vacancy` (`vacancy_id`),
  CONSTRAINT `fk_vrd_vacancy` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table deped_hrmis.vacancy_required_documents: ~2 rows (approximately)
INSERT INTO `vacancy_required_documents` (`id`, `vacancy_id`, `document_type`, `is_mandatory`) VALUES
	(1, 1, 'Transcript of Records', 1),
	(2, 1, 'PRC License', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
