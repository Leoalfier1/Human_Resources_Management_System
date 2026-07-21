import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, Loader2, FileWarning } from 'lucide-react';

const MIN_REASON_LENGTH = 10;

const RequestRevisionModal = ({
    isOpen,
    documentName,
    fileName,
    onConfirm,
    onCancel,
    loading = false,
}) => {
    const [reason, setReason] = useState('');
    const isValid = reason.trim().length >= MIN_REASON_LENGTH;
    const charsLeft = Math.max(0, MIN_REASON_LENGTH - reason.trim().length);

    useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    const handleConfirm = () => {
        if (isValid && !loading) {
            onConfirm(reason.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey && isValid && !loading) {
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
                                <div className="p-3 rounded-2xl shrink-0 bg-amber-50">
                                    <FileWarning size={22} className="text-amber-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-black text-[#1B3A6B]">
                                        Request Document Revision
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
                                    className="text-slate-300 hover:text-amber-400 transition-colors shrink-0 mt-1"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>

                        {/* REQUIRED REASON */}
                        <div className="px-7 mb-5">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                Reason for Revision <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={4}
                                placeholder="Explain what's wrong with this document or what needs to be resubmitted (e.g. 'Certificate is expired', 'Photo is blurry', 'Wrong document type uploaded')..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all resize-none"
                                autoFocus
                            />
                            <div className="flex justify-between items-center mt-1.5 px-1">
                                {reason.trim().length > 0 && reason.trim().length < MIN_REASON_LENGTH ? (
                                    <p className="text-[10px] font-bold text-amber-500">
                                        {charsLeft} more character{charsLeft !== 1 ? 's' : ''} needed
                                    </p>
                                ) : (
                                    <p className="text-[10px] font-bold text-slate-300">
                                        {reason.length} character{reason.length !== 1 ? 's' : ''}
                                    </p>
                                )}
                                <p className="text-[9px] font-semibold text-slate-300">Ctrl+Enter to confirm</p>
                            </div>
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
                                disabled={!isValid || loading}
                                className={`px-5 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-all ${
                                    isValid && !loading
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200'
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                            >
                                {loading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <AlertTriangle size={14} />
                                )}
                                Request Revision
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RequestRevisionModal;
