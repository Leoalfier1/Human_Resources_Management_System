import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NomineeVoteRow from './NomineeVoteRow';

const CATEGORY_LABELS = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching'
};

const RankingsConsensusList = ({ nominees, currentUserId, onVote, totalCommitteeMembers }) => {
    if (nominees.length === 0) {
        return (
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B] mb-4">
                    Rankings & Committee Consensus
                </h3>
                <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No nominees at deliberation stage</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B]">
                    Rankings & Committee Consensus
                </h3>
            </div>
            <div className="space-y-3">
                <AnimatePresence>
                    {nominees.map((nom, i) => (
                        <NomineeVoteRow
                            key={nom.nomination_id}
                            nominee={nom}
                            rank={nom.rank || i + 1}
                            currentUserId={currentUserId}
                            onVote={onVote}
                            totalCommitteeMembers={totalCommitteeMembers}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RankingsConsensusList;
