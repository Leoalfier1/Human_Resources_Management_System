import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Award, Calendar, Clock, ArrowRight, Star, Loader2, CheckCircle2, Vote, Megaphone, PartyPopper, FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRRDashboard } from '../../../hooks/useRRDashboard';
import { API_BASE } from '../../../utils/api';
import StatusStepper from '../../shared/StatusStepper';
import StatCards from '../../shared/StatCards';

const CYCLE_STEPS = [
    { key: 'draft', label: 'Draft', number: 1 },
    { key: 'published', label: 'Open', number: 2 },
    { key: 'closed', label: 'Closed', number: 3 },
];

const CATEGORY_COLORS = {
    teaching: { fill: '#F59E0B', label: 'Teaching' },
    teaching_related: { fill: '#7C3AED', label: 'Teaching-Related' },
    non_teaching: { fill: '#1B3A6B', label: 'Non-Teaching' },
};

const LEVEL_COLORS = ['#F59E0B', '#D6402F', '#7C3AED', '#1B3A6B'];

const ACTIVITY_ICONS = {
    nomination: <Users size={14} className="text-blue-500" />,
    meeting: <Vote size={14} className="text-emerald-500" />,
    ceremony: <PartyPopper size={14} className="text-amber-500" />,
    announcement: <Megaphone size={14} className="text-purple-500" />,
};

const ACTIVITY_DOT_COLORS = {
    nomination: 'bg-blue-500',
    meeting: 'bg-emerald-500',
    ceremony: 'bg-amber-500',
    announcement: 'bg-purple-500',
};

/* ── Sub-components ────────────────────────────────────────── */

function CycleHeroBanner({ cycle, stats }) {
    const navigate = useNavigate();
    const cycleSteps = CYCLE_STEPS.map(s => s.key);
    const currentIdx = cycle ? cycleSteps.indexOf(cycle.status) : -1;

    const daysLeft = cycle?.nomination_closes
        ? Math.max(0, Math.ceil((new Date(cycle.nomination_closes) - new Date()) / (1000 * 60 * 60 * 24)))
        : null;

    const getActionForStatus = (status) => {
        switch (status) {
            case 'published': return { label: 'View Nominations', path: '/rr/call-for-nominees' };
            case 'closed': return { label: 'Go to Evaluation', path: '/rr/evaluation' };
            default: return { label: 'Manage Calls', path: '/rr/call-for-nominees' };
        }
    };

    const action = cycle ? getActionForStatus(cycle.status) : null;

    if (!cycle) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#1B3A6B] to-[#2D5099] rounded-[2.5rem] p-8 text-white shadow-lg"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                                No Active Cycle
                            </span>
                        </div>
                        <h3 className="text-2xl font-black uppercase italic mb-1">Rewards & Recognition Dashboard</h3>
                        <p className="text-blue-200 text-sm font-semibold">
                            No nomination cycle is currently active. Start a new call for nominees to begin.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/rr/call-for-nominees')}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-[#1B3A6B] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-md shrink-0 ml-4"
                    >
                        Start New Cycle <ArrowRight size={14} />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-[2.5rem] p-8 text-white shadow-lg"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                            {cycle.award_type_name}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                            {cycle.eligible_category?.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full capitalize">
                            {cycle.award_level} Level
                        </span>
                    </div>
                    <h3 className="text-2xl font-black uppercase italic mb-1">
                        {cycle.award_type_name}
                    </h3>
                    <p className="text-amber-100 text-sm font-semibold">
                        Status: <span className="font-black uppercase">{cycle.status?.replace('_', ' ')}</span>
                        {daysLeft !== null && cycle.status === 'published' && (
                            <span className="ml-3">· {daysLeft} days left for nominations</span>
                        )}
                        {cycle.nomination_opens && (
                            <span className="ml-3">· {new Date(cycle.nomination_opens).toLocaleDateString()} – {cycle.nomination_closes ? new Date(cycle.nomination_closes).toLocaleDateString() : 'TBD'}</span>
                        )}
                    </p>

                    <div className="mt-4">
                        <StatusStepper
                            steps={CYCLE_STEPS}
                            currentStep={currentIdx}
                            completedSteps={[]}
                            activeColor="#ffffff"
                            variant="compact"
                        />
                    </div>
                </div>
                <button
                    onClick={() => navigate(action?.path || '/rr/call-for-nominees')}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 transition-all shadow-md shrink-0 ml-4"
                >
                    {action?.label || 'Manage'} <ArrowRight size={14} />
                </button>
            </div>
        </motion.div>
    );
}

