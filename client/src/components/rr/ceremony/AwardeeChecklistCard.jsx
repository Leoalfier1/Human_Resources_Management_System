import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck } from 'lucide-react';
import StatusBadgeDropdown from './StatusBadgeDropdown';

const CATEGORY_LABELS = {
    teaching: 'Outstanding Teacher',
    teaching_related: 'Outstanding Teaching-Related',
    non_teaching: 'Outstanding Non-Teaching'
};

const AwardeeChecklistCard = ({ awardees, onToggleAttendance, onChangeCertStatus, onChangePlaqueStatus }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center">
                    <ClipboardCheck size={18} className="text-[#1B3A6B]" />
                </div>
                <h3 className="text-sm font-black uppercase text-[#1B3A6B] tracking-tight">
                    Awardee Checklist
                </h3>
                <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {awardees.length} awardee{awardees.length !== 1 ? 's' : ''}
                </span>
            </div>

            {awardees.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-xs font-bold text-slate-400">No approved awardees for this cycle</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {awardees.map((aw, i) => (
                        <motion.div
                            key={aw.nomination_id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors"
                        >
                            {/* Row 1: Name + attendance pill */}
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm font-black text-[#1B3A6B]">{aw.nominee_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        {aw.award_type_name || CATEGORY_LABELS[aw.nominee_category] || 'Award'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onToggleAttendance(aw.nomination_id)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors
                                        ${aw.attendance_confirmed
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                >
                                    {aw.attendance_confirmed ? 'Confirmed' : 'Pending'}
                                </button>
                            </div>

                            {/* Row 2: Cert + Plaque badges */}
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        CERTIFICATE
                                    </span>
                                    <StatusBadgeDropdown
                                        status={aw.certificate_status}
                                        onChange={(s) => onChangeCertStatus(aw.nomination_id, s)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        PLAQUE
                                    </span>
                                    <StatusBadgeDropdown
                                        status={aw.plaque_status}
                                        onChange={(s) => onChangePlaqueStatus(aw.nomination_id, s)}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default AwardeeChecklistCard;
