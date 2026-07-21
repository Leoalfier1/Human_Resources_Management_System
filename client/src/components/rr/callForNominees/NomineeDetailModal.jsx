import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, User, Award, Calendar, Building } from 'lucide-react';

const CATEGORY_LABELS = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching'
};

const STATUS_LABELS = {
    pending_review: 'Pending Review',
    under_evaluation: 'Under Evaluation',
    advanced: 'Advanced',
    rejected: 'Rejected'
};

const NomineeDetailModal = ({ isOpen, onClose, nomination }) => {
    if (!nomination) return null;

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                            <h3 className="font-black text-lg text-[#1B3A6B] uppercase">Nominee Details</h3>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#1B3A6B] rounded-full flex items-center justify-center shrink-0">
                                    <User size={22} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-[#1B3A6B]">{nomination.nominee_name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {nomination.nominee_user_name && `System User: ${nomination.nominee_user_name}`}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <DetailRow icon={Award} label="Award" value={nomination.award_type_name} />
                                <DetailRow icon={Building} label="Category" value={CATEGORY_LABELS[nomination.nominee_category]} />
                                <DetailRow icon={User} label="Nominated By" value={nomination.nominated_by_label || '—'} />
                                <DetailRow icon={Calendar} label="Submitted" value={formatDate(nomination.submitted_at)} />
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Status</span>
                                    <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase text-[9px]">
                                        {STATUS_LABELS[nomination.status] || nomination.status}
                                    </span>
                                </div>
                            </div>

                            {nomination.nominated_by_user_name && (
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Nominator (System)</p>
                                    <p className="text-sm font-bold text-[#1B3A6B]">{nomination.nominated_by_user_name}</p>
                                </div>
                            )}

                            {nomination.documents && nomination.documents.length > 0 && (
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Supporting Documents</p>
                                    <div className="space-y-1">
                                        {nomination.documents.map(doc => (
                                            <div key={doc.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                                <FileText size={14} className="text-slate-400" />
                                                <span className="text-xs font-medium text-[#1B3A6B]">{doc.file_label || 'Document'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-bold uppercase tracking-widest">{label}</span>
        <span className="text-[#1B3A6B] font-bold">{value}</span>
    </div>
);

export default NomineeDetailModal;
