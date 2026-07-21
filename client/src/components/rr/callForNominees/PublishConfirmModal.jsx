import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Send } from 'lucide-react';

const PublishConfirmModal = ({ isOpen, onClose, onConfirm, payload, awardTypes, isEditing, existingCallId, onUpdateAndPublish }) => {
    const awardName = awardTypes.find(at => at.id === payload?.awardTypeId)?.name || '—';

    const categoryLabels = {
        teaching: 'Teaching',
        teaching_related: 'Teaching-Related',
        non_teaching: 'Non-Teaching'
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

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
                            <h3 className="text-lg font-bold text-[#1B3A6B]">Publish Call</h3>
                            <button
                                onClick={onClose}
                                className="ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                            {isEditing
                                ? 'Update and publish this nomination call? It will become visible to applicants immediately.'
                                : 'Publish this nomination call? It will become visible to applicants immediately on the R&R Opportunities page.'}
                        </p>

                        {payload && (
                            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Award</span>
                                    <span className="text-[#1B3A6B] font-bold text-right">{awardName}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Category</span>
                                    <span className="text-[#1B3A6B] font-bold">{categoryLabels[payload.eligibleCategory]}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Opens</span>
                                    <span className="text-[#1B3A6B] font-bold">{formatDate(payload.nominationOpens)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Closes</span>
                                    <span className="text-[#1B3A6B] font-bold">{formatDate(payload.nominationCloses)}</span>
                                </div>
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
                                onClick={() => {
                                    if (isEditing && existingCallId) {
                                        onUpdateAndPublish(existingCallId, {
                                            award_type_id: payload?.awardTypeId,
                                            eligible_category: payload?.eligibleCategory,
                                            nomination_opens: payload?.nominationOpens,
                                            nomination_closes: payload?.nominationCloses,
                                            criteria_summary: payload?.criteriaSummary
                                        });
                                    } else {
                                        onConfirm();
                                    }
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D6402F] text-white text-xs font-black uppercase tracking-widest hover:bg-[#c03525] transition-all"
                            >
                                <Send size={14} />
                                {isEditing ? 'Update & Publish' : 'Confirm Publish'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PublishConfirmModal;
