import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronDown, Eye, Circle, Info, ShieldOff, User, FileWarning, FileText } from 'lucide-react';
import { useInitialEvaluation } from '../../../hooks/useInitialEvaluation';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import DisqualificationModal from '../../shared/DisqualificationModal';
import RequestRevisionModal from '../../shared/RequestRevisionModal';

const RSPInitialEvaluation = () => {
    const [vacancies, setVacancies] = useState([]);
    const [selectedVacId, setSelectedVacId] = useState(null);
    const [isVacDropdownOpen, setIsVacDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchVacList = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/rsp/vacancies`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.length > 0) {
                    setVacancies(data);
                    setSelectedVacId(data[0].id);
                }
            } catch (e) {
                console.error("Failed to load vacancies", e);
            }
        };
        fetchVacList();
    }, []);

    const {
        queueData,
        selectedApplicant,
        setSelectedApplicant,
        details,
        setDetails,
        fetchQueue,
        fetchDetails,
        silentFetchDetails,
        loading: hookLoading,
        error: hookError
    } = useInitialEvaluation(selectedVacId);

    const [decisionLoading, setDecisionLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [previewDoc, setPreviewDoc] = useState(null);
    const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
    const [showDisqualifyReadOnly, setShowDisqualifyReadOnly] = useState(false);
    const [revisionDocTarget, setRevisionDocTarget] = useState(null);
    const [docActionLoading, setDocActionLoading] = useState(false);
    const handleCriteriaToggle = async (criterionId, passed) => {
        let reason = null;
        if (!passed) {
            reason = window.prompt("Optional: Enter a specific reason why this criterion was not met (e.g., 'nonsubmission of necessary documents'). This will appear on the applicant's Annex E letter if they are disqualified.");
            if (reason === null) return; // User cancelled
        }
        
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/api/rsp/evaluation/applicant/${selectedApplicant.id}/criterion/${criterionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ passed, reason })
        });
        fetchDetails(selectedApplicant.id);
    };

    const handleVerifyDoc = async (docId, note) => {
        setDocActionLoading(true);
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/api/rsp/evaluation/document/${docId}/verify`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ note })
        });
        setDocActionLoading(false);
        setDetails(prev => ({
            ...prev,
            documents: prev.documents.map(d =>
                d.id === docId ? { ...d, verification_status: 'verified', verification_notes: note || null } : d
            )
        }));
        silentFetchDetails(selectedApplicant.id);
    };

    const handleRequestRevision = async (docId, reason) => {
        setDocActionLoading(true);
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/api/rsp/evaluation/document/${docId}/request-revision`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ reason })
        });
        setRevisionDocTarget(null);
        setDocActionLoading(false);
        setDetails(prev => ({
            ...prev,
            documents: prev.documents.map(d =>
                d.id === docId ? { ...d, verification_status: 'needs_revision', revision_note: reason || null } : d
            )
        }));
        silentFetchDetails(selectedApplicant.id);
    };

    const handleDecision = async (decision, remarks) => {
        setDecisionLoading(true);
        setServerError("");
        const token = localStorage.getItem('token');

        const body = { decision };
        if (decision === 'disqualified' && remarks) body.remarks = remarks;

        const res = await fetch(`${API_BASE}/api/rsp/evaluation/applicant/${selectedApplicant.id}/decision`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (res.ok) {
            setShowDisqualifyModal(false);
            await fetchQueue();
            const queue = queueData?.queue || [];
            const currentIdx = queue.findIndex(a => a.id === selectedApplicant.id);
            const nextUnevaluated = queue.find((a, i) => i > currentIdx && a.status === 'submitted');
            if (nextUnevaluated) {
                setSelectedApplicant(nextUnevaluated);
            } else {
                const firstUnevaluated = queue.find(a => a.status === 'submitted' && a.id !== selectedApplicant.id);
                if (firstUnevaluated) setSelectedApplicant(firstUnevaluated);
            }
        } else {
            setServerError(data.message);
        }
        setDecisionLoading(false);
    };

    // Note: handleFinalize was removed as part of Stage 3 cleanup.
    // The vacancy stage progression (3→5) is handled elsewhere; the
    // "Mark as Qualified" / "Revise Documents" per-applicant actions
    // are the correct evaluation workflow.

    if (!selectedVacId) return (
        <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Loader2 className="animate-spin mx-auto text-slate-300 mb-4" size={32} />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Searching for active vacancies...</p>
        </div>
    );

    if (hookError) return (
        <div className="p-20 text-center bg-white rounded-2xl border border-red-200">
            <AlertCircle className="mx-auto text-red-400 mb-4" size={32} />
            <p className="text-red-600 font-bold text-sm mb-2">Failed to load evaluation queue</p>
            <p className="text-red-400 text-xs mb-4">{hookError}</p>
            <button onClick={fetchQueue} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                Retry
            </button>
        </div>
    );

    if (!queueData || hookLoading) return (
        <div className="p-20 text-center">
            <Loader2 className="animate-spin mx-auto text-[#1B3A6B] mb-4" size={32} />
            <p className="text-[#1B3A6B] font-bold text-sm">Loading applicant queue...</p>
        </div>
    );

    const evaluatedCount = queueData.queue.filter(a => a.status !== 'submitted').length;
    const readiness = details?.readiness;
    const canQualify = readiness?.canQualify ?? false;
    const missingReasons = [];
    if (readiness && !readiness.allCriteriaMet) missingReasons.push(`${readiness.requiredCriteriaTotal - readiness.requiredCriteriaMet} required criteria not met`);
    if (readiness && !readiness.allDocsVerified) missingReasons.push(`${readiness.requiredDocsTotal - readiness.requiredDocsVerified} required documents not verified`);

    return (
        <div className="space-y-4 select-none pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="relative">
                    <button
                        onClick={() => setIsVacDropdownOpen(!isVacDropdownOpen)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-[#1B3A6B] transition-colors"
                    >
                        Stage 1 of RSP · {queueData.vacancy?.position_title} · {queueData.vacancy?.ref_no}
                        {vacancies.length > 1 && (
                            <ChevronDown size={12} className={`transition-transform ${isVacDropdownOpen ? 'rotate-180' : ''}`} />
                        )}
                    </button>
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
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Processing Time</p>
                        <p className="text-xs font-bold text-[#1B3A6B] mt-0.5">{queueData.processing_time_label}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)]">
                <div className="w-full lg:w-[300px] shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Applicant Queue</h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {queueData.queue.length} applicant{queueData.queue.length === 1 ? '' : 's'} · Batch 1
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto sidebar-scroll">
                            {queueData.queue.length === 0 ? (
                                <div className="p-10 text-center text-slate-300 text-xs font-semibold">No pending applicants</div>
                            ) : (
                                queueData.queue.map(app => {
                                    const isSelected = selectedApplicant?.id === app.id;
                                    const isQualified = app.status === 'qualified';
                                    const isDisqualified = app.status === 'disqualified';
                                    const isUnevaluated = app.status === 'submitted';
                                    const borderColor = isQualified ? 'border-emerald-500' : isDisqualified ? 'border-red-500' : 'border-slate-200';

                                    return (
                                        <button
                                            key={app.id}
                                            onClick={() => { setSelectedApplicant(app); setServerError(""); }}
                                            className={`w-full text-left px-5 py-3 transition-colors flex items-center justify-between border-l-[3px] ${isSelected ? 'bg-blue-50 border-[#1B3A6B]' : `${borderColor} hover:bg-slate-50`}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${isQualified ? 'bg-emerald-500' : isDisqualified ? 'bg-red-500' : 'bg-slate-300'} ${isUnevaluated ? 'animate-pulse' : ''}`} />
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-[#1B3A6B] leading-tight truncate">{app.full_name}</p>
                                                    <p className="text-[10px] font-semibold text-slate-400">{app.applicant_code}</p>
                                                </div>
                                            </div>
                                            {isQualified && (
                                                <span className="text-[9px] font-bold text-emerald-600 whitespace-nowrap ml-2 flex items-center gap-0.5">
                                                    <CheckCircle2 size={10} /> Qualified
                                                </span>
                                            )}
                                            {isDisqualified && (
                                                <span className="text-[9px] font-bold text-red-600 whitespace-nowrap ml-2 flex items-center gap-0.5">
                                                    <XCircle size={10} /> Disqualified
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {selectedApplicant ? (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden pr-1 relative">
                        {selectedApplicant.status === 'disqualified' && details?.application?.initial_evaluation_remarks && (
                            <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden shrink-0">
                                <div className="px-6 py-4 flex items-start gap-4">
                                    <div className="p-2 bg-red-50 rounded-xl shrink-0 mt-0.5">
                                        <ShieldOff size={18} className="text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-1">Previously Disqualified</p>
                                        <p className="text-[11px] font-semibold text-slate-700 leading-relaxed mb-2">
                                            {details.application.initial_evaluation_remarks}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            {details.application.disqualified_by_name && (
                                                <div className="flex items-center gap-1.5">
                                                    <User size={11} className="text-slate-400" />
                                                    <p className="text-[10px] font-bold text-slate-500">{details.application.disqualified_by_name}</p>
                                                </div>
                                            )}
                                            {details.application.disqualification_recorded_at && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={11} className="text-slate-400" />
                                                    <p className="text-[10px] font-bold text-slate-500">
                                                        {new Date(details.application.disqualification_recorded_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDisqualifyReadOnly(true)}
                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-[#1B3A6B] hover:bg-slate-50 transition-all shrink-0"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
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
                                            {c.is_required ? (
                                                <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide mt-0.5">Required</p>
                                            ) : (
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Preferred</p>
                                            )}
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

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                                <h3 className="text-[13px] font-bold text-[#1B3A6B]">Required Documents</h3>
                                <span className="text-[10px] font-semibold text-slate-400">
                                    {details.documents.filter(d => d.verification_status === 'verified').length}/{details.documents.length} Verified
                                </span>
                            </div>
                            <div className="p-4 space-y-2 flex-1 min-h-0 overflow-y-auto sidebar-scroll">
                                {details.documents.length === 0 ? (
                                    <div className="p-10 text-center text-slate-300 text-xs font-semibold">
                                        No required documents configured for this vacancy, and the applicant hasn't uploaded anything yet.
                                    </div>
                                ) : (
                                    details.documents.map(doc => {
                                        const hasFile = !!doc.file_path;
                                        const isVerified = hasFile && doc.verification_status === 'verified';
                                        const isNeedsRevision = hasFile && doc.verification_status === 'needs_revision';
                                        const isPending = hasFile && !isVerified && !isNeedsRevision;
                                        const fileUrl = hasFile ? `${SERVER_BASE}${doc.file_path}` : null;

                                        const rowBg = isVerified
                                            ? 'bg-emerald-50/60 border-emerald-100'
                                            : isNeedsRevision
                                            ? 'bg-amber-50/60 border-amber-200'
                                            : isPending
                                            ? 'bg-blue-50/60 border-blue-100'
                                            : 'bg-white border-slate-100';

                                        return (
                                            <div key={doc.required_doc_id ?? `uploaded-${doc.id}`} className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border ${rowBg}`}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {isVerified ? (
                                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                    ) : isNeedsRevision ? (
                                                        <FileWarning size={18} className="text-amber-500 shrink-0" />
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
                                                            <>
                                                                <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[260px]">
                                                                    {doc.file_name}
                                                                    <span className={`ml-2 ${isVerified ? 'text-emerald-600' : isNeedsRevision ? 'text-amber-600' : 'text-amber-600'}`}>
                                                                        {isVerified ? 'verified' : isNeedsRevision ? 'revision requested' : 'uploaded · pending review'}
                                                                    </span>
                                                                </p>
                                                                {isNeedsRevision && doc.revision_note && (
                                                                    <p className="text-[10px] font-semibold text-amber-700 mt-0.5 leading-tight max-w-[320px] line-clamp-2">
                                                                        Revision reason: {doc.revision_note}
                                                                    </p>
                                                                )}
                                                            </>
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
                                                                onClick={() => handleVerifyDoc(doc.id, null)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-[9px] font-bold text-white transition-all"
                                                            >
                                                                <CheckCircle2 size={12} /> Verify
                                                            </button>
                                                        )}
                                                        {!isNeedsRevision && (
                                                            <button
                                                                onClick={() => setRevisionDocTarget(doc)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-600 hover:bg-amber-50 rounded-lg text-[9px] font-bold transition-all"
                                                            >
                                                                <FileWarning size={12} /> Revise
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

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-10">
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
                                    {evaluatedCount} of {queueData.queue.length} evaluated in this stage
                                </p>
                            </div>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => setShowDisqualifyModal(true)}
                                    disabled={decisionLoading}
                                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 transition-all rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <XCircle size={13} /> Revise Documents
                                </button>
                                <div className="relative group">
                                    <button
                                        onClick={() => handleDecision('qualified')}
                                        disabled={decisionLoading || !canQualify}
                                        className={`px-4 py-2 transition-all rounded-lg text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-50 ${
                                            canQualify
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {decisionLoading ? <Loader2 className="animate-spin" size={13} /> : <CheckCircle2 size={13} />}
                                        Mark as Qualified
                                    </button>
                                    {!canQualify && (
                                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                                            <div className="bg-slate-800 text-white text-[10px] font-semibold px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Info size={11} /> Cannot mark as qualified:
                                                </div>
                                                {missingReasons.map((r, i) => (
                                                    <div key={i} className="text-slate-300 ml-4">· {r}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Note: "Finalize & Advance" was removed in the initial evaluation cleanup.
                                    The vacancy stage progression happens via the dashboard's auto-pipeline or
                                    the per-applicant "Mark as Qualified/Disqualified" actions.
                                    The Congratulatory Advice send action (Stage 8) independently controls
                                    the applicant-facing Advice & Next Steps visibility. */}
                                {/* Note: "Generate Annex E Letter" button removed from this page.
                                    The standalone Annex E page at /rsp/congratulatory-advice provides
                                    full preview, download, print, and send functionality. */}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-white rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
                        <p className="text-slate-400 font-semibold text-sm italic">Select an applicant from the queue to start screening</p>
                    </div>
                )}
            </div>

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

            <DisqualificationModal
                isOpen={showDisqualifyModal}
                applicantName={selectedApplicant?.full_name || ''}
                applicantCode={selectedApplicant?.applicant_code || ''}
                unmetCriteria={(details?.criteria || [])
                    .filter(c => c.is_required && c.passed !== 1)
                    .map(c => c.criterion_label)}
                unverifiedDocs={(details?.documents || [])
                    .filter(d => d.is_mandatory && d.file_path && !d.is_verified)
                    .map(d => d.document_type)}
                onConfirm={(remarks) => handleDecision('disqualified', remarks)}
                onCancel={() => setShowDisqualifyModal(false)}
                loading={decisionLoading}
            />
            <DisqualificationModal
                isOpen={showDisqualifyReadOnly}
                applicantName={selectedApplicant?.full_name || ''}
                applicantCode={selectedApplicant?.applicant_code || ''}
                mode="read-only"
                disqualificationReason={details?.application?.initial_evaluation_remarks || ''}
                disqualifiedByName={details?.application?.disqualified_by_name || ''}
                disqualifiedAt={details?.application?.disqualification_recorded_at || ''}
                onCancel={() => setShowDisqualifyReadOnly(false)}
            />

            <RequestRevisionModal
                isOpen={!!revisionDocTarget}
                documentName={revisionDocTarget?.document_type || ''}
                fileName={revisionDocTarget?.file_name || ''}
                onConfirm={(reason) => handleRequestRevision(revisionDocTarget?.id, reason)}
                onCancel={() => setRevisionDocTarget(null)}
                loading={docActionLoading}
            />

        </div>
    );
};

export default RSPInitialEvaluation;
