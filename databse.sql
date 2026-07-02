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
CREATE DATABASE IF NOT EXISTS `deped_hrmis` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `deped_hrmis`;

-- Dumping structure for table deped_hrmis.activity_log
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `applicant_id` int DEFAULT NULL,
  `actor_id` int DEFAULT NULL,
  `action_description` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vacancy_id` (`vacancy_id`),
  KEY `applicant_id` (`applicant_id`),
  KEY `actor_id` (`actor_id`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `activity_log_ibfk_2` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `activity_log_ibfk_3` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.activity_log: ~13 rows (approximately)
INSERT INTO `activity_log` (`id`, `vacancy_id`, `applicant_id`, `actor_id`, `action_description`, `created_at`) VALUES
	(1, 1, NULL, 7, 'New vacancy posted: teacher (V-2026-001)', '2026-06-25 01:34:56'),
	(2, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:34:44'),
	(3, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:35:12'),
	(4, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:35:13'),
	(5, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:35:13'),
	(6, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:35:13'),
	(7, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:35:14'),
	(8, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:35:14'),
	(9, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:35:14'),
	(10, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:35:14'),
	(11, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:46:02'),
	(12, 1, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-25 06:46:47'),
	(13, 1, NULL, 7, 'Comparative assessment results posted for V-2026-001', '2026-06-25 06:48:19'),
	(14, 1, NULL, 7, 'Shortlist finalized - top 1 endorsed to SDS', '2026-06-25 07:49:24'),
	(15, 2, NULL, 7, 'New vacancy posted: teacher II (Mathematics) (V-2026-002)', '2026-06-27 05:41:15'),
	(16, 2, NULL, 6, 'New application submitted for teacher II (Mathematics) (APP-002-2026) by undefined', '2026-06-27 06:23:45'),
	(17, 2, NULL, 7, 'Comparative Assessment finalized and submitted to SDS.', '2026-06-27 14:07:40'),
	(18, 1, NULL, 7, 'Congratulatory Advice issued to Leo alfier test for teacher', '2026-06-27 19:21:56'),
	(19, 2, NULL, 7, 'Comparative assessment results posted for V-2026-002', '2026-06-27 21:36:30'),
	(20, 2, NULL, 7, 'Shortlist finalized - top 1 endorsed to SDS', '2026-06-27 21:36:41'),
	(21, 1, NULL, 7, 'Congratulatory Advice issued to Leo alfier test for teacher', '2026-06-27 21:47:20'),
	(22, 1, NULL, 7, 'Congratulatory Advice issued to Leo alfier test for teacher', '2026-06-27 22:00:32'),
	(23, 1, NULL, 7, 'Congratulatory Advice issued to Leo alfier test for teacher', '2026-06-28 04:23:52');

-- Dumping structure for table deped_hrmis.applicants
CREATE TABLE IF NOT EXISTS `applicants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_code` varchar(50) DEFAULT NULL,
  `vacancy_id` int DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `id_number` varchar(100) DEFAULT NULL,
  `school_station` varchar(255) DEFAULT NULL,
  `date_submitted` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('submitted','under_evaluation','qualified','disqualified','shortlisted','selected','appointed') DEFAULT 'submitted',
  `qualified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `applicant_code` (`applicant_code`),
  KEY `status` (`status`),
  KEY `idx_app_vac` (`vacancy_id`),
  KEY `idx_app_status` (`status`),
  CONSTRAINT `applicants_ibfk_1` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.applicants: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.applicant_documents
CREATE TABLE IF NOT EXISTS `applicant_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `document_type` varchar(255) DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '1',
  `file_path` varchar(255) DEFAULT NULL,
  `verification_status` enum('not_uploaded','uploaded_pending_review','verified') DEFAULT 'not_uploaded',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `applicant_id` (`applicant_id`),
  CONSTRAINT `applicant_documents_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.applicant_documents: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.applicant_qualification_results
CREATE TABLE IF NOT EXISTS `applicant_qualification_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `criterion_id` int DEFAULT NULL,
  `passed` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `applicant_id` (`applicant_id`),
  KEY `criterion_id` (`criterion_id`),
  CONSTRAINT `applicant_qualification_results_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `applicant_qualification_results_ibfk_2` FOREIGN KEY (`criterion_id`) REFERENCES `minimum_qualifications_checklist` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.applicant_qualification_results: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.applications
