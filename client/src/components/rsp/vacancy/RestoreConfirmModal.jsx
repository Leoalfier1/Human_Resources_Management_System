import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, X } from 'lucide-react';

const RestoreConfirmModal = ({ isOpen, onClose, onConfirm, vacancy, loading }) => {
    if (!isOpen || !vacancy) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <RotateCcw className="text-[#1B3A6B]" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">
                                    Restore Vacancy Posting?
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <p className="text-sm font-black text-[#1B3A6B]">
                                    {vacancy.ref_no} — {vacancy.position_title}
                                </p>
                            </div>

                            <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                                It will reappear in Posted Vacancies with its original status.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-200 text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-[#1B3A6B] text-white shadow-lg hover:bg-[#162E55] transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? 'Restoring...' : <><RotateCcw size={14} /> Restore</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RestoreConfirmModal;
