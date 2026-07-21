const db = require('../../db');
const { computeConsensus } = require('../../utils/consensus');

/**
 * Internal: recompute deliberation_status for a nomination from its votes.
 */
async function recomputeStatus(nominationId) {
    const [voteRows] = await db.query(`
        SELECT dv.vote, pcm.role_label
        FROM rr_deliberation_votes dv
        JOIN rr_praise_committee_members pcm ON dv.committee_member_id = pcm.id
        WHERE dv.nomination_id = ?
    `, [nominationId]);

    const [memberCount] = await db.query(
        'SELECT COUNT(*) AS cnt FROM rr_praise_committee_members WHERE is_active = 1'
    );
    const totalMembers = memberCount[0]?.cnt || 0;

    const result = computeConsensus(voteRows, totalMembers);

    await db.query(`
        UPDATE rr_call_nominations SET deliberation_status = ? WHERE id = ?
    `, [result.status, nominationId]);

    return result;
}

/**
 * GET /api/rr/deliberation2/nominees?category={all|teaching|teaching_related|non_teaching}
 * Returns nominees who completed Validation & Interview, with votes, stats.
 */
exports.getNominees = async (req, res) => {
    try {
        const { category } = req.query;

        let sql = `
            SELECT
                cn.id AS nomination_id,
                cn.nominee_name,
                cn.nominee_category,
                cn.deliberation_status,
                cn.final_rank,
                at.id AS award_type_id,
                at.name AS award_type_name,
                vi.weighted_total
            FROM rr_call_nominations cn
            JOIN rr_nomination_calls nc ON nc.id = cn.call_id
            JOIN rr_award_types at ON at.id = nc.award_type_id
            LEFT JOIN rr_validation_interviews vi ON vi.nomination_id = cn.id
            WHERE cn.status = 'advanced'
        `;
        const params = [];
        if (category && category !== 'all') {
            sql += ' AND cn.nominee_category = ?';
            params.push(category);
        }
        sql += ' ORDER BY vi.weighted_total DESC, cn.nominee_name ASC';

        const [nominees] = await db.query(sql, params);

        const nominationIds = nominees.map(n => n.nomination_id);

        let votes = [];
        if (nominationIds.length > 0) {
            const placeholders = nominationIds.map(() => '?').join(',');
            [votes] = await db.query(`
                SELECT
                    dv.nomination_id,
                    dv.committee_member_id,
                    dv.vote,
                    dv.voted_at,
                    dv.is_locked,
                    pcm.role_label,
                    u.full_name AS voter_name
                FROM rr_deliberation_votes dv
                JOIN rr_praise_committee_members pcm ON dv.committee_member_id = pcm.id
                JOIN users u ON pcm.user_id = u.id
                WHERE dv.nomination_id IN (${placeholders})
            `, nominationIds);
        }

        const votesByNominee = {};
        for (const v of votes) {
            if (!votesByNominee[v.nomination_id]) votesByNominee[v.nomination_id] = [];
            votesByNominee[v.nomination_id].push(v);
        }

        const enriched = nominees.map((n, i) => ({
            ...n,
            weighted_total: n.weighted_total !== null ? Number(n.weighted_total) : 0,
            votes: votesByNominee[n.nomination_id] || [],
            rank: i + 1
        }));

        const [stats] = await db.query(`
            SELECT
                COUNT(*) AS total_nominees,
                SUM(CASE WHEN cn.deliberation_status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
                SUM(CASE WHEN cn.deliberation_status = 'on_hold' THEN 1 ELSE 0 END) AS on_hold_count,
                COALESCE(AVG(vi.weighted_total), 0) AS avg_score
            FROM rr_call_nominations cn
            LEFT JOIN rr_validation_interviews vi ON vi.nomination_id = cn.id
            WHERE cn.status = 'advanced'
        `);

        const [memberCount] = await db.query(
            'SELECT COUNT(*) AS cnt FROM rr_praise_committee_members WHERE is_active = 1'
        );

        res.json({
            nominees: enriched,
            stats: {
                total_nominees: stats[0]?.total_nominees || 0,
                approved_count: Number(stats[0]?.approved_count) || 0,
                on_hold_count: Number(stats[0]?.on_hold_count) || 0,
                avg_score: Math.round(Number(stats[0]?.avg_score) * 10) / 10 || 0
            },
            totalCommitteeMembers: memberCount[0]?.cnt || 0
        });
    } catch (err) {
        console.error('❌ GET DELIBERATION NOMINEES ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch deliberation nominees' });
    }
};