CREATE TABLE IF NOT EXISTS `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int NOT NULL,
  `applicant_id` int NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `current_school` varchar(255) DEFAULT NULL,
  `years_experience` int DEFAULT '0',
  `status` enum('draft','submitted','under_review','qualified','disqualified','shortlisted','selected','appointed') DEFAULT 'draft',
  `ref_no` varchar(50) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `current_stage` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ref_no` (`ref_no`),
  KEY `vacancy_id` (`vacancy_id`),
  KEY `applicant_id` (`applicant_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`),
  CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.applications: ~2 rows (approximately)
INSERT INTO `applications` (`id`, `vacancy_id`, `applicant_id`, `full_name`, `email`, `phone`, `current_school`, `years_experience`, `status`, `ref_no`, `submitted_at`, `created_at`, `updated_at`, `current_stage`) VALUES
	(1, 1, 6, 'Leo alfier test', 'leoalfier68@gmail.com', '09123456789', 'dapitan', 5, 'selected', 'APP-001-2026', '2026-06-25 10:43:15', '2026-06-25 02:42:31', '2026-06-28 04:23:52', 9),
	(2, 2, 6, 'Leo alfier test', 'leoalfier68@gmail.com', '09123456789', 'jnfwnefuwen dw', 1, 'shortlisted', 'APP-002-2026', '2026-06-27 14:23:45', '2026-06-27 05:42:38', '2026-06-28 04:19:00', 8);

-- Dumping structure for table deped_hrmis.application_documents
CREATE TABLE IF NOT EXISTS `application_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `document_type` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `application_id` (`application_id`),
  CONSTRAINT `application_documents_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.application_documents: ~8 rows (approximately)
INSERT INTO `application_documents` (`id`, `application_id`, `document_type`, `file_name`, `file_path`, `uploaded_at`, `is_verified`) VALUES
	(1, 2, 'Personal Data Sheet (CS Form 212, latest revision)', 'MEMO-1782114061862-514796096.pdf', '/uploads/applications/a7babecc22c98c1f8eec1b15c5b08b3e', '2026-06-27 06:22:43', 0),
	(2, 2, 'Service Record (duly signed by authorized official)', 'MEMO-1782114043859-136431009.pdf', '/uploads/applications/fff5134f0e0a32b2b369fa70e7afc9b4', '2026-06-27 06:22:53', 0),
	(3, 2, 'Performance Evaluation Reports (last 3 rating periods)', 'MEMO-1782114063202-636681832.pdf', '/uploads/applications/fc9d8389b22507b6d2f8a32dad518d77', '2026-06-27 06:22:58', 0),
	(4, 2, 'Transcript of Records (certified true copy)', 'MEMO-1782114027347-687830402.pdf', '/uploads/applications/85f94fb18e4411d6e7bfeaf8a27ffebc', '2026-06-27 06:23:03', 0),
	(5, 2, 'LET Certificate / PRC ID (professional license)', 'MEMO-1782114043090-824494499.pdf', '/uploads/applications/af66f4e0f2e90480e10b18cb74a9ea77', '2026-06-27 06:23:08', 0),
	(6, 2, 'NBI Clearance (issued within the last 6 months)', 'MEMO-1782114062544-435769786.pdf', '/uploads/applications/5c6356823998be5bd007c8932d23cc85', '2026-06-27 06:23:14', 0),
	(7, 2, 'CSC MC 10 s. 2013 Omnibus Sworn Statement', 'MEMO-1782114071638-385232255.pdf', '/uploads/applications/575acf444f866775e6a0b323679c0387', '2026-06-27 06:23:18', 0),
	(8, 2, 'Medical Certificate (from government hospital)', 'MEMO-1782114063703-693905054.pdf', '/uploads/applications/40971587cfac689e21e2c992ab724ad5', '2026-06-27 06:23:23', 0),
	(9, 2, 'Certificates of Training / Seminars (relevant)', 'MEMO-1782114043859-136431009.pdf', '/uploads/applications/983f1a51812408a5bfbdf71b2d633485', '2026-06-27 06:23:28', 0);

