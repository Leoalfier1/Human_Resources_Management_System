import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const CATEGORY_LABELS = {
    teaching: 'Teaching',
    non_teaching: 'Non-Teaching',
    teaching_related: 'Teaching-Related'
};

const CATEGORY_KEYS = ['teaching', 'non_teaching', 'teaching_related'];

const NomineesByCategoryCard = ({ data }) => {
    const maxCount = Math.max(...CATEGORY_KEYS.map(k => data[k] || 0), 1);
    const total = CATEGORY_KEYS.reduce((sum, k) => sum + (data[k] || 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center">
                    <BarChart3 size={18} className="text-[#1B3A6B]" />
                </div>
                <h3 className="text-sm font-black uppercase text-[#1B3A6B] tracking-tight">
                    Nominees by Category
                </h3>
            </div>

            <div className="space-y-4">
                {CATEGORY_KEYS.map((key, i) => {
                    const count = data[key] || 0;
                    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

                    return (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-slate-700">
                                    {CATEGORY_LABELS[key]}
                                </span>
                                <span className="text-sm font-black text-[#D6402F] tabular-nums">
                                    {count}
                                </span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                                    className="h-full bg-[#1B3A6B] rounded-full"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-center">
                {total} total nominees
            </p>
        </motion.div>
    );
};

export default NomineesByCategoryCard;
