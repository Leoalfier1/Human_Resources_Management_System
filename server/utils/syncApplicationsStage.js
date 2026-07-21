const db = require('../db');

/**
 * Syncs qualifying applications for a vacancy to the given stage.
 * Called after vacancies.current_stage is advanced so that the
 * applicant-facing "My Application" page stays in sync.
 *
 * - Only advances forward (never regresses an applicant's stage)
 * - Skips disqualified applicants entirely
 * - Inserts a stage_history row for the new stage
 *
 * Stages 6-11 are already handled per-applicant by their respective
 * controllers (caController, resultsController, etc.), so this mainly
 * fills the gap for stages 3 and 5 which have no per-applicant logic.
 */
const syncApplicationsStage = async (vacancyId, stageNumber, io) => {
    if (!vacancyId || !stageNumber) return;

    const [apps] = await db.query(
        `SELECT id FROM applications
         WHERE vacancy_id = ?
           AND status NOT IN ('draft', 'disqualified')
           AND (current_stage IS NULL OR current_stage < ?)`,
        [vacancyId, stageNumber]
    );

    for (const app of apps) {
        await db.query(
            `INSERT INTO stage_history (application_id, stage_number, status, completed_at)
             VALUES (?, ?, 'completed', NOW())
             ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
            [app.id, stageNumber]
        );
        await db.query(
            `UPDATE applications SET current_stage = ? WHERE id = ?`,
            [stageNumber, app.id]
        );
    }

    if (io && apps.length > 0) {
        for (const app of apps) {
            io.to(`application-${app.id}`).emit('application:stage-update', {
                applicationId: app.id,
                stage: stageNumber
            });
        }
    }
};

module.exports = syncApplicationsStage;
