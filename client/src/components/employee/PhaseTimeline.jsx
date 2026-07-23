import React from 'react';

const PHASE_CONFIG = [
  { num: 1, title: "Planning & Commitment",      route: "/pm/my-ipcrf",    months: "January" },
  { num: 2, title: "Monitoring & Coaching",       route: "/pm/my-progress", months: "March · June · September" },
  { num: 3, title: "Review & Evaluation",         route: "/pm/my-review",   months: "June · October · November" },
  { num: 4, title: "Rewarding & Dev Planning",    route: "/pm/recognition", months: "December" },
];

const STATUS_STYLE = {
  completed:  { bg: "bg-emerald-100 text-emerald-800", label: "Completed", cardBg: "bg-slate-50 border border-slate-200", titleColor: "text-[#1e293b] group-hover:text-[#F59E0B]" },
  active:     { bg: "bg-[#F59E0B] text-white",        label: "Active",     cardBg: "bg-[#1e293b] text-white",             titleColor: "" },
  upcoming:   { bg: "bg-slate-200 text-black",    label: "Upcoming",   cardBg: "bg-slate-50 border border-slate-200/60 opacity-60", titleColor: "text-slate-800 group-hover:text-black" },
};

const PhaseTimeline = ({ ratingPeriodLabel, onPhaseClick, phases }) => {
    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm select-none">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">My Annual PM Cycle — {ratingPeriodLabel || "Current Period"}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PHASE_CONFIG.map((p, i) => {
                    const status = (phases && phases[p.num]) || "upcoming";
                    const s = STATUS_STYLE[status] || STATUS_STYLE.upcoming;
                    return (
                        <div 
                            key={p.num}
                            onClick={() => onPhaseClick && onPhaseClick(p.route)}
                            className={`${s.cardBg} p-4 rounded-2xl text-left flex flex-col gap-1.5 transition-all cursor-pointer group hover:opacity-95`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Phase {p.num}</span>
                                <span className={`${s.bg} text-[9px] font-black uppercase px-2 py-0.5 rounded-full`}>{s.label}</span>
                            </div>
                            <p className={`text-xs font-black uppercase ${s.titleColor}`}>{p.title}</p>
                            <span className="text-[9px] font-bold text-slate-600 uppercase">{p.months}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PhaseTimeline;
