import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, Download, Filter, X, ChevronDown, ChevronUp, Activity, CheckCircle, Clock, Users, ClipboardList } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import LDTNAFormBuilder from './LDTNAFormBuilder';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const LDTNAManagement = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingForm, setEditingForm] = useState(null);
    const [viewResults, setViewResults] = useState(null);
    const [resultsData, setResultsData] = useState(null);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ status: '', target_position_type: '', school_year: '' });

    const fetchForms = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => { if (v) q.append(k, v); });
            const res = await fetch(`${API_BASE}/api/ld/tna?${q}`, { headers: headers() });
            if (res.ok) setForms(await res.json());
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { fetchForms(); }, [fetchForms]);

    const handleActivate = async (id) => {
        if (!window.confirm('Activate this form? This will assign it to all eligible personnel.')) return;
        await fetch(`${API_BASE}/api/ld/tna/${id}/activate`, { method: 'POST', headers: headers() });
        fetchForms();
    };

    const handleClose = async (id) => {
        await fetch(`${API_BASE}/api/ld/tna/${id}/close`, { method: 'POST', headers: headers() });
        fetchForms();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this TNA form permanently?')) return;
        await fetch(`${API_BASE}/api/ld/tna/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status: 'closed' }) });
        fetchForms();
    };

    const openResults = async (id) => {
        setResultsLoading(true);
        setViewResults(id);
        try {
            const res = await fetch(`${API_BASE}/api/ld/tna/${id}/results`, { headers: headers() });
            if (res.ok) setResultsData(await res.json());
        } catch (e) { /* silent */ }
        finally { setResultsLoading(false); }
    };

    const exportCSV = async (id) => {
        const res = await fetch(`${API_BASE}/api/ld/tna/${id}/export`, { headers: headers() });
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tna-report-${id}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const getStatusBadge = (status) => {
        const colors = { draft: 'bg-slate-100 text-slate-600', active: 'bg-emerald-100 text-emerald-700', closed: 'bg-red-100 text-red-600' };
        return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
    };

    const getTypeBadge = (type) => {
        const colors = { all: 'bg-slate-100 text-slate-600', teaching: 'bg-amber-100 text-amber-700', non_teaching: 'bg-sky-100 text-sky-700', teaching_related: 'bg-violet-100 text-violet-700' };
        const labels = { all: 'All', teaching: 'Teaching', non_teaching: 'Non-Teaching', teaching_related: 'Tch-Related' };
        return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${colors[type] || 'bg-slate-100'}`}>{labels[type] || type}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black uppercase italic text-[#1B3A6B]">Training Needs Assessment</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step 1: Conduct of TNA</p>
                </div>
                <button onClick={() => { setEditingForm(null); setShowBuilder(true); }}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700">
                    <Plus size={16} /> Create TNA Form
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-4">
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Filter size={14} /> {showFilters ? 'Hide' : 'Show'} Filters {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showFilters && (
                    <div className="flex gap-4 mt-3 flex-wrap">
                        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                        </select>
                        <select value={filters.target_position_type} onChange={e => setFilters({ ...filters, target_position_type: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                            <option value="">All Types</option>
                            <option value="teaching">Teaching</option>
                            <option value="non_teaching">Non-Teaching</option>
                            <option value="teaching_related">Teaching-Related</option>
                        </select>
                        <input value={filters.school_year} onChange={e => setFilters({ ...filters, school_year: e.target.value })}
                            placeholder="School Year" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold w-32" />
                    </div>
                )}
            </div>

            {/* TNA Forms Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 animate-pulse space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
                    </div>
                ) : forms.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-400">No TNA forms yet</p>
                        <p className="text-xs text-slate-300 mt-1">Create your first TNA form to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Title</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">School Year</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Target</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Response Rate</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Deadline</th>
                                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forms.map((f, i) => (
                                    <motion.tr key={f.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                        onClick={() => openResults(f.id)}
                                    >
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#1B3A6B]">{f.title}</p>
                                            {f.description && <p className="text-[10px] text-slate-400 mt-0.5">{f.description.substring(0, 60)}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{f.school_year}</td>
                                        <td className="px-6 py-4">{getTypeBadge(f.target_position_type)}</td>
                                        <td className="px-6 py-4">{getStatusBadge(f.status)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-20">
                                                    <div className="h-full bg-emerald-500 rounded-full transition-all"
                                                        style={{ width: `${f.target_count > 0 ? Math.min((f.response_count / f.target_count) * 100, 100) : 0}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">{f.response_count}/{f.target_count}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {f.deadline_date ? new Date(f.deadline_date).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                                                {f.status === 'draft' && (
                                                    <button onClick={() => handleActivate(f.id)}
                                                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold hover:bg-emerald-200">Activate</button>
                                                )}
                                                {f.status === 'active' && (
                                                    <button onClick={() => handleClose(f.id)}
                                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-[10px] font-bold hover:bg-red-200">Close</button>
                                                )}
                                                <button onClick={() => exportCSV(f.id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-xl"><Download size={14} className="text-slate-400" /></button>
                                                <button onClick={() => { setEditingForm(f); setShowBuilder(true); }}
                                                    className="p-1.5 hover:bg-slate-100 rounded-xl"><Eye size={14} className="text-slate-400" /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Results Drawer */}
            <AnimatePresence>
                {viewResults && resultsData && (
                    <motion.div
                        initial={{ opacity: 0, x: 400 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 400 }}
                        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-[#1B3A6B]">{resultsData.form?.title}</h3>
                                    <p className="text-xs text-slate-400">{resultsData.totalResponses} responses</p>
                                </div>
                                <button onClick={() => { setViewResults(null); setResultsData(null); }}
                                    className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                            </div>
                            {resultsData.results?.map((r, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                    <p className="text-sm font-bold text-[#1B3A6B] mb-2">{i + 1}. {r.question?.question_text}</p>
                                    {r.question?.question_type === 'rating' && (
                                        <div>
                                            <p className="text-xs text-slate-500">Average: <span className="font-bold text-emerald-600">{r.average || '—'}/5</span></p>
                                            <div className="flex gap-1 mt-2">
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <div key={v} className="flex-1 text-center">
                                                        <div className="h-16 bg-slate-100 rounded-lg relative overflow-hidden">
                                                            <div className="absolute bottom-0 w-full bg-emerald-500 transition-all"
                                                                style={{ height: r.distribution ? `${((r.distribution[v] || 0) / Math.max(...Object.values(r.distribution || {1:0}), 1)) * 100}%` : '0%' }} />
                                                        </div>
                                                        <p className="text-[9px] font-bold text-slate-500 mt-1">{v}: {r.distribution?.[v] || 0}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {r.question?.question_type === 'text' && r.answers?.length > 0 && (
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {r.answers.map((a, j) => (
                                                <p key={j} className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-100">{a.answer_text}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form Builder Modal */}
            {showBuilder && (
                <LDTNAFormBuilder
                    editForm={editingForm}
                    onClose={() => { setShowBuilder(false); setEditingForm(null); fetchForms(); }}
                />
            )}
        </div>
    );
};

export default LDTNAManagement;
