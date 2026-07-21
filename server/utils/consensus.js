/**
 * Consensus utility for R&R Deliberation & Finalization.
 *
 * Default rule: simple majority among committee members who have voted.
 *   - More "approve" votes than any other single vote type → 'approved'
 *   - More "hold" or "reject" votes than "approve" → 'on_hold' or 'rejected'
 *   - Tie → 'on_hold' (conservative default)
 *
 * This is an isolated, configurable function. To change governance rules
 * (e.g. unanimous required, Chair's vote weighted 2x), modify only this file.
 */

const CONSENSUS_CONFIG = {
    // Weight multipliers per committee role. Default 1.0 for all.
    // Example: { 'Chair': 2, 'Vice-Chair': 1.5 } would give extra weight.
    roleWeights: {},

    // Tie-breaking: 'on_hold' | 'approved' | 'rejected'
    tieBreaker: 'on_hold',

    // Minimum vote count to consider consensus reached (0 = any number of votes)
    minVotes: 1,
};

/**
 * Compute the deliberation_status for a nomination based on its votes.
 * @param {Array<{vote: string, role_label?: string}>} votes - All cast votes
 * @returns {{ status: string, approveCount: number, holdCount: number, rejectCount: number, totalVotes: number, isComplete: boolean, totalCommitteeMembers: number }}
 */
function computeConsensus(votes, totalCommitteeMembers) {
    let approveCount = 0;
    let holdCount = 0;
    let rejectCount = 0;

    for (const v of votes) {
        const weight = CONSENSUS_CONFIG.roleWeights[v.role_label] || 1;
        switch (v.vote) {
            case 'approve': approveCount += weight; break;
            case 'hold':    holdCount += weight; break;
            case 'reject':  rejectCount += weight; break;
        }
    }

    const totalVotes = votes.length;
    const isComplete = totalCommitteeMembers > 0 && totalVotes >= totalCommitteeMembers;

    let status = 'pending';

    if (totalVotes < CONSENSUS_CONFIG.minVotes) {
        status = 'pending';
    } else if (approveCount > holdCount && approveCount > rejectCount) {
        status = 'approved';
    } else if (holdCount >= approveCount && holdCount >= rejectCount) {
        status = CONSENSUS_CONFIG.tieBreaker === 'approved' && holdCount === approveCount
            ? 'approved'
            : 'on_hold';
    } else if (rejectCount >= approveCount && rejectCount > holdCount) {
        status = 'rejected';
    } else {
        status = CONSENSUS_CONFIG.tieBreaker;
    }

    return {
        status,
        approveCount,
        holdCount,
        rejectCount,
        totalVotes,
        isComplete,
        totalCommitteeMembers
    };
}

module.exports = { computeConsensus, CONSENSUS_CONFIG };
