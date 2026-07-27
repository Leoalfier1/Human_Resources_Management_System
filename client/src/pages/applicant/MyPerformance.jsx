import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Target, Star, Trophy, ClipboardList, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE } from '../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const STATUS_STYLES = {
    draft: 'bg-slate-100 text-slate-600',
    submitted: 'bg-blue-100 text-blue-700',
    rated: 'bg-amber-100 text-amber-700',
    finalized: 'bg-emerald-100 text-emerald-700',
};

const MyPerformance = () => {
    const [activePeriod, setActivePeriod] = useState(null);
    const [commitment, setCommitment] = useState(null);
    const [targets, setTargets] = useState([]);
    const [coachingLogs, setCoachingLogs] = useState([]);
    const [ratingHistory, setRatingHistory] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTarget, setExpandedTarget] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, cRes, coRes, rRes, rwRes] = await Promise.all([
                fetch(`${API_BASE}/api/pm/periods`, { headers: headers() }),
                fetch(`${API_BASE}/api/pm/commitments/my`, { headers: headers() }),
                fetch(`${API_BASE}/api/pm/coaching/my`, { headers: headers() }),
                fetch(`${API_BASE}/api/pm/rewards/my?t=${Date.now()}`, { headers: headers() }).catch(() => null),
            ]);
            if (pRes.ok) {
                const periods = await pRes.json();
                setActivePeriod(periods.find(p => p.status === 'active'));
            }
            if (cRes.ok) {
                const commitments = await cRes.json();
                if (commitments.length > 0) {
                    const detailRes = await fetch(`${API_BASE}/api/pm/commitments/${commitments[0].id}`, { headers: headers() });
                    if (detailRes.ok) {
                        const detail = await detailRes.json();
                        setCommitment(detail);
                        setTargets(detail.targets || []);
                    }
                }
            }
            if (coRes.ok) setCoachingLogs(await coRes.json());
            if (rRes && rRes.ok) {
                const myUserId = JSON.parse(atob(token().split('.')[1]))?.id;
                if (myUserId) {
                    const histRes = await fetch(`${API_BASE}/api/pm/ratings/individual/${myUserId}`, { headers: headers() });
                    if (histRes.ok) setRatingHistory(await histRes.json());
                }
            }
            if (rwRes && rwRes.ok) setRewards(await rwRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async () => {
        if (!activePeriod) return;
        const res = await fetch(`${API_BASE}/api/pm/commitments`, {
            method: 'POST', headers: headers(), body: JSON.stringify({ period_id: activePeriod.id })
        });
        if (res.ok) fetchData();
    };

    const handleSubmit = async () => {
        if (!commitment) return;
        await fetch(`${API_BASE}/api/pm/commitments/${commitment.id}/submit`, { method: 'POST', headers: headers() });
        fetchData();
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>;

    const maxRating = Math.max(...ratingHistory.map(r => parseFloat(r.overall_rating) || 0), 5);

    return (
        <div className="space-y-8">
            {activePeriod && (
                <div className="bg-[#1B3A6B] rounded-[2.5rem] px-8 py-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Active Performance Period</p>
                            <p className="text-2xl font-black mt-1">Phase {activePeriod.phase} — {activePeriod.period_label || `Phase ${activePeriod.phase}`}</p>
                            <p className="text-blue-200 text-sm font-bold">{activePeriod.school_year}</p>
                        </div>
                        <div className="bg-white/10 px-5 py-3 rounded-2xl text-center">
                            <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Period</p>
                            <p className="text-sm font-black">{activePeriod.start_date?.split('T')[0]} → {activePeriod.end_date?.split('T')[0]}</p>
                        </div>
                    </div>
                </div>
            )}

            {!activePeriod && (
                <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] px-8 py-6 text-center">
                    <p className="text-amber-800 font-bold text-lg">No active performance period</p>
                    <p className="text-amber-600 text-sm mt-1">Your IPCRF/OPCRF form will appear once HR activates a period.</p>
                </div>
            )}

            {commitment && (
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <FileText size={24} className="text-[#1B3A6B]" />
                            <div>
                                <h3 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">My {commitment.form_type?.toUpperCase()}</h3>
                                <p className="text-xs text-slate-500">{commitment.position_type === 'non_teaching' ? 'Non-Teaching' : commitment.position_type === 'teaching_related' ? 'Teaching-Related' : 'Teaching'} · {activePeriod?.school_year}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full ${STATUS_STYLES[commitment.status] || 'bg-slate-100 text-slate-600'}`}>
                                {commitment.status}
                            </span>
                            {commitment.status === 'draft' && (
                                <button onClick={handleSubmit}
                                    className="bg-[#1B3A6B] text-white px-4 py-2 rounded-2xl text-xs font-bold hover:bg-blue-900 transition-all flex items-center gap-2">
                                    <CheckCircle size={14} /> Submit
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">KRA</th>
                                    <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Weight</th>
                                    <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Q1</th>
                                    <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Q2</th>
                                    <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Q3</th>
                                    <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Q4</th>
                                    <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                {targets.map((t, i) => (
                                    <React.Fragment key={i}>
                                        <tr className="border-b border-slate-50 cursor-pointer hover:bg-slate-50" onClick={() => setExpandedTarget(expandedTarget === i ? null : i)}>
                                            <td className="py-3 font-bold text-[#1B3A6B] text-xs">{t.kra_label}</td>
                                            <td className="py-3 text-center font-bold">{t.weight}%</td>
                                            <td className="py-3 text-center">{t.q1_rating || '—'}</td>
                                            <td className="py-3 text-center">{t.q2_rating || '—'}</td>
                                            <td className="py-3 text-center">{t.q3_rating || '—'}</td>
                                            <td className="py-3 text-center">{t.q4_rating || '—'}</td>
                                            <td className="py-3 text-center font-bold text-[#1B3A6B]">{t.average_rating != null ? parseFloat(t.average_rating).toFixed(2) : '—'}</td>
                                        </tr>
                                        {expandedTarget === i && (
                                            <tr className="bg-slate-50">
                                                <td colSpan={7} className="p-4">
                                                    <p className="text-xs text-slate-600"><strong>Success Indicator:</strong> {t.success_indicator || '—'}</p>
                                                    <p className="text-xs text-slate-600 mt-1"><strong>MOV:</strong> {t.means_of_verification || '—'}</p>
                                                    <p className="text-xs text-slate-600 mt-1"><strong>Remarks:</strong> {t.remarks || '—'}</p>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {commitment.overall_rating && (
                        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Rating</p>
                                <p className="text-xl font-black text-[#1B3A6B]">{commitment.overall_rating != null ? parseFloat(commitment.overall_rating).toFixed(2) : '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjectival</p>
                                <p className="text-xl font-black text-[#1B3A6B]">{commitment.adjectival_rating || '—'}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!commitment && activePeriod && (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center">
                    <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-lg font-black text-[#1B3A6B]">No IPCRF/OPCRF Yet</p>
                    <p className="text-sm text-slate-500 mt-1">Create your performance commitment for the current period.</p>
                    <button onClick={handleCreate} className="mt-4 bg-[#D6402F] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-all">
                        Create IPCRF/OPCRF
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {coachingLogs.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-[#1B3A6B] uppercase tracking-tight mb-4 flex items-center gap-2">
                            <Target size={16} /> My Coaching Sessions
                        </h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {coachingLogs.map(log => (
                                <div key={log.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${log.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{log.status}</span>
                                        <span className="text-xs text-slate-500">{log.coaching_date?.split('T')[0]}</span>
                                        <span className="text-xs text-slate-400">by {log.rater_name}</span>
                                    </div>
                                    {log.observations && <p className="text-xs text-slate-600"><strong>Observations:</strong> {log.observations}</p>}
                                    {log.agreed_actions && <p className="text-xs text-slate-600 mt-1"><strong>Agreed Actions:</strong> {log.agreed_actions}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {ratingHistory.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-black text-[#1B3A6B] uppercase tracking-tight mb-4 flex items-center gap-2">
                            <Star size={16} /> My Rating History
                        </h3>
                        <div className="space-y-3">
                            {ratingHistory.map(r => (
                                <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
                                    <div>
                                        <p className="text-xs font-bold text-[#1B3A6B]">{r.school_year} — {r.period_label || `Phase ${r.phase}`}</p>
                                        <p className="text-[10px] text-slate-400">{r.adjectival_rating}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-[#1B3A6B]">{parseFloat(r.overall_rating).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rating Trend</p>
                            <div className="flex items-end gap-2 h-20">
                                {ratingHistory.slice(-4).map((r, i) => {
                                    const val = parseFloat(r.overall_rating) || 0;
                                    const height = (val / maxRating) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center">
                                            <div className="w-full bg-[#1B3A6B] rounded-t-lg transition-all" style={{ height: `${height}%` }} />
                                            <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">P{r.phase}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {rewards.length > 0 && (
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-black text-[#1B3A6B] uppercase tracking-tight mb-4 flex items-center gap-2">
                        <Trophy size={16} /> My Awards
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {rewards.map(r => (
                            <div key={r.id} className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                                <p className="text-lg font-black text-[#1B3A6B]">{r.award_type}</p>
                                <p className="text-xs text-slate-500 mt-1">{r.school_year}</p>
                                {r.description && <p className="text-xs text-slate-600 mt-1">{r.description}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPerformance;
