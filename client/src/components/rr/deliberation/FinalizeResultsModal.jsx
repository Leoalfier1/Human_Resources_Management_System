import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

const FinalizeResultsModal = ({ isOpen, onClose, onConfirm, nominees, stats }) => {
    if (!isOpen) return null;

    const approved = nominees.filter(n => n.deliberation_status === 'approved');
    const onHold = nominees.filter(n => n.deliberation_status === 'on_hold');
    const rejected = nominees.filter(n => n.deliberation_status === 'rejected');
    const pending = nominees.filter(n => n.deliberation_status === 'pending');

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2rem] w-full max-w-lg p-6 shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-black text-lg text-[#1B3A6B]">
                            Finalize Results
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>

                    {pending.length > 0 && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 font-medium">
                                {pending.length} nominee(s) still have no consensus. They will be marked as "on_hold".
                            </p>
                        </div>
                    )}

                    <div className="space-y-3 mb-5">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">Total Nominees</span>
                            <span className="text-sm font-black text-[#1B3A6B]">{nominees.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-emerald-600">Approved</span>
                            <span className="text-sm font-black text-emerald-600">{approved.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-amber-600">On Hold</span>
                            <span className="text-sm font-black text-amber-600">{onHold.length + pending.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-red-600">Rejected</span>
                            <span className="text-sm font-black text-red-600">{rejected.length}</span>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mb-5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
                            Approved Nominees
                        </p>
                        {approved.length > 0 ? (
                            <div className="space-y-1">
                                {approved.map(n => (
                                    <div key={n.nomination_id} className="flex justify-between text-xs">
                                        <span className="font-bold text-[#1B3A6B]">{n.nominee_name}</span>
                                        <span className="font-bold text-slate-500 tabular-nums">{n.weighted_total?.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-300 italic">None</p>
                        )}
                    </div>

                    <p className="text-[10px] text-slate-400 mb-4">
                        This action will lock all votes and advance approved nominees to Announcement of Results.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 bg-[#D6402F] hover:bg-[#c0352a] text-white font-black uppercase tracking-widest text-xs rounded-xl transition-colors"
                        >
                            Confirm Finalize
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FinalizeResultsModal;
