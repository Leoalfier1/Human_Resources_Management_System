import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Printer, Trophy, Trash2 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const LEVEL_COLORS = {
    school: 'bg-slate-100 text-slate-600',
    division: 'bg-blue-100 text-blue-700',
    regional: 'bg-purple-100 text-purple-700',
    national: 'bg-amber-100 text-amber-700',
};

const PMRewardsPhase = () => {
    const [rewards, setRewards] = useState([]);
    const [users, setUsers] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ user_id: '', period_id: '', award_type: '', award_level: 'division', description: '', awarded_at: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = selectedPeriod ? `?period_id=${selectedPeriod}` : '';
            const [rRes, pRes] = await Promise.all([
                fetch(`${API_BASE}/api/pm/rewards${params}`, { headers: headers() }),
                fetch(`${API_BASE}/api/pm/periods`, { headers: headers() }),
            ]);
            if (rRes.ok) setRewards(await rRes.json());
            if (pRes.ok) setPeriods(await pRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selectedPeriod]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchUsers = async () => {
        const res = await fetch(`${API_BASE}/api/admin/users`, { headers: headers() }).catch(() => null);
        if (res && res.ok) setUsers(await res.json());
    };
    useEffect(() => { fetchUsers(); }, []);

    const createReward = async () => {
        if (!form.user_id || !form.period_id || !form.award_type) return;
        await fetch(`${API_BASE}/api/pm/rewards`, { method: 'POST', headers: headers(), body: JSON.stringify(form) });
        setShowModal(false);
        setForm({ user_id: '', period_id: '', award_type: '', award_level: 'division', description: '', awarded_at: '' });
        fetchData();
    };

    const deleteReward = async (id) => {
        if (!window.confirm('Remove this award?')) return;
        await fetch(`${API_BASE}/api/pm/rewards/${id}`, { method: 'DELETE', headers: headers() });
        fetchData();
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">Phase 4 — Rewarding & Development Planning</h2>
                    <p className="text-sm text-slate-500">Manage awards and recognition</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-[#D6402F] text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-red-700 transition-all flex items-center gap-2">
                    <Plus size={16} /> Add Award
                </button>
            </div>

            <div className="flex items-center gap-3">
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
                    className="bg-white px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 border border-slate-200 outline-none">
                    <option value="">All Periods</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.school_year} - {p.period_label || `Phase ${p.phase}`}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rewards.map(r => (
                    <div key={r.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 relative group">
                        <button onClick={() => deleteReward(r.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                        <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 mb-3"><Trophy size={24} /></div>
                        <p className="text-lg font-black text-[#1B3A6B]">{r.full_name}</p>
                        <p className="text-sm font-bold text-slate-600 mt-1">{r.award_type}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${LEVEL_COLORS[r.award_level] || 'bg-slate-100 text-slate-600'}`}>{r.award_level}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600`}>{r.applicant_type === 'non_teaching' ? 'Non-Teaching' : 'Teaching'}</span>
                        </div>
                        {r.description && <p className="text-xs text-slate-500 mt-2">{r.description}</p>}
                        {r.awarded_at && <p className="text-[10px] text-slate-400 font-bold mt-2">Awarded: {r.awarded_at?.split('T')[0]}</p>}
                    </div>
                ))}
                {rewards.length === 0 && <p className="col-span-full text-center text-slate-400 font-bold py-8">No awards yet.</p>}
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
                                <h3 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">Add Award</h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</label>
                                    <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Award Type</label>
                                    <input value={form.award_type} onChange={e => setForm(f => ({ ...f, award_type: e.target.value }))}
                                        placeholder="e.g. Best in Performance"
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-[#1B3A6B]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Award Level</label>
                                    <select value={form.award_level} onChange={e => setForm(f => ({ ...f, award_level: e.target.value }))}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none">
                                        <option value="school">School</option>
                                        <option value="division">Division</option>
                                        <option value="regional">Regional</option>
                                        <option value="national">National</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-[#1B3A6B]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Award Date</label>
                                    <input type="date" value={form.awarded_at} onChange={e => setForm(f => ({ ...f, awarded_at: e.target.value }))}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-[#1B3A6B]" />
                                </div>
                                <button onClick={createReward} className="w-full bg-[#1B3A6B] text-white py-3 rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all">
                                    Add Award
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PMRewardsPhase;
