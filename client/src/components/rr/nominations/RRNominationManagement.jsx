import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Users, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import RRNominationForm from './RRNominationForm';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const ELIGIBILITY_COLORS = {
    pending: 'bg-slate-100 text-slate-600',
    eligible: 'bg-emerald-100 text-emerald-700',
    ineligible: 'bg-red-100 text-red-600',
};

const RRNominationManagement = () => {
    const [activeTab, setActiveTab] = useState('nominations');
    const [searches, setSearches] = useState([]);
    const [selectedSearchId, setSelectedSearchId] = useState(null);
    const [nominations, setNominations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterEligibility, setFilterEligibility] = useState('');
    const [filterPosition, setFilterPosition] = useState('');
    const [categories, setCategories] = useState([]);
    const [ineligibilityModal, setIneligibilityModal] = useState(null);
    const [ineligibilityReason, setIneligibilityReason] = useState('');

    const fetchSearches = useCallback(async () => {
        const res = await fetch(`${API_BASE}/api/rr/searches`, { headers: headers() });
        if (res.ok) {
            const data = await res.json();
            setSearches(data);
            if (data.length > 0 && !selectedSearchId) setSelectedSearchId(data[0].id);
        }
    }, [selectedSearchId]);

    const fetchNominations = useCallback(async () => {
        if (!selectedSearchId) return;
        setLoading(true);
        try {
            let url = `${API_BASE}/api/rr/nominations?search_id=${selectedSearchId}`;
            if (filterCategory) url += `&category_id=${filterCategory}`;
            if (filterEligibility) url += `&eligibility_status=${filterEligibility}`;
            if (filterPosition) url += `&position_type=${filterPosition}`;
            const res = await fetch(url, { headers: headers() });
            if (res.ok) setNominations(await res.json());

            const catRes = await fetch(`${API_BASE}/api/rr/searches/${selectedSearchId}`, { headers: headers() });
            if (catRes.ok) {
                const data = await catRes.json();
                setCategories(data.categories || []);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selectedSearchId, filterCategory, filterEligibility, filterPosition]);

    useEffect(() => { fetchSearches(); }, []);
    useEffect(() => { fetchNominations(); }, [fetchNominations]);

    const handleEligibility = async (id, status) => {
        if (status === 'ineligible') {
            setIneligibilityModal(id);
            return;
        }
        try {
            await fetch(`${API_BASE}/api/rr/nominations/${id}/eligibility`, {
                method: 'PATCH', headers: headers(),
                body: JSON.stringify({ eligibility_status: status })
            });
            fetchNominations();
        } catch (e) { alert('Failed to update eligibility'); }
    };

    const submitIneligibility = async () => {
        if (!ineligibilityModal) return;
        try {
            await fetch(`${API_BASE}/api/rr/nominations/${ineligibilityModal}/eligibility`, {
                method: 'PATCH', headers: headers(),
                body: JSON.stringify({ eligibility_status: 'ineligible', ineligibility_reason: ineligibilityReason })
            });
            setIneligibilityModal(null);
            setIneligibilityReason('');
            fetchNominations();
        } catch (e) { alert('Failed'); }
    };

    const eligibleCount = nominations.filter(n => n.eligibility_status === 'eligible').length;
    const ineligibleCount = nominations.filter(n => n.eligibility_status === 'ineligible').length;
    const pendingCount = nominations.filter(n => n.eligibility_status === 'pending').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-500 p-2 rounded-xl">
                    <Users size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">Nominations & Preliminary Evaluation</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Steps 2 & 3</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <select value={selectedSearchId || ''} onChange={e => setSelectedSearchId(parseInt(e.target.value))}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-amber-500">
                    <option value="">Select Search</option>
                    {searches.map(s => (
                        <option key={s.id} value={s.id}>{s.title} ({s.school_year})</option>
                    ))}
                </select>
                <button onClick={() => setShowForm(true)} disabled={!selectedSearchId}
                    className="flex items-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 shadow-md transition-all">
                    <Plus size={14} /> Add Nomination
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-2 flex gap-1">
                <button onClick={() => setActiveTab('nominations')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'nominations' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'}`}>
                    <Users size={16} /> Nominations
                </button>
                <button onClick={() => setActiveTab('evaluation')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'evaluation' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'}`}>
                    <CheckCircle size={16} /> Preliminary Evaluation ({pendingCount} pending)
                </button>
            </div>

            {activeTab === 'nominations' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-amber-50 rounded-[2.5rem] p-4 border border-amber-100">
                            <p className="text-2xl font-black text-amber-700">{nominations.length}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Total Nominations</p>
                        </div>
                        <div className="bg-emerald-50 rounded-[2.5rem] p-4 border border-emerald-100">
                            <p className="text-2xl font-black text-emerald-700">{eligibleCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Eligible</p>
                        </div>
                        <div className="bg-red-50 rounded-[2.5rem] p-4 border border-red-100">
                            <p className="text-2xl font-black text-red-700">{ineligibleCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Ineligible</p>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-bold bg-white outline-none">
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                        </select>
                        <select value={filterEligibility} onChange={e => setFilterEligibility(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-bold bg-white outline-none">
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="eligible">Eligible</option>
                            <option value="ineligible">Ineligible</option>
                        </select>
                        <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-bold bg-white outline-none">
                            <option value="">All Types</option>
                            <option value="teaching">Teaching</option>
                            <option value="non_teaching">Non-Teaching</option>
                            <option value="teaching_related">Teaching-Related</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-[2.5rem]" />)}
                        </div>
                    ) : nominations.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center">
                            <Users size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-400">No nominations yet</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nominee</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nominator</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nominations.map((nom, i) => (
                                        <tr key={nom.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{nom.nominee_name}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500">{nom.category_name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${nom.position_type === 'teaching' ? 'bg-blue-100 text-blue-700' : nom.position_type === 'non_teaching' ? 'bg-purple-100 text-purple-700' : 'bg-violet-100 text-violet-700'}`}>
                                                    {nom.position_type === 'teaching_related' ? 'Tch-Related' : nom.position_type?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">{nom.nominator_name || 'Self'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ELIGIBILITY_COLORS[nom.eligibility_status] || 'bg-slate-100 text-slate-600'}`}>
                                                    {nom.eligibility_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEligibility(nom.id, 'eligible')} title="Mark Eligible"
                                                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all">
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button onClick={() => handleEligibility(nom.id, 'ineligible')} title="Mark Ineligible"
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'evaluation' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-emerald-50 rounded-[2.5rem] p-4 border border-emerald-100">
                            <p className="text-2xl font-black text-emerald-700">{eligibleCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Eligible for Next Step</p>
                        </div>
                        <div className="bg-red-50 rounded-[2.5rem] p-4 border border-red-100">
                            <p className="text-2xl font-black text-red-700">{ineligibleCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Ineligible</p>
                        </div>
                        <div className="bg-slate-50 rounded-[2.5rem] p-4 border border-slate-100">
                            <p className="text-2xl font-black text-slate-700">{pendingCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Pending Review</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Nominee</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Eligibility</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nominations.filter(n => n.eligibility_status === 'pending').map((nom, i) => (
                                    <tr key={nom.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{nom.nominee_name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{nom.category_name}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Pending</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEligibility(nom.id, 'eligible')}
                                                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold hover:bg-emerald-200">
                                                    <CheckCircle size={12} className="inline mr-1" /> Eligible
                                                </button>
                                                <button onClick={() => handleEligibility(nom.id, 'ineligible')}
                                                    className="px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-200">
                                                    <XCircle size={12} className="inline mr-1" /> Ineligible
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showForm && (
                <RRNominationForm
                    searchId={selectedSearchId}
                    onClose={() => setShowForm(false)}
                    onSaved={() => { setShowForm(false); fetchNominations(); }}
                />
            )}

            {ineligibilityModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setIneligibilityModal(null)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 0.95 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-md p-6 m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-black text-lg text-[#1B3A6B] mb-4">Mark as Ineligible</h3>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason for Ineligibility</label>
                        <textarea value={ineligibilityReason} onChange={e => setIneligibilityReason(e.target.value)}
                            className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-500" rows={3} />
                        <div className="flex gap-3 mt-4">
                            <button onClick={submitIneligibility}
                                className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600">
                                Confirm
                            </button>
                            <button onClick={() => setIneligibilityModal(null)}
                                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold">
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default RRNominationManagement;
