// client/src/components/rsp/dashboard/DashboardComponents.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Check, Clock, AlertTriangle, UserPlus, 
    Info, ChevronRight, Briefcase, MapPin, Users 
} from 'lucide-react';

// ─── 1. ANIMATED STAT COUNTER ───────────────────────────────────────────────
const AnimatedNumber = ({ value }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const duration = 1000;
        const increment = value / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                clearInterval(timer);
                setCount(value);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{count}</span>;
};

// ─── 2. STAT CARD ───────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, value, label, context, colorClass }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass}`}>
                <Icon size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                {context}
            </span>
        </div>
        <div>
            <h3 className="text-3xl font-black text-[#1B3A6B]">
                <AnimatedNumber value={value || 0} />
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{label}</p>
        </div>
    </div>
);

// ─── 3. TURNAROUND TIME (TAT) CARD ──────────────────────────────────────────
export const TATCard = ({ items, target }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6">Process TAT Monitoring</h4>
        <div className="space-y-5 flex-1">
            {items?.length > 0 ? items.map(item => (
                <div key={item.ref_no}>
                    <div className="flex justify-between text-[11px] font-black mb-1.5 uppercase">
                        <span className="text-[#1B3A6B]">{item.ref_no}</span>
                        {item.is_over ? (
                            <span className="text-[#D6402F] animate-pulse">⚠ Over Target</span>
                        ) : (
                            <span className="text-emerald-600">{item.working_days_elapsed} / {target} WD</span>
                        )}
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((item.working_days_elapsed / target) * 100, 100)}%` }}
                            className={`h-full transition-all duration-1000 ${item.is_over ? 'bg-[#D6402F]' : 'bg-emerald-500'}`}
                        />
                    </div>
                </div>
            )) : <p className="text-center text-slate-300 text-xs py-10 uppercase font-bold">No active TAT data</p>}
        </div>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-6 pt-4 border-t border-slate-50">
            PRIME-HRM Target: {target} Working Days
        </p>
    </div>
);

// ─── 4. RECENT ACTIVITY CARD ────────────────────────────────────────────────
export const ActivityCard = ({ items }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6">Recent Activity Log</h4>
        <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] sidebar-scroll pr-2">
            {items?.length > 0 ? items.map((act) => (
    <div key={`${act.created_at}-${act.action_description?.slice(0,20)}`} className="flex gap-4 text-xs border-b border-slate-50 pb-4 last:border-0">
                    <div className="mt-0.5 text-[#1B3A6B] bg-blue-50 p-2 rounded-xl shrink-0 h-fit">
                        <Info size={14} />
                    </div>
                    <div>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            <span className="font-black text-[#1B3A6B] uppercase">{act.actor_name}:</span> {act.action_description}
                        </p>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1 block">
                            {new Date(act.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            )) : <p className="text-center text-slate-300 text-xs py-10 uppercase font-bold">No recent activities</p>}
        </div>
    </div>
);

// ─── 5. VACANCY PROGRESS TRACKER (Functional Logic) ──────────────────────────
export const VacancyProgressTracker = ({ vacancies }) => {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState(null);

    // Sync selectedId when vacancies load
    useEffect(() => {
        if (vacancies?.length > 0 && !selectedId) {
            setSelectedId(vacancies[0].id);
        }
    }, [vacancies]);

    const currentVac = vacancies?.find(v => v.id === selectedId);

    // STAGE ROUTE MAPPING: Maps Stage 1-11 to your existing App.jsx routes
    const getRouteForStage = (stage) => {
        const routes = {
            1: '/rsp/vacancy-posting',         // Publication
            2: '/rsp/applicants',              // Submission window
            3: '/rsp/initial-evaluation',       // Screening
            4: '/rsp/initial-evaluation',       // Validation (usually same UI)
            5: '/rsp/applicants',              // Posting Qualified List
            6: '/rsp/comparative-assessment',   // Scoring Rubric
            7: '/rsp/results-posting',          // Result Preview
            8: '/rsp/deliberation',             // HRMPSB Shortlist
            9: '/rsp/congratulatory-advice',    // SDS Selection
            10: '/rsp/appointment-processing',  // Document Review
            11: '/rsp/notice-of-appointment'    // Final Posting
        };
        return routes[stage] || '/rsp/dashboard';
    };

    if (!currentVac) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 opacity-50 my-8">
                <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest">No Active Vacancy Workflows Found</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 my-8 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-50 pb-6">
                <div>
                    <h3 className="text-xl font-black text-[#1B3A6B] uppercase italic">Active Vacancy Progress Tracker</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">11-Stage RSP Workflow Engine</p>
                </div>
                <button 
                    onClick={() => navigate('/rsp/vacancy-posting')} 
                    className="text-[10px] font-black text-[#D6402F] hover:underline uppercase tracking-[0.2em] flex items-center gap-2"
                >
                    Manage All Positions <ChevronRight size={14} />
                </button>
            </div>

            {/* Vacancy Switcher Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-8 sidebar-scroll">
                {vacancies.map(v => (
                    <button
                        key={v.id}
                        onClick={() => setSelectedId(v.id)}
                        className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                            v.id === selectedId 
                                ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white shadow-lg shadow-blue-900/20' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                    >
                        {v.ref_no}
                    </button>
                ))}
            </div>

            {/* Selection Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-7 rounded-[2rem] mb-10 border border-slate-100">
                <div>
                    <h4 className="text-2xl font-black text-[#1B3A6B] uppercase italic leading-tight">{currentVac.position_title}</h4>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <MapPin size={12} /> {currentVac.assigned_school}
                        </p>
                        <p className="text-[10px] font-bold text-[#D6402F] uppercase tracking-widest flex items-center gap-1">
                            <Users size={12} /> {currentVac.total_applicants} Applicants
                        </p>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <div className="bg-white px-5 py-2 rounded-xl border border-slate-200 text-center">
                        <p className="text-lg font-black text-[#1B3A6B]">{currentVac.days_left}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Days Left</p>
                    </div>
                </div>
            </div>

            {/* Horizontal Workflow Line */}
            <div className="overflow-x-auto sidebar-scroll pb-10 mb-6">
                <div className="min-w-[1100px] flex justify-between items-center relative px-6">
                    {/* Background Connecting Line */}
                    <div className="absolute left-10 right-10 top-6 h-1.5 bg-slate-100 -z-0 rounded-full" />
                    
                    {/* Progress Fill Line */}
                    <motion.div
    key={currentVac.current_stage}
    initial={{ width: 0 }}
    animate={{ width: `${((currentVac.current_stage - 1) / 10) * 95}%` }}
    transition={{ duration: 1.5, ease: "easeInOut" }}
    className="absolute left-10 top-6 h-1.5 bg-emerald-500 -z-0 rounded-full"
/>

                    {currentVac.workflow?.map((node) => {
                        const isComplete = node.status === 'complete';
                        const isActive = node.status === 'active';

                        return (
                            <div key={node.stage} className="flex flex-col items-center relative z-10 w-24">
                                <motion.div 
                                    whileHover={{ scale: 1.1 }}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shadow-xl transition-all ${
                                        isComplete ? 'bg-emerald-500 text-white ring-8 ring-emerald-50' :
                                        isActive ? 'bg-[#1B3A6B] text-white ring-8 ring-blue-50 scale-110' : 
                                        'bg-white text-slate-300 border-2 border-slate-200'
                                    }`}
                                >
                                    {isComplete ? <Check strokeWidth={4} size={20} /> : node.stage}
                                </motion.div>
                                <span className={`text-[9px] font-black uppercase tracking-tighter mt-4 text-center leading-tight h-8 ${
                                    isActive ? 'text-[#1B3A6B]' : isComplete ? 'text-slate-600' : 'text-slate-300'
                                }`}>
                                    {node.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Call to Action Row */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-[#1B3A6B] p-6 rounded-[2rem] gap-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl text-emerald-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-blue-300 uppercase tracking-[0.2em] mb-0.5">Current Processing Stage</p>
                        <h5 className="text-white font-black uppercase tracking-tight">
                            Stage {currentVac.current_stage}: <span className="text-emerald-400 italic ml-1">{currentVac.stage_name}</span>
                        </h5>
                    </div>
                </div>
                
                {/* DYNAMIC NAVIGATION BUTTON */}
                <button
                    onClick={() => navigate(getRouteForStage(currentVac.current_stage))}
                    className="w-full md:w-auto px-10 py-4 bg-white hover:bg-emerald-50 text-[#1B3A6B] font-black text-xs rounded-2xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
                >
                    Process Phase <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

// ─── 6. DEADLINES CARD ───────────────────────────────────────────────────────
export const DeadlinesCard = ({ items }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6">Upcoming RSP Deadlines</h4>
        <div className="space-y-3 flex-1">
            {items?.length > 0 ? items.map((item, i) => {
                const colors = {
                    red: 'text-red-600 bg-red-50 border-red-100',
                    orange: 'text-amber-600 bg-amber-50 border-amber-100',
                    default: 'text-blue-600 bg-blue-50 border-blue-100'
                }[item.urgency] || 'text-slate-600 bg-slate-50 border-slate-100';

                return (
                    <div key={i} className={`flex items-center justify-between text-[11px] p-4 rounded-2xl border ${colors} font-black uppercase tracking-tighter`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${item.urgency === 'red' ? 'bg-red-500 animate-ping' : 'bg-blue-400'}`} />
                            <span className="truncate max-w-[150px]">{item.label}</span>
                        </div>
                        <span className="shrink-0 whitespace-nowrap ml-2">
    {item.days_remaining === 0 ? 'Due Today' : `${item.days_remaining}d Left`}
</span>
                    </div>
                );
            }) : <p className="text-center text-slate-300 text-xs py-10 uppercase font-bold">No upcoming deadlines</p>}
        </div>
    </div>
);