-- ============================================================
-- BACKFILL: minimum_qualifications_checklist from rsp_mqs_criteria
-- Run this ONCE via HeidiSQL after deploying the code changes.
--
-- For every vacancy that has a rsp_mqs_criteria row but NO
-- minimum_qualifications_checklist rows, this script creates
-- the 4 real checklist rows so Initial Evaluation works.
-- ============================================================

-- Preview first (safe SELECT — won't modify anything)
SELECT
    r.vacancy_id,
    v.ref_no,
    v.position_title,
    r.education,
    r.training,
    r.experience,
    r.eligibility
FROM rsp_mqs_criteria r
JOIN vacancies v ON v.id = r.vacancy_id
WHERE NOT EXISTS (
    SELECT 1 FROM minimum_qualifications_checklist m
    WHERE m.vacancy_id = r.vacancy_id
);

-- ──────────────────────────────────────────────────────────────
-- Run the INSERT after confirming the preview above looks correct.
-- Uses a stored procedure to loop per vacancy.
-- ──────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS backfill_mqs_checklist;

DELIMITER //

CREATE PROCEDURE backfill_mqs_checklist()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id INT;
    DECLARE v_edu TEXT;
    DECLARE v_train TEXT;
    DECLARE v_exp TEXT;
    DECLARE v_elig TEXT;
    DECLARE lbl VARCHAR(255);

    DECLARE cur CURSOR FOR
        SELECT r.vacancy_id, r.education, r.training, r.experience, r.eligibility
        FROM rsp_mqs_criteria r
        WHERE NOT EXISTS (
            SELECT 1 FROM minimum_qualifications_checklist m
            WHERE m.vacancy_id = r.vacancy_id
        );

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_id, v_edu, v_train, v_exp, v_elig;
        IF done THEN LEAVE read_loop; END IF;

        -- Education
        SET lbl = IF(TRIM(COALESCE(v_edu, '')) = '', 'Education', CONCAT('Education: ', TRIM(v_edu)));
        INSERT INTO minimum_qualifications_checklist (vacancy_id, criterion_label, is_required)
        VALUES (v_id, lbl, 1);

        -- Experience
        SET lbl = IF(TRIM(COALESCE(v_exp, '')) = '', 'Experience', CONCAT('Experience: ', TRIM(v_exp)));
        INSERT INTO minimum_qualifications_checklist (vacancy_id, criterion_label, is_required)
        VALUES (v_id, lbl, 1);

        -- Training
        SET lbl = IF(TRIM(COALESCE(v_train, '')) = '', 'Training', CONCAT('Training: ', TRIM(v_train)));
        INSERT INTO minimum_qualifications_checklist (vacancy_id, criterion_label, is_required)
        VALUES (v_id, lbl, 1);

        -- Eligibility
        SET lbl = IF(TRIM(COALESCE(v_elig, '')) = '', 'Eligibility', CONCAT('Eligibility: ', TRIM(v_elig)));
        INSERT INTO minimum_qualifications_checklist (vacancy_id, criterion_label, is_required)
        VALUES (v_id, lbl, 1);

    END LOOP;

    CLOSE cur;
END //

DELIMITER ;

-- Execute the backfill
CALL backfill_mqs_checklist();

-- Clean up
DROP PROCEDURE IF EXISTS backfill_mqs_checklist;

-- ──────────────────────────────────────────────────────────────
-- Verification: confirm every rsp_mqs_criteria vacancy now has checklist rows
-- ──────────────────────────────────────────────────────────────

SELECT
    r.vacancy_id,
    v.ref_no,
    (SELECT COUNT(*) FROM minimum_qualifications_checklist m WHERE m.vacancy_id = r.vacancy_id) AS checklist_row_count
FROM rsp_mqs_criteria r
JOIN vacancies v ON v.id = r.vacancy_id;
-- Expected: checklist_row_count = 4 for every row
