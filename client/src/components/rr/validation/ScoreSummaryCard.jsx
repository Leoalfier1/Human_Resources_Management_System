import React from 'react';
import { motion } from 'framer-motion';

const ScoreSummaryCard = ({ criteria, weightedTotal }) => {
    const displayTotal = typeof weightedTotal === 'number' ? weightedTotal.toFixed(1) : '0.0';

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                SCORE SUMMARY
            </p>
            <div className="space-y-1.5">
                {criteria.map(c => {
                    const val = c.raw_score !== null && c.raw_score !== undefined
                        ? ((c.raw_score / c.max_raw_score) * c.weight_percent).toFixed(1)
                        : '0.0';
                    const truncated = c.criterion_label.length > 35
                        ? c.criterion_label.substring(0, 32) + '...'
                        : c.criterion_label;
                    return (
                        <div key={c.id} className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500 font-medium truncate mr-2">
                                {truncated}
                            </span>
                            <span className="text-slate-700 font-bold tabular-nums whitespace-nowrap">
                                {val}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="border-t border-slate-100 mt-3 pt-2.5 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-[#1B3A6B]">
                    TOTAL
                </span>
                <span className="text-sm font-black text-[#D6402F] tabular-nums">
                    {displayTotal}
                </span>
            </div>
        </div>
    );
};

export default ScoreSummaryCard;
