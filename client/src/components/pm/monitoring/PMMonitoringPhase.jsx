import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, CheckCircle } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const PMMonitoringPhase = () => {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState({ status: '' });
    const [form, setForm] = useState({ ratee_id: '', period_id: '', coaching_date: '', observations: '', agreed_actions: '', follow_up_date: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filter).toString();
            const [lRes, pRes] = await Promise.all([
                fetch(`${API_BASE}/api/pm/coaching${params ? '?' + params : ''}`, { headers: headers() }),
                fetch(`${API_BASE}/api/pm/periods`, { headers: headers() }),
            ]);
            if (lRes.ok) setLogs(await lRes.json());
            if (pRes.ok) setPeriods(await pRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchUsers = async () => {
        const res = await fetch(`${API_BASE}/api/admin/users`, { headers: headers() }).catch(() => null);
        if (res && res.ok) setUsers(await res.json());
    };
    useEffect(() => { fetchUsers(); }, []);

    const createLog = async () => {
        if (!form.ratee_id || !form.period_id || !form.coaching_date) return;
        await fetch(`${API_BASE}/api/pm/coaching`, { method: 'POST', headers: headers(), body: JSON.stringify(form) });
        setShowModal(false);
        setForm({ ratee_id: '', period_id: '', coaching_date: '', observations: '', agreed_actions: '', follow_up_date: '' });
        fetchData();
    };

    const completeLog = async (id) => {
        await fetch(`${API_BASE}/api/pm/coaching/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status: 'completed' }) });
        fetchData();
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">Phase 2 — Performance Monitoring & Coaching</h2>
                    <p className="text-sm text-slate-500">Track coaching sessions and provide performance feedback</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-[#D6402F] text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-all flex items-center gap-2">
                    <Plus size={16} /> New Coaching Log
                </button>
            </div>

            <div className="flex items-center gap-3">
                <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
                    className="bg-white px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 border border-slate-200 outline-none">
                    <option value="">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <div className="space-y-3">
                {logs.map(log => (
                    <div key={log.id} className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-black text-[#1B3A6B]">{log.ratee_name}</span>
                                    <span className="text-xs text-slate-400">coached by <strong>{log.rater_name}</strong></span>
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border
                                        ${log.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>{log.status}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-1"><strong>Date:</strong> {log.coaching_date?.split('T')[0]}</p>
                                {log.observations && <p className="text-xs text-slate-600 mb-1"><strong>Observations:</strong> {log.observations}</p>}
                                {log.agreed_actions && <p className="text-xs text-slate-600 mb-1"><strong>Agreed Actions:</strong> {log.agreed_actions}</p>}
                                {log.follow_up_date && <p className="text-xs text-slate-500"><strong>Follow-up:</strong> {log.follow_up_date?.split('T')[0]}</p>}
                            </div>
                            {log.status === 'scheduled' && (
                                <button onClick={() => completeLog(log.id)}
                                    className="text-emerald-600 hover:text-emerald-800 p-2"><CheckCircle size={20} /></button>
                            )}
                        </div>
                    </div>
                ))}
                {logs.length === 0 && <p className="text-center text-slate-400 font-bold py-8">No coaching logs found.</p>}
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">New Coaching Log</h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee (Ratee)</label>
                                    <select value={form.ratee_id} onChange={e => setForm(f => ({ ...f, ratee_id: e.target.value }))}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none">
                                        <option value="">Select employee</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.applicant_type || 'staff'})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</label>
                                    <select value={form.period_id} onChange={e => setForm(f => ({ ...f, period_id: e.target.value }))}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none">
                                        <option value="">Select period</option>
                                        {periods.map(p => <option key={p.id} value={p.id}>{p.school_year} - {p.period_label || `Phase ${p.phase}`}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coaching Date</label>
                                    <input type="date" value={form.coaching_date} onChange={e => setForm(f => ({ ...f, coaching_date: e.target.value }))}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-[#1B3A6B]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observations</label>
                                    <textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={3}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-[#1B3A6B]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agreed Actions</label>
                                    <textarea value={form.agreed_actions} onChange={e => setForm(f => ({ ...f, agreed_actions: e.target.value }))} rows={3}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-[#1B3A6B]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-up Date</label>
                                    <input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-[#1B3A6B]" />
                                </div>
                                <button onClick={createLog} className="w-full bg-[#1B3A6B] text-white py-3 rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all">
                                    Create Coaching Log
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PMMonitoringPhase;
