import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { Check, Clock, Bell, Trophy, ChevronRight, XCircle, AlertTriangle, Send, FileText, Upload, Loader2 } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../utils/api';
import StatusBadge from '../../components/shared/StatusBadge';

// 11-Stage RSP Process labels, matching the PRIME-HRM workflow used elsewhere in the system
const STAGE_LABELS = [
    { stage: 1,  title: 'Publication and Posting',           desc: 'Vacancy published with application guidelines' },
    { stage: 2,  title: 'Submission of Requirements',         desc: 'Submit mandatory documents via digital folder' },
    { stage: 3,  title: 'Initial Evaluation',                 desc: 'HR screens vs. minimum qualification standards' },
    { stage: 4,  title: 'Validation of Performance',          desc: 'HRMPSB validates eligibility and appointed staff' },
    { stage: 5,  title: 'Posting of Qualified / Disqualified', desc: 'Results posted on website, Facebook, bulletin board' },
    { stage: 6,  title: 'Comparative Assessment',              desc: 'Demo teaching, BEI, and document evaluation' },
    { stage: 7,  title: 'Posting of CA Results',               desc: 'Comparative assessment results posted publicly' },
    { stage: 8,  title: 'HRMPSB Deliberation',                 desc: 'Shortlist and background check deliberated' },
    { stage: 9,  title: 'Selection and Congratulatory Advice', desc: 'Appointing authority selects and notifies appointee' },
    { stage: 10, title: 'Document Submission',                 desc: 'Submit pertinent documents for appointment processing' },
    { stage: 11, title: 'Issuance of Appointment',              desc: 'Appointment paper issued and posted' },
];