/**
 * PUT /api/rr/deliberation2/:nominationId/vote
 * Body: { vote: 'approve' | 'hold' | 'reject' }
 * Upserts the current committee member's vote, recomputes consensus.
 */
exports.putVote = async (req, res) => {
    try {
        const { nominationId } = req.params;
        const { vote } = req.body;

        if (!['approve', 'hold', 'reject'].includes(vote)) {
            return res.status(400).json({ message: 'vote must be approve, hold, or reject' });
        }

        const [memberRows] = await db.query(
            'SELECT id FROM rr_praise_committee_members WHERE user_id = ? AND is_active = 1',
            [req.user.id]
        );

        if (memberRows.length === 0) {
            return res.status(403).json({ message: 'You are not an active committee member' });
        }

        const committeeMemberId = memberRows[0].id;

        const [locked] = await db.query(
            'SELECT is_locked FROM rr_deliberation_votes WHERE nomination_id = ? AND committee_member_id = ?',
            [nominationId, committeeMemberId]
        );
        if (locked.length > 0 && locked[0].is_locked) {
            return res.status(409).json({ message: 'Voting is locked for this nomination' });
        }

        await db.query(`
            INSERT INTO rr_deliberation_votes (nomination_id, committee_member_id, vote, voted_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE vote = VALUES(vote), voted_at = NOW()
        `, [nominationId, committeeMemberId, vote]);

        const consensus = await recomputeStatus(nominationId);

        const [updatedVotes] = await db.query(`
            SELECT
                dv.nomination_id,
                dv.committee_member_id,
                dv.vote,
                dv.voted_at,
                pcm.role_label,
                u.full_name AS voter_name
            FROM rr_deliberation_votes dv
            JOIN rr_praise_committee_members pcm ON dv.committee_member_id = pcm.id
            JOIN users u ON pcm.user_id = u.id
            WHERE dv.nomination_id = ?
        `, [nominationId]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:vote-cast', {
                nominationId,
                committeeMemberId,
                vote,
                votes: updatedVotes,
                consensus
            });
        }

        res.json({ votes: updatedVotes, consensus });
    } catch (err) {
        console.error('❌ PUT DELIBERATION VOTE ERROR:', err);
        res.status(500).json({ message: 'Failed to save vote' });
    }
};

/**
 * PATCH /api/rr/deliberation2/finalize
 * Locks all votes, sets final_rank, finalized_at, finalized_by.
 */
exports.patchFinalize = async (req, res) => {
    try {
        const [nominees] = await db.query(`
            SELECT cn.id, cn.nominee_name, cn.deliberation_status
            FROM rr_call_nominations cn
            WHERE cn.status = 'advanced'
        `);

        const [memberCount] = await db.query(
            'SELECT COUNT(*) AS cnt FROM rr_praise_committee_members WHERE is_active = 1'
        );
        const totalMembers = memberCount[0]?.cnt || 0;

        const incomplete = [];
        for (const nom of nominees) {
            const [voteCount] = await db.query(
                'SELECT COUNT(*) AS cnt FROM rr_deliberation_votes WHERE nomination_id = ?',
                [nom.id]
            );
            if (voteCount[0].cnt < totalMembers) {
                incomplete.push({ nomination_id: nom.id, nominee_name: nom.nominee_name, votes_cast: voteCount[0].cnt, votes_needed: totalMembers });
            }
        }

        if (incomplete.length > 0) {
            return res.status(409).json({
                message: 'Not all committee members have voted on every nominee',
                incomplete
            });
        }

        const [scored] = await db.query(`
            SELECT cn.id
            FROM rr_call_nominations cn
            LEFT JOIN rr_validation_interviews vi ON vi.nomination_id = cn.id
            WHERE cn.status = 'advanced'
            ORDER BY vi.weighted_total DESC, cn.nominee_name ASC
        `);

        for (let i = 0; i < scored.length; i++) {
            await db.query(`
                UPDATE rr_call_nominations
                SET final_rank = ?, finalized_at = NOW(), finalized_by = ?
                WHERE id = ?
            `, [i + 1, req.user.id, scored[i].id]);
        }

        await db.query(`
            UPDATE rr_deliberation_votes SET is_locked = 1
            WHERE nomination_id IN (SELECT id FROM rr_call_nominations WHERE status = 'advanced')
        `);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rr:deliberation-finalized');
            io.emit('rr:dashboard:update');
        }

        res.json({ message: 'Deliberation finalized successfully', finalized_count: scored.length });
    } catch (err) {
        console.error('❌ PATCH DELIBERATION FINALIZE ERROR:', err);
        res.status(500).json({ message: 'Failed to finalize deliberation' });
    }
};