function DonutChart({ data, total }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    if (!data || data.length === 0 || total === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <p className="text-slate-400 text-sm font-semibold">No award data yet</p>
            </div>
        );
    }

    const radius = 40;
    const innerRadius = 24;
    let cumulativeAngle = -90;

    const slices = data.map((d, i) => {
        const pct = d.count / total;
        const angle = pct * 360;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        const endAngle = cumulativeAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1Outer = 50 + radius * Math.cos(startRad);
        const y1Outer = 50 + radius * Math.sin(startRad);
        const x2Outer = 50 + radius * Math.cos(endRad);
        const y2Outer = 50 + radius * Math.sin(endRad);
        const x1Inner = 50 + innerRadius * Math.cos(endRad);
        const y1Inner = 50 + innerRadius * Math.sin(endRad);
        const x2Inner = 50 + innerRadius * Math.cos(startRad);
        const y2Inner = 50 + innerRadius * Math.sin(startRad);

        const largeArc = angle > 180 ? 1 : 0;

        const path = [
            `M ${x1Outer} ${y1Outer}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
            `L ${x1Inner} ${y1Inner}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
            'Z'
        ].join(' ');

        return { path, color: CATEGORY_COLORS[d.position_type]?.fill || '#94a3b8', idx: i };
    });

    return (
        <div className="flex items-center justify-center py-4">
            <div className="relative">
                <svg viewBox="0 0 100 100" className="w-40 h-40">
                    {slices.map((s, i) => (
                        <path
                            key={i}
                            d={s.path}
                            fill={s.color}
                            opacity={hoveredIdx === null || hoveredIdx === s.idx ? 1 : 0.4}
                            onMouseEnter={() => setHoveredIdx(s.idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            className="transition-opacity cursor-pointer"
                        />
                    ))}
                    <circle cx="50" cy="50" r={innerRadius} fill="white" />
                    <text x="50" y="47" textAnchor="middle" className="text-[18px] font-black" fill="#1B3A6B">
                        {total}
                    </text>
                    <text x="50" y="60" textAnchor="middle" className="text-[5px] font-bold" fill="#94A3B8">
                        NOMINEES
                    </text>
                </svg>
            </div>
        </div>
    );
}

function AwardDistributionCard({ data }) {
    const total = data?.reduce((s, d) => s + d.count, 0) || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6"
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-100 w-8 h-8 rounded-xl flex items-center justify-center">
                    <Award size={16} className="text-amber-600" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Award Distribution by Category
                </h3>
            </div>
            <DonutChart data={data} total={total} />
            <div className="flex justify-center gap-5 mt-3">
                {data?.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[b.position_type]?.fill || '#94a3b8' }}
                        />
                        <span className="text-[10px] font-bold text-slate-500 capitalize">
                            {CATEGORY_COLORS[b.position_type]?.label || b.position_type}: {b.count}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function AwardLevelsCard({ data }) {
    const maxCount = data ? Math.max(...data.map(d => d.count), 1) : 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6"
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-purple-100 w-8 h-8 rounded-xl flex items-center justify-center">
                    <Star size={16} className="text-purple-600" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Award Levels Breakdown
                </h3>
            </div>
            {data && data.length > 0 ? (
                <div className="space-y-4">
                    {data.map((b, i) => {
                        const pct = (b.count / maxCount) * 100;
                        return (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-600 capitalize">
                                        {b.award_level} Level
                                    </span>
                                    <span className="text-xs font-black text-[#1B3A6B]">{b.count}</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                        className="h-full rounded-full"
                                        style={{ background: LEVEL_COLORS[i % LEVEL_COLORS.length] }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8 text-sm font-semibold">No data yet</p>
            )}
        </motion.div>
    );
}

function RecentActivityFeed({ data }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6"
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 w-8 h-8 rounded-xl flex items-center justify-center">
                    <Clock size={16} className="text-blue-600" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Recent Activity
                </h3>
            </div>
            {data && data.length > 0 ? (
                <div className="space-y-3">
                    {data.map((act, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ACTIVITY_DOT_COLORS[act.type] || 'bg-slate-400'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-600 font-semibold leading-snug">
                                    {act.description}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {ACTIVITY_ICONS[act.type]}
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                        {act.type}
                                    </span>
                                </div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                                {act.date ? new Date(act.date).toLocaleDateString() : ''}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8 text-sm font-semibold">No recent activity</p>
            )}
        </motion.div>
    );
}

/* ── Main Dashboard ────────────────────────────────────────── */

const RRDashboard = () => {
    const { data, loading, error } = useRRDashboard();

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-44 bg-slate-200 rounded-[2.5rem]" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-[2.5rem]" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-72 bg-slate-200 rounded-[2.5rem]" />
                    <div className="h-72 bg-slate-200 rounded-[2.5rem]" />
                </div>
                <div className="h-64 bg-slate-200 rounded-[2.5rem]" />
            </div>
        );
    }

    const legacy = data?.legacy;
    const activeCycles = data?.active_cycles || legacy?.active_searches || 0;
    const nominations = data?.nominations_this_year || legacy?.nominations_this_year || 0;
    const awardees = data?.awardees_this_year || legacy?.awardees_this_year || 0;
    const meetings = data?.finalized_meetings || 0;
    const ceremonies = data?.upcoming_ceremonies || 0;

    const categoryBreakdown = data?.category_breakdown?.length > 0
        ? data.category_breakdown
        : data?.position_breakdown || [];

    const levelBreakdown = data?.level_breakdown || [];

    const statCards = [
        {
            label: 'Active Cycles',
            value: activeCycles,
            icon: <Trophy size={20} className="text-amber-500" />,
            color: 'text-amber-600',
            caption: 'Open for nominations',
        },
        {
            label: 'Total Nominations',
            value: nominations,
            icon: <Users size={20} className="text-blue-500" />,
            color: 'text-blue-600',
            caption: `This year`,
        },
        {
            label: 'Advanced Awardees',
            value: awardees,
            icon: <Award size={20} className="text-purple-500" />,
            color: 'text-purple-600',
            caption: 'Made it through',
        },
        {
            label: 'Meetings Held',
            value: meetings,
            icon: <CheckCircle2 size={20} className="text-emerald-500" />,
            color: 'text-emerald-600',
            caption: 'PRAISE finalized',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-500 p-2 rounded-xl">
                    <Trophy size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">R&R Dashboard</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Rewards & Recognition Overview
                    </p>
                </div>
            </div>

            <CycleHeroBanner cycle={data?.current_cycle} stats={{}} />

            <StatCards cards={statCards} columns={4} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AwardDistributionCard data={categoryBreakdown} />
                <AwardLevelsCard data={levelBreakdown} />
            </div>

            <RecentActivityFeed data={data?.recent_activity} />
        </div>
    );
};

export default RRDashboard;