const ApplicationStatus = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applicationId, setApplicationId] = useState(null);
    const [withdrawing, setWithdrawing] = useState(false);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
    const [appealReason, setAppealReason] = useState('');
    const [submittingAppeal, setSubmittingAppeal] = useState(false);
    const [appealSubmitted, setAppealSubmitted] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);
    const [reuploadingType, setReuploadingType] = useState(null);
    const reuploadRef = React.useRef(null);

    const token = () => localStorage.getItem('token');

    const fetchStatus = React.useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const t = localStorage.getItem('token');

            // Resolve the applicant's latest non-draft application ID first
            const latestRes = await fetch(`${API_BASE}/api/applications/my-latest`, {
                headers: { 'Authorization': `Bearer ${t}` }
            });
            if (!latestRes.ok) { setLoading(false); return; }
            const latest = await latestRes.json();
            setApplicationId(latest.applicationId);

            const res = await fetch(`${API_BASE}/api/applications/${latest.applicationId}/status`, {
                headers: { 'Authorization': `Bearer ${t}` }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Failed to load application status:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (!applicationId) return;
        const socket = io(SERVER_BASE);
        socket.emit('join-application-room', `application-${applicationId}`);

        const silentRefresh = () => fetchStatus(true);

        socket.on('application:stage-update', silentRefresh);
        socket.on('application:notification', silentRefresh);
        socket.on('application:score-update', silentRefresh);
        socket.on('application:document-update', silentRefresh);

        return () => socket.disconnect();
    }, [applicationId, fetchStatus]);

    const handleWithdraw = async () => {
        setWithdrawing(true);
        try {
            const res = await fetch(`${API_BASE}/api/applications/${applicationId}/withdraw`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token()}` },
            });
            const json = await res.json();
            if (res.ok) {
                setActionMessage({ type: 'success', text: 'Application withdrawn.' });
                setShowWithdrawConfirm(false);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setActionMessage({ type: 'error', text: json.message });
            }
        } catch {
            setActionMessage({ type: 'error', text: 'Server error.' });
        } finally {
            setWithdrawing(false);
        }
    };

    const handleSubmitAppeal = async () => {
        if (!appealReason.trim()) return;
        setSubmittingAppeal(true);
        try {
            const res = await fetch(`${API_BASE}/api/applications/${applicationId}/appeal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
                body: JSON.stringify({ reason: appealReason }),
            });
            const json = await res.json();
            if (res.ok) {
                setAppealSubmitted(true);
                setActionMessage({ type: 'success', text: json.message });
            } else {
                setActionMessage({ type: 'error', text: json.message });
            }
        } catch {
            setActionMessage({ type: 'error', text: 'Server error.' });
        } finally {
            setSubmittingAppeal(false);
        }
    };

    const triggerReupload = (docType) => {
        setReuploadingType(docType);
        reuploadRef.current.click();
    };

    const handleReuploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file || !reuploadingType) return;

        const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExt.includes(ext)) {
            setActionMessage({ type: 'error', text: 'Only PDF, JPG, or PNG files are allowed.' });
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', reuploadingType);

        try {
            const res = await fetch(`${API_BASE}/api/applications/${applicationId}/documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token()}` },
                body: formData
            });
            const json = await res.json();
            if (res.ok) {
                setActionMessage({ type: 'success', text: 'Document re-uploaded successfully. It will be reviewed by HR.' });
                // Refresh data to show updated status
                fetchStatus(true);
            } else {
                setActionMessage({ type: 'error', text: json.message || 'Upload failed' });
            }
        } catch {
            setActionMessage({ type: 'error', text: 'Server error during upload.' });
        } finally {
            setReuploadingType(null);
            e.target.value = '';
        }
    };

    if (loading) {
        return <div className="min-h-screen flex justify-center pt-32"><div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin"/></div>;
    }

    if (!data || !data.application) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <p className="text-slate-400 font-black uppercase tracking-widest">No active application found.</p>
                <p className="text-slate-300 text-sm mt-2">Apply to a posted vacancy to see your status here.</p>
            </div>
        );
    }

    const { application, stageHistory, notifications, score } = data;
    const currentStage = application.current_stage || 1;
    const isDisqualified = application.status === 'disqualified';
    const disqualifiedAtStage = isDisqualified ? currentStage : null;

    const getStageStatus = (stageNum) => {
        if (isDisqualified && stageNum === disqualifiedAtStage) return 'disqualified';
        const found = stageHistory?.find(s => s.stage_number === stageNum);
        if (found?.status === 'completed') return 'completed';
        if (!isDisqualified && stageNum === currentStage) return 'active';
        if (stageNum < currentStage) return 'completed';
        return 'upcoming';
    };

    const getStageDate = (stageNum) => {
        const found = stageHistory?.find(s => s.stage_number === stageNum);
        return found?.completed_at
            ? new Date(found.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : null;
    };

    const completedCount = STAGE_LABELS.filter(s => getStageStatus(s.stage) === 'completed').length;

    return (
        <div className="min-h-screen bg-[#F1F3F6] pb-16">
            <input ref={reuploadRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleReuploadFile} />
            {/* HEADER BANNER */}
            <div className="bg-[#1B3A6B] text-white">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">
                        My RSP Application Status
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                        <div>
                            <p className="text-[9px] font-bold text-blue-300 uppercase">Reference</p>
                            <p className="font-black">{application.ref_no || application.vacancy_ref}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-blue-300 uppercase">Position</p>
                            <p className="font-black">{application.position_title}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-blue-300 uppercase">Current Stage</p>
                            <p className="font-black">Stage {currentStage} of 11</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-blue-300 uppercase">Overall Status</p>
                            <StatusBadge status={application.status} dark />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: TIMELINE */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-[#1B3A6B] uppercase">11-Stage RSP Process</h3>
                        <span className="text-[10px] font-bold text-emerald-600">{completedCount} completed</span>
                    </div>

                    <div className="space-y-1">
                        {STAGE_LABELS.map((s, i) => {
                            const status = getStageStatus(s.stage);
                            const isLast = i === STAGE_LABELS.length - 1;
                            const dateStr = getStageDate(s.stage);

                            return (
                                <div key={s.stage} className="flex gap-4">
                                    {/* Indicator column */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 shrink-0
                                            ${status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : status === 'disqualified' ? 'bg-red-500 border-red-500 text-white'
                                            : status === 'active' ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white'
                                            : 'bg-white border-slate-200 text-slate-300'}`}>
                                            {status === 'completed' ? <Check size={14} strokeWidth={3} />
                                            : status === 'disqualified' ? <XCircle size={14} strokeWidth={3} />
                                            : s.stage}
                                        </div>
                                        {!isLast && (
                                            <div className={`w-0.5 flex-1 my-1 ${
                                                status === 'completed' ? 'bg-emerald-300'
                                                : status === 'disqualified' ? 'bg-red-200'
                                                : 'bg-slate-100'
                                            }`} style={{ minHeight: '28px' }} />
                                        )}
                                    </div>

                                    {/* Content column */}
                                    <div className={`flex-1 pb-5 ${
                                        status === 'active' ? 'bg-blue-50/50 -mx-3 px-3 rounded-xl border border-blue-100'
                                        : status === 'disqualified' ? 'bg-red-50/50 -mx-3 px-3 rounded-xl border border-red-100'
                                        : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`text-xs font-black uppercase ${
                                                    status === 'upcoming' ? 'text-slate-300'
                                                    : status === 'disqualified' ? 'text-red-600'
                                                    : 'text-[#1B3A6B]'
                                                }`}>
                                                    Stage {s.stage}: {s.title}
                                                </p>
                                                <p className={`text-[11px] mt-0.5 ${
                                                    status === 'upcoming' ? 'text-slate-300'
                                                    : status === 'disqualified' ? 'text-red-400 font-medium'
                                                    : 'text-slate-400 font-medium'
                                                }`}>
                                                    {s.desc}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-bold whitespace-nowrap ml-4 ${
                                                status === 'completed' ? 'text-emerald-600'
                                                : status === 'disqualified' ? 'text-red-500'
                                                : status === 'active' ? 'text-[#1B3A6B]'
                                                : 'text-slate-300'
                                            }`}>
                                                {status === 'completed' && dateStr}
                                                {status === 'disqualified' && 'Stopped Here'}
                                                {status === 'active' && 'In Progress'}
                                                {status === 'upcoming' && 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: SIDEBAR */}
                <div className="space-y-6">
                    {/* DISQUALIFICATION REASON BANNER */}
                    {isDisqualified && application.initial_evaluation_remarks && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle size={16} className="text-red-500" />
                                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">
                                    Disqualified at Stage {disqualifiedAtStage}
                                </p>
                            </div>
                            <p className="text-xs font-bold text-red-800 leading-relaxed mb-1">
                                Your application did not meet the minimum qualification standards.
                            </p>
                            <div className="bg-white/60 rounded-xl px-3 py-2 mt-2 border border-red-100">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Reason</p>
                                <p className="text-[11px] font-semibold text-red-700 leading-relaxed">
                                    {application.initial_evaluation_remarks}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STAGE 9 BANNER — only shows when relevant */}
                    {currentStage === 9 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">
                                Stage 9 In Progress
                            </p>
                            <p className="text-xs font-bold text-amber-800 leading-relaxed mb-3">
                                Selection and Congratulatory Advice. The appointing authority is reviewing the shortlist before the congratulatory advice within 1–2 working days.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600">
                                <Clock size={12} /> Estimated: 1–2 WD
                            </div>
                        </div>
                    )}

                    {/* ASSESSMENT RESULT */}
                    {score && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">My Assessment Result</p>
                            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trophy size={32} />
                            </div>
                            <p className="text-3xl font-black text-[#1B3A6B]">
                                {parseFloat(score.total_score).toFixed(2)}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mb-1">out of 100.00</p>
                            <p className="text-xs font-black text-[#D6402F] uppercase mb-4">
                                Rank #{score.rank_position} of {score.rank_total} Qualified
                            </p>

                            <div className="border-t border-slate-100 pt-4 space-y-2 text-left">
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">Classroom Observable (60%)</span>
                                    <span className="font-black text-[#1B3A6B]">
                                        {parseFloat(score.classroom_score || 0).toFixed(2)} / {score.classroom_max}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">Non-Classroom (20%)</span>
                                    <span className="font-black text-[#1B3A6B]">
                                        {parseFloat(score.nonclassroom_score || 0).toFixed(2)} / {score.nonclassroom_max}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">Document Evaluation (20%)</span>
                                    <span className="font-black text-[#1B3A6B]">
                                        {parseFloat(score.document_score || 0).toFixed(2)} / {score.document_max}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Bell size={14} /> Latest Notifications
                        </p>
                        <div className="space-y-3">
                            {notifications?.length > 0 ? notifications.slice(0, 4).map(n => (
                                <div key={n.id} className="flex gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1B3A6B] mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-600 leading-tight">{n.message}</p>
                                        <p className="text-[9px] font-bold text-slate-300 mt-0.5">
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-[11px] text-slate-300 font-bold">No notifications yet.</p>
                            )}
                        </div>
                    </div>

                    {/* DOCUMENT STATUS — shows needs_revision docs with re-upload */}
                    {data.documents && data.documents.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText size={14} /> Document Status
                            </p>
                            <div className="space-y-2.5">
                                {data.documents.map(doc => {
                                    const isVerified = doc.verification_status === 'verified';
                                    const isNeedsRevision = doc.verification_status === 'needs_revision';
                                    return (
                                        <div key={doc.id} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border ${
                                            isVerified ? 'bg-emerald-50/60 border-emerald-100'
                                            : isNeedsRevision ? 'bg-amber-50/60 border-amber-200'
                                            : 'bg-slate-50 border-slate-100'
                                        }`}>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-[#1B3A6B] leading-tight truncate">{doc.document_type}</p>
                                                {isNeedsRevision && doc.revision_note && (
                                                    <p className="text-[10px] font-semibold text-amber-700 mt-0.5 leading-tight line-clamp-2">
                                                        {doc.revision_note}
                                                    </p>
                                                )}
                                                {isVerified && (
                                                    <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">Verified</p>
                                                )}
                                            </div>
                                            {isNeedsRevision && (
                                                <button
                                                    onClick={() => triggerReupload(doc.document_type)}
                                                    disabled={reuploadingType === doc.document_type}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-bold transition-all shrink-0 disabled:opacity-50"
                                                >
                                                    {reuploadingType === doc.document_type ? (
                                                        <Loader2 size={11} className="animate-spin" />
                                                    ) : (
                                                        <Upload size={11} />
                                                    )}
                                                    Re-upload
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CONGRATULATORY ADVICE CTA — only shows once status reaches that point */}
                    {['selected', 'appointed'].includes(application.status) && (
                        <button
                            onClick={() => navigate('/jobs/advice')}
                            className="w-full bg-[#D6402F] hover:bg-[#b53526] text-white p-4 rounded-2xl shadow-lg flex items-center justify-between transition-all"
                        >
                            <div className="text-left">
                                <p className="text-[10px] font-bold opacity-90">Stage 9 Update</p>
                                <p className="text-xs font-black uppercase">View Congratulatory Advice</p>
                            </div>
                            <ChevronRight size={18} />
                        </button>
                    )}

                    {/* ACTION MESSAGE */}
                    {actionMessage && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${
                            actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {actionMessage.type === 'success' ? <Check size={14} /> : <XCircle size={14} />}
                            {actionMessage.text}
                        </div>
                    )}

                    {/* WITHDRAW BUTTON — only for withdrawable statuses */}
                    {['draft', 'submitted', 'for_evaluation'].includes(application.status) && !showWithdrawConfirm && (
                        <button
                            onClick={() => setShowWithdrawConfirm(true)}
                            className="w-full bg-white border-2 border-red-200 hover:border-red-400 text-red-600 p-4 rounded-2xl flex items-center justify-between transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <XCircle size={18} />
                                <div className="text-left">
                                    <p className="text-[10px] font-bold opacity-70">Cancel Application</p>
                                    <p className="text-xs font-black uppercase">Withdraw</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}

                    {/* WITHDRAW CONFIRMATION */}
                    <AnimatePresence>
                    {showWithdrawConfirm && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-50 border border-red-200 rounded-2xl p-5"
                        >
                            <p className="text-xs font-black text-red-700 mb-2">Are you sure?</p>
                            <p className="text-[11px] font-bold text-red-600 mb-4">This action cannot be undone. Your application will be permanently withdrawn.</p>
                            <div className="flex gap-2">
                                <button onClick={handleWithdraw} disabled={withdrawing} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-50">
                                    {withdrawing ? 'Withdrawing...' : 'Yes, Withdraw'}
                                </button>
                                <button onClick={() => setShowWithdrawConfirm(false)} className="text-red-500 hover:text-red-700 px-4 py-2 text-xs font-bold">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    {/* APPEAL FORM — only for disqualified applicants */}
                    {application.status === 'disqualified' && !appealSubmitted && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle size={16} className="text-amber-600" />
                                <p className="text-xs font-black text-amber-700 uppercase">File an Appeal</p>
                            </div>
                            <p className="text-[11px] font-bold text-amber-600 mb-3">If you believe there has been an error, you may submit an appeal for review.</p>
                            <textarea
                                value={appealReason}
                                onChange={(e) => setAppealReason(e.target.value)}
                                placeholder="Explain why you are appealing..."
                                className="w-full px-4 py-3 rounded-xl border border-amber-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 mb-3"
                                rows={3}
                            />
                            <button onClick={handleSubmitAppeal} disabled={submittingAppeal || !appealReason.trim()} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl text-xs font-black transition-all disabled:opacity-50">
                                <Send size={14} />
                                {submittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                            </button>
                        </div>
                    )}

                    {appealSubmitted && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                            <Check size={24} className="mx-auto text-emerald-500 mb-2" />
                            <p className="text-xs font-black text-emerald-700">Appeal Submitted</p>
                            <p className="text-[11px] font-bold text-emerald-600 mt-1">An administrator will review your case.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicationStatus;