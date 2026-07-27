import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Target, FileText, PlayCircle, BarChart3, Users, Clock, Award, BookOpen, CheckCircle, Activity, GraduationCap } from 'lucide-react';
import { useLDDashboard } from '../../../hooks/useLDDashboard';
import { API_BASE } from '../../../utils/api';

const STEPS = [
    { id: 1, title: 'TNA', label: 'Training Needs Assessment', icon: ClipboardList },
    { id: 2, title: 'Objectives', label: 'L&D Objectives', icon: Target },
    { id: 3, title: 'Planning', label: 'Learning Dev\'t Plan', icon: FileText },
    { id: 4, title: 'Implementation', label: 'Training Programs', icon: PlayCircle },
    { id: 5, title: 'Evaluation', label: 'Impact Assessment', icon: BarChart3 },
];

const Skeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-[2.5rem]" />)}
        </div>
        <div className="h-20 bg-slate-200 rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-200 rounded-[2.5rem]" />
            <div className="h-48 bg-slate-200 rounded-[2.5rem]" />
        </div>
    </div>
);

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
            <div className={`p-2.5 rounded-xl ${bgColor}`}>
                <Icon size={18} className="text-white" />
            </div>
        </div>
        <p className="text-3xl font-black text-[#1B3A6B]">{value ?? '—'}</p>
    </div>
);

const LDDashboard = () => {
    const { data, loading } = useLDDashboard();
    const [tnaStats, setTnaStats] = useState({ activeTnaForms: 0 });
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchMeta = async () => {
            const token = localStorage.getItem('token');
            const h = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
            try {
                const [tnaRes, progRes] = await Promise.all([
                    fetch(`${API_BASE}/api/ld/tna`, { headers: h }),
                    fetch(`${API_BASE}/api/ld/programs?status=ongoing`, { headers: h })
                ]);
                if (tnaRes.ok) {
                    const tnaForms = await tnaRes.json();
                    setTnaStats({ activeTnaForms: tnaForms.filter(f => f.status === 'active').length });
                }
                if (progRes.ok) {
                    const progs = await progRes.json();
                    setRecentActivity(progs.slice(0, 5));
                }
            } catch (e) { /* silent */ }
        };
        fetchMeta();
    }, []);

    if (loading) return <Skeleton />;

    const stats = {
        activeTnaForms: tnaStats.activeTnaForms,
        programsInLDP: data?.stats?.programsInLDP || 0,
        totalTrainingHours: data?.stats?.totalTrainingHours || 0,
        personnelTrained: data?.stats?.personnelTrained || 0,
    };
    const statusCounts = data?.statusCounts || { planned: 0, ongoing: 0, completed: 0, cancelled: 0 };
    const MAX_TOTAL = Math.max(statusCounts.planned + statusCounts.ongoing + statusCounts.completed + statusCounts.cancelled, 1);

    const stepStatus = (stepId) => {
        if (stepId === 1) return stats.activeTnaForms > 0 ? 'active' : 'pending';
        if (stepId === 2) return 'active';
        if (stepId === 3) return data?.planCount > 0 ? 'complete' : 'pending';
        if (stepId === 4) return data?.programCount > 0 ? 'complete' : 'pending';
        if (stepId === 5) return 'pending';
        return 'pending';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-600 p-2 rounded-xl">
                    <GraduationCap size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">L&D Dashboard</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Learning and Development Overview</p>
                </div>
            </div>

            {/* 5-Step Process Timeline */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">5-Step L&D Process</p>
                <div className="flex items-center justify-between">
                    {STEPS.map((step, idx) => {
                        const status = stepStatus(step.id);
                        return (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                        status === 'complete' ? 'bg-emerald-500 text-white' :
                                        status === 'active' ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500' :
                                        'bg-slate-100 text-slate-400'
                                    }`}>
                                        {status === 'complete' ? <CheckCircle size={24} /> : <step.icon size={22} />}
                                    </div>
                                    <p className={`text-[10px] font-black uppercase mt-2 ${
                                        status === 'complete' ? 'text-emerald-600' :
                                        status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                                    }`}>{step.title}</p>
                                    <p className="text-[8px] text-slate-400 uppercase tracking-wider mt-0.5">{step.label}</p>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className={`h-0.5 flex-1 mx-2 ${status === 'complete' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={ClipboardList} label="Active TNA Forms" value={stats.activeTnaForms} bgColor="bg-emerald-600" />
                <StatCard icon={FileText} label="Programs in LDP" value={stats.programsInLDP} bgColor="bg-teal-600" />
                <StatCard icon={Clock} label="Training Hours" value={stats.totalTrainingHours} bgColor="bg-cyan-600" />
                <StatCard icon={Users} label="Personnel Trained" value={stats.personnelTrained} bgColor="bg-emerald-700" />
            </div>

            {/* Program Status Overview */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Program Status Overview</p>
                <div className="flex h-6 rounded-full overflow-hidden bg-slate-100">
                    <div className="bg-slate-400 transition-all flex items-center justify-center text-[9px] text-white font-bold"
                        style={{ width: `${(statusCounts.planned / MAX_TOTAL) * 100}%` }}>
                        {statusCounts.planned > 0 && `${statusCounts.planned} Planned`}
                    </div>
                    <div className="bg-amber-500 transition-all flex items-center justify-center text-[9px] text-white font-bold"
                        style={{ width: `${(statusCounts.ongoing / MAX_TOTAL) * 100}%` }}>
                        {statusCounts.ongoing > 0 && `${statusCounts.ongoing} Ongoing`}
                    </div>
                    <div className="bg-emerald-500 transition-all flex items-center justify-center text-[9px] text-white font-bold"
                        style={{ width: `${(statusCounts.completed / MAX_TOTAL) * 100}%` }}>
                        {statusCounts.completed > 0 && `${statusCounts.completed} Completed`}
                    </div>
                    <div className="bg-red-400 transition-all flex items-center justify-center text-[9px] text-white font-bold"
                        style={{ width: `${(statusCounts.cancelled / MAX_TOTAL) * 100}%` }}>
                        {statusCounts.cancelled > 0 && `${statusCounts.cancelled} Cancelled`}
                    </div>
                </div>
                <div className="flex gap-6 mt-3 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Planned: {statusCounts.planned}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Ongoing: {statusCounts.ongoing}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed: {statusCounts.completed}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Cancelled: {statusCounts.cancelled}</span>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Recent L&D Activity</p>
                {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                        {recentActivity.map(p => (
                            <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <Activity size={14} className="text-emerald-500" />
                                    <span className="text-sm font-semibold text-slate-700">{p.title}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                    p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    p.status === 'ongoing' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>{p.status}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 font-semibold text-center py-4">No recent activity</p>
                )}
            </div>
        </div>
    );
};

export default LDDashboard;