-- Dumping structure for table deped_hrmis.appointments
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `vacancy_id` int DEFAULT NULL,
  `salary_grade` int DEFAULT NULL,
  `monthly_salary` decimal(10,2) DEFAULT NULL,
  `nature_of_appointment` enum('Permanent','Temporary','Provisional') DEFAULT 'Permanent',
  `issued_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `issued_by` int DEFAULT NULL,
  `notice_posted_at` timestamp NULL DEFAULT NULL,
  `notice_posting_deadline` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `applicant_id` (`applicant_id`),
  KEY `vacancy_id` (`vacancy_id`),
  KEY `issued_by` (`issued_by`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`),
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.appointments: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.appointment_documents
CREATE TABLE IF NOT EXISTS `appointment_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `document_type` varchar(255) NOT NULL,
  `is_required` tinyint(1) DEFAULT '1',
  `file_path` varchar(255) DEFAULT NULL,
  `verification_status` enum('not_uploaded','uploaded_pending_review','verified') DEFAULT 'not_uploaded',
  PRIMARY KEY (`id`),
  KEY `appointment_documents_ibfk_1` (`applicant_id`),
  CONSTRAINT `appointment_documents_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.appointment_documents: ~0 rows (approximately)
INSERT INTO `appointment_documents` (`id`, `applicant_id`, `document_type`, `is_required`, `file_path`, `verification_status`) VALUES
	(101, 1, 'Official Transcript of Records', 1, NULL, 'not_uploaded'),
	(102, 1, 'Original Diploma (BSEd)', 1, NULL, 'not_uploaded'),
	(103, 1, 'Updated Personal Data Sheet (CS Form 212)', 1, NULL, 'not_uploaded'),
	(104, 1, 'NBI Clearance (issued within 6 months)', 1, NULL, 'not_uploaded'),
	(105, 1, 'Medical Certificate (from government hospital)', 1, NULL, 'not_uploaded'),
	(106, 1, 'Dental Certificate', 1, NULL, 'not_uploaded'),
	(107, 1, '4 pcs. Passport-size ID photos (white background)', 1, NULL, 'not_uploaded'),
	(108, 1, 'Marriage Certificate (for married female)', 1, NULL, 'not_uploaded'),
	(109, 1, 'Authenticated Service Record', 1, NULL, 'not_uploaded'),
	(110, 1, 'Certificate of No Pending Administrative Case', 1, NULL, 'not_uploaded');

-- Dumping structure for table deped_hrmis.appointment_notice_postings
CREATE TABLE IF NOT EXISTS `appointment_notice_postings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appointment_id` int DEFAULT NULL,
  `channel` enum('division_website','facebook','bulletin_board') DEFAULT NULL,
  `posted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `posted_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `posted_by` (`posted_by`),
  CONSTRAINT `appointment_notice_postings_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointment_notice_postings_ibfk_2` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.appointment_notice_postings: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.appointment_required_documents
CREATE TABLE IF NOT EXISTS `appointment_required_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_type` varchar(255) NOT NULL,
  `is_mandatory` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.appointment_required_documents: ~9 rows (approximately)
INSERT INTO `appointment_required_documents` (`id`, `document_type`, `is_mandatory`) VALUES
	(1, 'Original/Authenticated Transcript of Records', 1),
	(2, 'Original/Authenticated BSEd/BSE Diploma', 1),
	(3, 'Updated Personal Data Sheet (CS Form 212)', 1),
	(4, 'NBI Clearance (issued within 6 months)', 1),
	(5, 'Medical Certificate (from government hospital)', 1),
	(6, 'Dental Certificate', 1),
	(7, '4 pcs. Passport-size ID photos', 1),
	(8, 'Authenticated Service Record', 1),
	(9, 'Certificate of No Pending Administrative Case', 1);

