import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, CheckCircle, Star, Clock, Target, BarChart3, Award } from 'lucide-react';
import { usePMDashboard } from '../../../hooks/usePMDashboard';

const PHASES = [
    { phase: 1, label: 'Performance Planning & Commitment', months: 'January', icon: ClipboardList, color: 'bg-blue-500' },
    { phase: 2, label: 'Performance Monitoring & Coaching', months: 'March, June, September', icon: Target, color: 'bg-amber-500' },
    { phase: 3, label: 'Performance Review & Evaluation', months: 'June, October, November', icon: BarChart3, color: 'bg-purple-500' },
    { phase: 4, label: 'Rewarding & Development Planning', months: 'December', icon: Award, color: 'bg-emerald-500' },
];

const PMDashboard = () => {
    const { data, loading } = usePMDashboard();
    const navigate = useNavigate();

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>;

    const activePeriod = data?.periods?.find(p => p.status === 'active');
    const summary = data?.summary;

    const stats = [
        { label: 'Total Personnel', value: summary?.total_personnel || 0, icon: Users, color: 'bg-blue-500' },
        { label: 'Submitted IPCRFs', value: summary?.submitted_count || 0, icon: CheckCircle, color: 'bg-amber-500' },
        { label: 'Pending Ratings', value: (summary?.total_personnel || 0) - (summary?.rated_count || 0), icon: Clock, color: 'bg-red-500' },
        { label: 'Rated This Period', value: summary?.rated_count || 0, icon: Star, color: 'bg-emerald-500' },
    ];

    return (
        <div className="space-y-8">
            {!activePeriod && (
                <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] px-8 py-6 text-center">
                    <p className="text-amber-800 font-bold text-lg">No active performance period</p>
                    <p className="text-amber-600 text-sm mt-1">Go to Phase 1 — Planning to create a new period.</p>
                </div>
            )}

            {activePeriod && (
                <div className="bg-[#1B3A6B] rounded-[2.5rem] px-8 py-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Active Period</p>
                            <p className="text-2xl font-black mt-1">{activePeriod.school_year}</p>
                            <p className="text-blue-200 text-sm font-bold">Phase {activePeriod.phase}: {activePeriod.period_label || `Phase ${activePeriod.phase}`}</p>
                        </div>
                        <div className="bg-white/10 px-5 py-3 rounded-2xl text-center">
                            <p className="text-2xl font-black">{activePeriod.start_date?.split('T')[0]} → {activePeriod.end_date?.split('T')[0]}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider">{s.label}</p>
                            <div className={`${s.color} p-2.5 rounded-xl text-white`}><s.icon size={18} /></div>
                        </div>
                        <p className="text-4xl font-black text-[#1B3A6B]">{s.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <h2 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight mb-6">Annual PM Cycle Timeline</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {PHASES.map((p, i) => {
                        const isActive = activePeriod && p.phase === activePeriod.phase;
                        const isPast = activePeriod && p.phase < activePeriod.phase;
                        return (
                            <motion.div key={p.phase} whileHover={{ scale: 1.02 }}
                                className={`rounded-[2.5rem] p-5 border-2 cursor-pointer transition-all
                                    ${isActive ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 shadow-lg' : isPast ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                                onClick={() => navigate(isActive ? `/pm/planning` : '#')}
                            >
                                <div className={`${p.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3`}>
                                    <p.icon size={20} />
                                </div>
                                <p className="text-xs font-black text-[#1B3A6B] uppercase tracking-tight mb-1">Phase {p.phase}</p>
                                <p className="text-sm font-bold text-slate-700 leading-tight mb-2">{p.label}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.months}</p>
                                {isActive && <span className="inline-block mt-2 text-[10px] font-black text-[#D6402F] uppercase tracking-widest">Active Now</span>}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <button onClick={() => navigate('/pm/planning')} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 text-left hover:shadow-md transition-all">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Quick Action</p>
                    <p className="text-lg font-black text-[#1B3A6B]">Manage IPCRF/OPCRF Forms</p>
                    <p className="text-sm text-slate-500 mt-1">Create, review, and finalize performance commitments</p>
                </button>
                <button onClick={() => navigate('/pm/evaluation')} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 text-left hover:shadow-md transition-all">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Quick Action</p>
                    <p className="text-lg font-black text-[#1B3A6B]">Rate Commitments</p>
                    <p className="text-sm text-slate-500 mt-1">Evaluate submitted IPCRFs and OPCRFs</p>
                </button>
            </div>
        </div>
    );
};

export default PMDashboard;
