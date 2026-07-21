import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, Loader2, AlertTriangle } from 'lucide-react';

const PublishConfirmModal = ({ isOpen, onClose, onConfirm, isPublishing, announcement, totalWinners }) => {
    if (!isOpen) return null;

    const alreadyPublished = announcement?.status === 'published';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-[#1B3A6B] p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Megaphone size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase text-white tracking-tight">
                                    Publish Results
                                </h2>
                                <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {alreadyPublished ? (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl">
                                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-amber-800 uppercase">Already Published</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        This announcement was already published on{' '}
                                        {new Date(announcement.published_at).toLocaleDateString()}.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    You are about to officially publish the R&R results. Once published:
                                </p>
                                <ul className="space-y-2">
                                    {[
                                        'Notifications will be sent based on your settings',
                                        'Results become visible to all notified parties',
                                        'This announcement record is locked and cannot be unpublished'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#D6402F] mt-1.5 shrink-0" />
                                            <span className="text-xs text-slate-600">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                        Winners to be announced
                                    </p>
                                    <p className="text-lg font-black text-[#1B3A6B]">
                                        {totalWinners} {totalWinners === 1 ? 'winner' : 'winners'}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                        Memo attachment
                                    </p>
                                    <p className="text-xs font-bold text-slate-700">
                                        {announcement?.memo_file_path ? 'Memo attached' : 'No memo uploaded'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors"
                        >
                            Cancel
                        </button>
                        {!alreadyPublished && (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onConfirm}
                                disabled={isPublishing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#D6402F] hover:bg-[#c0352a] disabled:opacity-60 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md transition-colors"
                            >
                                {isPublishing ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Megaphone size={14} strokeWidth={2.5} />
                                )}
                                {isPublishing ? 'Publishing...' : 'Confirm Publish'}
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PublishConfirmModal;
