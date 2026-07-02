import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Printer, Send, CheckCircle2, Clock, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { useResultsPosting } from '../../../hooks/useResultsPosting';

const API = 'http://localhost:5000';

const RSPResultsPosting = () => {
    const [vacancies, setVacancies] = useState([]);
    const [vacancyId, setVacancyId] = useState(null);
    const [vacLoading, setVacLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);

    // Fetch vacancies list once
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

    const { data, loading, publish, isPublishing } = useResultsPosting(vacancyId);

    const handlePublishClick = () => setConfirming(true);

    const handleConfirmPublish = async () => {
        setConfirming(false);
        await publish();
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

    const isPublished = data?.posting_status === 'published';

    return (
        <div className="space-y-6 select-none pb-20">
            {/* HEADER + VACANCY SELECTOR */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#1B3A6B] uppercase tracking-tight italic">Results Posting</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Stage 7 · Post comparative assessment results before deliberation
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

            {loading || !data ? (
                <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest">
                    Preparing Results Preview...
                </div>
            ) : (
                <div className="flex flex-col xl:flex-row gap-8">
                    {/* LEFT: STATUS PANEL */}
                    <div className="w-full xl:w-[380px] space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                            <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest mb-6 border-b pb-3">
                                Posting Status
                            </h3>

                            {isPublished ? (
                                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                                    <CheckCircle2 className="text-emerald-500 shrink-0" size={28} />
                                    <div>
                                        <p className="text-xs font-black text-emerald-700 uppercase">Published</p>
                                        <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                                            {data.posted_date ? new Date(data.posted_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                                    <Clock className="text-amber-500 shrink-0" size={28} />
                                    <div>
                                        <p className="text-xs font-black text-amber-700 uppercase">Not Yet Published</p>
                                        <p className="text-[10px] font-bold text-amber-600 mt-0.5">{data.deadline_label}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 space-y-3 text-xs font-bold text-slate-500">
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="uppercase tracking-widest text-slate-400">Position</span>
                                    <span className="text-[#1B3A6B] text-right">{data.vacancy?.position_title}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="uppercase tracking-widest text-slate-400">Reference No.</span>
                                    <span className="text-[#1B3A6B]">{data.vacancy?.ref_no}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="uppercase tracking-widest text-slate-400">Total Candidates</span>
                                    <span className="text-[#1B3A6B]">{data.results.length}</span>
                                </div>
                            </div>

                            {!isPublished && (
                                <button
                                    onClick={handlePublishClick}
                                    disabled={isPublishing || data.results.length === 0}
                                    className={`w-full mt-8 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg
                                        ${data.results.length === 0
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-[#D6402F] hover:bg-[#b53526] text-white shadow-red-900/20'}`}
                                >
                                    {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                                    Publish Results
                                </button>
                            )}
                            {data.results.length === 0 && !isPublished && (
                                <p className="text-[10px] font-bold text-slate-400 mt-3 text-center uppercase tracking-widest">
                                    No assessed candidates yet for this vacancy.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: OFFICIAL RESULTS PREVIEW */}
                    <div className="flex-1">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[#1B3A6B] font-black uppercase text-xs tracking-widest">
                                    <FileText size={16} /> Official Results Preview
                                </div>
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Printer size={14} /> Print
                                </button>
                            </div>

                            <div className="p-12 md:p-20 text-left bg-white min-h-[700px] font-serif text-slate-800 leading-relaxed">
                                <div className="text-center mb-10">
                                    <p className="uppercase text-xs">{data.org.republic}</p>
                                    <p className="uppercase text-xs font-bold">{data.org.dept}</p>
                                    <p className="uppercase text-xs">{data.org.region}</p>
                                    <p className="uppercase text-xs font-bold text-[#1B3A6B]">{data.org.office}</p>
                                    <div className="h-0.5 bg-[#1B3A6B] w-full mt-4" />
                                </div>

                                <h2 className="text-center text-lg font-bold uppercase mb-1">Results of Comparative Assessment</h2>
                                <p className="text-center text-sm uppercase mb-10">
                                    {data.vacancy?.position_title} · {data.vacancy?.assigned_school} · Ref. No. {data.vacancy?.ref_no}
                                </p>

                                <table className="w-full text-sm border-collapse mb-10">
                                    <thead>
                                        <tr className="border-b-2 border-slate-800">
                                            <th className="text-left py-2 w-16">Rank</th>
                                            <th className="text-left py-2">Name of Applicant</th>
                                            <th className="text-center py-2 w-32">Total Score</th>
                                            <th className="text-center py-2 w-32">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.results.map((r, i) => (
                                            <tr key={i} className="border-b border-slate-200">
                                                <td className="py-2 font-bold">{r.rank}</td>
                                                <td className="py-2 uppercase">{r.name}</td>
                                                <td className="py-2 text-center font-bold">{r.score}</td>
                                                <td className={`py-2 text-center font-bold ${r.remarks === 'Qualified' ? 'text-emerald-700' : 'text-red-700'}`}>
                                                    {r.remarks}
                                                </td>
                                            </tr>
                                        ))}
                                        {data.results.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-10 text-center text-slate-400 italic font-sans">
                                                    No candidates have been assessed yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                <p className="text-xs italic text-slate-500 font-sans">
                                    This document reflects the official ranking based on the PRIME-HRM Comparative Assessment rubric. 
                                    Candidates marked "Disqualified" did not meet minimum qualification requirements at Initial Evaluation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM PUBLISH MODAL */}
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
                                <h3 className="text-lg font-black text-[#1B3A6B] uppercase">Confirm Publication</h3>
                            </div>
                            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                Once published, results become visible to applicants and the workflow advances to <strong>Stage 8 (Deliberation)</strong>. This cannot be undone. Continue?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirming(false)}
                                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmPublish}
                                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-[#D6402F] hover:bg-[#b53526] text-white flex items-center gap-2 shadow-lg"
                                >
                                    <Send size={14} /> Publish Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RSPResultsPosting;
