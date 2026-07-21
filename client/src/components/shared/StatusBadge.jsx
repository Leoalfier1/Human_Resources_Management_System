const VARIANT_CONFIG = {
    draft:           { label: 'DRAFT',           bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200' },
    pending:         { label: 'PENDING',         bg: 'bg-slate-50',    text: 'text-slate-500',   border: 'border-slate-200' },
    in_progress:     { label: 'IN PROGRESS',     bg: 'bg-[#1B3A6B]/10', text: 'text-[#1B3A6B]', border: 'border-[#1B3A6B]/20' },
    submitted:       { label: 'SUBMITTED',       bg: 'bg-[#1B3A6B]/10', text: 'text-[#1B3A6B]', border: 'border-[#1B3A6B]/20' },
    completed:       { label: 'COMPLETED',       bg: 'bg-emerald-50',  text: 'text-emerald-600', border: 'border-emerald-100' },
    approved:        { label: 'APPROVED',        bg: 'bg-emerald-50',  text: 'text-emerald-600', border: 'border-emerald-100' },
    awarded:         { label: 'AWARDED',         bg: 'bg-amber-50',    text: 'text-amber-600',   border: 'border-amber-100' },
    rejected:        { label: 'REJECTED',        bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-100' },
    needs_action:    { label: 'NEEDS ACTION',    bg: 'bg-[#D6402F]/10', text: 'text-[#D6402F]', border: 'border-[#D6402F]/20' },
    published:       { label: 'PUBLISHED',       bg: 'bg-emerald-50',  text: 'text-emerald-600', border: 'border-emerald-100' },
    pending_review:  { label: 'PENDING REVIEW',  bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' },
    under_evaluation:{ label: 'UNDER EVALUATION', bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100' },
    qualified:       { label: 'QUALIFIED',       bg: 'bg-emerald-50',  text: 'text-emerald-600', border: 'border-emerald-100' },
    disqualified:    { label: 'DISQUALIFIED',    bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-100' },
    shortlisted:     { label: 'SHORTLISTED',     bg: 'bg-amber-50',    text: 'text-amber-600',   border: 'border-amber-100' },
    selected:        { label: 'SELECTED',        bg: 'bg-teal-50',     text: 'text-teal-600',    border: 'border-teal-100' },
    appointed:       { label: 'APPOINTED',       bg: 'bg-indigo-50',   text: 'text-indigo-600',  border: 'border-indigo-100' },
};

const DARK_OVERRIDES = {
    draft:           { bg: 'bg-white/10',  text: 'text-white', border: 'border-white/20' },
    pending:         { bg: 'bg-white/10',  text: 'text-white', border: 'border-white/20' },
    in_progress:     { bg: 'bg-white/15',  text: 'text-white', border: 'border-white/20' },
    submitted:       { bg: 'bg-white/15',  text: 'text-white', border: 'border-white/20' },
    completed:       { bg: 'bg-emerald-400/20', text: 'text-emerald-200', border: 'border-emerald-400/30' },
    approved:        { bg: 'bg-emerald-400/20', text: 'text-emerald-200', border: 'border-emerald-400/30' },
    awarded:         { bg: 'bg-amber-400/20',   text: 'text-amber-200',   border: 'border-amber-400/30' },
    rejected:        { bg: 'bg-red-400/20',     text: 'text-red-200',     border: 'border-red-400/30' },
    needs_action:    { bg: 'bg-red-400/20',     text: 'text-red-200',     border: 'border-red-400/30' },
    published:       { bg: 'bg-emerald-400/20', text: 'text-emerald-200', border: 'border-emerald-400/30' },
    pending_review:  { bg: 'bg-amber-400/20',   text: 'text-amber-200',   border: 'border-amber-400/30' },
    under_evaluation:{ bg: 'bg-purple-400/20',  text: 'text-purple-200',  border: 'border-purple-400/30' },
    qualified:       { bg: 'bg-emerald-400/20', text: 'text-emerald-200', border: 'border-emerald-400/30' },
    disqualified:    { bg: 'bg-red-400/20',     text: 'text-red-200',     border: 'border-red-400/30' },
    shortlisted:     { bg: 'bg-amber-400/20',   text: 'text-amber-200',   border: 'border-amber-400/30' },
    selected:        { bg: 'bg-teal-400/20',    text: 'text-teal-200',    border: 'border-teal-400/30' },
    appointed:       { bg: 'bg-indigo-400/20',  text: 'text-indigo-200',  border: 'border-indigo-400/30' },
};

const FALLBACK = { label: '', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' };
const FALLBACK_DARK = { label: '', bg: 'bg-white/10', text: 'text-white', border: 'border-white/20' };

const StatusBadge = ({ variant, status, label: customLabel, dark = false }) => {
    const key = variant || status;
    const config = VARIANT_CONFIG[key] || FALLBACK;
    const darkConfig = DARK_OVERRIDES[key] || FALLBACK_DARK;
    const active = dark ? darkConfig : config;
    const displayLabel = customLabel || config.label || key?.replace(/_/g, ' ');

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${active.bg} ${active.text} ${active.border}`}>
            {displayLabel}
        </span>
    );
};

export { VARIANT_CONFIG };
export default StatusBadge;
