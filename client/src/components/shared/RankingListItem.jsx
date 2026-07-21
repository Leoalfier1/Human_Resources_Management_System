import React from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

const RankingListItem = ({ rank = 1, name, subtitle, score, voteStatus, isTopRank = false }) => {
    const isGold = rank === 1;

    const badgeBg = isGold
        ? 'bg-amber-400 shadow-md shadow-amber-200'
        : 'bg-[#1B3A6B]/10';

    const badgeText = isGold ? 'text-white' : 'text-[#1B3A6B]';

    const voteConfig = {
        approve: { label: 'APPROVE', bg: 'bg-emerald-100', text: 'text-emerald-700' },
        hold:    { label: 'HOLD',    bg: 'bg-amber-100',   text: 'text-amber-700' },
        reject:  { label: 'REJECT',  bg: 'bg-red-100',     text: 'text-red-700' },
    };

    const vote = voteConfig[voteStatus] || null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.05 }}
            className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white transition-all"
        >
            <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${badgeBg} ${badgeText}`}>
                    {isGold ? <Award size={16} /> : `#${rank}`}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1B3A6B] truncate">{name}</p>
                    {subtitle && (
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{subtitle}</p>
                    )}
                </div>

                <div className="text-right shrink-0 mr-3">
                    <span className="text-xl font-black text-[#D6402F] tabular-nums">
                        {score}
                    </span>
                </div>

                {vote && (
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${vote.bg} ${vote.text} shrink-0`}>
                        {vote.label}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

export default RankingListItem;
