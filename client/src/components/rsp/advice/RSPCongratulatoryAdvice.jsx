import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Printer, Download, Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useCongratulatoryAdvice } from '../../../hooks/useCongratulatoryAdvice';
import { API_BASE } from '../../../utils/api';

const API = API_BASE;

const RSPCongratulatoryAdvice = () => {
    const [vacancies, setVacancies] = useState([]);
    const [vacancyId, setVacancyId] = useState(null);
    const [vacLoading, setVacLoading] = useState(true);
    const letterRef = useRef(null);

    useEffect(() => {
        const fetchVacancies = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE}/api/rsp/vacancies`, {
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

    const { eligible, selectedId, setSelectedId, detail, setDetails, loading, refresh } =
        useCongratulatoryAdvice(vacancyId);

    const [submitting, setSubmitting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Save / Send ───────────────────────────────────────────────
    const handleSave = async () => {
    setSubmitting(true);
    const token = localStorage.getItem('token');

    // Ensure dates are sent as plain YYYY-MM-DD strings, not full ISO datetimes
    const payload = {
        ...detail,
        report_date: detail.report_date?.split('T')[0],
        document_submission_deadline: detail.document_submission_deadline?.split('T')[0],
    };

    await fetch(`${API_BASE}/api/rsp/congratulatory-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    setSubmitting(false);
    alert("Congratulatory Advice Saved & Preview Updated");
};

    // ── Print ─────────────────────────────────────────────────────
    const handlePrint = () => {
        const content = letterRef.current;
        if (!content) return;
        const printWin = window.open('', '_blank', 'width=900,height=700');
        printWin.document.write(`
            <html>
              <head>
                <title>Congratulatory Advice</title>
                <style>
                  body { font-family: Georgia, serif; font-size: 12pt; margin: 72px; color: #1a1a1a; }
                  h1, h2, p { margin: 0 0 12px; }
                  ol { margin: 12px 0 12px 24px; }
                  .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1B3A6B; padding-bottom: 12px; }
                  .sig-row { display: flex; justify-content: space-between; margin-top: 64px; }
                  .sig-line { border-top: 1px solid #333; width: 240px; padding-top: 4px; font-size: 10pt; }
                </style>
              </head>
              <body>${content.innerHTML}</body>
            </html>
        `);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => printWin.print(), 400);
    };

    // ── Download PDF ──────────────────────────────────────────────
    const handleDownloadPDF = async () => {
        if (!selectedId) return;
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${API}/api/rsp/congratulatory-advice/${selectedId}/pdf`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('PDF generation failed.');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Congratulatory_Advice_${detail?.full_name?.replace(/\s+/g, '_') || selectedId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setDownloading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────
    if (vacLoading) {
        return (
            <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                Loading Postings...
            </div>
        );
    }

    if (vacancies.length === 0) {
        return (
            <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                No vacancies found. Post a vacancy first.
            </div>
        );
    }

    const reportDateDisplay = detail?.report_date
        ? new Date(detail.report_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '[Date not set]';

    const deadlineDateDisplay = detail?.document_submission_deadline
        ? new Date(detail.document_submission_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '[Date not set]';

    return (
        <div className="space-y-6 select-none pb-20 relative">
            {/* HEADER + VACANCY SELECTOR */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#1B3A6B] uppercase tracking-tight italic">Selection &amp; Congratulatory Advice</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Stage 9 · Appointing Authority selection and dynamic document requirement check
                    </p>
                </div>
                <select
                    className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-[#1B3A6B] outline-none shadow-sm max-w-sm"
                    value={vacancyId || ''}
                    onChange={e => {
                        setVacancyId(Number(e.target.value));
                        setSelectedId(null);
                        setDetails(null);
                    }}
                >
                    {vacancies.map(v => (
                        <option key={v.id} value={v.id}>{v.ref_no} — {v.position_title}</option>
                    ))}
                </select>
            </div>

            {loading || !detail ? (
                <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                    Preparing Advice Generator...
                </div>
            ) : eligible.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 max-w-lg mx-auto text-center">
                    <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic mb-2">No Eligible Appointees</h2>
                    <p className="text-slate-500 text-sm">
                        No shortlisted or selected applicants found for this vacancy.
                        Complete the Deliberation stage first.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col xl:flex-row gap-8">

            {/* ── TOAST ─────────────────────────────────────────── */}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-3
                        ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
                >
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.msg}
                </motion.div>
            )}

            {/* ── LEFT PANEL ────────────────────────────────────── */}
            <div className="w-full xl:w-[450px] space-y-6 shrink-0">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                    <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest mb-6 border-b pb-2">
                        Select Appointee
                    </h3>

                    <div className="space-y-2">
                        {eligible.map(app => (
                            <button
                                key={app.id}
                                onClick={() => setSelectedId(app.id)}
                                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between
                                    ${selectedId === app.id
                                        ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white shadow-xl'
                                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300'}`}
                            >
                                <div>
                                    <p className="text-xs font-black uppercase">{app.full_name}</p>
                                    <p className={`text-[9px] font-bold mt-0.5 ${selectedId === app.id ? 'text-blue-300' : 'text-slate-400'}`}>
                                        Rank #{app.rank_val} · Score {parseFloat(app.total_score).toFixed(2)}
                                    </p>
                                </div>
                                {Number(app.already_sent) > 0 && (
                                    <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Editable fields */}
                    <div className="mt-8 space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                Place of Assignment
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-[#1B3A6B] outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                                value={detail.place_of_assignment || ''}
                                onChange={e => setDetails({ ...detail, place_of_assignment: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                    Report Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-[#1B3A6B] outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                                    value={detail.report_date?.split('T')[0] || ''}
                                    onChange={e => setDetails({ ...detail, report_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                    Doc Deadline
                                </label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-[#1B3A6B] outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                                    value={detail.document_submission_deadline?.split('T')[0] || ''}
                                    onChange={e => setDetails({ ...detail, document_submission_deadline: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                Appointing Authority
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-[#1B3A6B] outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                                value={detail.appointing_authority_name || ''}
                                onChange={e => setDetails({ ...detail, appointing_authority_name: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL: LETTER PREVIEW ───────────────────── */}
            <div className="flex-1 min-w-0">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2 text-[#1B3A6B] font-black uppercase text-xs tracking-widest">
                            <Printer size={16} /> Letter Preview
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                            >
                                <Printer size={14} /> Print
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={downloading}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {downloading
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Download size={14} />}
                                Download PDF
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={submitting}
                                className="px-4 py-2 bg-[#1B3A6B] rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-2 hover:bg-[#162E55] transition-colors disabled:opacity-60"
                            >
                                {submitting
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Send size={14} />}
                                Send to Appointee
                            </button>
                        </div>
                    </div>

                    {/* Letter body — this div is printed */}
                    <div ref={letterRef} className="p-20 text-left bg-white min-h-[1000px] font-serif text-slate-800 leading-relaxed">

                        {/* Letterhead */}
                        <div className="text-center mb-10">
                            <p className="uppercase text-xs text-slate-500">Republic of the Philippines</p>
                            <p className="uppercase text-xs font-bold">Department of Education</p>
                            <p className="uppercase text-xs text-slate-500">Region IX – Zamboanga Peninsula</p>
                            <p className="uppercase text-xs font-bold text-[#1B3A6B]">Schools Division Office of Dapitan City</p>
                            <div className="h-0.5 bg-[#1B3A6B] w-full mt-4" />
                        </div>

                        <p className="text-right mb-10 text-sm font-bold">
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>

                        <div className="mb-8">
                            <p className="font-bold uppercase text-sm">{detail.full_name}</p>
                            <p className="text-sm text-slate-600">{detail.assigned_school}</p>
                        </div>

                        <p className="mb-6 text-sm">
                            Dear {detail.full_name?.split(' ').pop()},
                        </p>

                        <p className="mb-6 text-sm text-justify">
                            <span className="font-bold">Congratulations!</span> It is with great pleasure that I inform you
                            of your selection for appointment to the position of{' '}
                            <span className="underline uppercase font-bold">{detail.position_title}</span>{' '}
                            at <strong>{detail.place_of_assignment || detail.assigned_school}</strong>,
                            effective <span className="underline font-bold">{reportDateDisplay}</span>.
                        </p>

                        <p className="mb-4 text-sm text-justify">
                            You are hereby required to report to your assigned station on the said date.
                            Please submit the following documents to the Human Resource Management Division
                            on or before <span className="font-bold underline">{deadlineDateDisplay}</span>:
                        </p>

                        <ol className="list-decimal list-inside space-y-1 mb-8 text-sm bg-slate-50 p-6 rounded-xl border border-slate-100">
                            {(detail.required_docs || []).map((doc, i) => (
                                <li key={i} className="text-slate-700">{doc}</li>
                            ))}
                        </ol>

                        <p className="mb-10 text-sm text-justify">
                            Failure to submit the required documents within the prescribed period may result in
                            the withdrawal of this advice. Please acknowledge receipt of this letter by signing below.
                        </p>

                        <p className="mb-10 text-sm">Congratulations once again!</p>

                        <div className="flex justify-between mt-16">
                            <div>
                                <p className="font-black text-sm uppercase border-b border-slate-800 pb-1 pr-12">
                                    {detail.appointing_authority_name}
                                </p>
                                <p className="text-xs italic text-slate-500 mt-1">Schools Division Superintendent</p>
                            </div>
                            <div className="text-center w-64 border-t border-slate-400 pt-1">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Appointee's Signature over Printed Name</p>
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

export default RSPCongratulatoryAdvice;
