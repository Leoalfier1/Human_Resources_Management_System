import React from 'react';
import { Search, Printer } from 'lucide-react';

const STATUS_CONFIG = {
    draft:     { label: 'Draft',     bg: 'bg-slate-100', text: 'text-slate-500' },
    submitted: { label: 'Submitted', bg: 'bg-[#1B3A6B]/10', text: 'text-[#1B3A6B]' },
    attested:  { label: 'Attested',  bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

const ApplicantQueueList = ({ queue, selectedApplicantId, onSelect, searchQuery, onSearchChange, downloadPDF }) => {
    const filtered = queue.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (item.applicantName || '').toLowerCase().includes(q) ||
            (item.applicationCode || '').toLowerCase().includes(q) ||
            (item.positionTitle || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className="p-3 border-b border-slate-100">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search Applicant or order..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 outline-none focus:border-[#1B3A6B] transition-colors"
                    />
                </div>
            </div>

            {/* Queue list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filtered.length === 0 && (
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-8">
                        No applicants in this category
                    </p>
                )}
                {filtered.map(item => {
                    const isSelected = item.applicationId === selectedApplicantId;
                    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
                    const hasScore = item.totalScore !== null && item.totalScore !== undefined;

                    return (
                        <button
                            key={item.applicationId}
                            onClick={() => onSelect(item.applicationId)}
                            className={`w-full text-left rounded-2xl border p-3 transition-all ${
                                isSelected
                                    ? 'border-l-4 border-l-[#1B3A6B] border-t-slate-200 border-r-slate-200 border-b-slate-200 bg-[#1B3A6B]/5'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-start gap-2.5">
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center text-[10px] font-black text-[#1B3A6B] shrink-0">
                                    {getInitials(item.applicantName)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs font-black text-slate-700 truncate">{item.applicantName}</p>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${statusConf.bg} ${statusConf.text}`}>
                                                {statusConf.label}
                                            </span>
                                            {item.status === 'attested' && (
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(e) => { e.stopPropagation(); downloadPDF(item.iesId, item.applicantName); }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); downloadPDF(item.iesId, item.applicantName); } }}
                                                    className="p-1 rounded-full text-slate-400 hover:text-[#1B3A6B] hover:bg-[#1B3A6B]/10 transition-colors cursor-pointer"
                                                    title="Download IES PDF"
                                                >
                                                    <Printer size={12} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                                        {item.positionTitle}{item.subject ? ` (${item.subject})` : ''}
                                    </p>
                                    <p className="text-[10px] font-semibold text-slate-400 truncate">{item.school}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[9px] font-bold text-slate-300">{item.applicationCode}</p>
                                        {hasScore ? (
                                            <p className="text-[10px] font-black text-[#D6402F]">
                                                {Number(item.totalScore).toFixed(1)} pts
                                            </p>
                                        ) : (
                                            <p className="text-[9px] font-bold text-slate-300">Not scored</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ApplicantQueueList;
