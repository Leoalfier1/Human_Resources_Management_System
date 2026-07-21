-- Migration 042: Fix AES application_id linkage + position-type application code format
-- ================================================================================
-- Context:
--   The applicant_eligibility_screening (AES) table originally had no application_id
--   column. It was added dynamically by db.js patch at startup. Existing AES rows
--   created before the column was added retained application_id=NULL, causing the
--   admin LEFT JOIN to never match (NULL != actual id). This migration documents
--   the data fix: UPDATE existing AES rows to link to their correct application_id.
--
--   Additionally, application reference numbers (ref_no) are changed from the old
--   format APP-{sequential}-{year} to a position-type prefix format:
--     Teaching:          T-{sequential}   (e.g. T-001, T-002)
--     Teaching-Related:  TR-{sequential}  (e.g. TR-001)
--     Non-Teaching:      NT-{sequential}  (e.g. NT-001)
--   Sequential numbers run across ALL vacancies and years per position type.

-- 1. Backfill AES application_id from matching applications.ref_no
--    (Already fixed manually; this documents the operation for reproducibility)
UPDATE applicant_eligibility_screening ae
JOIN applications a ON ae.application_code = a.ref_no
SET ae.application_id = a.id
WHERE ae.application_id IS NULL AND ae.application_code IS NOT NULL;

-- 2. Re-sync AES rows that have no matching application_code (fallback by name + vacancy)
--    Safeguard: only apply if exactly one applications row matches per AES row.
--    Ambiguous matches (multiple application rows for the same name+vacancy) are
--    skipped so we don't silently pick the wrong one.

-- 2a. Report ambiguous AES rows (more than one application match) — review manually
SELECT ae.id AS ambiguous_aes_id,
       ae.applicant_name,
       ae.vacancy_id,
       COUNT(*) AS match_count
FROM applicant_eligibility_screening ae
JOIN applications a ON ae.applicant_name = a.full_name AND ae.vacancy_id = a.vacancy_id
WHERE ae.application_id IS NULL
GROUP BY ae.id, ae.applicant_name, ae.vacancy_id
HAVING COUNT(*) > 1;

-- 2b. Update only AES rows that resolve to exactly one application
UPDATE applicant_eligibility_screening ae
JOIN (
  SELECT ae2.id AS ae_id, MIN(a.id) AS app_id
  FROM applicant_eligibility_screening ae2
  JOIN applications a ON ae2.applicant_name = a.full_name AND ae2.vacancy_id = a.vacancy_id
  WHERE ae2.application_id IS NULL
  GROUP BY ae2.id
  HAVING COUNT(*) = 1
) safe ON ae.id = safe.ae_id
SET ae.application_id = safe.app_id;
