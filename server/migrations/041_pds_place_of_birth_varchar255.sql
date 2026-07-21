-- 041: Widen place_of_birth from VARCHAR(150) to VARCHAR(255)
-- The user's input exceeded the 150-character limit (full address strings
-- like "Barangay San Roque, Dapitan City, Zamboanga del Norte, Region IX, Philippines").

SET SESSION sql_mode = '';
ALTER TABLE personal_data_sheets
  MODIFY COLUMN place_of_birth VARCHAR(255);
SET SESSION sql_mode = 'TRADITIONAL,NO_AUTO_VALUE_ON_ZERO,ONLY_FULL_GROUP_BY';
