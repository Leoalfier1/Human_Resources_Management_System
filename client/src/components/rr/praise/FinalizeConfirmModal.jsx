import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';

const FinalizeConfirmModal = ({ isOpen, onClose, onConfirm, meeting }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1B3A6B]">Finalize Meeting</h3>
                            <button
                                onClick={onClose}
                                className="ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                            Are you sure you want to finalize this meeting record? This action will lock the meeting and all its details — attendance, agenda, and minutes — and cannot be undone.
                        </p>

                        {meeting && (
                            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
                                {meeting.meeting_date && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Date</span>
                                        <span className="text-[#1B3A6B] font-bold">{new Date(meeting.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                )}
                                {meeting.venue && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Venue</span>
                                        <span className="text-[#1B3A6B] font-bold">{meeting.venue}</span>
                                    </div>
                                )}
                                {meeting.presiding_officer_name && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest">Officer</span>
                                        <span className="text-[#1B3A6B] font-bold">{meeting.presiding_officer_name}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D6402F] text-white text-xs font-black uppercase tracking-widest hover:bg-[#c03525] transition-all"
                            >
                                <CheckCircle size={14} />
                                Confirm Finalize
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FinalizeConfirmModal;
