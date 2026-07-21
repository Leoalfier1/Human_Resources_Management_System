-- Migration 022: Extend leave_applications for CS Form 6 fields + two-level approval chain

-- ============================================================
-- 1. Expand leave_type ENUM (add 4 new types per CS Form 6)
-- ============================================================
ALTER TABLE `leave_applications`
  MODIFY COLUMN `leave_type` ENUM(
    'sick','vacation','special_privilege','maternity','paternity',
    'forced','study','rehabilitation','vawc','solo_parent',
    'special_benefits_women','special_emergency','adoption','others'
  ) NOT NULL;

-- ============================================================
-- 2. Expand status ENUM (add 'recommended' for two-level chain)
-- ============================================================
ALTER TABLE `leave_applications`
  MODIFY COLUMN `status` ENUM(
    'pending','recommended','approved','rejected','cancelled'
  ) NOT NULL DEFAULT 'pending';

-- ============================================================
-- 3. CS Form 6 detail fields (6.B + 6.D)
-- ============================================================
ALTER TABLE `leave_applications`
  ADD COLUMN `leave_details` VARCHAR(500) DEFAULT NULL
    COMMENT '6.B conditional detail: illness, location, study type, others spec' AFTER `reason`,
  ADD COLUMN `commutation` ENUM('requested','not_requested') NOT NULL DEFAULT 'not_requested'
    COMMENT '6.D commutation' AFTER `leave_details`;

-- ============================================================
-- 4. Two-level approval chain (7.B + 7.C/7.D)
-- ============================================================
ALTER TABLE `leave_applications`
  ADD COLUMN `recommended_by` INT DEFAULT NULL
    COMMENT 'First-level approver (hr_staff/admin) per 7.B' AFTER `approved_by`,
  ADD COLUMN `recommended_at` DATETIME DEFAULT NULL AFTER `recommended_by`,
  ADD COLUMN `recommendation_remark` TEXT DEFAULT NULL
    COMMENT '7.B: For disapproval due to [reason]' AFTER `recommended_at`,
  ADD COLUMN `final_action_by` INT DEFAULT NULL
    COMMENT 'Final approver (appointing_authority/admin) per 7.C/7.D' AFTER `recommendation_remark`,
  ADD COLUMN `signatory_id` INT DEFAULT NULL
    COMMENT 'Authorized official whose signature appears on the form (separate from final_action_by)' AFTER `final_action_by`,
  ADD COLUMN `final_action_at` DATETIME DEFAULT NULL AFTER `signatory_id`,
  ADD COLUMN `final_action_days_type` ENUM('with_pay','without_pay','others') DEFAULT NULL
    COMMENT '7.C: Approved for days with/without pay' AFTER `final_action_at`,
  ADD COLUMN `final_action_remark` TEXT DEFAULT NULL
    COMMENT '7.C others specify or 7.D disapproval reason' AFTER `final_action_days_type`;

-- ============================================================
-- 5. E-signature consent (timestamped, not hand-drawn)
-- ============================================================
ALTER TABLE `leave_applications`
  ADD COLUMN `esignature_consented` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `esignature_ip` VARCHAR(45) DEFAULT NULL,
  ADD COLUMN `esignature_timestamp` DATETIME DEFAULT NULL;
