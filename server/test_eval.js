// No fetch needed

(async () => {
    try {
        // Juan Santos application is APP-2026-0003, applicant_id = 4.
        // Wait, the API needs authentication. I can just write a quick script that calls getFullEvaluation(1) directly.
        
        const db = require('./db');
        const getFullEvaluation = async (ieId) => {
            const [records] = await db.query(
                `SELECT ie.*
                 FROM ies_evaluations ie
                 WHERE ie.id = ?`,
                [ieId]
            );
            if (records.length === 0) return null;
        
            const [criteria] = await db.query(
                `SELECT id, ies_evaluation_id, criteria_key, weight_allocation,
                        qualification_notes, computation_notes, actual_score
                 FROM ies_criterion_scores
                 WHERE ies_evaluation_id = ?
                 ORDER BY id ASC`,
                [ieId]
            );
        
            return {
                ...records[0],
                criteria
            };
        };
        
        const evalData = await getFullEvaluation(1);
        console.log(JSON.stringify(evalData, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
