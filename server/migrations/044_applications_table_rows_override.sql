-- 044: Add table_rows_override JSON column to applications
-- Stores admin-edited Annex E QS evaluation table rows as JSON.
-- When NULL, buildAnnexEPayload auto-derives rows from MQ checklist + AQR + PDS.

ALTER TABLE applications
  ADD COLUMN `table_rows_override` JSON DEFAULT NULL
  AFTER `letter_date`;
