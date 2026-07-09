import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Star, Loader2, Trophy, Users, Search } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import io from 'socket.io-client';

const token = () => localStorage.getItem('token');
const authHeader = () => ({ 'Authorization': `Bearer ${token()}` });

const RREvaluationWorkspace = () => {
    const [searches, setSearches] = useState([]);
    const [searchId, setSearchId] = useState(null);
    const [nominees, setNominees] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [scores, setScores] = useState({});
    const [selectedNomineeId, setSelectedNomineeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rankings, setRankings] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/api/rr/searches`, { headers: authHeader() })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const filtered = data.filter(s => ['evaluation', 'deliberation', 'announced'].includes(s.status));
                setSearches(filtered);
                if (filtered.length > 0) setSearchId(filtered[0].id);
            });
    }, []);

    const fetchWorkspace = useCallback(async (isSilent = false) => {
        if (!searchId) return;
        if (!isSilent) setLoading(true);
        try {
            const [nomRes, critRes, rankRes] = await Promise.all([
                fetch(`${API_BASE}/api/rr/evaluation/workspace?search_id=${searchId}`, { headers: authHeader() }),
                fetch(`${API_BASE}/api/rr/evaluation/criteria?search_id=${searchId}`, { headers: authHeader() }),
                fetch(`${API_BASE}/api/rr/evaluation/scores-summary?search_id=${searchId}`, { headers: authHeader() })
            ]);
            if (nomRes.ok) {
                const data = await nomRes.json();
                setNominees(Array.isArray(data) ? data : []);
                if (!selectedNomineeId && data.length > 0) setSelectedNomineeId(data[0].nomination_id);
            }
            if (critRes.ok) {
                const data = await critRes.json();
                setCriteria(Array.isArray(data) ? data : []);
            }
            if (rankRes.ok) {
                const data = await rankRes.json();
                setRankings(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
        finally { if (!isSilent) setLoading(false); }
    }, [searchId, selectedNomineeId]);

    useEffect(() => { fetchWorkspace(); }, [fetchWorkspace]);

    useEffect(() => {
        if (!searchId) return;
        const socket = io(API_BASE);
        socket.on(`rr:ca:scoreUpdate:${searchId}`, () => fetchWorkspace(true));
        return () => socket.disconnect();
    }, [searchId, fetchWorkspace]);

    useEffect(() => {
        if (!selectedNomineeId) { setScores({}); return; }
        fetch(`${API_BASE}/api/rr/evaluation/scores?nomination_id=${selectedNomineeId}`, { headers: authHeader() })
            .then(r => r.ok ? r.json() : {})
            .then(data => setScores(typeof data === 'object' ? data : {}));
    }, [selectedNomineeId]);

    const getScore = (criterionId) => scores[criterionId] !== undefined ? scores[criterionId] : 0;

    const handleScoreCommit = async (criterionId, maxScore, value) => {
        const scoreGiven = Math.max(0, Math.min(maxScore, Number(value) || 0));
        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/rr/evaluation/score`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ nomination_id: selectedNomineeId, criterion_id: criterionId, score_given: scoreGiven })
            });
            fetchWorkspace(true);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const selectedNominee = nominees.find(n => n.nomination_id === selectedNomineeId);
    const posType = selectedNominee?.position_type || 'teaching';
    const filteredCriteria = criteria.filter(c => c.position_type === posType);

    const totalScore = filteredCriteria.reduce((sum, c) => {
        const s = getScore(c.id);
        return sum + ((s / c.max_score) * c.weight_percent);
    }, 0);

    if (loading) {
        return <div className="p-20 text-center animate-pulse font-black text-slate-400">Loading Evaluation Workspace...</div>;
    }

    return (
        <div className="flex gap-6 select-none">
            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500 p-2 rounded-xl">
                        <Trophy size={22} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">Evaluation & Scoring</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step 4 · Rate eligible nominees</p>
                    </div>
                </div>

                <select value={searchId || ''} onChange={e => setSearchId(parseInt(e.target.value))}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-amber-500">
                    <option value="">Select Search</option>
                    {searches.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>

                {nominees.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-12 text-center">
                        <Users size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-400">No eligible nominees for this search</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Nominee to Rate</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {nominees.map(nom => (
                                    <button key={nom.nomination_id}
                                        onClick={() => setSelectedNomineeId(nom.nomination_id)}
                                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                                            selectedNomineeId === nom.nomination_id
                                                ? 'bg-amber-500 border-amber-500 text-white shadow-lg'
                                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                                        }`}>
                                        <p className="text-xs font-black uppercase truncate">{nom.nominee_name}</p>
                                        <p className={`text-[10px] font-bold ${selectedNomineeId === nom.nomination_id ? 'text-amber-100' : 'text-slate-400'}`}>
                                            {nom.category_name} · {nom.total_score || 0}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedNominee && (
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black text-lg text-[#1B3A6B]">{selectedNominee.nominee_name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{selectedNominee.position_type?.replace('_', ' ')}</span>
                                                <span className="text-xs text-slate-500">{selectedNominee.category_name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-amber-500">{totalScore.toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-slate-400">Total Score</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-5">
                                    {filteredCriteria.map(c => {
                                        const val = getScore(c.id);
                                        const pct = c.max_score > 0 ? Math.round((val / c.max_score) * 100) : 0;
                                        return (
                                            <div key={c.id}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{c.criterion_label}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                            Weight: {c.weight_percent}% · Max: {c.max_score}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0 ml-4">
                                                        <input type="number" min="0" max={c.max_score} step="0.5"
                                                            value={val}
                                                            onChange={e => setScores({ ...scores, [c.id]: e.target.value })}
                                                            onBlur={e => handleScoreCommit(c.id, c.max_score, e.target.value)}
                                                            className="w-16 text-center font-black text-[#1B3A6B] border border-slate-200 rounded-lg py-1 text-sm outline-none focus:border-amber-500" />
                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">of {c.max_score}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div animate={{ width: `${pct}%` }}
                                                            className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-slate-300'}`} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 w-10 text-right">{pct}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="w-[380px] space-y-4">
                <div className="bg-[#1B3A6B] rounded-2xl p-6 text-white shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-4">Live Rankings</h3>
                    <p className="text-[10px] font-bold text-blue-300 mb-4">Real-time ranked results</p>
                    <div className="space-y-4">
                        {rankings.length === 0 ? (
                            <p className="text-[10px] text-blue-300">No scores yet</p>
                        ) : (
                            rankings.map((r, i) => (
                                <div key={r.nomination_id} className={`${selectedNomineeId === r.nomination_id ? 'opacity-100' : 'opacity-80'}`}>
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">
                                            {i === 0 ? <Star size={14} className="text-yellow-400" fill="currentColor" /> : r.rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black truncate">{r.nominee_name}</p>
                                            <p className="text-[9px] font-bold text-blue-300">{r.category_name}</p>
                                        </div>
                                        <span className="text-sm font-black text-yellow-400">
                                            {parseFloat(r.total_score || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div animate={{ width: `${Math.min(r.total_score || 0, 100)}%` }}
                                            className="h-full bg-gradient-to-r from-blue-400 to-yellow-400 rounded-full" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {selectedNominee && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Score Breakdown</h4>
                        <div className="space-y-3 mb-4">
                            {filteredCriteria.map(c => {
                                const val = getScore(c.id);
                                const weightedScore = c.max_score > 0 ? ((val / c.max_score) * c.weight_percent) : 0;
                                return (
                                    <div key={c.id} className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-500">{c.criterion_label}</span>
                                        <span className="font-black text-[#1B3A6B]">{weightedScore.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                            <span className="text-xs font-black text-slate-700 uppercase">Total Score</span>
                            <span className="text-2xl font-black text-amber-500">{totalScore.toFixed(2)}</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 text-right mt-1">out of 100.00</p>
                    </div>
                )}

                {saving && <p className="text-center text-[10px] font-bold text-slate-400">Saving score...</p>}
            </div>
        </div>
    );
};

export default RREvaluationWorkspace;
