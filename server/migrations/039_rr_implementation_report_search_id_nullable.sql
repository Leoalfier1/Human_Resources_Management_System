-- Migration 039: Make rr_implementation_reports.search_id nullable
-- Background: The legacy rr_searches-keyed INSERT requires search_id NOT NULL,
-- but the new cycle-based code only provides nomination_call_id. When getReport()
-- auto-creates a row with only nomination_call_id, MySQL rejects the INSERT
-- because search_id has no default and is NOT NULL.
-- Fix: MODIFY COLUMN search_id to allow NULL. The UNIQUE constraint still works
-- (MySQL treats multiple NULLs as distinct under UNIQUE).

-- Step 1: Capture BEFORE state
SELECT 'BEFORE migration:' AS info;
SELECT id, search_id, nomination_call_id FROM rr_implementation_reports;

-- Step 2: Apply schema change
ALTER TABLE rr_implementation_reports
  MODIFY COLUMN search_id int NULL;

-- Step 3: Confirm AFTER state (legacy row unchanged)
SELECT 'AFTER migration:' AS info;
SELECT id, search_id, nomination_call_id FROM rr_implementation_reports;

-- Step 4: Confirm column definition
SHOW COLUMNS FROM rr_implementation_reports WHERE Field = 'search_id';
