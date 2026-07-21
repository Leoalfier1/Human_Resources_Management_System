-- ============================================================
-- Migration 037: Add UNIQUE constraint to rr_implementation_reports
-- ============================================================
-- nomination_call_id should uniquely identify a report per call,
-- matching the pattern of the legacy search_id column which has
-- a UNIQUE constraint.
-- Verified: zero duplicate rows exist in the live table.

CREATE UNIQUE INDEX `uq_rrir_nomination_call` ON `rr_implementation_reports` (`nomination_call_id`);
