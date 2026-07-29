-- 054: Add `source` column to ld_programs and ld_plans for ownership tracking.
--      Values: 'plans' (old module), 'portal' (new portal).

ALTER TABLE ld_programs
    ADD COLUMN source VARCHAR(50) DEFAULT 'plans';

ALTER TABLE ld_plans
    ADD COLUMN source VARCHAR(50) DEFAULT 'plans';
