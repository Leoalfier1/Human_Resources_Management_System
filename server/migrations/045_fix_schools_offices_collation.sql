-- Migration 045: Fix schools_offices collation mismatch
-- Problem: schools_offices uses utf8mb4_0900_ai_ci (MySQL 8 server default)
--          while all other core tables use utf8mb4_unicode_ci (project standard).
--          This causes "Illegal mix of collations" errors when JOINing
--          schools_offices.name with vacancies.assigned_school.
-- Fix: Convert table + all varchar/text columns to utf8mb4_unicode_ci.

ALTER TABLE schools_offices
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
