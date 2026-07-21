import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Send, Flag, ExternalLink, AlertTriangle } from 'lucide-react';
import { SERVER_BASE } from '../../../utils/api';

const CATEGORY_LABELS = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching'
};

const NomineeDocumentChecklist = ({
    checklistData,
    onRequestMissingDocs,
    onFlagForReview
}) => {
    if (!checklistData) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center justify-center min-h-[300px]"
            >
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                    Select a nominee to view their document checklist
                </p>
            </motion.div>
        );
    }

    const { nomination, checklist, total_required, submitted_required, completeness_pct, preliminary_status } = checklistData;
    const isReady = preliminary_status === 'ready';
    const barColor = completeness_pct >= 100 ? 'bg-emerald-500' : 'bg-[#D6402F]';

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={nomination.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-black text-[#1B3A6B]">
                            {nomination.nominee_name}
                        </h2>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                            {nomination.award_type_name} &middot; {CATEGORY_LABELS[nomination.nominee_category]}
                        </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        isReady
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-[#D6402F]/10 text-[#D6402F]'
                    }`}>
                        {isReady ? 'READY' : 'NEEDS ACTION'}
                    </span>
                </div>

                {/* Completeness bar */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Document Completeness
                        </span>
                        <span className="text-[10px] font-black text-slate-500 tabular-nums">
                            {submitted_required}/{total_required} documents
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completeness_pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${barColor}`}
                        />
                    </div>
                </div>

                {/* Flag notice */}
                {nomination.is_flagged && (
                    <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Flagged for Review</p>
                            {nomination.flagged_note && (
                                <p className="text-xs text-amber-600 mt-0.5">{nomination.flagged_note}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Checklist */}
                <div className="space-y-2 mb-6">
                    {checklist.map((item) => (
                        <motion.div
                            key={item.requirement_id}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                item.is_submitted
                                    ? 'bg-emerald-50/60 border-emerald-200'
                                    : 'bg-red-50/60 border-red-200'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {item.is_submitted ? (
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                ) : (
                                    <XCircle size={16} className="text-[#D6402F] shrink-0" />
                                )}
                                <span className={`text-xs font-semibold ${
                                    item.is_submitted ? 'text-emerald-700' : 'text-[#D6402F]'
                                }`}>
                                    {item.document_label}
                                </span>
                                {item.is_submitted && item.submitted_doc?.file_path && (
                                    <a
                                        href={`${SERVER_BASE}/${item.submitted_doc.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[#1B3A6B] hover:text-[#D6402F] transition-colors"
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                            {!item.is_submitted && item.is_required && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#D6402F]/10 text-[#D6402F]">
                                    Missing
                                </span>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                    {!isReady && (
                        <button
                            onClick={() => onRequestMissingDocs(nomination)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#1B3A6B] text-[#1B3A6B] text-[10px] font-black uppercase tracking-widest hover:bg-[#1B3A6B] hover:text-white transition-all"
                        >
                            <Send size={14} />
                            Request Missing Docs
                        </button>
                    )}
                    <button
                        onClick={() => onFlagForReview(nomination)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#1B3A6B] text-[#1B3A6B] text-[10px] font-black uppercase tracking-widest hover:bg-[#1B3A6B] hover:text-white transition-all"
                    >
                        <Flag size={14} />
                        Flag for Review
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NomineeDocumentChecklist;
