import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FILTER_OPTIONS = [
    { value: 'all', label: 'ALL' },
    { value: 'teaching', label: 'TEACHING' },
    { value: 'teaching_related', label: 'TEACHING-RELATED' },
    { value: 'non_teaching', label: 'NON-TEACHING' }
];

const CATEGORY_COLORS = {
    teaching: { border: 'border-blue-400', text: 'text-blue-600', bg: 'bg-blue-50' },
    teaching_related: { border: 'border-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' },
    non_teaching: { border: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' }
};

const CATEGORY_LABELS = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching'
};

const IncomingNomineesTable = ({ nominations, categoryFilter, onFilterChange, onNomineeClick }) => {
    const formatName = (name) => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        if (parts.length <= 1) return <span className="font-bold text-[#1B3A6B]">{name}</span>;
        const surname = parts[parts.length - 1];
        const given = parts.slice(0, -1).join(' ');
        return (
            <span className="font-bold text-[#1B3A6B]">
                {given} <span className="text-[#D6402F]">{surname}</span>
            </span>
        );
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B]">
                    Incoming Nominees
                </h3>
                <div className="flex gap-1.5">
                    {FILTER_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => onFilterChange(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                categoryFilter === opt.value
                                    ? 'bg-[#D6402F] text-white shadow-sm'
                                    : 'border border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {nominations.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No nominations received yet</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-3 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Nominee Name</th>
                                <th className="text-left py-3 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                <th className="text-left py-3 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Award</th>
                                <th className="text-left py-3 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Nominated By</th>
                                <th className="text-left py-3 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="text-left py-3 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {nominations.map((nom, i) => {
                                    const catColor = CATEGORY_COLORS[nom.nominee_category] || CATEGORY_COLORS.teaching;
                                    return (
                                        <motion.tr
                                            key={nom.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            onClick={() => onNomineeClick(nom)}
                                            className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <td className="py-3 px-3 text-sm">
                                                {formatName(nom.nominee_name)}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${catColor.border} ${catColor.text} ${catColor.bg}`}>
                                                    {CATEGORY_LABELS[nom.nominee_category]}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-bold text-[#D6402F]">
                                                    {nom.award_type_name}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-xs text-slate-600">
                                                {nom.nominated_by_label || '—'}
                                            </td>
                                            <td className="py-3 px-3 text-xs text-slate-500">
                                                {formatDate(nom.submitted_at)}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-500">
                                                    {nom.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
};

export default IncomingNomineesTable;
