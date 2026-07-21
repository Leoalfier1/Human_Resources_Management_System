-- Migration 029: Add document reference and office contact columns to settings table
-- Used by Annex E and other official letter generators to pull Doc Ref Code, Rev, Effectivity

ALTER TABLE `settings`
  ADD COLUMN IF NOT EXISTS `doc_ref_code` VARCHAR(50) DEFAULT 'SDO-OSDS-F001'
    COMMENT 'Document reference code shown in footer (e.g. SDO-OSDS-F001)',
  ADD COLUMN IF NOT EXISTS `doc_rev` VARCHAR(10) DEFAULT '00'
    COMMENT 'Document revision number',
  ADD COLUMN IF NOT EXISTS `doc_effectivity` DATE DEFAULT NULL
    COMMENT 'Date the current revision became effective',
  ADD COLUMN IF NOT EXISTS `office_address` VARCHAR(500) DEFAULT 'Sunset Boulevard, Dawo, Dapitan City'
    COMMENT 'Full office address for letterheads and footers',
  ADD COLUMN IF NOT EXISTS `office_website` VARCHAR(255) DEFAULT 'www.depeddapitancity.net'
    COMMENT 'Official website URL',
  ADD COLUMN IF NOT EXISTS `office_facebook` VARCHAR(255) DEFAULT NULL
    COMMENT 'Facebook page name or URL';
