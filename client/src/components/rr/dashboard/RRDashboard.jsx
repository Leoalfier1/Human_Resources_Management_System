import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Award, Calendar, Clock, ArrowRight, Star, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRRDashboard } from '../../../hooks/useRRDashboard';
import { API_BASE } from '../../../utils/api';

const RRDashboard = () => {
    const { data, loading, error, refresh } = useRRDashboard();
    const navigate = useNavigate();
    const [activeSearch, setActiveSearch] = useState(null);

    useEffect(() => {
        const fetchActiveSearch = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE}/api/rr/searches`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const searches = await res.json();
                    const active = searches.find(s => ['open', 'evaluation', 'deliberation', 'announced'].includes(s.status));
                    if (active) setActiveSearch(active);
                }
            } catch (e) { /* silent */ }
        };
        fetchActiveSearch();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-40 bg-slate-200 rounded-[2.5rem]" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-[2.5rem]" />)}
                </div>
                <div className="h-64 bg-slate-200 rounded-[2.5rem]" />
            </div>
        );
    }

    const statusSteps = ['draft', 'open', 'evaluation', 'deliberation', 'announced', 'completed'];
    const currentStep = activeSearch ? statusSteps.indexOf(activeSearch.status) : -1;

    const getActionForStatus = (status) => {
        switch (status) {
            case 'open': return { label: 'View Nominations', path: '/rr/nominations' };
            case 'evaluation': return { label: 'Go to Evaluation', path: '/rr/evaluation' };
            case 'deliberation': return { label: 'Go to Deliberation', path: '/rr/deliberation' };
            case 'announced': return { label: 'Manage Awards', path: '/rr/awards' };
            default: return { label: 'Manage Search', path: '/rr/searches' };
        }
    };

    const daysLeft = activeSearch?.nomination_end
        ? Math.max(0, Math.ceil((new Date(activeSearch.nomination_end) - new Date()) / (1000 * 60 * 60 * 24)))
        : null;

    const action = activeSearch ? getActionForStatus(activeSearch.status) : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-500 p-2 rounded-xl">
                    <Trophy size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">R&R Dashboard</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rewards and Recognition Overview</p>
                </div>
            </div>

            {activeSearch && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-[2.5rem] p-8 text-white shadow-lg"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                                    {activeSearch.school_year}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                                    {activeSearch.search_type}
                                </span>
                            </div>
                            <h3 className="text-2xl font-black uppercase italic mb-1">{activeSearch.title}</h3>
                            <p className="text-amber-100 text-sm font-semibold">
                                Status: <span className="font-black uppercase">{activeSearch.status}</span>
                                {daysLeft !== null && activeSearch.status === 'open' && (
                                    <span className="ml-3">· {daysLeft} days left for nominations</span>
                                )}
                            </p>

                            <div className="flex items-center gap-2 mt-4">
                                {statusSteps.map((step, i) => (
                                    <React.Fragment key={step}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black
                                            ${i <= currentStep ? 'bg-white text-amber-700' : 'bg-white/20 text-white/60'}`}>
                                            {i + 1}
                                        </div>
                                        {i < statusSteps.length - 1 && (
                                            <div className={`h-1 w-8 rounded-full ${i < currentStep ? 'bg-white' : 'bg-white/20'}`} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(action?.path || '/rr/searches')}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 transition-all shadow-md shrink-0 ml-4"
                        >
                            {action?.label || 'Manage'} <ArrowRight size={14} />
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-3">
                        <Trophy size={22} className="text-amber-600" />
                    </div>
                    <p className="text-3xl font-black text-[#1B3A6B]">{data?.active_searches || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Active Searches</p>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <div className="bg-rose-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-3">
                        <Users size={22} className="text-rose-600" />
                    </div>
                    <p className="text-3xl font-black text-[#1B3A6B]">{data?.nominations_this_year || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Nominations This Year</p>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <div className="bg-purple-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-3">
                        <Award size={22} className="text-purple-600" />
                    </div>
                    <p className="text-3xl font-black text-[#1B3A6B]">{data?.awardees_this_year || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Awardees This Year</p>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-3">
                        <Calendar size={22} className="text-amber-600" />
                    </div>
                    <p className="text-3xl font-black text-[#1B3A6B]">{data?.upcoming_ceremonies || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Upcoming Ceremonies</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Award Distribution</h3>
                    {data?.position_breakdown && data.position_breakdown.length > 0 ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="relative w-40 h-40">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    {(() => {
                                        const total = data.position_breakdown.reduce((s, b) => s + b.count, 0);
                                        let offset = 0;
                                        const colors = ['#F59E0B', '#7C3AED'];
                                        return data.position_breakdown.map((b, i) => {
                                            const pct = b.count / total;
                                            const angle = pct * 360;
                                            const rad = (offset * Math.PI) / 180;
                                            const x1 = 50 + 40 * Math.cos(rad);
                                            const y1 = 50 + 40 * Math.sin(rad);
                                            const endAngle = rad + (angle * Math.PI) / 180;
                                            const x2 = 50 + 40 * Math.cos(endAngle);
                                            const y2 = 50 + 40 * Math.sin(endAngle);
                                            const largeArc = angle > 180 ? 1 : 0;
                                            offset += angle;
                                            return (
                                                <path key={i}
                                                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                                    fill={colors[i]} />
                                            );
                                        });
                                    })()}
                                    <circle cx="50" cy="50" r="25" fill="white" />
                                    <text x="50" y="48" textAnchor="middle" className="text-[20px] font-black" fill="#1B3A6B">
                                        {data?.awardees_this_year || 0}
                                    </text>
                                    <text x="50" y="62" textAnchor="middle" className="text-[6px] font-bold" fill="#94A3B8">
                                        Total
                                    </text>
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 py-8 text-sm font-semibold">No data yet</p>
                    )}
                    <div className="flex justify-center gap-6 mt-2">
                        {data?.position_breakdown?.map((b, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-amber-500' : 'bg-purple-600'}`} />
                                <span className="text-[10px] font-bold text-slate-500 capitalize">{b.position_type}: {b.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Award Levels</h3>
                    {data?.level_breakdown && data.level_breakdown.length > 0 ? (
                        <div className="space-y-3">
                            {data.level_breakdown.map((b, i) => {
                                const maxCount = Math.max(...data.level_breakdown.map(x => x.count));
                                const pct = (b.count / maxCount) * 100;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-slate-600 capitalize">{b.award_level}</span>
                                            <span className="text-xs font-black text-[#1B3A6B]">{b.count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 py-8 text-sm font-semibold">No data yet</p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Recent Activity</h3>
                {data?.recent_activity && data.recent_activity.length > 0 ? (
                    <div className="space-y-3">
                        {data.recent_activity.map((act, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                                <div className={`w-2 h-2 rounded-full ${act.type === 'award' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                <p className="text-xs text-slate-600 flex-1">{act.description}</p>
                                <span className="text-[9px] text-slate-400 font-semibold">
                                    {act.date ? new Date(act.date).toLocaleDateString() : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-400 py-8 text-sm font-semibold">No recent activity</p>
                )}
            </div>
        </div>
    );
};

export default RRDashboard;
