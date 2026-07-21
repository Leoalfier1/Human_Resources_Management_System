-- ============================================================
-- Migration 036: Add indexes to rr_call_nominations
-- ============================================================
-- These columns are heavily filtered in R&R controllers:
--   status: filtered by 'advanced', 'pending_review', etc.
--   deliberation_status: filtered by 'approved' in multiple stages.

CREATE INDEX `idx_rcn_status` ON `rr_call_nominations` (`status`);
CREATE INDEX `idx_rcn_deliberation_status` ON `rr_call_nominations` (`deliberation_status`);
