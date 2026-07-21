import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, AlertTriangle } from 'lucide-react';

const SubmitToRegionModal = ({ isOpen, onClose, onConfirm, isSubmitting, cycleSummary }) => {
    if (!isOpen) return null;

    const incomplete = (cycleSummary || []).filter(s => !s.completed);
    const allComplete = incomplete.length === 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-[#1B3A6B] p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Send size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase text-white tracking-tight">
                                    Submit to Region
                                </h2>
                                <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">
                                    This action locks the report
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {allComplete ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-2xl">
                                    <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-green-800 uppercase">All Stages Complete</p>
                                        <p className="text-xs text-green-700 mt-1">
                                            All 8 PRAISE cycle stages show COMPLETED. You may submit the report.
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Once submitted, the narrative report will be locked from further edits and the submission will be recorded with a timestamp.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl">
                                    <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-amber-800 uppercase">Incomplete Stages</p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            The following stages are not yet complete:
                                        </p>
                                    </div>
                                </div>
                                <ul className="space-y-1.5">
                                    {incomplete.map(s => (
                                        <li key={s.stage} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                            <span className="text-xs font-bold text-slate-700">{s.stage}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors"
                        >
                            Cancel
                        </button>
                        {allComplete && (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onConfirm}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#162f57] disabled:opacity-60 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md transition-colors"
                            >
                                {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SubmitToRegionModal;
