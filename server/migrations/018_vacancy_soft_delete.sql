-- 018: Add soft-delete support to vacancies table
-- Adds is_deleted, deleted_at, deleted_by, previous_status columns

ALTER TABLE `vacancies`
    ADD COLUMN `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`,
    ADD COLUMN `previous_status` VARCHAR(50) NULL AFTER `is_deleted`,
    ADD COLUMN `deleted_at` DATETIME NULL AFTER `previous_status`,
    ADD COLUMN `deleted_by` INT NULL AFTER `deleted_at`;

ALTER TABLE `vacancies`
    ADD CONSTRAINT `fk_vacancies_deleted_by`
    FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `idx_vacancies_is_deleted` ON `vacancies`(`is_deleted`);
