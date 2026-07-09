import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, CheckCircle, Target, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const PPST_DOMAINS = [
    'PPST Domain 1: Content Knowledge and Pedagogy',
    'PPST Domain 2: Learning Environment',
    'PPST Domain 3: Diversity of Learners',
    'PPST Domain 4: Curriculum and Planning',
    'PPST Domain 5: Assessment and Reporting',
    'PPST Domain 6: Community Linkages and Professional Engagement',
    'PPST Domain 7: Personal Growth and Professional Development',
];

const CSC_STANDARDS = [
    'CSC Core Values: Patriotism',
    'CSC Core Values: Integrity',
    'CSC Core Values: Accountability',
    'CSC Core Values: Excellence',
    'CSC Core Values: Service',
];

const PRIORITY_CONFIG = {
    high: { color: 'bg-red-100 text-red-700', label: 'High' },
    medium: { color: 'bg-amber-100 text-amber-700', label: 'Medium' },
    low: { color: 'bg-slate-100 text-slate-600', label: 'Low' },
};

const LDObjectivesManagement = () => {
    const [objectives, setObjectives] = useState([]);
    const [tnaForms, setTnaForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ school_year: '', target_position_type: '' });
    const [form, setForm] = useState({
        title: '', description: '', school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        target_position_type: 'all', professional_standard: '', priority_level: 'medium', tna_form_id: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => { if (v) q.append(k, v); });
            const [objRes, tnaRes] = await Promise.all([
                fetch(`${API_BASE}/api/ld/objectives?${q}`, { headers: headers() }),
                fetch(`${API_BASE}/api/ld/tna`, { headers: headers() })
            ]);
            if (objRes.ok) setObjectives(await objRes.json());
            if (tnaRes.ok) setTnaForms(await tnaRes.json());
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openCreate = () => {
        setEditingId(null);
        setForm({
            title: '', description: '', school_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
            target_position_type: 'all', professional_standard: '', priority_level: 'medium', tna_form_id: ''
        });
        setShowModal(true);
    };

    const openEdit = (obj) => {
        setEditingId(obj.id);
        setForm({
            title: obj.title, description: obj.description || '',
            school_year: obj.school_year,
            target_position_type: obj.target_position_type || 'all',
            professional_standard: obj.professional_standard || '',
            priority_level: obj.priority_level || 'medium',
            tna_form_id: obj.tna_form_id || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, tna_form_id: form.tna_form_id || null };
            if (editingId) {
                await fetch(`${API_BASE}/api/ld/objectives/${editingId}`, {
                    method: 'PATCH', headers: headers(), body: JSON.stringify(payload)
                });
            } else {
                await fetch(`${API_BASE}/api/ld/objectives`, {
                    method: 'POST', headers: headers(), body: JSON.stringify(payload)
                });
            }
            setShowModal(false);
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const handleApprove = async (id) => {
        await fetch(`${API_BASE}/api/ld/objectives/${id}/approve`, { method: 'POST', headers: headers() });
        fetchData();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this objective?')) return;
        await fetch(`${API_BASE}/api/ld/objectives/${id}`, { method: 'DELETE', headers: headers() });
        fetchData();
    };

    const getStandards = () => {
        if (form.target_position_type === 'teaching') return PPST_DOMAINS;
        if (form.target_position_type === 'non_teaching') return CSC_STANDARDS;
        return [...PPST_DOMAINS, ...CSC_STANDARDS];
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black uppercase italic text-[#1B3A6B]">L&D Objectives</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step 2: Identification of L&D Objectives</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700">
                    <Plus size={16} /> New Objective
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
                        <select value={filters.target_position_type} onChange={e => setFilters({ ...filters, target_position_type: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                            <option value="">All Types</option>
                            <option value="teaching">Teaching</option>
                            <option value="non_teaching">Non-Teaching</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Objectives List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-[2.5rem]" />)}
                    </div>
                ) : objectives.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center">
                        <Target size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-400">No objectives yet</p>
                        <p className="text-xs text-slate-300 mt-1">Create your first L&D objective</p>
                    </div>
                ) : (
                    objectives.map((o, i) => (
                        <motion.div key={o.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-sm font-bold text-[#1B3A6B]">{o.title}</h3>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[o.priority_level]?.color || 'bg-slate-100'}`}>
                                            {PRIORITY_CONFIG[o.priority_level]?.label || o.priority_level}
                                        </span>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${o.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {o.status}
                                        </span>
                                    </div>
                                    {o.description && <p className="text-xs text-slate-500 mb-2">{o.description}</p>}
                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-semibold">
                                        <span className={`px-2 py-0.5 rounded-full ${o.target_position_type === 'teaching' ? 'bg-amber-100 text-amber-700' : o.target_position_type === 'non_teaching' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {o.target_position_type}
                                        </span>
                                        {o.professional_standard && (
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{o.professional_standard}</span>
                                        )}
                                        {o.tna_form_title && (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Linked: {o.tna_form_title}</span>
                                        )}
                                        <span className="text-slate-400">SY {o.school_year}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    {o.status === 'draft' && (
                                        <button onClick={() => handleApprove(o.id)}
                                            className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold hover:bg-emerald-200">
                                            <CheckCircle size={12} className="inline mr-1" /> Approve
                                        </button>
                                    )}
                                    <button onClick={() => openEdit(o)}
                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-200">Edit</button>
                                    <button onClick={() => handleDelete(o.id)}
                                        className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold hover:bg-red-100">Delete</button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 m-4 shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black uppercase italic text-[#1B3A6B]">{editingId ? 'Edit' : 'New'} Objective</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">School Year</label>
                                    <input value={form.school_year} onChange={e => setForm({ ...form, school_year: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Priority Level</label>
                                    <select value={form.priority_level} onChange={e => setForm({ ...form, priority_level: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1">
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Position Type</label>
                                    <select value={form.target_position_type} onChange={e => setForm({ ...form, target_position_type: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1">
                                        <option value="all">All</option>
                                        <option value="teaching">Teaching</option>
                                        <option value="non_teaching">Non-Teaching</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Professional Standard</label>
                                    <select value={form.professional_standard} onChange={e => setForm({ ...form, professional_standard: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1">
                                        <option value="">Select Standard</option>
                                        {getStandards().map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link to TNA Form</label>
                                <select value={form.tna_form_id} onChange={e => setForm({ ...form, tna_form_id: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1">
                                    <option value="">None</option>
                                    {tnaForms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700">
                                    {editingId ? 'Update' : 'Create'} Objective
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default LDObjectivesManagement;
