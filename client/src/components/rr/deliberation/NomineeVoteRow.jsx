import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_LABELS = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching'
};

const VOTE_CONFIG = {
    approve: { label: 'Approve', pillBg: 'bg-emerald-100', pillText: 'text-emerald-700', btnOutline: 'border-emerald-400 text-emerald-600 hover:bg-emerald-50', btnActive: 'bg-emerald-500 text-white' },
    hold:    { label: 'Hold',    pillBg: 'bg-amber-100',   pillText: 'text-amber-700',   btnOutline: 'border-amber-400 text-amber-600 hover:bg-amber-50',   btnActive: 'bg-amber-500 text-white' },
    reject:  { label: 'Reject',  pillBg: 'bg-red-100',     pillText: 'text-red-700',     btnOutline: 'border-red-400 text-red-600 hover:bg-red-50',       btnActive: 'bg-red-500 text-white' }
};

const NomineeVoteRow = ({ nominee, rank, currentUserId, onVote, totalCommitteeMembers }) => {
    const [isVoting, setIsVoting] = useState(false);

    const myVoteObj = nominee.votes?.find(v => v.committee_member_id && v.voter_name);
    const myVoteEntry = nominee.votes?.find(v => {
        return currentUserId && v.voter_name;
    });

    const myVote = nominee.myVote || null;

    const handleVote = async (voteType) => {
        setIsVoting(true);
        try {
            await onVote(nominee.nomination_id, voteType);
        } finally {
            setIsVoting(false);
        }
    };

    const rankBadge = rank === 1 ? (
        <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-sm shadow-md shadow-amber-200">
            {rank}
        </div>
    ) : (
        <div className="w-9 h-9 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B] font-black text-sm">
            {rank}
        </div>
    );

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white transition-all"
        >
            <div className="flex items-start gap-4">
                {rankBadge}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-[#1B3A6B] truncate">
                            {nominee.nominee_name}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mb-2">
                        {nominee.award_type_name} &middot; {CATEGORY_LABELS[nominee.nominee_category] || nominee.nominee_category}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-1">
                            VOTES:
                        </span>
                        <AnimatePresence>
                            {nominee.votes && nominee.votes.length > 0 ? (
                                nominee.votes.map((v, vi) => {
                                    const cfg = VOTE_CONFIG[v.vote] || VOTE_CONFIG.approve;
                                    return (
                                        <motion.span
                                            key={`${v.committee_member_id}-${v.vote}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ delay: vi * 0.03 }}
                                            className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${cfg.pillBg} ${cfg.pillText}`}
                                        >
                                            {cfg.label}
                                        </motion.span>
                                    );
                                })
                            ) : (
                                <span className="text-[9px] text-slate-300 font-medium italic">No votes yet</span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="text-right shrink-0 mr-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                        SCORE
                    </p>
                    <span className="text-xl font-black text-[#D6402F] tabular-nums">
                        {nominee.weighted_total?.toFixed(1) || '0.0'}
                    </span>
                </div>

                <div className="flex gap-1.5 shrink-0">
                    {['approve', 'hold', 'reject'].map(vt => {
                        const cfg = VOTE_CONFIG[vt];
                        const isActive = myVote === vt;
                        return (
                            <button
                                key={vt}
                                onClick={() => handleVote(vt)}
                                disabled={isVoting}
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                    isActive ? cfg.btnActive : cfg.btnOutline
                                } disabled:opacity-50`}
                            >
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default NomineeVoteRow;
