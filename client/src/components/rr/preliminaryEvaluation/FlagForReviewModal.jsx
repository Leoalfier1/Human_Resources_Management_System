import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag } from 'lucide-react';

const FlagForReviewModal = ({ isOpen, onClose, onConfirm, nomination }) => {
    const [note, setNote] = useState('');

    if (!isOpen || !nomination) return null;

    const handleConfirm = () => {
        onConfirm(note);
        setNote('');
    };

    const handleClose = () => {
        setNote('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-4"
                    onClick={handleClose}
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
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Flag size={16} className="text-amber-600" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B]">
                                    Flag for Review
                                </h3>
                            </div>
                            <button onClick={handleClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={16} className="text-slate-400" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 mb-1">
                            Flag <span className="font-bold text-[#1B3A6B]">{nomination.nominee_name}</span>&apos;s nomination for manual committee attention during Deliberation &amp; Finalization.
                        </p>

                        <div className="mt-4">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                                Note (optional)
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Reason for flagging..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20 resize-none transition-all"
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all"
                            >
                                <Flag size={12} />
                                Confirm Flag
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FlagForReviewModal;
