import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, FileText, CheckCircle2, Upload, AlertCircle,
    Loader2, Clock, ChevronDown, Users
} from 'lucide-react';
import CompletenessRing from './CompletenessRing';

const API = 'http://localhost:5000';
const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

// ── Toast ─────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
    if (!toast) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-3
                ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
        >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.msg}
        </motion.div>
    );
};

const RSPAppointmentProcessing = () => {
    // Vacancy + Appointee selection
    const [vacancies,    setVacancies]    = useState([]);
    const [vacancyId,    setVacancyId]    = useState(null);
    const [appointees,   setAppointees]   = useState([]);
    const [selectedApp,  setSelectedApp]  = useState(null);

    // Doc data
    const [docData,      setDocData]      = useState(null);

    // UI state
    const [loading,      setLoading]      = useState(false);
    const [issuing,      setIssuing]      = useState(false);
    const [uploadingId,  setUploadingId]  = useState(null); // which doc is uploading
    const [toast,        setToast]        = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Load vacancies
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`${API}/api/rsp/vacancies`, { headers: authHeader() });
                const list = await res.json();
                const active = Array.isArray(list) ? list : [];
                setVacancies(active);
                if (active.length > 0) setVacancyId(active[0].id);
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    // 2. Load appointees when vacancy changes
    useEffect(() => {
        if (!vacancyId) return;
        setAppointees([]);
        setSelectedApp(null);
        setDocData(null);
        const load = async () => {
            try {
                const res = await fetch(
                    `${API}/api/rsp/appointment/processing?vacancy_id=${vacancyId}`,
                    { headers: authHeader() }
                );
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setAppointees(list);
                if (list.length > 0) setSelectedApp(list[0]);
            } catch (e) { console.error(e); }
        };
        load();
    }, [vacancyId]);

    // 3. Load docs when selected appointee changes
    const fetchDocs = async (id) => {
        try {
            const res = await fetch(
                `${API}/api/rsp/appointment/documents/${id}`,
                { headers: authHeader() }
            );
            const data = await res.json();
            setDocData(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (selectedApp) fetchDocs(selectedApp.id);
    }, [selectedApp]);

    // Verify a document
    const handleVerify = async (docId) => {
        try {
            const res = await fetch(
                `${API}/api/rsp/appointment/documents/${docId}/verify`,
                { method: 'PATCH', headers: authHeader() }
            );
            if (res.ok) {
                showToast('success', 'Document verified.');
                fetchDocs(selectedApp.id);
            } else {
                const d = await res.json();
                showToast('error', d.message);
            }
        } catch (e) { showToast('error', 'Network error.'); }
    };

    // Upload a document
    const handleUpload = async (docId, file) => {
        if (!file) return;
        setUploadingId(docId);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(
                `${API}/api/rsp/appointment/documents/${docId}/upload`,
                { method: 'POST', headers: authHeader(), body: formData }
            );
            const data = await res.json();
            if (res.ok) {
                showToast('success', 'File uploaded successfully.');
                fetchDocs(selectedApp.id);
            } else {
                showToast('error', data.message);
            }
        } catch (e) {
            showToast('error', 'Upload failed.');
        } finally {
            setUploadingId(null);
        }
    };

    // Issue appointment
    const handleIssue = async () => {
        setIssuing(true);
        try {
            const res = await fetch(`${API}/api/rsp/appointment/issue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({
                    applicant_id: selectedApp.id,
                    vacancy_id:   vacancyId,
                    full_name:    selectedApp.full_name
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast('success', data.message);
                // Reload appointees to reflect new status
                const res2 = await fetch(
                    `${API}/api/rsp/appointment/processing?vacancy_id=${vacancyId}`,
                    { headers: authHeader() }
                );
                const list = await res2.json();
                setAppointees(Array.isArray(list) ? list : []);
                const updated = list.find(a => a.id === selectedApp.id);
                if (updated) setSelectedApp(updated);
            } else {
                showToast('error', data.message);
            }
        } catch (e) {
            showToast('error', 'Network error issuing appointment.');
        } finally {
            setIssuing(false);
        }
    };

    const allVerified = docData
        ? docData.stats.total > 0 && docData.stats.verified === docData.stats.total
        : false;

    // ── Empty states ──────────────────────────────────────────────
    const noAppointees = vacancyId && appointees.length === 0 && !loading;

    return (
        <div className="space-y-6 select-none pb-24">
            <AnimatePresence><Toast toast={toast} /></AnimatePresence>

            {/* ── SELECTOR BAR ──────────────────────────────────── */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-wrap gap-6 items-end">
                {/* Vacancy */}
                <div className="flex flex-col gap-1 min-w-[280px]">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vacancy</label>
                    <div className="relative">
                        <select
                            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1B3A6B] outline-none focus:ring-2 focus:ring-[#1B3A6B] pr-10"
                            value={vacancyId || ''}
                            onChange={e => setVacancyId(Number(e.target.value))}
                        >
                            {vacancies.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.ref_no} — {v.position_title}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Appointee tabs */}
                {appointees.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointee</label>
                        <div className="flex gap-2 flex-wrap">
                            {appointees.map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => setSelectedApp(a)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all
                                        ${selectedApp?.id === a.id
                                            ? 'bg-[#1B3A6B] text-white shadow-md'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {a.full_name}
                                    {a.status === 'appointed' && (
                                        <span className="ml-2 text-emerald-400">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── NO APPOINTEES ─────────────────────────────────── */}
            {noAppointees && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center shadow-sm">
                    <Users size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-[#1B3A6B] uppercase italic mb-2">No Selected Applicants</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        No applicants have been marked as "selected" for this vacancy yet.
                        Complete the Congratulatory Advice stage first.
                    </p>
                </div>
            )}

            {/* ── MAIN LAYOUT ───────────────────────────────────── */}
            {selectedApp && docData && (
                <div className="flex flex-col xl:flex-row gap-8">

                    {/* LEFT PANEL */}
                    <div className="w-full xl:w-[380px] space-y-6 shrink-0">

                        {/* Appointee Info */}
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                                    {selectedApp.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-[#1B3A6B] uppercase text-sm">{selectedApp.full_name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                        {selectedApp.applicant_code} · Rank #{selectedApp.rank_val}
                                    </p>
                                    {selectedApp.status === 'appointed' && (
                                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                                            <CheckCircle2 size={10} /> Appointed
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3 text-[11px] font-bold border-t pt-6">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 uppercase">Position</span>
                                    <span className="text-[#1B3A6B]">{selectedApp.position_title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 uppercase">Salary Grade</span>
                                    <span className="text-[#1B3A6B]">SG-{selectedApp.salary_grade}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 uppercase">Report Date</span>
                                    <span className="text-[#D6402F] font-black">
                                        {selectedApp.report_date
                                            ? new Date(selectedApp.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Document Completeness Ring */}
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 text-center">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Document Completeness</h4>
                            <CompletenessRing verified={docData.stats.verified} total={docData.stats.total} />
                            <div className="grid grid-cols-3 gap-2 mt-8">
                                <div>
                                    <p className="text-emerald-500 font-black text-lg">{docData.stats.verified}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Verified</p>
                                </div>
                                <div>
                                    <p className="text-blue-500 font-black text-lg">{docData.stats.uploaded}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Uploaded</p>
                                </div>
                                <div>
                                    <p className="text-red-500 font-black text-lg">{docData.stats.pending}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Pending</p>
                                </div>
                            </div>

                            {!allVerified && docData.stats.total > 0 && (
                                <div className="mt-6 bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3 text-left">
                                    <AlertCircle className="text-amber-500 shrink-0" size={18} />
                                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                                        {docData.stats.pending + docData.stats.uploaded} documents still pending. Cannot issue appointment.
                                    </p>
                                </div>
                            )}

                            {allVerified && (
                                <div className="mt-6 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                    <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase">All documents verified. Ready to issue.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: CHECKLIST */}
                    <div className="flex-1 min-w-0 space-y-6">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xl font-black text-[#1B3A6B] uppercase tracking-tight italic">
                                    Document Submission Checklist
                                </h3>
                                <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px]">
                                    <Clock size={14} />
                                    Deadline: 3–5 Working Days from Advice
                                </div>
                            </div>

                            <div className="p-8 space-y-3">
                                {docData.documents.map(doc => {
                                    const isVerified = doc.verification_status === 'verified';
                                    const isPending  = doc.verification_status === 'uploaded_pending_review';
                                    const isUploading = uploadingId === doc.id;

                                    return (
                                        <div
                                            key={doc.id}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all
                                                ${isVerified ? 'bg-emerald-50 border-emerald-100'
                                                : isPending  ? 'bg-blue-50 border-blue-100'
                                                : 'bg-white border-slate-100'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg shrink-0
                                                    ${isVerified ? 'bg-emerald-500 text-white'
                                                    : isPending  ? 'bg-blue-500 text-white'
                                                    : 'bg-slate-100 text-slate-300'}`}>
                                                    {isVerified ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-black uppercase
                                                        ${isVerified ? 'text-emerald-700'
                                                        : isPending  ? 'text-blue-700'
                                                        : 'text-slate-400'}`}>
                                                        {doc.document_type}
                                                    </p>
                                                    {doc.file_name && (
                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate max-w-xs">
                                                            {doc.file_name}
                                                        </p>
                                                    )}
                                                    {isPending && (
                                                        <p className="text-[9px] font-bold text-blue-500 mt-0.5 uppercase">Uploaded · Awaiting Review</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 shrink-0">
                                                {/* Verify button — only if not yet verified */}
                                                {!isVerified && (
                                                    <button
                                                        onClick={() => handleVerify(doc.id)}
                                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm"
                                                    >
                                                        Verify
                                                    </button>
                                                )}

                                                {/* Upload button */}
                                                <label className="cursor-pointer p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#1B3A6B] hover:border-[#1B3A6B] shadow-sm transition-all flex items-center justify-center">
                                                    {isUploading
                                                        ? <Loader2 size={14} className="animate-spin" />
                                                        : <Upload size={14} />}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={e => handleUpload(doc.id, e.target.files[0])}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ISSUE APPOINTMENT BUTTON */}
                        <div className="sticky bottom-6">
                            <AnimatePresence>
                                {toast?.type === 'error' && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                        className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl mb-4 flex items-center gap-3"
                                    >
                                        <AlertCircle size={20} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">{toast.msg}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handleIssue}
                                disabled={!allVerified || issuing || selectedApp?.status === 'appointed'}
                                className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all
                                    ${selectedApp?.status === 'appointed'
                                        ? 'bg-emerald-500 text-white cursor-default'
                                        : allVerified
                                            ? 'bg-[#1B3A6B] text-white hover:bg-[#162E55]'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                {issuing
                                    ? <Loader2 className="animate-spin" size={18} />
                                    : selectedApp?.status === 'appointed'
                                        ? <><CheckCircle2 size={18} /> Appointment Issued</>
                                        : <><Award size={18} /> Issue Appointment</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RSPAppointmentProcessing;
