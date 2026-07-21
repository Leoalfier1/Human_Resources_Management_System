-- ============================================================
-- Migration 035: Reconcile R&R schema drift
-- ============================================================
-- Documents columns that were added to the live DB outside the
-- migration system. Uses ADD COLUMN IF NOT EXISTS so it is
-- safe to re-run.

-- 1. rr_award_types: award_level was added to the live DB but
--    never documented in migration 011.
--    The live DB already has: award_level ENUM('school','division','regional','national')
--    This migration brings the migration history in sync.
ALTER TABLE `rr_award_types`
  ADD COLUMN IF NOT EXISTS `award_level`
    ENUM('school','division','regional','national') NOT NULL DEFAULT 'school';
