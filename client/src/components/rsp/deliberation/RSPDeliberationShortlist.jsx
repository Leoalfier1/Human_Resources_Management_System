import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award, AlertTriangle, Send, Loader2, Lock, CheckCircle2, ShieldCheck, ArrowRight, Users, BarChart3 } from 'lucide-react';
import { useDeliberation } from '../../../hooks/useDeliberation';
import EmptyStagePanel from '../../shared/EmptyStagePanel';
import { API_BASE } from '../../../utils/api';

const API = API_BASE;

const NotesCell = ({ applicant, onSave }) => {
    const [value, setValue] = useState(applicant.background_investigation_notes || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setValue(applicant.background_investigation_notes || '');
    }, [applicant.background_investigation_notes]);

    const handleBlur = async () => {
        if (value === (applicant.background_investigation_notes || '')) return;
        setSaving(true);
        const ok = await onSave(applicant.id, value);
        setSaving(false);
        if (ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        }
    };

    return (
        <div className="relative">
            <textarea
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={handleBlur}
                rows={2}
                placeholder="Background investigation notes..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
            />
            <div className="absolute -top-2 right-1 text-[9px] font-black uppercase tracking-widest">
                {saving && <span className="text-slate-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving</span>}
                {saved && !saving && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10} /> Saved</span>}
            </div>
        </div>
    );
};

