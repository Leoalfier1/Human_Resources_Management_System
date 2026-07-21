import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_LABELS = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching'
};

const NomineeScoreHeader = ({ nomination, weightedTotal }) => {
    if (!nomination) return null;

    const displayTotal = typeof weightedTotal === 'number' ? weightedTotal.toFixed(1) : '0.0';

    return (
        <div className="flex items-start justify-between">
            <div>
                <h2 className="text-lg font-black text-[#1B3A6B] leading-tight">
                    {nomination.nominee_name}
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {nomination.award_type_name} &middot; {CATEGORY_LABELS[nomination.nominee_category] || nomination.nominee_category}
                </p>
            </div>
            <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    WEIGHTED TOTAL
                </p>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={displayTotal}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0.5 }}
                        transition={{ duration: 0.2 }}
                        className="text-2xl font-black text-[#D6402F] tabular-nums"
                    >
                        {displayTotal} <span className="text-sm text-slate-400">/ 100</span>
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NomineeScoreHeader;
