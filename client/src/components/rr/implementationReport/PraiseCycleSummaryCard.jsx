import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, ClipboardList } from 'lucide-react';

const PraiseCycleSummaryCard = ({ summary }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center">
                    <ClipboardList size={18} className="text-[#1B3A6B]" />
                </div>
                <h3 className="text-sm font-black uppercase text-[#1B3A6B] tracking-tight">
                    PRAISE Cycle Summary
                </h3>
            </div>

            <div className="space-y-1">
                {summary.map((item, i) => (
                    <motion.div
                        key={item.stage}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {item.completed ? (
                                <CheckCircle size={18} className="text-green-500 shrink-0" />
                            ) : (
                                <Circle size={18} className="text-slate-300 shrink-0" />
                            )}
                            <span className={`text-xs font-bold ${item.completed ? 'text-slate-700' : 'text-slate-500'}`}>
                                {item.stage}
                            </span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest
                            ${item.completed ? 'text-green-600' : 'text-[#1B3A6B] bg-[#1B3A6B]/10 px-2.5 py-1 rounded-full'}`}
                        >
                            {item.completed ? 'COMPLETED' : 'IN PROGRESS'}
                        </span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default PraiseCycleSummaryCard;