const RSPDeliberationShortlist = () => {
    const [vacancies, setVacancies] = useState([]);
    const [vacancyId, setVacancyId] = useState(null);
    const [vacLoading, setVacLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [toast, setToast] = useState(null);
    const [qualifiedCount, setQualifiedCount] = useState(null);

    useEffect(() => {
        const fetchVacancies = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API}/api/rsp/vacancies`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setVacancies(list);
                if (list.length > 0) setVacancyId(list[0].id);
            } catch (e) {
                console.error('Failed to load vacancies:', e);
            } finally {
                setVacLoading(false);
            }
        };
        fetchVacancies();
    }, []);

    const { data, loading, error, updateBI, recommend, endorse, isEndorsing, refresh } = useDeliberation(vacancyId);

    useEffect(() => {
        if (!vacancyId) { setQualifiedCount(null); return; }
        let cancelled = false;
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API}/api/rsp/deliberation/qualified-count?vacancy_id=${vacancyId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    if (!cancelled) setQualifiedCount(json.count ?? 0);
                } else {
                    if (!cancelled) setQualifiedCount(null);
                }
            } catch {
                if (!cancelled) setQualifiedCount(null);
            }
        })();
        return () => { cancelled = true; };
    }, [vacancyId]);

    const recommendedCount = data.filter(d => d.is_recommended).length;
    const isAlreadyEndorsed = data.length > 0 && data[0].current_stage >= 9;

    const handleToggleRecommend = (applicant) => {
        if (!applicant.is_top5) return;
        recommend(applicant.id, !applicant.is_recommended);
    };

    const handleEndorseClick = () => {
        if (recommendedCount === 0) {
            setToast({ type: 'error', message: 'Select at least one candidate to recommend before endorsing.' });
            setTimeout(() => setToast(null), 3000);
            return;
        }
        setConfirming(true);
    };

    const handleConfirmEndorse = async () => {
        setConfirming(false);
        const result = await endorse();
        setToast({ type: result.success ? 'success' : 'error', message: result.message });
        setTimeout(() => setToast(null), 3500);
    };

    if (vacLoading) {
        return <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest">Loading Postings...</div>;
    }

    if (vacancies.length === 0) {
        return (
            <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                No vacancies found. Post a vacancy first.
            </div>
        );
    }

    return (
        <div className="space-y-6 select-none pb-20 relative">
            {/* HEADER + VACANCY SELECTOR */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#1B3A6B] uppercase tracking-tight italic">Deliberation &amp; Shortlist</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Stage 8 · HRMPSB review of Top 5 ranked candidates
                    </p>
                </div>
                <select
                    className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-[#1B3A6B] outline-none shadow-sm max-w-sm"
                    value={vacancyId || ''}
                    onChange={e => setVacancyId(Number(e.target.value))}
                >
                    {vacancies.map(v => (
                        <option key={v.id} value={v.id}>{v.ref_no} — {v.position_title}</option>
                    ))}
                </select>
            </div>

            {/* SUMMARY BAR */}
            {!loading && data.length > 0 && (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#1B3A6B] p-3 rounded-2xl text-white">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-[#1B3A6B] uppercase">{data[0].position_title}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {data[0].ref_no} · {recommendedCount} of {Math.min(5, data.length)} top candidates recommended</p>
                        </div>
                    </div>

                    {isAlreadyEndorsed ? (
                        <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={16} /> Shortlist Already Endorsed
                        </div>
                    ) : (
                        <button
                            onClick={handleEndorseClick}
                            disabled={isEndorsing}
                            className="flex items-center gap-2 px-6 py-3 bg-[#D6402F] hover:bg-[#b53526] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/20"
                        >
                            {isEndorsing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Endorse Shortlist to SDS
                        </button>
                    )}
                </div>
            )}

            {/* TABLE */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                {error ? (
                    <div className="p-20 text-center bg-white rounded-[2.5rem] shadow-sm border border-red-200">
                        <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
                        <h2 className="text-xl font-black text-red-600 uppercase italic mb-2">Failed to Load</h2>
                        <p className="text-red-400 text-sm mb-4">{error}</p>
                        <button onClick={refresh} className="px-6 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                            Retry
                        </button>
                    </div>
                ) : loading ? (
                    <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest">
                        Loading Ranked Candidates...
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-8">
                        <EmptyStagePanel
                            icon={BarChart3}
                            title="No Assessed Candidates Yet"
                            message={
                                qualifiedCount != null && qualifiedCount > 0
                                    ? `${qualifiedCount} qualified applicant${qualifiedCount !== 1 ? 's' : ''} · 0 of ${qualifiedCount} scored in Comparative Assessment`
                                    : 'Candidates must complete Comparative Assessment before appearing here.'
                            }
                            actionLabel="Go to Comparative Assessment"
                            onAction={() => { window.location.href = '/rsp/comparative-assessment'; }}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <th className="px-6 py-5 w-16">Rank</th>
                                    <th className="px-4 py-5">Applicant</th>
                                    <th className="px-4 py-5 text-center">A</th>
                                    <th className="px-4 py-5 text-center">B</th>
                                    <th className="px-4 py-5 text-center">C</th>
                                    <th className="px-4 py-5 text-center">Total</th>
                                    <th className="px-4 py-5 min-w-[260px]">Background Investigation Notes</th>
                                    <th className="px-6 py-5 text-center">Recommend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.map((app) => (
                                    <tr
                                        key={app.id}
                                        className={`transition-colors ${app.is_top5 ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/50 opacity-60'}`}
                                    >
                                        <td className="px-6 py-5">
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${
                                                app.is_top5 ? 'bg-[#1B3A6B] text-white' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {app.rank_val}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5">
                                            <p className="font-black text-[#1B3A6B] text-sm uppercase">{app.full_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-widest">{app.applicant_code}</p>
                                        </td>
                                        <td className="px-4 py-5 text-center text-xs font-bold text-slate-500">{app.A != null ? parseFloat(app.A).toFixed(1) : '—'}</td>
                                        <td className="px-4 py-5 text-center text-xs font-bold text-slate-500">{app.B != null ? parseFloat(app.B).toFixed(1) : '—'}</td>
                                        <td className="px-4 py-5 text-center text-xs font-bold text-slate-500">{app.C != null ? parseFloat(app.C).toFixed(1) : '—'}</td>
                                        <td className="px-4 py-5 text-center font-black text-[#1B3A6B] text-sm">{parseFloat(app.total_score).toFixed(2)}</td>
                                        <td className="px-4 py-5">
                                            {app.is_top5 ? (
                                                <NotesCell applicant={app} onSave={updateBI} />
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                    <Lock size={12} /> Outside Top 5
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button
                                                onClick={() => handleToggleRecommend(app)}
                                                disabled={!app.is_top5}
                                                title={app.is_top5 ? 'Toggle recommendation' : 'Only Top 5 candidates can be recommended'}
                                                className={`mx-auto flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                                                    ${!app.is_top5
                                                        ? 'border-slate-100 text-slate-200 cursor-not-allowed'
                                                        : app.is_recommended
                                                            ? 'bg-amber-400 border-amber-400 text-white shadow-lg shadow-amber-200'
                                                            : 'border-slate-200 text-slate-300 hover:border-amber-300 hover:text-amber-400'}`}
                                            >
                                                <Star size={18} fill={app.is_recommended ? 'currentColor' : 'none'} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CONFIRM ENDORSE MODAL */}
            <AnimatePresence>
                {confirming && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-6"
                        onClick={() => setConfirming(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4 text-amber-500">
                                <AlertTriangle size={28} />
                                <h3 className="text-lg font-black text-[#1B3A6B] uppercase">Confirm Endorsement</h3>
                            </div>
                            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                                You are endorsing <strong>{recommendedCount}</strong> recommended candidate{recommendedCount !== 1 ? 's' : ''} to the Schools Division Superintendent. This advances the vacancy to <strong>Stage 9 (Selection)</strong> and cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirming(false)}
                                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmEndorse}
                                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-[#D6402F] hover:bg-[#b53526] text-white flex items-center gap-2 shadow-lg"
                                >
                                    <Award size={14} /> Confirm Endorsement
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOAST */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-8 right-8 z-[300] px-6 py-4 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2
                            ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RSPDeliberationShortlist;
