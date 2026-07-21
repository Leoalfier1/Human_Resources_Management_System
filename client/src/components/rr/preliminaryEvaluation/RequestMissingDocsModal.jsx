import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertTriangle } from 'lucide-react';

const RequestMissingDocsModal = ({ isOpen, onClose, onConfirm, nomination, missingDocs }) => {
    if (!isOpen || !nomination) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#D6402F]/10 flex items-center justify-center">
                                    <AlertTriangle size={16} className="text-[#D6402F]" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B]">
                                    Request Missing Documents
                                </h3>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={16} className="text-slate-400" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 mb-4">
                            This will send a notification to the nominee and nominator listing the following missing required documents:
                        </p>

                        <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-100">
                            <p className="text-xs font-bold text-[#1B3A6B] mb-2">
                                {nomination.nominee_name} &mdash; {nomination.award_type_name}
                            </p>
                            <ul className="space-y-1">
                                {nomination.missingDocs && nomination.missingDocs.map((doc, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[11px] text-[#D6402F] font-semibold">
                                        <span className="w-1 h-1 rounded-full bg-[#D6402F] shrink-0" />
                                        {doc}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B3A6B] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#152d54] transition-all"
                            >
                                <Send size={12} />
                                Send Request
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RequestMissingDocsModal;
