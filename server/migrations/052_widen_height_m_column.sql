-- 052: Widen height_m to allow realistic values (including cm-entry mistakes).
-- DECIMAL(3,2) = max 9.99 (too narrow). DECIMAL(4,2) = max 99.99.
ALTER TABLE personal_data_sheets MODIFY COLUMN height_m DECIMAL(4,2) DEFAULT NULL;
ALTER TABLE employees MODIFY COLUMN height_m DECIMAL(4,2) DEFAULT NULL;
