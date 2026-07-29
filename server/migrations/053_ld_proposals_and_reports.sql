-- 053: L&D tables required by proposalController and reportController
--       (merged from colleague's branch). Also adds 'enrolled' to
--       ld_attendance.status enum.

-- 1. ld_notifications — persistent notification queue for L&D events
CREATE TABLE IF NOT EXISTS ld_notifications (
    id          INT             NOT NULL AUTO_INCREMENT,
    user_id     INT             NOT NULL,
    type        VARCHAR(50)     NULL,
    message     TEXT            NOT NULL,
    link        VARCHAR(500)    NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ld_notif_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. ld_program_proposals — employee-submitted PD program proposals
CREATE TABLE IF NOT EXISTS ld_program_proposals (
    id                    INT                              NOT NULL AUTO_INCREMENT,
    proposed_by           INT                              NOT NULL,
    title                 VARCHAR(255)                     NOT NULL,
    category              VARCHAR(100)                     NULL,
    rationale             TEXT                             NOT NULL,
    target_participants   TEXT                             NULL,
    proposed_date_from    DATE                             NULL,
    proposed_date_to      DATE                             NULL,
    estimated_budget      DECIMAL(12,2)                    NULL,
    mode_of_delivery      VARCHAR(100)                     NULL,
    status                ENUM('pending','under_review',
                              'approved','declined',
                              'converted')                 DEFAULT 'pending',
    admin_remarks         TEXT                             NULL,
    reviewed_by           INT                              NULL,
    reviewed_at           DATETIME                         NULL,
    linked_program_id     INT                              NULL,
    created_at            TIMESTAMP                        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ld_prop_proposed_by (proposed_by),
    INDEX idx_ld_prop_status (status),
    FOREIGN KEY (proposed_by)       REFERENCES users(id)        ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by)       REFERENCES users(id)        ON DELETE SET NULL,
    FOREIGN KEY (linked_program_id) REFERENCES ld_programs(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ld_program_completion_reports — DepEd Memo 044 s.2023 completion reports
CREATE TABLE IF NOT EXISTS ld_program_completion_reports (
    id                       INT              NOT NULL AUTO_INCREMENT,
    program_id               INT              NOT NULL,
    submitted_by             INT              NOT NULL,
    completion_date          DATE             NOT NULL,
    total_participants       INT              NULL,
    total_present            INT              NULL,
    total_hours              DECIMAL(6,1)     NULL,
    section_1_summary        TEXT             NULL,
    section_2_summary        TEXT             NULL,
    section_3_summary        TEXT             NULL,
    section_4_summary        TEXT             NULL,
    section_5_summary        TEXT             NULL,
    section_6_summary        TEXT             NULL,
    section_7a_recommendations TEXT            NULL,
    section_7b_challenges    TEXT             NULL,
    report_pdf_path          VARCHAR(500)     NULL,
    created_at               TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE INDEX idx_ld_cr_program (program_id),
    FOREIGN KEY (program_id)   REFERENCES ld_programs(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. ld_employee_training_records — HRD database of completed trainings
CREATE TABLE IF NOT EXISTS ld_employee_training_records (
    id               INT                              NOT NULL AUTO_INCREMENT,
    user_id          INT                              NOT NULL,
    program_id       INT                              NULL,
    program_title    VARCHAR(255)                     NULL,
    training_date    DATE                             NULL,
    duration_hours   DECIMAL(6,1)                     NULL,
    personnel_type   VARCHAR(50)                      NULL,
    status           ENUM('completed','incomplete')   DEFAULT 'completed',
    certificate_path VARCHAR(500)                     NULL,
    created_at       TIMESTAMP                        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ld_etr_user (user_id),
    INDEX idx_ld_etr_program (program_id),
    FOREIGN KEY (user_id)    REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES ld_programs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. ld_program_me_summaries — M&E Summary manual edits (DO 044 s.2023)
CREATE TABLE IF NOT EXISTS ld_program_me_summaries (
    id                      INT          NOT NULL AUTO_INCREMENT,
    program_id              INT          NOT NULL,
    strengths               JSON         NULL,
    areas_for_improvement   JSON         NULL,
    recommendations         TEXT         NULL,
    updated_at              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE INDEX idx_ld_me_program (program_id),
    FOREIGN KEY (program_id) REFERENCES ld_programs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. ld_program_test_submissions — pre-test / post-test scores per participant
CREATE TABLE IF NOT EXISTS ld_program_test_submissions (
    id            INT                               NOT NULL AUTO_INCREMENT,
    user_id       INT                               NOT NULL,
    program_id    INT                               NOT NULL,
    test_type     ENUM('pre_test','post_test')      NOT NULL,
    score         DECIMAL(5,2)                      NULL,
    submitted_at  TIMESTAMP                         DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ld_pts_user_program (user_id, program_id),
    FOREIGN KEY (user_id)    REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES ld_programs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. ld_ipcrf_records — latest IPCRF rating for My Records KPI
CREATE TABLE IF NOT EXISTS ld_ipcrf_records (
    id            INT              NOT NULL AUTO_INCREMENT,
    user_id       INT              NOT NULL,
    final_rating  DECIMAL(4,2)     NULL,
    period        VARCHAR(50)      NULL,
    created_at    TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ld_ipcrf_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. ld_session_checkins — daily session tracking for attendance %
CREATE TABLE IF NOT EXISTS ld_session_checkins (
    id            INT          NOT NULL AUTO_INCREMENT,
    user_id       INT          NOT NULL,
    program_id    INT          NOT NULL,
    checked_in_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ld_sci_program_user (program_id, user_id),
    FOREIGN KEY (user_id)    REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES ld_programs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. ld_attendance — add 'enrolled' to status enum for pre-attendance tracking
ALTER TABLE ld_attendance
    MODIFY COLUMN status ENUM('enrolled','present','absent','excused')
    DEFAULT 'enrolled';
