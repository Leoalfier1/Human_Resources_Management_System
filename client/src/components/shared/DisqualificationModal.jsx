import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, CheckCircle2, Loader2, ShieldOff, Clock, User } from 'lucide-react';

const MIN_REMARKS_LENGTH = 10;

const QUICK_REASONS = [
    'Does not meet minimum education requirement',
    'Lacks required training hours',
    'Insufficient work experience',
    'No valid civil service eligibility',
    'Missing or unverified required documents',
    'Information does not match PDS records',
];

const DisqualificationModal = ({
    isOpen,
    applicantName,
    applicantCode,
    unmetCriteria = [],
    unverifiedDocs = [],
    onConfirm,
    onCancel,
    loading = false,
    mode = 'interactive',
    disqualificationReason = '',
    disqualifiedByName = '',
    disqualifiedAt = '',
    title = 'Disqualify Applicant',
}) => {
    const [remarks, setRemarks] = useState('');
    const isValid = remarks.trim().length >= MIN_REMARKS_LENGTH;
    const charsLeft = Math.max(0, MIN_REMARKS_LENGTH - remarks.trim().length);

    useEffect(() => {
        if (isOpen) setRemarks('');
    }, [isOpen]);

    const handleConfirm = () => {
        if (isValid && !loading) {
            onConfirm(remarks.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey && isValid && !loading) {
            handleConfirm();
        }
    };

    const handleChipClick = (reason) => {
        setRemarks(prev => {
            if (prev.trim().length === 0) return reason;
            if (prev.trim().endsWith('.')) return prev.trim() + ' ' + reason;
            return prev.trim() + '. ' + reason;
        });
    };

    const isReadOnly = mode === 'read-only';

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
                        className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="px-7 pt-7 pb-5">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-2xl shrink-0 ${isReadOnly ? 'bg-slate-100' : 'bg-red-50'}`}>
                                    {isReadOnly ? <ShieldOff size={22} className="text-slate-500" /> : <AlertTriangle size={22} className="text-red-500" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-black text-[#1B3A6B]">
                                        {isReadOnly ? 'Document Revision Details' : title}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-500 mt-1">
                                        {applicantName}
                                        {applicantCode && <span className="text-slate-400 ml-1.5">— {applicantCode}</span>}
                                    </p>
                                </div>
                                <button
                                    onClick={onCancel}
                                    className="text-slate-300 hover:text-red-400 transition-colors shrink-0 mt-1"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>

                        {/* READ-ONLY: Reason + Author + Timestamp */}
                        {isReadOnly && (
                            <div className="mx-7 mb-4 space-y-3">
                                <div className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Reason for Revision Request</p>
                                    <p className="text-[11px] font-semibold text-slate-700 leading-relaxed">{disqualificationReason || 'No reason provided'}</p>
                                </div>
                                <div className="flex items-center gap-4 px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                    {disqualifiedByName && (
                                        <div className="flex items-center gap-1.5">
                                            <User size={12} className="text-slate-400" />
                                            <p className="text-[10px] font-bold text-slate-500">{disqualifiedByName}</p>
                                        </div>
                                    )}
                                    {disqualifiedAt && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-slate-400" />
                                            <p className="text-[10px] font-bold text-slate-500">{new Date(disqualifiedAt).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* INTERACTIVE: Evaluation Gaps Summary */}
                        {!isReadOnly && (unmetCriteria.length > 0 || unverifiedDocs.length > 0) && (
                            <div className="mx-7 mb-4 px-5 py-3 bg-amber-50/70 border border-amber-100 rounded-2xl">
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5">
                                    Documents Flagged for Revision
                                </p>
                                <ul className="space-y-1">
                                    {unmetCriteria.map((c, i) => (
                                        <li key={`c-${i}`} className="text-[11px] font-semibold text-amber-700 flex items-start gap-2">
                                            <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                                            <span>Criteria not yet satisfied: {c}</span>
                                        </li>
                                    ))}
                                    {unverifiedDocs.map((d, i) => (
                                        <li key={`d-${i}`} className="text-[11px] font-semibold text-amber-700 flex items-start gap-2">
                                            <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                                            <span>Document needs review: {d}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* INTERACTIVE: Quick Reason Chips */}
                        {!isReadOnly && (
                            <div className="px-7 mb-3">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Quick Reasons
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {QUICK_REASONS.map((reason) => (
                                        <button
                                            key={reason}
                                            onClick={() => handleChipClick(reason)}
                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* INTERACTIVE: Textarea */}
                        {!isReadOnly && (
                            <div className="px-7 mb-5">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Reason for Disqualification <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={4}
                                    placeholder="Explain why this applicant does not meet the qualification standards..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all resize-none"
                                    autoFocus
                                />
                                <div className="flex justify-between items-center mt-1.5 px-1">
                                    {remarks.trim().length > 0 && remarks.trim().length < MIN_REMARKS_LENGTH ? (
                                        <p className="text-[10px] font-bold text-amber-500">
                                            {charsLeft} more character{charsLeft !== 1 ? 's' : ''} needed
                                        </p>
                                    ) : (
                                        <p className="text-[10px] font-bold text-slate-300">
                                            {remarks.length} character{remarks.length !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                    <p className="text-[9px] font-semibold text-slate-300">Ctrl+Enter to confirm</p>
                                </div>
                            </div>
                        )}

                        {/* ACTIONS */}
                        <div className="px-7 pb-7 flex items-center justify-end gap-3">
                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className={`px-5 py-2.5 border border-slate-200 text-[#1B3A6B] hover:bg-slate-50 transition-all rounded-xl text-[11px] font-bold disabled:opacity-50 ${isReadOnly ? 'w-full justify-center flex' : ''}`}
                            >
                                {isReadOnly ? 'Close' : 'Cancel'}
                            </button>
                            {!isReadOnly && (
                                <button
                                    onClick={handleConfirm}
                                    disabled={!isValid || loading}
                                    className={`px-5 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-all ${
                                        isValid && !loading
                                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                    }`}
                                >
                                    {loading ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <XCircle size={14} />
                                    )}
                                    Confirm Disqualification
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DisqualificationModal;
