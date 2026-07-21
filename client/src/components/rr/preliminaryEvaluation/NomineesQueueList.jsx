import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag } from 'lucide-react';

const CATEGORY_LABELS = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching'
};

const CATEGORY_COLORS = {
    teaching: { border: 'border-blue-400', text: 'text-blue-600', bg: 'bg-blue-50' },
    teaching_related: { border: 'border-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' },
    non_teaching: { border: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' }
};

const NomineesQueueList = ({ nominees, selectedNominationId, onSelectNominee }) => {
    if (nominees.length === 0) {
        return (
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B] mb-4">
                    Nominees Queue
                </h3>
                <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No nominees pending evaluation</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B] mb-4">
                Nominees Queue
            </h3>
            <div className="space-y-2">
                <AnimatePresence>
                    {nominees.map((nom, i) => {
                        const isSelected = nom.nomination_id === selectedNominationId;
                        const catColor = CATEGORY_COLORS[nom.nominee_category] || CATEGORY_COLORS.teaching;
                        const pct = nom.completeness_pct || 0;
                        const barColor = pct >= 100 ? 'bg-emerald-500' : 'bg-[#D6402F]';

                        return (
                            <motion.div
                                key={nom.nomination_id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => onSelectNominee(nom.nomination_id)}
                                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                                    isSelected
                                        ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 shadow-md'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#1B3A6B]">
                                            {nom.nominee_name}
                                        </span>
                                        {nom.is_flagged ? (
                                            <Flag size={12} className="text-[#D6402F] fill-[#D6402F]" />
                                        ) : null}
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${catColor.border} ${catColor.text} ${catColor.bg}`}>
                                        {CATEGORY_LABELS[nom.nominee_category]}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-semibold mb-2.5">
                                    {nom.award_type_name}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${barColor}`}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 tabular-nums whitespace-nowrap">
                                        {nom.submitted_required}/{nom.total_required}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default NomineesQueueList;
