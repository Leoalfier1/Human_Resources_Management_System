import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const DeleteVacancyModal = ({ isOpen, onClose, onConfirm, vacancy, loading }) => {
    if (!isOpen || !vacancy) return null;

    const hasApplicants = (vacancy.applicant_count || 0) > 0;

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
                            <div className="p-3 bg-red-50 rounded-2xl">
                                <AlertTriangle className="text-[#D6402F]" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">
                                    Delete Vacancy Posting?
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
                                This will move the posting to Recently Deleted. You can restore it within 30 days or delete it permanently.
                            </p>

                            {hasApplicants && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                    <p className="text-sm font-bold text-amber-700 leading-relaxed">
                                        This vacancy has {vacancy.applicant_count} active applicant(s). Deleting it will not affect their existing applications, but the posting will no longer accept new applicants.
                                    </p>
                                </div>
                            )}
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
                                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-[#D6402F] text-white shadow-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DeleteVacancyModal;
