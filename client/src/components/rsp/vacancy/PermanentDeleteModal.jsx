import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';

const PermanentDeleteModal = ({ isOpen, onClose, onConfirm, vacancy, loading, error }) => {
    const [confirmText, setConfirmText] = useState('');

    if (!isOpen || !vacancy) return null;

    const isMatch = confirmText === vacancy.ref_no;

    const handleClose = () => {
        setConfirmText('');
        onClose();
    };

    const handleConfirm = () => {
        if (isMatch) {
            onConfirm();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-red-100 rounded-2xl">
                                <Trash2 className="text-red-700" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-red-700 uppercase italic">
                                    Permanently Delete Vacancy Posting?
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <p className="text-sm font-black text-[#1B3A6B]">
                                    {vacancy.ref_no} — {vacancy.position_title}
                                </p>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                <p className="text-sm font-bold text-red-700 leading-relaxed">
                                    This action cannot be undone. All records of {vacancy.ref_no} — {vacancy.position_title} will be permanently removed.
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">
                                    Type <span className="text-[#1B3A6B]">{vacancy.ref_no}</span> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={e => setConfirmText(e.target.value)}
                                    placeholder={vacancy.ref_no}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-xs font-bold text-red-600">{error}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-200 text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading || !isMatch}
                                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-red-700 text-white shadow-lg hover:bg-red-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? 'Deleting...' : <><Trash2 size={14} /> Permanently Delete</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PermanentDeleteModal;
