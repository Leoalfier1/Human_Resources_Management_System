import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Send, CheckCircle, X, FileText } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const STATUS_STYLES = {
    draft: 'bg-slate-100 text-slate-600 border-slate-300',
    submitted: 'bg-blue-100 text-blue-700 border-blue-300',
    rated: 'bg-amber-100 text-amber-700 border-amber-300',
    finalized: 'bg-emerald-100 text-emerald-700 border-emerald-300',
};

const PMPlanningPhase = () => {
    const navigate = useNavigate();
    const [periods, setPeriods] = useState([]);
    const [commitments, setCommitments] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [periodForm, setPeriodForm] = useState({ school_year: '', phase: 1, period_label: '', start_date: '', end_date: '', status: 'upcoming' });
    const [filter, setFilter] = useState({ period_id: '', position_type: '', status: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([
                fetch(`${API_BASE}/api/pm/periods`, { headers: headers() }),
                fetch(`${API_BASE}/api/pm/commitments/all`, { headers: headers() }),
            ]);
            if (pRes.ok) setPeriods(await pRes.json());
            if (cRes.ok) setCommitments(await cRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchUsers = async () => {
        const res = await fetch(`${API_BASE}/api/admin/users`, { headers: headers() }).catch(() => null);
        if (res && res.ok) setUsers(await res.json());
    };
    useEffect(() => { fetchUsers(); }, []);

    const createPeriod = async () => {
        if (!periodForm.school_year || !periodForm.start_date || !periodForm.end_date) return;
        await fetch(`${API_BASE}/api/pm/periods`, { method: 'POST', headers: headers(), body: JSON.stringify(periodForm) });
        setShowPeriodModal(false);
        setPeriodForm({ school_year: '', phase: 1, period_label: '', start_date: '', end_date: '', status: 'upcoming' });
        fetchData();
    };

    const updatePeriodStatus = async (id, status) => {
        await fetch(`${API_BASE}/api/pm/periods/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status }) });
        fetchData();
    };

    const filteredCommitments = commitments.filter(c => {
        if (filter.period_id && c.period_id !== parseInt(filter.period_id)) return false;
        if (filter.position_type && c.position_type !== filter.position_type) return false;
        if (filter.status && c.status !== filter.status) return false;
        return true;
    });

    const activePeriod = periods.find(p => p.status === 'active');

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">Phase 1 — Performance Planning & Commitment</h2>
                    <p className="text-sm text-slate-500">Manage performance periods and IPCRF/OPCRF submissions</p>
                </div>
                <button onClick={() => setShowPeriodModal(true)} className="bg-[#D6402F] text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-all flex items-center gap-2">
                    <Plus size={16} /> New Period
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {periods.map(p => (
                    <div key={p.id} className={`bg-white rounded-[2.5rem] p-5 shadow-sm border-2 ${p.status === 'active' ? 'border-[#1B3A6B]' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border
                                ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                  p.status === 'upcoming' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                  'bg-slate-100 text-slate-500 border-slate-300'}`}>{p.status}</span>
                            <span className="text-xs font-black text-[#1B3A6B]">Phase {p.phase}</span>
                        </div>
                        <p className="text-lg font-black text-[#1B3A6B]">{p.school_year}</p>
                        <p className="text-sm text-slate-500">{p.period_label || `Phase ${p.phase}`}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{p.start_date?.split('T')[0]} → {p.end_date?.split('T')[0]}</p>
                        {p.status === 'upcoming' && (
                            <button onClick={() => updatePeriodStatus(p.id, 'active')}
                                className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-800 underline underline-offset-2">Activate</button>
                        )}
                        {p.status === 'active' && (
                            <button onClick={() => updatePeriodStatus(p.id, 'closed')}
                                className="mt-3 text-xs font-bold text-red-600 hover:text-red-800 underline underline-offset-2">Close</button>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
                        <Filter size={14} className="text-slate-400" />
                        <select value={filter.period_id} onChange={e => setFilter(f => ({ ...f, period_id: e.target.value }))}
                            className="bg-transparent text-sm font-bold text-slate-600 border-none outline-none">
                            <option value="">All Periods</option>
                            {periods.map(p => <option key={p.id} value={p.id}>{p.school_year} - {p.period_label || `Phase ${p.phase}`}</option>)}
                        </select>
                    </div>
                    <select value={filter.position_type} onChange={e => setFilter(f => ({ ...f, position_type: e.target.value }))}
                        className="bg-slate-100 px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 border-none outline-none">
                        <option value="">All Types</option>
                        <option value="teaching">Teaching</option>
                        <option value="non_teaching">Non-Teaching</option>
                        <option value="teaching_related">Teaching-Related</option>
                    </select>
                    <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
                        className="bg-slate-100 px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 border-none outline-none">
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="rated">Rated</option>
                        <option value="finalized">Finalized</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left">
                                <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Form</th>
                                <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                                <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCommitments.map(c => (
                                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/pm/planning?commitment=${c.id}`)}>
                                    <td className="py-3 font-bold text-[#1B3A6B]">{c.full_name}</td>
                                    <td className="py-3"><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${c.applicant_type === 'non_teaching' ? 'bg-sky-100 text-sky-600' : c.applicant_type === 'teaching_related' ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'}`}>{c.applicant_type === 'non_teaching' ? 'Non-T' : c.applicant_type === 'teaching_related' ? 'Tch-Rel' : 'T'}</span></td>
                                    <td className="py-3 text-xs uppercase font-bold">{c.form_type}</td>
                                    <td className="py-3 text-slate-500 text-xs">{c.period_label}</td>
                                    <td className="py-3">
                                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${STATUS_STYLES[c.status] || ''}`}>{c.status}</span>
                                    </td>
                                    <td className="py-3 font-bold">{c.adjectival_rating || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showPeriodModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPeriodModal(false)}
                    >
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">Create Period</h3>
                                <button onClick={() => setShowPeriodModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">School Year</label>
                                    <input value={periodForm.school_year} onChange={e => setPeriodForm(f => ({ ...f, school_year: e.target.value }))}
                                        placeholder="e.g. 2026-2027"
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-[#1B3A6B]" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase (1-4)</label>
                                        <select value={periodForm.phase} onChange={e => setPeriodForm(f => ({ ...f, phase: +e.target.value }))}
                                            className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none">
                                            {[1, 2, 3, 4].map(p => <option key={p} value={p}>Phase {p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Label</label>
                                        <input value={periodForm.period_label} onChange={e => setPeriodForm(f => ({ ...f, period_label: e.target.value }))}
                                            placeholder="e.g. Midyear"
                                            className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-[#1B3A6B]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                                        <input type="date" value={periodForm.start_date} onChange={e => setPeriodForm(f => ({ ...f, start_date: e.target.value }))}
                                            className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-[#1B3A6B]" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
                                        <input type="date" value={periodForm.end_date} onChange={e => setPeriodForm(f => ({ ...f, end_date: e.target.value }))}
                                            className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-[#1B3A6B]" />
                                    </div>
                                </div>
                                <button onClick={createPeriod}
                                    className="w-full bg-[#1B3A6B] text-white py-3 rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all">
                                    Create Period
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PMPlanningPhase;
