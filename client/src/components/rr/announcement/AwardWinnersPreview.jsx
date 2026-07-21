import React from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Trophy } from 'lucide-react';

const AwardWinnersPreview = ({ groups }) => {
    if (groups.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 text-center"
            >
                <Trophy size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-400">No approved winners found</p>
                <p className="text-xs text-slate-300 mt-1">Complete deliberation and finalize results first</p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            {groups.map((group, gi) => (
                <motion.div
                    key={group.award_type_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.08 }}
                    className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Award size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase text-[#1B3A6B] tracking-tight">
                                {group.award_type_name}
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                {group.call_title}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {group.winners.map((w, wi) => (
                            <div
                                key={w.nomination_id}
                                className="flex items-center justify-between px-5 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black
                                        ${wi === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600'}`}
                                    >
                                        {w.final_rank || wi + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{w.nominee_name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                            {w.nominee_category?.replace(/_/g, ' ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-[#D6402F]">
                                        {w.weighted_total ? Number(w.weighted_total).toFixed(1) : '—'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                        Score
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default AwardWinnersPreview;
