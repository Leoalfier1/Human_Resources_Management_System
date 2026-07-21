import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, FileCheck } from 'lucide-react';

const VerifyDocumentModal = ({
    isOpen,
    documentName,
    fileName,
    onConfirm,
    onCancel,
    loading = false,
}) => {
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen) setNote('');
    }, [isOpen]);

    const handleConfirm = () => {
        if (!loading) {
            onConfirm(note.trim() || null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey && !loading) {
            handleConfirm();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-6"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="px-7 pt-7 pb-5">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl shrink-0 bg-emerald-50">
                                    <FileCheck size={22} className="text-emerald-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-black text-[#1B3A6B]">
                                        Verify Document
                                    </h3>
                                    <p className="text-xs font-bold text-slate-500 mt-1">
                                        {documentName}
                                    </p>
                                    {fileName && (
                                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                                            {fileName}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onCancel}
                                    className="text-slate-300 hover:text-emerald-400 transition-colors shrink-0 mt-1"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>

                        {/* OPTIONAL NOTE */}
                        <div className="px-7 mb-5">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                Optional Note (visible to applicant)
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={3}
                                placeholder="Add an optional note about this document (visible to applicant)..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all resize-none"
                                autoFocus
                            />
                            <p className="text-[9px] font-semibold text-slate-300 mt-1.5 px-1">Ctrl+Enter to confirm</p>
                        </div>

                        {/* ACTIONS */}
                        <div className="px-7 pb-7 flex items-center justify-end gap-3">
                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className="px-5 py-2.5 border border-slate-200 text-[#1B3A6B] hover:bg-slate-50 transition-all rounded-xl text-[11px] font-bold disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className={`px-5 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-all ${
                                    !loading
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                            >
                                {loading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <CheckCircle2 size={14} />
                                )}
                                Confirm Verification
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VerifyDocumentModal;
