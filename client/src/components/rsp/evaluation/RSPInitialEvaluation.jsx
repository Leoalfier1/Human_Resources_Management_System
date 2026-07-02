import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, FileText, AlertCircle, Loader2, ChevronDown, Eye, Circle } from 'lucide-react';
import { useInitialEvaluation } from '../../../hooks/useInitialEvaluation';

// Files are served by the backend (Express static /uploads), not the Vite dev server —
// so document links must point at the API origin, not the React app's origin.
const SERVER_URL = 'http://localhost:5000';

const RSPInitialEvaluation = () => {
    // 1. Manage Vacancy Selection
    const [vacancies, setVacancies] = useState([]);
    const [selectedVacId, setSelectedVacId] = useState(null);
    const [isVacDropdownOpen, setIsVacDropdownOpen] = useState(false);

    // 2. Load the list of vacancies on mount
    useEffect(() => {
        const fetchVacList = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/rsp/vacancies', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.length > 0) {
                    setVacancies(data);
                    setSelectedVacId(data[0].id); // Auto-select the first vacancy
                }
            } catch (e) {
                console.error("Failed to load vacancies", e);
            }
        };
        fetchVacList();
    }, []);

    // 3. Connect to our Evaluation Hook
    const {
        queueData,
        selectedApplicant,
        setSelectedApplicant,
        details,
        fetchQueue,
        fetchDetails
    } = useInitialEvaluation(selectedVacId);

    const [decisionLoading, setDecisionLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [finalizing, setFinalizing] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null); // { url, name }

    // --- HANDLERS ---
    const handleCriteriaToggle = async (criterionId, passed) => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/rsp/evaluation/applicant/${selectedApplicant.id}/criterion/${criterionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ passed })
        });
        fetchDetails(selectedApplicant.id);
    };

    const handleVerifyDoc = async (docId) => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/rsp/evaluation/document/${docId}/verify`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchDetails(selectedApplicant.id);
    };

    const handleDecision = async (decision) => {
        if (decision === 'disqualified' && !window.confirm("Disqualify this applicant? This action is difficult to reverse.")) return;

        setDecisionLoading(true);
        setServerError("");
        const token = localStorage.getItem('token');

        const res = await fetch(`http://localhost:5000/api/rsp/evaluation/applicant/${selectedApplicant.id}/decision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ decision })
        });

        const data = await res.json();
        if (res.ok) {
            fetchQueue(); // Refresh the list
        } else {
            setServerError(data.message);
        }
        setDecisionLoading(false);
    };

    const handleFinalize = async () => {
        if (!window.confirm("Finalize Initial Evaluation? This advances the vacancy to Stage 5 and cannot be undone.")) return;
        setFinalizing(true);
        setServerError("");
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/rsp/evaluation/finalize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ vacancy_id: selectedVacId })
            });
            const data = await res.json();
            if (res.ok) {
                fetchQueue();
            } else {
                setServerError(data.message);
            }
        } catch (e) {
            setServerError("Could not reach the server.");
        } finally {
            setFinalizing(false);
        }
    };

    // --- RENDER HELPERS ---
    if (!selectedVacId) return (
        <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Loader2 className="animate-spin mx-auto text-slate-300 mb-4" size={32} />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Searching for active vacancies...</p>
        </div>
    );

    if (!queueData) return (
        <div className="p-20 text-center">
            <Loader2 className="animate-spin mx-auto text-[#1B3A6B] mb-4" size={32} />
            <p className="text-[#1B3A6B] font-bold text-sm">Loading applicant queue...</p>
        </div>
    );

    const evaluatedCount = queueData.queue.filter(a => a.status !== 'submitted').length;
    const allEvaluated = evaluatedCount === queueData.queue.length && queueData.queue.length > 0;

    return (
        <div className="space-y-4 select-none pb-10">

            {/* 1. PAGE SUBHEADER — breadcrumb + vacancy switcher only.
                NOTE: the page title itself ("Initial Evaluation") is already rendered by
                RSPHeader.jsx in the sticky top bar — duplicating it here caused the
                faint "ghost text" overlap bug, so it has been removed from this component. */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="relative">
                    <button
                        onClick={() => setIsVacDropdownOpen(!isVacDropdownOpen)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-[#1B3A6B] transition-colors"
                    >
                        Stage 3 of RSP · {queueData.vacancy?.position_title} · {queueData.vacancy?.ref_no}
                        {vacancies.length > 1 && (
                            <ChevronDown size={12} className={`transition-transform ${isVacDropdownOpen ? 'rotate-180' : ''}`} />
                        )}
                    </button>

                    {/* Vacancy switcher */}
                    <AnimatePresence>
                        {isVacDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute left-0 mt-2 w-full min-w-[300px] bg-white border border-slate-200 shadow-2xl rounded-xl z-[100] overflow-hidden"
                            >
                                {vacancies.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => { setSelectedVacId(v.id); setIsVacDropdownOpen(false); }}
                                        className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors border-b last:border-0"
                                    >
                                        <p className="text-xs font-bold text-[#1B3A6B]">{v.position_title}</p>
                                        <p className="text-[10px] font-semibold text-slate-400">{v.ref_no} · {v.assigned_school}</p>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 shrink-0">
                    <div className="p-1.5 bg-slate-50 rounded-lg text-[#1B3A6B]"><Clock size={16} /></div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Processing TAT</p>
                        <p className="text-xs font-bold text-[#1B3A6B] mt-0.5">{queueData.processing_time_label}</p>
                    </div>
                </div>
            </div>

            {/* 2. TWO PANEL EVALUATION AREA */}
            <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)]">

                {/* LEFT: APPLICANT QUEUE */}
                <div className="w-full lg:w-[300px] shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Applicant Queue</h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{queueData.queue.length} Applicant{queueData.queue.length === 1 ? '' : 's'}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto sidebar-scroll">
                            {queueData.queue.length === 0 ? (
                                <div className="p-10 text-center text-slate-300 text-xs font-semibold">No pending applicants</div>
                            ) : (
                                queueData.queue.map(app => {
                                    const isSelected = selectedApplicant?.id === app.id;
                                    const dotColor = app.status === 'qualified' ? 'bg-emerald-500' : (app.status === 'disqualified' ? 'bg-red-500' : 'bg-red-500');

                                    return (
                                        <button
                                            key={app.id}
                                            onClick={() => { setSelectedApplicant(app); setServerError(""); }}
                                            className={`w-full text-left px-5 py-3 transition-colors flex items-center justify-between border-l-[3px] ${isSelected ? 'bg-blue-50 border-[#1B3A6B]' : 'hover:bg-slate-50 border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${app.status === 'submitted' ? 'animate-pulse' : ''}`} />
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-[#1B3A6B] leading-tight truncate">{app.full_name}</p>
                                                    <p className="text-[10px] font-semibold text-slate-400">{app.applicant_code}</p>
                                                </div>
                                            </div>
                                            {app.status === 'qualified' && (
                                                <span className="text-[9px] font-bold text-emerald-600 whitespace-nowrap ml-2">✓ Qualified</span>
                                            )}
                                            {app.status === 'disqualified' && (
                                                <span className="text-[9px] font-bold text-red-600 whitespace-nowrap ml-2">✕ Disqualified</span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: EVALUATION CONTENT */}
                {selectedApplicant ? (
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 sidebar-scroll relative">

                        {/* A. STANDARDS CARD */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-[13px] font-bold text-[#1B3A6B]">Minimum Qualification Standards</h3>
                                <span className="text-[10px] font-semibold text-slate-400">
                                    DepEd-CSC Standards · {queueData.vacancy?.position_title}
                                </span>
                            </div>
                            <div className="p-4 space-y-2">
                                {details.criteria.map(c => (
                                    <div key={c.criterion_id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1B3A6B] leading-tight">{c.criterion_label}</p>
                                            {c.is_required && <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide mt-0.5">Required</p>}
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                            <button
                                                onClick={() => handleCriteriaToggle(c.criterion_id, true)}
                                                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all border ${c.passed === 1 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300 hover:border-emerald-300 hover:text-emerald-400'}`}
                                            >
                                                <CheckCircle2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleCriteriaToggle(c.criterion_id, false)}
                                                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all border ${c.passed === 0 ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-200 text-slate-300 hover:border-red-300 hover:text-red-400'}`}
                                            >
                                                <XCircle size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* B. DOCUMENTS CARD (3 states: verified / pending review / not yet uploaded) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-[13px] font-bold text-[#1B3A6B]">Required Documents</h3>
                                <span className="text-[10px] font-semibold text-slate-400">
                                    {details.documents.filter(d => !!d.is_verified).length}/{details.documents.length} Verified
                                </span>
                            </div>
                            <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto sidebar-scroll">
                                {details.documents.length === 0 ? (
                                    <div className="p-10 text-center text-slate-300 text-xs font-semibold">
                                        No required documents configured for this vacancy, and the applicant hasn't uploaded anything yet.
                                    </div>
                                ) : (
                                    details.documents.map(doc => {
                                        const hasFile = !!doc.file_path;
                                        const isVerified = hasFile && !!doc.is_verified;
                                        const isPending = hasFile && !isVerified;
                                        const fileUrl = hasFile ? `${SERVER_URL}${doc.file_path}` : null;

                                        const rowBg = isVerified
                                            ? 'bg-emerald-50/60 border-emerald-100'
                                            : isPending
                                            ? 'bg-blue-50/60 border-blue-100'
                                            : 'bg-white border-slate-100';

                                        return (
                                            <div key={doc.required_doc_id ?? `uploaded-${doc.id}`} className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border ${rowBg}`}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {isVerified ? (
                                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                    ) : isPending ? (
                                                        <Circle size={18} className="text-blue-400 shrink-0" />
                                                    ) : (
                                                        <Circle size={18} className="text-slate-300 shrink-0" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-bold text-[#1B3A6B] leading-tight">
                                                            {doc.document_type}
                                                            {!!doc.is_mandatory && <span className="text-red-500 ml-1">*</span>}
                                                        </p>
                                                        {hasFile ? (
                                                            <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[260px]">
                                                                {doc.file_name}
                                                                <span className={`ml-2 ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                    {isVerified ? 'verified' : 'uploaded · pending review'}
                                                                </span>
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] text-slate-400 font-semibold">Not yet uploaded</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {hasFile && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => setPreviewDoc({ url: fileUrl, name: doc.document_type })}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-[#1B3A6B] hover:bg-slate-50 transition-all"
                                                        >
                                                            <Eye size={12} /> View
                                                        </button>
                                                        {!isVerified && (
                                                            <button
                                                                onClick={() => handleVerifyDoc(doc.id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-[9px] font-bold text-white transition-all"
                                                            >
                                                                <CheckCircle2 size={12} /> Verify
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* C. ACTION FOOTER */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex items-center justify-between sticky bottom-0">
                            <div className="flex flex-col gap-2">
                                <AnimatePresence>
                                    {serverError && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-red-600">
                                            <AlertCircle size={14} />
                                            <p className="text-[11px] font-semibold">{serverError}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <p className="text-[11px] font-semibold text-slate-400">
                                    {evaluatedCount} of {queueData.queue.length} evaluated in this batch
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDecision('disqualified')}
                                    disabled={decisionLoading}
                                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 transition-all rounded-lg text-[10px] font-bold disabled:opacity-50"
                                >
                                    ✕ Disqualify
                                </button>
                                <button
                                    onClick={() => handleDecision('qualified')}
                                    disabled={decisionLoading}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white transition-all rounded-lg text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {decisionLoading ? <Loader2 className="animate-spin" size={13} /> : <CheckCircle2 size={13} />}
                                    Mark as Qualified
                                </button>

                                {allEvaluated && (
                                    <button
                                        onClick={handleFinalize}
                                        disabled={finalizing}
                                        className="px-4 py-2 bg-[#1B3A6B] hover:bg-[#162E55] text-white transition-all rounded-lg text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {finalizing ? <Loader2 className="animate-spin" size={13} /> : null}
                                        Finalize & Advance to Stage 5 →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-white rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
                        <p className="text-slate-400 font-semibold text-sm italic">Select an applicant from the queue to start screening</p>
                    </div>
                )}
            </div>

            {/* DOCUMENT PREVIEW MODAL */}
            <AnimatePresence>
                {previewDoc && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-6"
                        onClick={() => setPreviewDoc(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                                <p className="text-sm font-black text-[#1B3A6B] truncate">{previewDoc.name}</p>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={previewDoc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-slate-400 hover:text-[#1B3A6B] uppercase tracking-widest"
                                    >
                                        Open in New Tab
                                    </a>
                                    <button
                                        onClick={() => setPreviewDoc(null)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <XCircle size={22} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-50 overflow-auto">
                                <iframe
                                    src={previewDoc.url}
                                    title={previewDoc.name}
                                    className="w-full h-full border-0"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default RSPInitialEvaluation;
