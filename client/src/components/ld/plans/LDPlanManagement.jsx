import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown, ChevronRight, FileText, CheckCircle, Send, Filter, ChevronUp } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import LDProgramForm from './LDProgramForm';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const LDPlanManagement = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [expandedPlan, setExpandedPlan] = useState(null);
    const [planDetail, setPlanDetail] = useState(null);
    const [showProgramForm, setShowProgramForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ school_year: '', status: '' });
    const [createForm, setCreateForm] = useState({
        title: '', school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), description: ''
    });
    const [creating, setCreating] = useState(false);

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => { if (v) q.append(k, v); });
            const res = await fetch(`${API_BASE}/api/ld/plans?${q}`, { headers: headers() });
            if (res.ok) setPlans(await res.json());
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    const toggleExpand = async (planId) => {
        if (expandedPlan === planId) {
            setExpandedPlan(null);
            setPlanDetail(null);
            return;
        }
        setExpandedPlan(planId);
        try {
            const res = await fetch(`${API_BASE}/api/ld/plans/${planId}`, { headers: headers() });
            if (res.ok) setPlanDetail(await res.json());
        } catch (e) { /* silent */ }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await fetch(`${API_BASE}/api/ld/plans`, {
                method: 'POST', headers: headers(), body: JSON.stringify(createForm)
            });
            setShowCreate(false);
            setCreateForm({ title: '', school_year: '', description: '' });
            fetchPlans();
        } catch (err) { alert(err.message); }
        finally { setCreating(false); }
    };

    const handleSubmit = async (id) => {
        await fetch(`${API_BASE}/api/ld/plans/${id}/submit`, { method: 'POST', headers: headers() });
        fetchPlans();
        if (expandedPlan === id) toggleExpand(id);
    };

    const handleApprove = async (id) => {
        await fetch(`${API_BASE}/api/ld/plans/${id}/approve`, { method: 'POST', headers: headers() });
        fetchPlans();
        if (expandedPlan === id) toggleExpand(id);
    };

    const getStatusBadge = (status) => {
        const colors = { draft: 'bg-slate-100 text-slate-600', submitted: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700' };
        return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black uppercase italic text-[#1B3A6B]">Learning & Development Plan</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step 3: Planning and Design</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700">
                    <Plus size={16} /> Create LDP
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-4">
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Filter size={14} /> {showFilters ? 'Hide' : 'Show'} Filters
                </button>
                {showFilters && (
                    <div className="flex gap-4 mt-3 flex-wrap">
                        <input value={filters.school_year} onChange={e => setFilters({ ...filters, school_year: e.target.value })}
                            placeholder="School Year" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold w-32" />
                        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Plans List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-20 bg-slate-200 rounded-[2.5rem]" />)}
                    </div>
                ) : plans.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center">
                        <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-400">No L&D Plans yet</p>
                        <p className="text-xs text-slate-300 mt-1">Create your first Learning and Development Plan</p>
                    </div>
                ) : (
                    plans.map((plan, i) => (
                        <motion.div key={plan.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <div className="p-6 cursor-pointer" onClick={() => toggleExpand(plan.id)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            {expandedPlan === plan.id ? <ChevronDown size={16} className="text-emerald-500" /> : <ChevronRight size={16} className="text-slate-400" />}
                                            <h3 className="text-sm font-bold text-[#1B3A6B]">{plan.title}</h3>
                                            {getStatusBadge(plan.status)}
                                        </div>
                                        <div className="flex gap-4 mt-2 text-[10px] text-slate-500 font-semibold ml-7">
                                            <span>SY {plan.school_year}</span>
                                            <span>Programs: {plan.program_count || 0}</span>
                                            <span>Hours: {plan.total_hours || 0}h</span>
                                            {plan.total_budget > 0 && <span>Budget: ₱{Number(plan.total_budget).toLocaleString()}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                        {plan.status === 'draft' && (
                                            <button onClick={() => handleSubmit(plan.id)}
                                                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-bold hover:bg-amber-200">
                                                <Send size={12} className="inline mr-1" /> Submit
                                            </button>
                                        )}
                                        {plan.status === 'submitted' && (
                                            <button onClick={() => handleApprove(plan.id)}
                                                className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold hover:bg-emerald-200">
                                                <CheckCircle size={12} className="inline mr-1" /> Approve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Programs Table */}
                            <AnimatePresence>
                                {expandedPlan === plan.id && planDetail && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-100"
                                    >
                                        <div className="p-6 bg-slate-50/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Training Programs</p>
                                                <button onClick={() => setShowProgramForm(true)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700">
                                                    <Plus size={12} /> Add Program
                                                </button>
                                            </div>
                                            {(!planDetail.programs || planDetail.programs.length === 0) ? (
                                                <p className="text-xs text-slate-400 font-semibold text-center py-4">No programs yet. Add your first training program.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {planDetail.programs.map((pr, j) => (
                                                        <div key={pr.id} className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-100">
                                                            <div>
                                                                <p className="text-sm font-bold text-[#1B3A6B]">{pr.title}</p>
                                                                <div className="flex gap-3 mt-1 text-[10px] text-slate-500 font-semibold flex-wrap">
                                                                    <span className={`px-2 py-0.5 rounded-full ${pr.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : pr.status === 'ongoing' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{pr.status}</span>
                                                                    <span>{pr.methodology}</span>
                                                                    <span className={`px-2 py-0.5 rounded-full ${pr.target_position_type === 'teaching' ? 'bg-amber-100 text-amber-700' : pr.target_position_type === 'non_teaching' ? 'bg-sky-100 text-sky-700' : pr.target_position_type === 'teaching_related' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>{pr.target_position_type}</span>
                                                                    {pr.duration_hours && <span>{pr.duration_hours}h</span>}
                                                                    {pr.start_date && <span>{new Date(pr.start_date).toLocaleDateString()}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create LDP Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 m-4 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black uppercase italic text-[#1B3A6B]">New L&D Plan</h3>
                            <button onClick={() => setShowCreate(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Title</label>
                                <input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">School Year</label>
                                <input value={createForm.school_year} onChange={e => setCreateForm({ ...createForm, school_year: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
                                <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" rows={2} />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="submit" disabled={creating}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50">
                                    {creating ? 'Creating...' : 'Create Plan'}
                                </button>
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold">Cancel</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Add Program Form Modal */}
            {showProgramForm && expandedPlan && (
                <LDProgramForm
                    planId={expandedPlan}
                    onClose={() => { setShowProgramForm(false); toggleExpand(expandedPlan); }}
                />
            )}
        </div>
    );
};

export default LDPlanManagement;
