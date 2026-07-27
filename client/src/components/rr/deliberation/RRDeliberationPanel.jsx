import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, XCircle, FileText, Star, Trophy, Loader2 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const authHeader = () => ({ 'Authorization': `Bearer ${token()}` });

const RRDeliberationPanel = () => {
    const [searches, setSearches] = useState([]);
    const [searchId, setSearchId] = useState(null);
    const [rankedList, setRankedList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notesModal, setNotesModal] = useState(null);
    const [notesText, setNotesText] = useState('');
    const [awards, setAwards] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/api/rr/searches`, { headers: authHeader() })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const filtered = data.filter(s => ['deliberation', 'announced'].includes(s.status));
                setSearches(filtered);
                if (filtered.length > 0) setSearchId(filtered[0].id);
            });
    }, []);

    const fetchRankedList = useCallback(async () => {
        if (!searchId) return;
        setLoading(true);
        try {
            const [rankRes, awardRes] = await Promise.all([
                fetch(`${API_BASE}/api/rr/deliberation/ranked-list?search_id=${searchId}`, { headers: authHeader() }),
                fetch(`${API_BASE}/api/rr/awards?search_id=${searchId}`, { headers: authHeader() })
            ]);
            if (rankRes.ok) setRankedList(await rankRes.json());
            if (awardRes.ok) setAwards(await awardRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [searchId]);

    useEffect(() => { fetchRankedList(); }, [fetchRankedList]);

    const handleSelectAwardee = async (nominationId) => {
        try {
            const res = await fetch(`${API_BASE}/api/rr/deliberation/select-awardee`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ nomination_id: nominationId })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message); return; }
            fetchRankedList();
        } catch (e) { alert('Failed to select'); }
    };

    const handleDeselectAwardee = async (nominationId) => {
        try {
            await fetch(`${API_BASE}/api/rr/deliberation/deselect-awardee`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ nomination_id: nominationId })
            });
            fetchRankedList();
        } catch (e) { alert('Failed to deselect'); }
    };

    const handleSaveNotes = async () => {
        if (!notesModal) return;
        try {
            await fetch(`${API_BASE}/api/rr/deliberation/notes`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ nomination_id: notesModal, notes: notesText })
            });
            setNotesModal(null);
            setNotesText('');
            fetchRankedList();
        } catch (e) { alert('Failed to save notes'); }
    };

    const handleLockResults = async () => {
        if (!window.confirm('Lock deliberation results? This finalizes the selection and prepares for announcement.')) return;
        try {
            const res = await fetch(`${API_BASE}/api/rr/deliberation/lock-results`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ search_id: searchId })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message); return; }
            alert('Results locked!');
            fetchRankedList();
        } catch (e) { alert('Failed to lock'); }
    };

    const groupedByCategory = {};
    rankedList.forEach(r => {
        if (!groupedByCategory[r.category_name]) groupedByCategory[r.category_name] = [];
        groupedByCategory[r.category_name].push(r);
    });

    const selectedCount = rankedList.filter(r => r.is_selected).length;
    const categoryCount = Object.keys(groupedByCategory).length;
    const allCategoriesHaveSelection = Object.values(groupedByCategory).every(list =>
        list.some(r => r.is_selected)
    );

    if (loading) {
        return <div className="p-20 text-center animate-pulse font-black text-slate-400">Loading Deliberation Panel...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-xl">
                    <FileText size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">Deliberation & Selection</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step 5 · Finalize awardees</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <select value={searchId || ''} onChange={e => setSearchId(parseInt(e.target.value))}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-purple-500">
                    <option value="">Select Search</option>
                    {searches.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <button onClick={handleLockResults} disabled={!allCategoriesHaveSelection || !searchId}
                    className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50 shadow-md">
                    <Lock size={14} /> Lock Results
                </button>
                <span className="text-[10px] font-bold text-slate-500">{selectedCount} selected</span>
            </div>

            {Object.entries(groupedByCategory).map(([category, list]) => (
                <div key={category} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
                        <h3 className="font-black text-[#1B3A6B]">{category}</h3>
                        <p className="text-[10px] text-slate-500">{list[0]?.max_awardees || 1} max awardee(s)</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Rank</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Score</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Notes</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Select</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((r, i) => (
                                    <tr key={r.nomination_id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${r.is_selected ? 'bg-purple-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                                                {i === 0 ? <Star size={14} className="text-yellow-400" fill="currentColor" /> : r.total_score ? i + 1 : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#1B3A6B]">{r.nominee_name}</p>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{r.position_type?.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-lg font-black text-[#1B3A6B]">{parseFloat(r.total_score || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => { setNotesModal(r.nomination_id); setNotesText(r.deliberation_notes || ''); }}
                                                className="text-[10px] font-bold text-purple-600 hover:text-purple-800 underline underline-offset-2">
                                                {r.deliberation_notes ? 'Edit Notes' : 'Add Notes'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            {r.is_selected ? (
                                                <button onClick={() => handleDeselectAwardee(r.nomination_id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-200">
                                                    <XCircle size={12} /> Deselect
                                                </button>
                                            ) : (
                                                <button onClick={() => handleSelectAwardee(r.nomination_id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold hover:bg-emerald-200">
                                                    <CheckCircle size={12} /> Select
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {notesModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setNotesModal(null)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 0.95 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-md p-6 m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-black text-lg text-[#1B3A6B] mb-4">Deliberation Notes</h3>
                        <textarea value={notesText} onChange={e => setNotesText(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-500" rows={4} />
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleSaveNotes}
                                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700">
                                Save Notes
                            </button>
                            <button onClick={() => setNotesModal(null)}
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

export default RRDeliberationPanel;
