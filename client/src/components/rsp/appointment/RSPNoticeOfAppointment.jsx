import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, Download, Globe, Share2, ClipboardList,
    CheckCircle2, Shield, Loader2, AlertCircle,
    Printer, ChevronDown, Users
} from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const authHeader = () => ({ 'Authorization': `Bearer ${token()}` });

const LEGAL_BASIS = "This appointment is made pursuant to Section 9, Article B of the Civil Service Rules on Personnel Actions, and in accordance with DepEd Order No. 007, s. 2015 and relevant PRIME-HRM guidelines.";

const CHANNELS = [
    { id: 'division_website', label: 'Division Website', icon: Globe },
    { id: 'facebook',         label: 'Facebook Page',   icon: Share2 },
    { id: 'bulletin_board',   label: 'Bulletin Board',  icon: ClipboardList },
];

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

// ── Main Component ────────────────────────────────────────────────
const RSPNoticeOfAppointment = () => {
    const letterRef = useRef(null);

    // Vacancy + Appointee selection
    const [vacancies,      setVacancies]      = useState([]);
    const [vacancyId,      setVacancyId]      = useState(null);
    const [appointees,     setAppointees]     = useState([]);
    const [applicantId,    setApplicantId]    = useState(null);

    // Notice data
    const [data,           setData]           = useState(null);
    const [loading,        setLoading]        = useState(false);
    const [selectedChannels, setSelectedChannels] = useState([]);

    // UI state
    const [posting,        setPosting]        = useState(false);
    const [downloading,    setDownloading]    = useState(false);
    const [toast,          setToast]          = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Load active vacancies on mount
    useEffect(() => {
        const fetchVacancies = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/rsp/vacancies`, { headers: authHeader() });
                const list = await res.json();
                const active = Array.isArray(list) ? list.filter(v => v.status === 'active' || v.computed_status === 'active') : [];
                setVacancies(active);
                if (active.length > 0) setVacancyId(active[0].id);
            } catch (e) { console.error(e); }
        };
        fetchVacancies();
    }, []);

    // 2. Load appointees when vacancy changes
    useEffect(() => {
        if (!vacancyId) return;
        setAppointees([]);
        setApplicantId(null);
        setData(null);
        const fetchAppointees = async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/api/rsp/notice-of-appointment/vacancy/${vacancyId}`,
                    { headers: authHeader() }
                );
                const list = await res.json();
                if (Array.isArray(list) && list.length > 0) {
                    setAppointees(list);
                    setApplicantId(list[0].id);
                }
            } catch (e) { console.error(e); }
        };
        fetchAppointees();
    }, [vacancyId]);

    // 3. Load notice data when applicant changes
    useEffect(() => {
        if (!applicantId) return;
        setLoading(true);
        setData(null);
        setSelectedChannels([]);
        const fetchNotice = async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/api/rsp/notice-of-appointment/${applicantId}`,
                    { headers: authHeader() }
                );
                const json = await res.json();
                if (res.ok) setData(json);
                else showToast('error', json.message || 'Failed to load notice.');
            } catch (e) {
                showToast('error', 'Network error loading notice.');
            } finally {
                setLoading(false);
            }
        };
        fetchNotice();
    }, [applicantId]);

    // Handlers
    const handlePost = async () => {
        if (!data?.notice?.appointment_id || selectedChannels.length === 0) return;
        setPosting(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/rsp/notice-of-appointment/${data.notice.appointment_id}/post`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({ channels: selectedChannels })
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);
            showToast('success', json.message);
            // Refresh
            const res2 = await fetch(`${API_BASE}/api/rsp/notice-of-appointment/${applicantId}`, { headers: authHeader() });
            setData(await res2.json());
            setSelectedChannels([]);
        } catch (e) {
            showToast('error', e.message);
        } finally {
            setPosting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!applicantId) return;
        setDownloading(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/rsp/notice-of-appointment/${applicantId}/pdf`,
                { headers: authHeader() }
            );
            if (!res.ok) throw new Error('PDF generation failed.');
            const blob = await res.blob();
            const url  = window.URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `Notice_of_Appointment_${data?.notice?.fullName?.replace(/\s+/g, '_') || applicantId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            showToast('error', e.message);
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => {
        const content = letterRef.current;
        if (!content) return;
        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`
            <html><head><title>Notice of Appointment</title>
            <style>
              body { font-family: Georgia, serif; font-size: 12pt; margin: 72px; color: #1a1a1a; }
              h1 { text-align: center; font-size: 16pt; text-decoration: underline; }
              table { width: 100%; border-collapse: collapse; margin: 24px 0; }
              td { padding: 6px 0; vertical-align: top; }
              td:first-child { font-weight: bold; width: 200px; color: #555; font-size: 10pt; text-transform: uppercase; letter-spacing: 1px; }
              .header { text-align: center; border-bottom: 2px solid #1B3A6B; padding-bottom: 12px; margin-bottom: 24px; }
              .legal { font-style: italic; background: #f8f8f8; padding: 16px; border-radius: 4px; font-size: 10pt; }
              .sig-row { display: flex; justify-content: space-between; margin-top: 72px; }
              .sig { width: 240px; text-align: center; }
              .sig-line { border-top: 1px solid #333; padding-top: 6px; font-weight: bold; font-size: 11pt; }
            </style></head>
            <body>${content.innerHTML}</body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
    };

    // ── No vacancies ─────────────────────────────────────────────
    if (vacancies.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-10">
                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 max-w-lg">
                    <Users size={48} className="text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic mb-2">No Active Vacancies</h2>
                    <p className="text-slate-500 text-sm">No active vacancies found. Post a vacancy first.</p>
                </div>
            </div>
        );
    }

    // ── No appointees for selected vacancy ───────────────────────
    const noAppointees = !loading && vacancyId && appointees.length === 0;

    return (
        <div className="space-y-6 select-none pb-20">
            <AnimatePresence><Toast toast={toast} /></AnimatePresence>

            {/* ── SELECTOR BAR ──────────────────────────────────── */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-wrap gap-4 items-center">
                {/* Vacancy selector */}
                <div className="flex flex-col gap-1 min-w-[260px]">
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

                {/* Appointee selector */}
                {appointees.length > 0 && (
                    <div className="flex flex-col gap-1 min-w-[220px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointee</label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1B3A6B] outline-none focus:ring-2 focus:ring-[#1B3A6B] pr-10"
                                value={applicantId || ''}
                                onChange={e => setApplicantId(Number(e.target.value))}
                            >
                                {appointees.map(a => (
                                    <option key={a.id} value={a.id}>{a.full_name}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Status badge */}
                {data && (
                    <div className="ml-auto flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Stage 11 — Final</span>
                    </div>
                )}
            </div>

            {/* ── EMPTY STATE ───────────────────────────────────── */}
            {noAppointees && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center shadow-sm">
                    <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-[#1B3A6B] uppercase italic mb-2">No Appointed Applicants</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        No appointments have been issued for this vacancy yet. 
                        Complete Stage 10 (Appointment Processing) first.
                    </p>
                </div>
            )}

            {/* ── LOADING ───────────────────────────────────────── */}
            {loading && (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                    <Loader2 className="animate-spin text-[#1B3A6B] mb-4" size={48} />
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">
                        Generating Stage 11 Final Notice...
                    </p>
                </div>
            )}

            {/* ── MAIN CONTENT ──────────────────────────────────── */}
            {!loading && data && data.notice && (
                <div className="flex flex-col xl:flex-row gap-8">

                    {/* LEFT: Notice Document */}
                    <div className="flex-1 min-w-0">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden"
                        >
                            {/* Toolbar */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
                                <div className="flex items-center gap-2 text-[#1B3A6B] font-black uppercase text-xs tracking-widest">
                                    <Eye size={16} /> Appointment Notice Preview
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePrint}
                                        className="px-4 py-2 border border-slate-200 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                                    >
                                        <Printer size={14} /> Print
                                    </button>
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={downloading}
                                        className="px-4 py-2 border border-slate-200 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {downloading
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <Download size={14} />}
                                        Download PDF
                                    </button>
                                </div>
                            </div>

                            {/* Letter body (also used for print) */}
                            <div ref={letterRef} className="p-16 bg-white min-h-[1000px] text-[#1B3A6B]">

                                {/* Letterhead */}
                                <div className="header text-center mb-10">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Republic of the Philippines</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Department of Education</p>
                                    <p className="text-[11px] font-black uppercase tracking-widest">Region IX – Zamboanga Peninsula</p>
                                    <p className="text-sm font-black uppercase tracking-tighter border-b-2 border-[#1B3A6B] inline-block pb-1 px-4">
                                        Schools Division Office of Dapitan City
                                    </p>
                                </div>

                                <h1 className="text-2xl font-black text-center uppercase tracking-[0.3em] mb-12 italic">
                                    Notice of Appointment
                                </h1>

                                {/* Details table */}
                                <table className="w-full max-w-2xl mx-auto mb-12 border-y border-slate-100 py-6">
                                    <tbody>
                                    {[
                                        { label: 'Name',            val: data.notice.fullName },
                                        { label: 'Position',        val: data.notice.positionTitle },
                                        { label: 'Item Number',     val: data.notice.itemNumber },
                                        { label: 'Salary Grade',    val: data.notice.salaryGrade },
                                        { label: 'Monthly Salary',  val: data.notice.monthlySalary },
                                        { label: 'Station',         val: data.notice.station },
                                        { label: 'Nature',          val: data.notice.nature },
                                        { label: 'Effectivity Date',
                                          val: data.notice.effectivityDate
                                              ? new Date(data.notice.effectivityDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                              : '—'
                                        },
                                    ].map((row, i) => (
                                        <tr key={i} className="border-b border-slate-50">
                                            <td className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3 pr-6 w-40 align-top">{row.label}</td>
                                            <td className="text-sm font-black text-[#1B3A6B] uppercase py-3">{row.val || '—'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>

                                {/* Legal basis */}
                                <div className="legal max-w-2xl mx-auto mb-24 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                    <p className="text-xs font-bold leading-relaxed text-justify italic text-slate-600">
                                        "{data.notice.legalBasis || LEGAL_BASIS}"
                                    </p>
                                </div>

                                {/* Signatories */}
                                <div className="sig-row grid grid-cols-2 gap-20 px-10">
                                    <div className="sig text-center">
                                        <p className="sig-line font-black text-sm uppercase border-b border-[#1B3A6B] pb-1">
                                            {data.notice.signatory}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Schools Division Superintendent</p>
                                        <p className="text-[9px] mt-1 font-bold">
                                            Date: {new Date(data.notice.issuedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="sig text-center">
                                        <p className="sig-line font-black text-sm uppercase border-b border-slate-300 pb-1 text-slate-400">
                                            {data.notice.fullName}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Appointee's Signature</p>
                                        <p className="text-[9px] mt-1 font-bold text-slate-300 tracking-widest">Date: _________________</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT: Tracker + Channels + Timeline */}
                    <div className="w-full xl:w-[420px] space-y-6 shrink-0">

                        {/* 1. Deadline Tracker */}
                        <div className={`p-6 rounded-[2.5rem] border-2 shadow-sm transition-all
                            ${data.tracker.isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex justify-between text-[10px] font-black uppercase mb-4">
                                <div className="text-slate-500">
                                    <p>Issued</p>
                                    <p className="text-sm text-[#1B3A6B]">
                                        {new Date(data.tracker.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right text-slate-500">
                                    <p>Posting Deadline</p>
                                    <p className={`text-sm ${data.tracker.isOverdue ? 'text-red-600' : 'text-amber-700'}`}>
                                        {new Date(data.tracker.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${data.tracker.percentElapsed}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${data.tracker.isOverdue ? 'bg-red-500' : 'bg-amber-500'}`}
                                />
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-widest
                                ${data.tracker.isOverdue ? 'text-red-600' : 'text-amber-700'}`}>
                                {data.tracker.isOverdue
                                    ? `⚠ Overdue by ${data.tracker.daysElapsed - 15} days`
                                    : `${data.tracker.daysElapsed} of 15 calendar days elapsed`}
                            </p>
                        </div>

                        {/* 2. Publish Channels */}
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                            <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest mb-6 border-b pb-2 italic">
                                Publish Channels
                            </h3>
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {CHANNELS.map(ch => {
                                    const isPosted   = data.postings.some(p => p.channel === ch.id);
                                    const isSelected = selectedChannels.includes(ch.id);
                                    return (
                                        <button
                                            key={ch.id}
                                            disabled={isPosted}
                                            onClick={() => setSelectedChannels(prev =>
                                                isSelected ? prev.filter(i => i !== ch.id) : [...prev, ch.id]
                                            )}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all
                                                ${isPosted
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default'
                                                    : isSelected
                                                        ? 'bg-blue-50 border-[#1B3A6B] text-[#1B3A6B] shadow-inner'
                                                        : 'border-slate-100 text-slate-300 hover:border-slate-300 hover:text-slate-500'}`}
                                        >
                                            {isPosted
                                                ? <CheckCircle2 size={24} />
                                                : <ch.icon size={24} />}
                                            <span className="text-[8px] font-black uppercase text-center leading-tight">
                                                {ch.label}
                                            </span>
                                            {isPosted && (
                                                <span className="text-[8px] font-bold text-emerald-500">Posted</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={handlePost}
                                disabled={selectedChannels.length === 0 || posting}
                                className="w-full py-4 bg-[#1B3A6B] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#D6402F] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {posting && <Loader2 size={16} className="animate-spin" />}
                                Post Notice of Appointment
                            </button>
                        </div>

                        {/* 3. RSP Timeline */}
                        <div className="bg-[#1B3A6B] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full" />

                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <div className="p-2 bg-white/10 rounded-xl text-emerald-400">
                                    <Shield size={20} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest">RSP Process Complete</h3>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {data.timeline.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-[10px] font-bold text-blue-300/70 uppercase tracking-wider">
                                            {item.label}
                                        </span>
                                        <span className="text-xs font-black tracking-tight">
                                            {item.date
                                                ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : <span className="text-slate-500">—</span>}
                                        </span>
                                    </div>
                                ))}

                                <div className="pt-6 flex justify-between items-end border-t border-white/10">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-blue-300 tracking-[0.2em] mb-1">Audit Score</p>
                                        <p className="text-xs font-black uppercase text-emerald-400 italic tracking-widest">PRIME-HRM Level II</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-blue-200 mb-1 opacity-60">Total TAT</p>
                                        <p className="text-2xl font-black text-emerald-400 tracking-tighter">
                                            {data.totalTAT}
                                            <span className="text-xs uppercase ml-1">Working Days</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RSPNoticeOfAppointment;
