-- 026_pds_image_columns.sql
-- Add photo, signature, and thumbmark image paths to personal_data_sheets.
-- These are uploaded separately via multer (not part of the JSON body PATCH).

ALTER TABLE personal_data_sheets
    ADD COLUMN photo_path     VARCHAR(500) DEFAULT NULL AFTER date_accomplished,
    ADD COLUMN signature_path VARCHAR(500) DEFAULT NULL AFTER photo_path,
    ADD COLUMN thumbmark_path VARCHAR(500) DEFAULT NULL AFTER signature_path;