-- Dumping structure for table deped_hrmis.assessment_scores
CREATE TABLE IF NOT EXISTS `assessment_scores` (
  `application_id` int NOT NULL,
  `classroom_score` decimal(5,2) DEFAULT '0.00',
  `classroom_max` decimal(5,2) DEFAULT '60.00',
  `nonclassroom_score` decimal(5,2) DEFAULT '0.00',
  `nonclassroom_max` decimal(5,2) DEFAULT '20.00',
  `document_score` decimal(5,2) DEFAULT '0.00',
  `document_max` decimal(5,2) DEFAULT '20.00',
  `total_score` decimal(5,2) DEFAULT '0.00',
  `rank_position` int DEFAULT NULL,
  `rank_total` int DEFAULT NULL,
  PRIMARY KEY (`application_id`),
  CONSTRAINT `assessment_scores_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.assessment_scores: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.comparative_assessment_criteria
CREATE TABLE IF NOT EXISTS `comparative_assessment_criteria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `category` enum('classroom_observable','non_classroom_observable','document_evaluation') DEFAULT NULL,
  `sub_criterion_label` varchar(255) DEFAULT NULL,
  `weight_percent` decimal(5,2) DEFAULT NULL,
  `max_score` decimal(5,2) DEFAULT '5.00',
  PRIMARY KEY (`id`),
  KEY `vacancy_id` (`vacancy_id`),
  CONSTRAINT `comparative_assessment_criteria_ibfk_1` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.comparative_assessment_criteria: ~14 rows (approximately)
INSERT INTO `comparative_assessment_criteria` (`id`, `vacancy_id`, `category`, `sub_criterion_label`, `weight_percent`, `max_score`) VALUES
	(15, 2, 'classroom_observable', 'Content Knowledge and Pedagogy', 20.00, 5.00),
	(16, 2, 'classroom_observable', 'Learning Environment and Management', 15.00, 5.00),
	(17, 2, 'classroom_observable', 'Learner Diversity and Inclusion', 10.00, 5.00),
	(18, 2, 'classroom_observable', 'Curriculum and Planning', 15.00, 5.00),
	(19, 2, 'classroom_observable', 'Assessment and Reporting', 20.00, 5.00),
	(20, 2, 'classroom_observable', 'Community Linkages and Professional', 10.00, 5.00),
	(21, 2, 'classroom_observable', 'Personal Growth and Professional Dev.', 10.00, 5.00),
	(22, 2, 'non_classroom_observable', 'Behavioral Event Interview – Leadership', 25.00, 5.00),
	(23, 2, 'non_classroom_observable', 'Behavioral Event Interview – Communication', 25.00, 5.00),
	(24, 2, 'non_classroom_observable', 'Written Reflection – Self-Awareness', 15.00, 5.00),
	(25, 2, 'non_classroom_observable', 'Written Reflection – Problem-Solving', 15.00, 5.00),
	(26, 2, 'non_classroom_observable', 'Interpersonal Skills & Professionalism', 20.00, 5.00),
	(27, 2, 'document_evaluation', 'Education (Master\'s / Doctor\'s Degree)', 20.00, 10.00),
	(28, 2, 'document_evaluation', 'Training / Seminars (hrs)', 20.00, 10.00),
	(29, 2, 'document_evaluation', 'Experience (years in service)', 25.00, 10.00),
	(30, 2, 'document_evaluation', 'Performance Rating (last 3 ratings)', 25.00, 10.00),
	(31, 2, 'document_evaluation', 'Outstanding Accomplishments / Awards', 10.00, 10.00),
	(32, 2, 'classroom_observable', 'Content Knowledge and Pedagogy', 20.00, 5.00),
	(33, 2, 'classroom_observable', 'Learning Environment and Management', 15.00, 5.00),
	(34, 2, 'classroom_observable', 'Learner Diversity and Inclusion', 10.00, 5.00),
	(35, 2, 'classroom_observable', 'Curriculum and Planning', 15.00, 5.00),
	(36, 2, 'classroom_observable', 'Assessment and Reporting', 20.00, 5.00),
	(37, 2, 'classroom_observable', 'Community Linkages and Professional', 10.00, 5.00),
	(38, 2, 'classroom_observable', 'Personal Growth and Professional Dev.', 10.00, 5.00),
	(39, 2, 'non_classroom_observable', 'Behavioral Event Interview – Leadership', 25.00, 5.00),
	(40, 2, 'non_classroom_observable', 'Behavioral Event Interview – Communication', 25.00, 5.00),
	(41, 2, 'non_classroom_observable', 'Written Reflection – Self-Awareness', 15.00, 5.00),
	(42, 2, 'non_classroom_observable', 'Written Reflection – Problem-Solving', 15.00, 5.00),
	(43, 2, 'non_classroom_observable', 'Interpersonal Skills & Professionalism', 20.00, 5.00),
	(44, 2, 'document_evaluation', 'Education (Master\'s / Doctor\'s Degree)', 20.00, 10.00),
	(45, 2, 'document_evaluation', 'Training / Seminars (hrs)', 20.00, 10.00),
	(46, 2, 'document_evaluation', 'Experience (years in service)', 25.00, 10.00),
	(47, 2, 'document_evaluation', 'Performance Rating (last 3 ratings)', 25.00, 10.00),
	(48, 2, 'document_evaluation', 'Outstanding Accomplishments / Awards', 10.00, 10.00);

-- Dumping structure for table deped_hrmis.comparative_assessment_results
CREATE TABLE IF NOT EXISTS `comparative_assessment_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `category_subscore_classroom` decimal(5,2) DEFAULT NULL,
  `category_subscore_nonclassroom` decimal(5,2) DEFAULT NULL,
  `category_subscore_document` decimal(5,2) DEFAULT NULL,
  `total_score` decimal(5,2) DEFAULT NULL,
  `rank_val` int DEFAULT NULL,
  `is_qualified` tinyint(1) DEFAULT '0',
  `is_top5` tinyint(1) DEFAULT '0',
  `computed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_result_applicant` (`applicant_id`),
  CONSTRAINT `ca_results_app_fk` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.comparative_assessment_results: ~0 rows (approximately)
INSERT INTO `comparative_assessment_results` (`id`, `applicant_id`, `category_subscore_classroom`, `category_subscore_nonclassroom`, `category_subscore_document`, `total_score`, `rank_val`, `is_qualified`, `is_top5`, `computed_at`) VALUES
	(18, 2, 120.00, 36.00, 10.00, 166.00, NULL, 0, 0, '2026-06-27 21:36:16');

-- Dumping structure for table deped_hrmis.comparative_assessment_scores
CREATE TABLE IF NOT EXISTS `comparative_assessment_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `criterion_id` int DEFAULT NULL,
  `score_given` decimal(5,2) DEFAULT NULL,
  `scored_by` int DEFAULT NULL,
  `scored_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_applicant_criterion` (`applicant_id`,`criterion_id`),
  KEY `criterion_id` (`criterion_id`),
  CONSTRAINT `ca_scores_app_fk` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comparative_assessment_scores_ibfk_2` FOREIGN KEY (`criterion_id`) REFERENCES `comparative_assessment_criteria` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.comparative_assessment_scores: ~12 rows (approximately)
INSERT INTO `comparative_assessment_scores` (`id`, `applicant_id`, `criterion_id`, `score_given`, `scored_by`, `scored_at`) VALUES
	(24, 2, 15, 5.00, 7, '2026-06-27 21:33:56'),
	(25, 2, 16, 5.00, 7, '2026-06-27 21:34:02'),
	(26, 2, 17, 5.00, 7, '2026-06-27 21:34:05'),
	(27, 2, 18, 5.00, 7, '2026-06-27 21:34:08'),
	(28, 2, 19, 5.00, 7, '2026-06-27 21:34:12'),
	(29, 2, 20, 5.00, 7, '2026-06-27 21:34:15'),
	(30, 2, 21, 5.00, 7, '2026-06-27 21:34:19'),
	(31, 2, 38, 5.00, 7, '2026-06-27 21:34:28'),
	(32, 2, 37, 5.00, 7, '2026-06-27 21:34:31'),
	(33, 2, 36, 5.00, 7, '2026-06-27 21:34:42'),
	(34, 2, 35, 5.00, 7, '2026-06-27 21:34:46'),
	(35, 2, 34, 5.00, 7, '2026-06-27 21:34:49'),
	(36, 2, 33, 5.00, 7, '2026-06-27 21:34:52'),
	(37, 2, 32, 5.00, 7, '2026-06-27 21:34:58'),
	(38, 2, 22, 5.00, 7, '2026-06-27 21:35:06'),
	(39, 2, 23, 5.00, 7, '2026-06-27 21:35:10'),
	(40, 2, 24, 5.00, 7, '2026-06-27 21:35:13'),
	(41, 2, 25, 5.00, 7, '2026-06-27 21:35:17'),
	(42, 2, 26, 5.00, 7, '2026-06-27 21:35:20'),
	(43, 2, 39, 5.00, 7, '2026-06-27 21:35:23'),
	(44, 2, 40, 5.00, 7, '2026-06-27 21:35:26'),
	(45, 2, 41, 5.00, 7, '2026-06-27 21:35:30'),
	(46, 2, 42, 5.00, 7, '2026-06-27 21:35:38'),
	(47, 2, 27, 5.00, 7, '2026-06-27 21:35:44'),
	(48, 2, 28, 5.00, 7, '2026-06-27 21:35:47'),
	(49, 2, 29, 5.00, 7, '2026-06-27 21:35:51'),
	(50, 2, 30, 5.00, 7, '2026-06-27 21:35:53'),
	(51, 2, 31, 5.00, 7, '2026-06-27 21:36:16');

-- Dumping structure for table deped_hrmis.congratulatory_advices
CREATE TABLE IF NOT EXISTS `congratulatory_advices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `vacancy_id` int DEFAULT NULL,
  `place_of_assignment` varchar(255) DEFAULT NULL,
  `report_date` date DEFAULT NULL,
  `document_submission_deadline` date DEFAULT NULL,
  `appointing_authority_name` varchar(255) DEFAULT NULL,
  `letter_content` text,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vacancy_id` (`vacancy_id`),
  KEY `sent_by` (`sent_by`),
  KEY `congratulatory_advices_ibfk_1` (`applicant_id`),
  CONSTRAINT `congratulatory_advices_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `congratulatory_advices_ibfk_2` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`),
  CONSTRAINT `congratulatory_advices_ibfk_3` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.congratulatory_advices: ~0 rows (approximately)
INSERT INTO `congratulatory_advices` (`id`, `applicant_id`, `vacancy_id`, `place_of_assignment`, `report_date`, `document_submission_deadline`, `appointing_authority_name`, `letter_content`, `sent_at`, `sent_by`) VALUES
	(7, 1, 1, 'dapitan', '2026-06-30', '2026-07-04', 'Schools Division Superintendent', 'Congratulations! It is with great pleasure that I inform you of your selection for appointment to the position of teacher at dapitan, effective June 30, 2026.', '2026-06-27 19:21:56', 7),
	(8, 1, 1, 'dapitan', '2026-06-29', '2026-07-03', 'Schools Division Superintendent', 'Congratulations! It is with great pleasure that I inform you of your selection for appointment to the position of teacher at dapitan, effective June 29, 2026.', '2026-06-27 21:47:20', 7),
	(9, 1, 1, 'dapitan', '2026-06-29', '2026-07-03', 'Schools Division Superintendent', 'Congratulations! It is with great pleasure that I inform you of your selection for appointment to the position of teacher at dapitan, effective June 29, 2026.', '2026-06-27 22:00:32', 7),
	(10, 1, 1, 'dapitan', '2026-06-29', '2026-07-03', 'Schools Division Superintendent', 'Congratulations! It is with great pleasure that I inform you of your selection for appointment to the position of teacher at dapitan, effective June 29, 2026.', '2026-06-28 04:23:52', 7);

-- Dumping structure for table deped_hrmis.deliberation_notes
CREATE TABLE IF NOT EXISTS `deliberation_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicant_id` int DEFAULT NULL,
  `background_investigation_notes` text,
  `is_recommended` tinyint(1) DEFAULT '0',
  `recommended_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `recommended_by` (`recommended_by`),
  KEY `deliberation_notes_ibfk_1` (`applicant_id`),
  CONSTRAINT `deliberation_notes_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `deliberation_notes_ibfk_2` FOREIGN KEY (`recommended_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.deliberation_notes: ~5 rows (approximately)
INSERT INTO `deliberation_notes` (`id`, `applicant_id`, `background_investigation_notes`, `is_recommended`, `recommended_by`) VALUES
	(34, 1, NULL, 1, 7),
	(35, 1, NULL, 0, 7),
	(36, 1, NULL, 0, 7),
	(37, 1, NULL, 1, 7),
	(38, 1, NULL, 1, 7),
	(39, 2, NULL, 1, 7);

-- Dumping structure for table deped_hrmis.duties_responsibilities
CREATE TABLE IF NOT EXISTS `duties_responsibilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `label` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vacancy_id` (`vacancy_id`),
  CONSTRAINT `duties_responsibilities_ibfk_1` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.duties_responsibilities: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.minimum_qualifications_checklist
CREATE TABLE IF NOT EXISTS `minimum_qualifications_checklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `criterion_label` varchar(255) DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `vacancy_id` (`vacancy_id`),
  CONSTRAINT `minimum_qualifications_checklist_ibfk_1` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.minimum_qualifications_checklist: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `application_id` (`application_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.notifications: ~0 rows (approximately)
INSERT INTO `notifications` (`id`, `application_id`, `message`, `created_at`) VALUES
	(1, 1, 'Congratulations! You have been selected for teacher. Please review your appointment requirements.', '2026-06-28 04:23:52');

-- Dumping structure for table deped_hrmis.qualification_standards
CREATE TABLE IF NOT EXISTS `qualification_standards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `label` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vacancy_id` (`vacancy_id`),
  CONSTRAINT `qualification_standards_ibfk_1` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.qualification_standards: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.results_postings
CREATE TABLE IF NOT EXISTS `results_postings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `published_division_website` timestamp NULL DEFAULT NULL,
  `published_facebook` timestamp NULL DEFAULT NULL,
  `published_bulletin` timestamp NULL DEFAULT NULL,
  `published_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vacancy_id` (`vacancy_id`),
  KEY `published_by` (`published_by`),
  CONSTRAINT `results_postings_ibfk_1` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `results_postings_ibfk_2` FOREIGN KEY (`published_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.results_postings: ~0 rows (approximately)
INSERT INTO `results_postings` (`id`, `vacancy_id`, `published_division_website`, `published_facebook`, `published_bulletin`, `published_by`) VALUES
	(1, 1, '2026-06-25 06:48:19', '2026-06-25 06:48:19', '2026-06-25 06:48:19', 7),
	(2, 2, '2026-06-27 21:36:30', '2026-06-27 21:36:30', '2026-06-27 21:36:30', 7);

-- Dumping structure for table deped_hrmis.schools
CREATE TABLE IF NOT EXISTS `schools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.schools: ~0 rows (approximately)

-- Dumping structure for table deped_hrmis.settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `office_name` varchar(255) DEFAULT 'Schools Division Office of Dapitan City',
  `region` varchar(100) DEFAULT 'Region IX – Zamboanga Peninsula',
  `contact_number` varchar(50) DEFAULT '065-908-1234',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.settings: ~0 rows (approximately)
INSERT INTO `settings` (`id`, `office_name`, `region`, `contact_number`) VALUES
	(1, 'Schools Division Office of Dapitan City', 'Region IX – Zamboanga Peninsula', '065-908-1234');

-- Dumping structure for table deped_hrmis.stage_history
CREATE TABLE IF NOT EXISTS `stage_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_id` int NOT NULL,
  `stage_number` int NOT NULL,
  `status` enum('completed','in_progress','upcoming') DEFAULT 'upcoming',
  `completed_at` datetime DEFAULT NULL,
  `eta_label` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_id` (`application_id`,`stage_number`),
  CONSTRAINT `stage_history_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.stage_history: ~0 rows (approximately)
INSERT INTO `stage_history` (`id`, `application_id`, `stage_number`, `status`, `completed_at`, `eta_label`) VALUES
	(1, 2, 3, 'completed', '2026-06-28 12:19:00', NULL),
	(2, 2, 6, 'completed', '2026-06-28 12:19:00', NULL),
	(3, 2, 7, 'completed', '2026-06-28 12:19:00', NULL),
	(4, 2, 8, 'completed', '2026-06-28 12:19:00', NULL),
	(8, 1, 9, 'completed', '2026-06-28 12:23:52', NULL);

-- Dumping structure for table deped_hrmis.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('applicant','staff','admin') DEFAULT 'applicant',
  `is_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.users: ~3 rows (approximately)
INSERT INTO `users` (`id`, `full_name`, `email`, `mobile`, `password`, `role`, `is_verified`, `created_at`) VALUES
	(6, 'Leo alfier test', 'leoalfier68@gmail.com', '09123456789', '$2b$10$mobgUHZga2HbqqutOUk9peDLHrw9tkEoa0fuC0Sjx3r8Vq1lriv7W', 'applicant', 1, '2026-06-19 07:33:09'),
	(7, 'Leo Admin', 'leoalfierantipuesto394@gmail.com', '09123456789', '$2b$10$SxIQ0Y2nQaAWcisXMv1scO1B.0i/IkFPOiaKKIipb9U0yefHk82.m', 'admin', 1, '2026-06-20 03:21:38'),
	(9, 'cindi', 'oroscaxhyndylynne@gmail.com', '09123456789', '$2b$10$LVtdOJvFarfgqCWWEUIfyewnE4dNbFdghywcDULAFf2URxoXEHg6G', 'applicant', 0, '2026-06-23 02:22:14');

-- Dumping structure for table deped_hrmis.vacancies
CREATE TABLE IF NOT EXISTS `vacancies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ref_no` varchar(50) NOT NULL,
  `position_title` varchar(255) NOT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `item_number` varchar(100) DEFAULT NULL,
  `salary_grade` int DEFAULT NULL,
  `assigned_school` varchar(255) DEFAULT NULL,
  `no_of_vacancies` int DEFAULT '1',
  `minimum_qualifications` text,
  `division_memo_file_path` varchar(255) DEFAULT NULL,
  `posting_date` date DEFAULT NULL,
  `deadline_date` date DEFAULT NULL,
  `status` enum('active','closed') DEFAULT 'active',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `monthly_salary` decimal(10,2) DEFAULT NULL,
  `publish_division_website` tinyint(1) DEFAULT '0',
  `publish_facebook` tinyint(1) DEFAULT '0',
  `publish_bulletin` tinyint(1) DEFAULT '0',
  `current_stage` int DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assessment_submitted_at` timestamp NULL DEFAULT NULL,
  `shortlist_endorsed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ref_no` (`ref_no`),
  KEY `status` (`status`),
  KEY `current_stage` (`current_stage`),
  KEY `idx_vac_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.vacancies: ~1 rows (approximately)
INSERT INTO `vacancies` (`id`, `ref_no`, `position_title`, `subject`, `item_number`, `salary_grade`, `assigned_school`, `no_of_vacancies`, `minimum_qualifications`, `division_memo_file_path`, `posting_date`, `deadline_date`, `status`, `is_featured`, `monthly_salary`, `publish_division_website`, `publish_facebook`, `publish_bulletin`, `current_stage`, `created_by`, `created_at`, `assessment_submitted_at`, `shortlist_endorsed_at`) VALUES
	(1, 'V-2026-001', 'teacher', NULL, '12345', 1, 'dapitan', 1, 'lpt', 'uploads/division-memos/MEMO-1782351296361-570843733.pdf', '2026-06-25', '2026-07-05', 'active', 0, NULL, 1, 1, 1, 9, 7, '2026-06-25 01:34:56', '2026-06-25 06:46:47', NULL),
	(2, 'V-2026-002', 'teacher II (Mathematics)', NULL, '12343', 10, 'DCNHS', 1, 'lpt', 'uploads/division-memos/MEMO-1782538875291-873683370.pdf', '2026-06-27', '2026-07-07', 'active', 0, NULL, 1, 1, 1, 9, 7, '2026-06-27 05:41:15', '2026-06-27 14:07:40', NULL);

-- Dumping structure for table deped_hrmis.vacancy_required_documents
CREATE TABLE IF NOT EXISTS `vacancy_required_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vacancy_id` int DEFAULT NULL,
  `document_type` varchar(255) NOT NULL,
  `is_mandatory` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `vacancy_id` (`vacancy_id`),
  CONSTRAINT `vacancy_required_documents_ibfk_1` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table deped_hrmis.vacancy_required_documents: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
