import React from 'react';
import { MapPin, Users, Clock, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ─── CALENDAR COUNTDOWN WIDGET ────────────────────────────────────────────────
const CalendarWidget = ({ daysLeft, daysElapsed, deadlineDate }) => {
    const TOTAL = 10;
    const elapsed = Math.min(TOTAL, Math.max(0, daysElapsed));
    const pct = (elapsed / TOTAL) * 100;
    const isUrgent = daysLeft <= 3;
    const isClosed = daysLeft < 0;

    return (
        <div className="min-w-[130px]">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5">
                <span className="text-slate-400">Calendar Days</span>
                <span className={isClosed ? 'text-slate-400' : isUrgent ? 'text-[#D6402F]' : 'text-[#1B3A6B]'}>
                    {isClosed ? 'Closed' : `${elapsed}/10`}
                </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${isClosed ? 100 : pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isClosed ? 'bg-slate-300' : isUrgent ? 'bg-[#D6402F]' : 'bg-[#1B3A6B]'}`}
                />
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-tight">
                Deadline: {new Date(deadlineDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
        </div>
    );
};

// ─── QUAL TAG CHIPS ───────────────────────────────────────────────────────────
const QualChips = ({ qualString }) => {
    if (!qualString) return null;
    
    // Parse qualifications from a text string — split on common delimiters
    const raw = qualString.split(/[,;|\n]/).map(s => s.trim()).filter(Boolean);
    
    // Detect common short tags
    const chips = raw.map(q => {
        if (/bachelor|bsed|beed|degree/i.test(q)) return { label: extractDegree(q), key: q };
        if (/let|licensure/i.test(q)) return { label: 'LET passer', key: q };
        if (/(\d+)\s*(hour|hr)/i.test(q)) {
            const m = q.match(/(\d+)\s*(hour|hr)/i);
            return { label: `Relevant training: ${m[1]} hrs`, key: q };
        }
        if (/experience/i.test(q)) return { label: '1 yr experience', key: q };
        return { label: q.length > 30 ? q.slice(0, 27) + '…' : q, key: q };
    });

    const visible = chips.slice(0, 3);
    const overflow = chips.length - 3;

    return (
        <div className="flex flex-wrap gap-2 mt-3">
            {visible.map((c, i) => (
                <span
                    key={i}
                    className="bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-bold px-3 py-1 rounded-full"
                >
                    {c.label}
                </span>
            ))}
            {overflow > 0 && (
                <span className="text-[10px] font-black text-slate-400 px-2 py-1">
                    +{overflow} more
                </span>
            )}
        </div>
    );
};

function extractDegree(q) {
    if (/mathematics/i.test(q)) return 'BSEd/BSE major in Math';
    if (/science/i.test(q)) return 'BSEd/BSE major in Science';
    if (/english/i.test(q)) return 'BSEd/BSE major in English';
    if (/filipino/i.test(q)) return 'BSEd/BSE major in Filipino';
    if (/bsed|bse/i.test(q)) return 'BSEd/BSE degree';
    if (/beed|beed/i.test(q)) return 'BEEd degree';
    return q.length > 28 ? q.slice(0, 25) + '…' : q;
}

// ─── JOB CARD ─────────────────────────────────────────────────────────────────
const JobCard = ({ job, index = 0 }) => {
    const daysLeft = job.days_left ?? 0;
    const daysElapsed = job.days_elapsed ?? 0;
    const isClosed = job.computed_status === 'closed';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-2xl border shadow-sm relative flex flex-col hover:shadow-lg transition-shadow duration-200
                ${job.is_featured ? 'border-[#D6402F]/40 shadow-red-50' : 'border-slate-100'}`}
        >
            {/* Featured badge */}
            {!!job.is_featured && (
                <div className="flex items-center gap-1.5 bg-[#D6402F] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-t-2xl">
                    <Star size={10} fill="currentColor" />
                    Featured Opening
                </div>
            )}

            <div className="p-6 flex flex-col flex-1">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-black text-[#1B3A6B] uppercase italic leading-tight">
                            {job.position_title}
                            {job.subject && (
                                <span className="text-[#D6402F]"> ({job.subject})</span>
                            )}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mt-1">
                            <MapPin size={12} className="text-[#1B3A6B] flex-shrink-0" />
                            <span className="truncate">{job.school_name || job.assigned_school}</span>
                        </div>
                    </div>
                    <span className="bg-blue-50 text-[#1B3A6B] text-[10px] font-black px-3 py-1.5 rounded-xl border border-blue-100 whitespace-nowrap">
                        {job.salary_grade || `SG-${job.salary_grade}`}
                    </span>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                        <Users size={12} className="text-slate-300" />
                        {job.no_of_vacancies || 1} {job.no_of_vacancies === 1 ? 'vacancy' : 'vacancies'}
                    </span>
                    {job.monthly_salary && (
                        <span className="text-[#1B3A6B] font-black">
                            ₱{Number(job.monthly_salary).toLocaleString('en-PH')}/month
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Users size={12} className="text-slate-300" />
                        {job.applicant_count || 0} applicants
                    </span>
                </div>

                {/* Qualification chips */}
                <QualChips qualString={job.minimum_qualifications} />

                {/* Divider */}
                <div className="border-t border-slate-50 mt-4 mb-4" />

                {/* Bottom row */}
                <div className="flex items-end justify-between gap-4 mt-auto">
                    <div className="flex-1">
                        <CalendarWidget
                            daysLeft={daysLeft}
                            daysElapsed={daysElapsed}
                            deadlineDate={job.deadline_date}
                        />
                        <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-tight">
                            Ref: {job.ref_no} · Posted: {new Date(job.posting_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>

                    <Link
                        to={`/jobs/${job.id}`}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md
                            ${isClosed
                                ? 'bg-slate-100 text-slate-400 pointer-events-none'
                                : 'bg-[#1B3A6B] hover:bg-[#162E55] text-white shadow-blue-900/20'}`}
                    >
                        {isClosed ? 'Closed' : <>View &amp; Apply <ChevronRight size={14} /></>}
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default JobCard;