import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Trash2, ChevronRight, Trophy, Loader2, ArrowUpCircle } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import RRSearchForm from './RRSearchForm';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const STATUS_COLORS = {
    draft: 'bg-slate-100 text-slate-600',
    open: 'bg-emerald-100 text-emerald-700',
    evaluation: 'bg-blue-100 text-blue-700',
    deliberation: 'bg-purple-100 text-purple-700',
    announced: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
};

const RRSearchManagement = () => {
    const [searches, setSearches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSearches = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/rr/searches`, { headers: headers() });
            if (res.ok) setSearches(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSearches(); }, [fetchSearches]);

    const handleAdvance = async (id) => {
        if (!window.confirm('Advance this search to the next status stage?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/rr/searches/${id}/advance`, {
                method: 'PATCH', headers: headers()
            });
            if (res.ok) fetchSearches();
            else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (e) { alert('Failed to advance status'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this draft search permanently?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/rr/searches/${id}`, {
                method: 'DELETE', headers: headers()
            });
            if (res.ok) fetchSearches();
            else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (e) { alert('Failed to delete'); }
    };

    const filtered = searches.filter(s =>
        s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.school_year?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-slate-200 rounded-[2.5rem]" />
                <div className="h-64 bg-slate-200 rounded-[2.5rem]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500 p-2 rounded-xl">
                        <Trophy size={22} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">R&R Searches</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage R&R Search Periods</p>
                    </div>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 shadow-md transition-all">
                    <Plus size={14} /> New Search
                </button>
            </div>

            <div className="relative max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search searches..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500 transition-all bg-white" />
            </div>

            {searches.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center">
                    <Trophy size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-400">No R&R searches yet</p>
                    <p className="text-xs text-slate-300 mt-1">Create your first search to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(search => (
                        <motion.div key={search.id} layout
                            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black text-[#1B3A6B]">{search.title}</h3>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[search.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {search.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                                        <span>SY {search.school_year}</span>
                                        <span>{search.search_type}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
    search.target_position_type === 'teaching' ? 'bg-amber-100 text-amber-700' :
    search.target_position_type === 'non_teaching' ? 'bg-sky-100 text-sky-700' :
    search.target_position_type === 'teaching_related' ? 'bg-violet-100 text-violet-700' :
    'bg-slate-100 text-slate-600'
}`}>{search.target_position_type?.replace('_', ' ')}</span>
                                        <span>{search.nominee_count || 0} nominee(s)</span>
                                        <span>{search.awardee_count || 0} awardee(s)</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                    {search.status === 'draft' && (
                                        <button onClick={() => handleDelete(search.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    {search.status !== 'draft' && search.status !== 'completed' && (
                                        <button onClick={() => handleAdvance(search.id)}
                                            className="flex items-center gap-1 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-bold hover:bg-amber-100 transition-all">
                                            <ArrowUpCircle size={14} /> Advance
                                        </button>
                                    )}
                                    <button onClick={() => window.open(`/rr/evaluation?search_id=${search.id}`, '_self')}
                                        className="flex items-center gap-1 px-3 py-2 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black hover:bg-[#0F2A4F] transition-all">
                                        Manage <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {showForm && (
                <RRSearchForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchSearches(); }} />
            )}
        </div>
    );
};

export default RRSearchManagement;
