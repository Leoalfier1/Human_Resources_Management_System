import React from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

const RRStatCardsRow2 = ({ stats, onBudgetChange, isSubmitted }) => {
    return (
        <div className="grid grid-cols-[0.7fr_0.7fr_1.6fr] gap-4">
            {/* Non-Teaching Awards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100"
            >
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    NON-TEACHING AWARDS
                </p>
                <span className="text-3xl font-black text-[#1B3A6B] tabular-nums">
                    {stats.nonTeachingAwardees || 0}
                </span>
            </motion.div>

            {/* Teaching-Related Awards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100"
            >
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    TEACHING-RELATED AWARDS
                </p>
                <span className="text-3xl font-black text-[#1B3A6B] tabular-nums">
                    {stats.teachingRelatedAwardees || 0}
                </span>
            </motion.div>

            {/* Budget Utilized (wider) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100"
            >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        BUDGET UTILIZED
                    </p>
                    <Wallet size={18} className="text-[#D6402F]/30" />
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-black text-[#D6402F] tabular-nums">
                        ₱{stats.budgetUtilized ? Number(stats.budgetUtilized).toLocaleString() : '0'}
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    of ₱{stats.budgetAllocated ? Number(stats.budgetAllocated).toLocaleString() : '0'} allocated
                </p>

                {/* Inline budget inputs */}
                {!isSubmitted && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-300">Allocated</label>
                            <input
                                type="number"
                                value={stats.budgetAllocated || ''}
                                onChange={e => onBudgetChange('budgetAllocated', e.target.value ? Number(e.target.value) : null)}
                                placeholder="0"
                                className="w-full mt-0.5 px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 outline-none border border-slate-100 focus:border-[#1B3A6B]/30"
                            />
                        </div>
                        <div>
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-300">Utilized</label>
                            <input
                                type="number"
                                value={stats.budgetUtilized || ''}
                                onChange={e => onBudgetChange('budgetUtilized', e.target.value ? Number(e.target.value) : null)}
                                placeholder="0"
                                className="w-full mt-0.5 px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 outline-none border border-slate-100 focus:border-[#1B3A6B]/30"
                            />
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default RRStatCardsRow2;
