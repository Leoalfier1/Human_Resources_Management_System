import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Printer, Download, Send, CheckCircle2, XCircle, Loader2,
    AlertCircle, FileText, Mail, CheckCircle, Clock, ShieldCheck,
    ChevronDown, Save, Plus, Trash2, RotateCcw
} from 'lucide-react';
import { useCongratulatoryAdvice } from '../../../hooks/useCongratulatoryAdvice';
import { API_BASE } from '../../../utils/api';

const API = API_BASE;

const QUALIFIED_COLOR = 'text-emerald-700 bg-emerald-50 border-emerald-200';
const DISQ_COLOR = 'text-red-700 bg-red-50 border-red-200';
const INPUT_CLASS = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1B3A6B] outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 focus:border-[#1B3A6B] transition-all';
const LABEL_CLASS = 'text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block';

/* ─── Sub-components (unchanged) ─────────────────────────────────────────── */

function RemarksChip({ text }) {
    const isDisq = (text || '').startsWith('DISQUALIFIED');
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${isDisq ? DISQ_COLOR : QUALIFIED_COLOR}`}>
            {isDisq ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
            {text}
        </span>
    );
}

const SERIF = '"Times New Roman", Georgia, "Palatino Linotype", serif';
const LETTER_BODY = { fontFamily: SERIF, fontSize: '12pt', lineHeight: '1.7', color: '#1a1a1a' };

/* ─── Letter Header — DepEd Seal + Letterhead ──────────────────────────────── */

function LetterHeader() {
    return (
        <div className="text-center mb-2">
            <div className="relative w-[96px] h-[96px] mx-auto mb-2">
                <img src="/assets/deped-seal.png" alt="" className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                <div className="hidden w-full h-full rounded-full border-2 border-[#1B3A6B] items-center justify-center bg-white">
                    <span className="text-[7px] font-bold text-[#1B3A6B] text-center leading-tight">DEPED<br />SEAL</span>
                </div>
            </div>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '12pt', color: '#1a1a1a', marginBottom: '1px', lineHeight: '1.4' }}>
                Republic of the Philippines
            </p>
            <p style={{ fontFamily: '"Old English Text MT", "UnifrakturMaguntia", "Times New Roman", serif', fontSize: '17pt', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '1px', lineHeight: '1.3', letterSpacing: '0.5px' }}>
                Department of Education
            </p>
            <p style={{ fontFamily: SERIF, fontVariant: 'small-caps', fontSize: '10pt', color: '#1a1a1a', marginBottom: '1px', letterSpacing: '0.5px', lineHeight: '1.4' }}>
                Region IX, Zamboanga Peninsula
            </p>
            <p style={{ fontFamily: SERIF, fontVariant: 'small-caps', fontSize: '10.5pt', fontWeight: 'bold', color: '#1B3A6B', letterSpacing: '0.5px', lineHeight: '1.4' }}>
                Schools Division of Dapitan City
            </p>
        </div>
    );
}

/* ─── ANNEX E label + Date row ────────────────────────────────────────────── */

function AnnexEDateRow({ letterDate }) {
    return (
        <>
            <div className="border-t-2 border-[#1B3A6B] my-4" />
            <div className="flex justify-between items-start" style={{ fontFamily: SERIF, fontSize: '12pt' }}>
                <span>{letterDate}</span>
                <span style={{ fontStyle: 'italic', fontWeight: 'bold' }}>ANNEX E</span>
            </div>
        </>
    );
}

/* ─── Recipient Block ─────────────────────────────────────────────────────── */

function RecipientBlock({ salutation, recipientName, recipientAddress, lastName }) {
    return (
        <div className="my-5" style={{ fontFamily: SERIF, fontSize: '12pt' }}>
            <p className="font-bold mb-1">{salutation} {recipientName}</p>
            <p className="mb-5">{recipientAddress}</p>
            <p>Dear {salutation} {lastName}:</p>
        </div>
    );
}

/* ─── QS Evaluation Table (merged Position column via rowspan) ──────────────── */

function MqsTable({ tableRows, positionTitle }) {
    return (
        <div className="my-6 overflow-x-auto border border-slate-300" style={{ fontFamily: SERIF }}>
            <table className="w-full text-[11px] border-collapse">
                <thead>
                    <tr className="bg-[#1B3A6B] text-white">
                        <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide border border-[#1B3A6B] w-[16%]">Position Applied for:</th>
                        <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide border border-[#1B3A6B] w-[22%]">CSC Approved QS of the Position</th>
                        <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide border border-[#1B3A6B] w-[30%]">Applicant's Qualifications</th>
                        <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide border border-[#1B3A6B] w-[32%]">Remarks / Details</th>
                    </tr>
                </thead>
                <tbody>
                    {tableRows.map((row, i) => {
                        const isDisq = (row.remarks || '').startsWith('DISQUALIFIED');
                        return (
                            <tr key={row.criterion_id || `row-${i}`} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                                {i === 0 && (
                                    <td rowSpan={tableRows.length} className="px-3 py-4 border border-slate-200 align-middle text-center font-bold text-[#1B3A6B] text-[12px]" style={{ background: '#f0f4fa' }}>
                                        {positionTitle}
                                    </td>
                                )}
                                <td className="px-3 py-2.5 border border-slate-200 align-top text-left">
                                    <span className="text-slate-700">{row.cs_qs}</span>
                                    {row.is_required && (
                                        <span className="block text-[8px] font-bold text-red-500 uppercase mt-0.5">Required</span>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 border border-slate-200 align-top text-left text-slate-600">
                                    {row.your_qualifications || 'None'}
                                </td>
                                <td className="px-3 py-2.5 border border-slate-200 align-top text-left">
                                    <span className={`font-bold text-[11px] ${isDisq ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {row.remarks}
                                    </span>
                                    {isDisq && row.reason && (
                                        <p className="text-[9px] text-red-500 italic mt-1 leading-snug">{row.reason}</p>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ─── Signatory Block ─────────────────────────────────────────────────────── */

function SignatoryBlock({ signatory }) {
    return (
        <div className="mt-12 mb-6" style={{ fontFamily: SERIF, fontSize: '12pt' }}>
            <p>Very truly yours,</p>
            <div className="mt-12 mb-3">
                {signatory?.signature_path ? (
                    <img src={signatory.signature_path} alt="Signature" className="h-14 object-contain" />
                ) : (
                    <div className="h-14" />
                )}
            </div>
            <p className="font-bold uppercase">{signatory?.name || 'SCHOOLS DIVISION SUPERINTENDENT'}</p>
            <p style={{ fontSize: '10pt', color: '#475569' }}>{signatory?.position || 'Schools Division Superintendent'}</p>
            {signatory?.designation && (
                <p style={{ fontSize: '10pt', color: '#475569' }}>{signatory.designation}</p>
            )}
        </div>
    );
}

/* ─── Footer Band (3-part: logos | contact | doc-ref) ─────────────────────── */

function FooterBand({ office }) {
    const logos = [
        { src: '/assets/deped-seal.png', fallback: 'DepEd' },
        { src: '/assets/bagong-pilipinas.png', fallback: 'Bagong\nPilipinas' },
        { src: '/assets/division-seal.png', fallback: 'Division\nSeal' },
        { src: '/assets/prime-hrm.png', fallback: 'PRIME-\nHRM' }
    ];
    return (
        <div className="mt-14 pt-4 border-t-2 border-[#1B3A6B]" style={{ fontFamily: SERIF }}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-1.5 shrink-0">
                    {logos.map((logo, idx) => (
                        <div key={idx} className="relative w-11 h-11 border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                            <img src={logo.src} alt="" className="w-full h-full object-contain p-0.5"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                            <div className="hidden w-full h-full items-center justify-center">
                                <span className="text-[5px] font-bold text-center leading-tight text-slate-500 whitespace-pre-line">{logo.fallback}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex-1 text-[9px] space-y-0.5 px-3 border-l border-slate-200" style={{ fontFamily: SERIF }}>
                    <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Address:</span><span>{office.office_address || office.address}</span></div>
                    <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Telephone No:</span><span>{office.contact}</span></div>
                    <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Website:</span><span>{office.office_website || office.website}</span></div>
                    <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Email Address:</span><span>{office.email}</span></div>
                    {office.facebook && (
                        <div className="flex gap-1.5"><span className="font-bold text-[#1B3A6B] w-16 shrink-0">Facebook:</span><span>{office.facebook}</span></div>
                    )}
                </div>
                <div className="text-[8px] border border-[#1B3A6B] shrink-0">
                    <div className="bg-[#1B3A6B] text-white font-bold flex divide-x divide-white text-center">
                        <div className="px-2 py-1 w-20">Doc. Ref. Code</div>
                        <div className="px-1 py-1 w-8">Rev</div>
                        <div className="px-2 py-1 w-16">Effectivity</div>
                        <div className="px-2 py-1 w-12">Page</div>
                    </div>
                    <div className="flex divide-x divide-[#1B3A6B] text-center font-bold text-slate-700">
                        <div className="px-2 py-1 w-20">{office.doc_ref_code || 'SDO-OSDS-F001'}</div>
                        <div className="px-1 py-1 w-8">{office.doc_rev || '00'}</div>
                        <div className="px-2 py-1 w-16">{office.doc_effectivity || '03.18.26'}</div>
                        <div className="px-2 py-1 w-12">1 of 1</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Letter previews (read from data.letter for overridable fields) ────── */

function QualifiedLetter({ data }) {
    const { vacancy, table_rows, signatory, office, letter } = data;
    const recipientName = letter?.recipient_full_name || data.applicant.full_name;
    const recipientAddress = letter?.address || data.applicant.address;
    const letterDate = letter?.letter_date_display || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const evalDate = letter?.eval_date_display || letterDate;
    const salutation = letter?.salutation || 'Mr.';
    const lastName = letter?.last_name || recipientName.trim().split(/\s+/).pop();

    return (
        <div className="bg-white rounded-2xl border border-slate-200 px-10 py-8 shadow-sm max-w-3xl mx-auto" style={{ ...LETTER_BODY, lineHeight: '1.7' }}>
            <LetterHeader />
            <AnnexEDateRow letterDate={letterDate} />
            <RecipientBlock salutation={salutation} recipientName={recipientName} recipientAddress={recipientAddress} lastName={lastName} />

            <div className="space-y-4 mb-4">
                <p><strong>Congratulations!</strong></p>
                <p className="text-justify">
                    We are pleased to inform you that based on the initial evaluation, we have found your
                    qualifications to be substantial vis-à-vis the Civil Service Commission (CSC) approved
                    Qualification Standards (QS) of the <strong>{vacancy.position_title}</strong> position
                    under ({vacancy.office_abbreviation}). Below are the results of the initial evaluation
                    conducted by the undersigned dated <strong>{evalDate}</strong>.
                </p>
            </div>

            <MqsTable tableRows={table_rows} positionTitle={vacancy.position_title} />

            <p className="text-justify mb-4">
                Please be advised of your assigned application code{' '}
                <strong>{data.applicant.ref_no}</strong> which shall be used as you
                proceed with the next stage of the selection process. You may refer to the official issuances
                of DepEd {office.name} for the additional announcements in this regard. For inquiries, you
                may communicate with the office number: <strong>{office.contact}</strong> and email
                address: <strong>{office.email}</strong>. Thank you.
            </p>

            <SignatoryBlock signatory={signatory} />
            <FooterBand office={office} />
        </div>
    );
}

function DisqualifiedLetter({ data }) {
    const { vacancy, table_rows, signatory, office, letter } = data;
    const recipientName = letter?.recipient_full_name || data.applicant.full_name;
    const recipientAddress = letter?.address || data.applicant.address;
    const letterDate = letter?.letter_date_display || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const salutation = letter?.salutation || 'Mr.';
    const lastName = letter?.last_name || recipientName.trim().split(/\s+/).pop();

    return (
        <div className="bg-white rounded-2xl border border-slate-200 px-10 py-8 shadow-sm max-w-3xl mx-auto" style={{ ...LETTER_BODY, lineHeight: '1.7' }}>
            <LetterHeader />
            <AnnexEDateRow letterDate={letterDate} />
            <RecipientBlock salutation={salutation} recipientName={recipientName} recipientAddress={recipientAddress} lastName={lastName} />

            <p className="text-justify mb-4">
                Please be informed of the results of the initial evaluation of your qualifications vis-à-vis
                the Civil Service Commission (CSC) approved Qualification Standards (QS) of
                the <strong>{vacancy.position_title}</strong> position under ({vacancy.office_abbreviation}), as follows:
            </p>

            <MqsTable tableRows={table_rows} positionTitle={vacancy.position_title} />

            <div className="space-y-4 mb-4">
                <p className="text-justify">
                    While your qualifications made a favorable impression, we regret to inform you that
                    you did not meet the minimum QS set for the <strong>{vacancy.position_title}</strong> position.
                    You may, however, continue to submit job applications in response to other vacancy
                    announcements that we publish at <strong>www.csc.gov.ph/careers</strong>, DepEd {office.name} bulletin
                    boards, and official website.
                </p>
                <p className="text-justify">
                    The results of the initial evaluation shall be released and posted for transparency purposes.
                    You may refer to your assigned application code{' '}
                    <strong>{data.applicant.ref_no}</strong> in the official posting of the results.
                </p>
                <p>Thank you and we wish you the best of luck in your future success.</p>
            </div>

            <SignatoryBlock signatory={signatory} />
            <FooterBand office={office} />
        </div>
    );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

const RSPCongratulatoryAdvice = () => {
    const [vacancies, setVacancies] = useState([]);
    const [vacancyId, setVacancyId] = useState(null);
    const [vacLoading, setVacLoading] = useState(true);

    const {
        queue,
        selectedId,
        setSelectedId,
        annexEData: data,
        loading,
        annexFetching,
        error,
        refresh,
        refreshAnnexE,
        letterForm,
        setLetterForm,
        saveOverrides,
        savingOverrides,
        saveTableRows,
        clearTableRows
    } = useCongratulatoryAdvice(vacancyId);

    // Congratulatory Advice-specific fields
    const [adviceForm, setAdviceForm] = useState({
        place_of_assignment: '',
        report_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        document_submission_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        appointing_authority_name: ''
    });

    useEffect(() => {
        if (data?.vacancy) {
            setAdviceForm(f => ({
                ...f,
                place_of_assignment: f.place_of_assignment || data.vacancy.assigned_school || ''
            }));
        }
    }, [data]);

    const [submitting, setSubmitting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState(null);
    const [editRows, setEditRows] = useState([]);
    const [savingRows, setSavingRows] = useState(false);

    const letterRef = useRef(null);

    // Sync editable rows when Annex E data loads/changes
    useEffect(() => {
        if (data?.table_rows) {
            setEditRows(data.table_rows.map((r, i) => ({ ...r, _key: r.criterion_id || `new-${i}` })));
        } else {
            setEditRows([]);
        }
    }, [data]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // Load vacancies
    useEffect(() => {
        const fetchVacancies = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE}/api/rsp/vacancies`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                const list = Array.isArray(json) ? json : [];
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

    // Build preview data by merging server data with form overrides for real-time preview
    const previewData = useMemo(() => {
        if (!data) return null;
        return {
            ...data,
            table_rows: editRows.length > 0 ? editRows : data.table_rows,
            letter: {
                ...data.letter,
                salutation: letterForm.salutation,
                last_name: letterForm.last_name || data.letter?.last_name,
                first_name: letterForm.first_name || data.letter?.first_name,
                recipient_full_name: [letterForm.first_name, letterForm.last_name].filter(Boolean).join(' ') || data.letter?.recipient_full_name,
                address: letterForm.address || data.letter?.address,
                letter_date: letterForm.letter_date,
                letter_date_display: letterForm.letter_date
                    ? new Date(letterForm.letter_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : data.letter?.letter_date_display
            }
        };
    }, [data, letterForm, editRows]);

    // ── Print ─────────────────────────────────────────────────────
    const handlePrint = () => {
        const content = letterRef.current;
        if (!content) return;
        const printWin = window.open('', '_blank', 'width=900,height=700');
        printWin.document.write(`
            <html>
              <head>
                <title>Annex E – Initial Evaluation Result</title>
                <style>
                  body { font-family: Georgia, serif; font-size: 12pt; margin: 72px; color: #1a1a1a; }
                  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
                  th { background: #1B3A6B; color: white; padding: 8px 10px; text-align: left; font-size: 9pt; }
                  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
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
            const res = await fetch(`${API}/api/rsp/evaluation/${selectedId}/annex-e/pdf`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.message || 'PDF generation failed.');
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const name = letterForm.last_name || data?.applicant?.full_name?.trim().split(/\s+/).pop() || 'Applicant';
            a.href = url;
            a.download = `AnnexE_${name.replace(/[^A-Za-z]/g, '')}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setDownloading(false);
        }
    };

    // ── Send email ────────────────────────────────────────────────
    const handleSend = async () => {
        if (!selectedId || !data?.vacancy) return;
        // Auto-save overrides before sending
        const saved = await saveOverrides();
        if (!saved && (letterForm.last_name || letterForm.first_name)) {
            showToast('error', 'Could not save letter details. Please try again.');
            return;
        }
        if (!window.confirm('Issue Congratulatory Advice and notify the applicant? This marks Stage 9 as complete.')) return;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                id: selectedId,
                vacancy_id: data.vacancy.id,
                full_name: data.applicant.full_name,
                position_title: data.vacancy.position_title,
                place_of_assignment: adviceForm.place_of_assignment || data.vacancy.assigned_school || 'SDO Dapitan City',
                report_date: adviceForm.report_date,
                document_submission_deadline: adviceForm.document_submission_deadline,
                appointing_authority_name: adviceForm.appointing_authority_name || 'Schools Division Superintendent'
            };
            const res = await fetch(`${API}/api/rsp/congratulatory-advice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.message || 'Failed to issue congratulatory advice.');
            showToast('success', 'Congratulatory Advice issued successfully. Applicant stage advanced to Stage 9.');
            refreshAnnexE();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setSending(false);
        }
    };

    // ── Update letter type override ───────────────────────────────
    const handleLetterTypeChange = async (newType) => {
        if (!selectedId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/rsp/evaluation/${selectedId}/annex-e/letter-type`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ letter_type: newType })
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.message || 'Failed to update letter type.');
            }
            showToast('success', 'Letter type updated.');
            refreshAnnexE();
        } catch (err) {
            showToast('error', err.message);
        }
    };

    // ── Loading / empty states ────────────────────────────────────
    if (vacLoading) {
        return (
            <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                Loading Vacancies...
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

    const variant = previewData?.variant;
    const isQualified = variant === 'qualified';
    const alreadySent = !!data?.congratulatory_advice_sent_at;

    return (
        <div className="space-y-5 select-none pb-20 relative">
            {/* ── TOAST ─────────────────────────────────────────── */}
            <AnimatePresence>
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
            </AnimatePresence>

            {/* ── HEADER ────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#1B3A6B] uppercase tracking-tight italic">
                        Annex E — Initial Evaluation Advice Letter
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Stage 8 · Generate, preview, and send the Annex E notification letter to applicants
                    </p>
                </div>
                <select
                    className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-[#1B3A6B] outline-none shadow-sm max-w-sm"
                    value={vacancyId || ''}
                    onChange={e => {
                        setVacancyId(Number(e.target.value));
                        setSelectedId(null);
                    }}
                >
                    {vacancies.map(v => (
                        <option key={v.id} value={v.id}>{v.ref_no} — {v.position_title}</option>
                    ))}
                </select>
            </div>

            {/* ── LETTER TYPE TOGGLE (top-level) ────────────────── */}
            {data && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex items-center gap-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">Letter Type:</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleLetterTypeChange('qualified')}
                            disabled={submitting}
                            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide border-2 transition-all flex items-center gap-1.5
                                ${variant === 'qualified'
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg'
                                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-emerald-200'}`}
                        >
                            <CheckCircle2 size={14} />
                            Qualified Advice
                        </button>
                        <button
                            onClick={() => handleLetterTypeChange('disqualified')}
                            disabled={submitting}
                            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide border-2 transition-all flex items-center gap-1.5
                                ${variant === 'disqualified'
                                    ? 'bg-red-50 border-red-500 text-red-700 shadow-lg'
                                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-red-200'}`}
                        >
                            <XCircle size={14} />
                            Disqualified Advice
                        </button>
                    </div>
                    {alreadySent && (
                        <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Mail size={11} />
                            Sent
                        </span>
                    )}
                </div>
            )}

            {error ? (
                <div className="p-20 text-center bg-white rounded-[2.5rem] shadow-sm border border-red-200">
                    <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
                    <h2 className="text-xl font-black text-red-600 uppercase italic mb-2">Failed to Load</h2>
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                    <button onClick={refresh} className="px-6 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                        Retry
                    </button>
                </div>
            ) : !loading && queue.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 max-w-lg mx-auto text-center">
                    <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic mb-2">No Evaluated Applicants</h2>
                    <p className="text-slate-500 text-sm">
                        No qualified or disqualified applicants found for this vacancy.
                        Complete the Initial Evaluation stage first.
                    </p>
                </div>
            ) : loading && !data ? (
                <div className="p-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                    Preparing Annex E Generator...
                </div>
            ) : (
                <div className="flex flex-col xl:flex-row gap-6">

                    {/* ═══ LEFT PANEL ═══════════════════════════════ */}
                    <div className="w-full xl:w-[420px] space-y-5 shrink-0">

                        {/* ── Applicant selector ──────────────────── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                            <label className={LABEL_CLASS}>Select Applicant</label>
                            <div className="relative">
                                <select
                                    className={`${INPUT_CLASS} appearance-none pr-10 cursor-pointer`}
                                    value={selectedId || ''}
                                    onChange={e => setSelectedId(Number(e.target.value))}
                                >
                                    {queue.map(app => (
                                        <option key={app.id} value={app.id}>
                                            {app.full_name} ({app.ref_no}) — {app.status}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* ── Recipient Details (editable) ────────── */}
                        {data && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                                <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                                    Recipient Details
                                </h3>
                                <div className="space-y-3.5">
                                    <div>
                                        <label className={LABEL_CLASS}>Salutation</label>
                                        <select
                                            className={INPUT_CLASS}
                                            value={letterForm.salutation}
                                            onChange={e => setLetterForm(f => ({ ...f, salutation: e.target.value }))}
                                        >
                                            <option value="Mr.">Mr.</option>
                                            <option value="Ms.">Ms.</option>
                                            <option value="Mrs.">Mrs.</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Last Name</label>
                                        <input
                                            type="text"
                                            className={INPUT_CLASS}
                                            value={letterForm.last_name}
                                            onChange={e => setLetterForm(f => ({ ...f, last_name: e.target.value }))}
                                            placeholder="e.g. Dela Cruz"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>First Name &amp; Middle Initial</label>
                                        <input
                                            type="text"
                                            className={INPUT_CLASS}
                                            value={letterForm.first_name}
                                            onChange={e => setLetterForm(f => ({ ...f, first_name: e.target.value }))}
                                            placeholder="e.g. Juan S."
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Address / Station</label>
                                        <input
                                            type="text"
                                            className={INPUT_CLASS}
                                            value={letterForm.address}
                                            onChange={e => setLetterForm(f => ({ ...f, address: e.target.value }))}
                                            placeholder="Full mailing address"
                                        />
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const ok = await saveOverrides();
                                            showToast(ok ? 'success' : 'error', ok ? 'Recipient details saved.' : 'Failed to save.');
                                        }}
                                        disabled={savingOverrides}
                                        className="w-full px-4 py-2.5 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#162E55] transition-colors disabled:opacity-50"
                                    >
                                        {savingOverrides ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                        {savingOverrides ? 'Saving...' : 'Save Details'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Position & Letter Details ───────────── */}
                        {data && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                                <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                                    Position &amp; Letter Details
                                </h3>
                                <div className="space-y-3.5">
                                    <div>
                                        <label className={LABEL_CLASS}>Position Applied For</label>
                                        <input
                                            type="text"
                                            className={INPUT_CLASS}
                                            value={data.vacancy.position_title}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Office Assigned</label>
                                        <input
                                            type="text"
                                            className={INPUT_CLASS}
                                            value={data.vacancy.assigned_school || data.letter?.address || 'SDO Dapitan City'}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Application Code</label>
                                        <input
                                            type="text"
                                            className={`${INPUT_CLASS} bg-slate-100 text-slate-500`}
                                            value={data.applicant.ref_no}
                                            readOnly
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={LABEL_CLASS}>Letter Date</label>
                                            <input
                                                type="date"
                                                className={INPUT_CLASS}
                                                value={letterForm.letter_date}
                                                onChange={e => setLetterForm(f => ({ ...f, letter_date: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLASS}>Evaluation Date</label>
                                            <input
                                                type="text"
                                                className={`${INPUT_CLASS} bg-slate-100 text-slate-500`}
                                                value={data.applicant.evaluated_at
                                                    ? new Date(data.applicant.evaluated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : 'N/A'}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Congratulatory Advice Details ──────── */}
                        {data && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                                <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                                    Congratulatory Advice Details
                                </h3>
                                <div className="space-y-3.5">
                                    <div>
                                        <label className={LABEL_CLASS}>Place of Assignment</label>
                                        <input
                                            type="text"
                                            className={INPUT_CLASS}
                                            value={adviceForm.place_of_assignment}
                                            onChange={e => setAdviceForm(f => ({ ...f, place_of_assignment: e.target.value }))}
                                            placeholder="e.g. SDO Dapitan City"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={LABEL_CLASS}>Report Date</label>
                                            <input
                                                type="date"
                                                className={INPUT_CLASS}
                                                value={adviceForm.report_date}
                                                onChange={e => setAdviceForm(f => ({ ...f, report_date: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLASS}>Doc Submission Deadline</label>
                                            <input
                                                type="date"
                                                className={INPUT_CLASS}
                                                value={adviceForm.document_submission_deadline}
                                                onChange={e => setAdviceForm(f => ({ ...f, document_submission_deadline: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Appointing Authority Name</label>
                                        <input
                                            type="text"
                                            className={INPUT_CLASS}
                                            value={adviceForm.appointing_authority_name}
                                            onChange={e => setAdviceForm(f => ({ ...f, appointing_authority_name: e.target.value }))}
                                            placeholder="e.g. Schools Division Superintendent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── QS Evaluation Results (editable) ──── */}
                        {data && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                                    <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest">
                                        QS Evaluation Results
                                    </h3>
                                    <button
                                        onClick={() => setEditRows(r => [...r, {
                                            _key: `new-${Date.now()}`,
                                            criterion_id: null,
                                            criterion_label: '',
                                            is_required: true,
                                            cs_qs: '',
                                            your_qualifications: '',
                                            remarks: 'QUALIFIED',
                                            reason: null,
                                            passed: 1
                                        }])}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                    >
                                        <Plus size={11} /> Add Row
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-[420px] overflow-y-auto sidebar-scroll pr-1">
                                    {editRows.length === 0 && (
                                        <p className="text-[10px] text-slate-400 text-center py-4 italic">
                                            No criteria rows. Click "Add Row" to create one.
                                        </p>
                                    )}
                                    {editRows.map((row, idx) => {
                                        const isDisq = (row.remarks || '').startsWith('DISQUALIFIED');
                                        return (
                                            <div key={row._key || idx} className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-[9px] font-black text-slate-300 shrink-0 pt-0.5">#{idx + 1}</span>
                                                    <button
                                                        onClick={() => setEditRows(r => r.filter((_, i) => i !== idx))}
                                                        className="shrink-0 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Remove row"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">CSC Approved QS Standard</label>
                                                    <textarea
                                                        rows={2}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-700 outline-none focus:ring-1 focus:ring-[#1B3A6B]/30 focus:border-[#1B3A6B] transition-all resize-none"
                                                        value={row.cs_qs}
                                                        onChange={e => setEditRows(r => r.map((rr, i) => i === idx ? { ...rr, cs_qs: e.target.value } : rr))}
                                                        placeholder="e.g. Bachelor's Degree relevant to the job"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Applicant's Qualifications</label>
                                                    <textarea
                                                        rows={2}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-700 outline-none focus:ring-1 focus:ring-[#1B3A6B]/30 focus:border-[#1B3A6B] transition-all resize-none"
                                                        value={row.your_qualifications || ''}
                                                        onChange={e => setEditRows(r => r.map((rr, i) => i === idx ? { ...rr, your_qualifications: e.target.value } : rr))}
                                                        placeholder="Applicant's actual qualification"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Remarks</label>
                                                        <select
                                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-[#1B3A6B]/30 focus:border-[#1B3A6B] transition-all"
                                                            value={row.remarks}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setEditRows(r => r.map((rr, i) => i === idx ? {
                                                                    ...rr,
                                                                    remarks: val,
                                                                    passed: val.startsWith('QUALIFIED') ? 1 : 0
                                                                } : rr));
                                                            }}
                                                        >
                                                            <option value="QUALIFIED">QUALIFIED</option>
                                                            <option value="DISQUALIFIED">DISQUALIFIED</option>
                                                            <option value="DISQUALIFIED – Insufficient Training">DISQUALIFIED – Insufficient Training</option>
                                                            <option value="DISQUALIFIED – Insufficient Experience">DISQUALIFIED – Insufficient Experience</option>
                                                            <option value="DISQUALIFIED – No Relevant Degree">DISQUALIFIED – No Relevant Degree</option>
                                                            <option value="DISQUALIFIED – No Eligibility">DISQUALIFIED – No Eligibility</option>
                                                            <option value="DISQUALIFIED – Nonsubmission of necessary documents">DISQUALIFIED – Nonsubmission of necessary documents</option>
                                                            <option value="PENDING EVALUATION">PENDING EVALUATION</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Reason (if Disqualified)</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-700 outline-none focus:ring-1 focus:ring-[#1B3A6B]/30 focus:border-[#1B3A6B] transition-all"
                                                            value={row.reason || ''}
                                                            onChange={e => setEditRows(r => r.map((rr, i) => i === idx ? { ...rr, reason: e.target.value || null } : rr))}
                                                            placeholder="Reason for disqualification"
                                                            disabled={!isDisq}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Save / Reset buttons */}
                                {editRows.length > 0 && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                                        <button
                                            onClick={async () => {
                                                setSavingRows(true);
                                                const ok = await saveTableRows(editRows.map(({ _key, ...rest }) => rest));
                                                setSavingRows(false);
                                                showToast(ok ? 'success' : 'error', ok ? 'QS table rows saved.' : 'Failed to save.');
                                            }}
                                            disabled={savingRows}
                                            className="flex-1 px-3 py-2 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-[#162E55] transition-colors disabled:opacity-50"
                                        >
                                            {savingRows ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                            {savingRows ? 'Saving...' : 'Save Table'}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!window.confirm('Reset to auto-derived evaluation data? Your edits will be lost.')) return;
                                                setSavingRows(true);
                                                const ok = await clearTableRows();
                                                setSavingRows(false);
                                                showToast(ok ? 'success' : 'error', ok ? 'Overrides cleared.' : 'Failed to reset.');
                                            }}
                                            disabled={savingRows}
                                            className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                        >
                                            <RotateCcw size={12} /> Reset
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ═══ RIGHT PANEL: LETTER PREVIEW ═══════════ */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                            {/* Toolbar */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 text-[#1B3A6B] font-black uppercase text-xs tracking-widest">
                                        <FileText size={16} /> Annex E Letter Preview
                                    </div>
                                    {previewData && (
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isQualified ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                                            {isQualified ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                            {variant === 'qualified' ? 'Qualified' : 'Disqualified'}
                                        </span>
                                    )}
                                    {annexFetching && (
                                        <Loader2 size={12} className="animate-spin text-[#1B3A6B] ml-1" />
                                    )}
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
                                        disabled={downloading || !selectedId}
                                        className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        Download PDF
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={sending || !selectedId || alreadySent}
                                        className="px-4 py-2 bg-[#1B3A6B] rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-2 hover:bg-[#162E55] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sending
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : alreadySent
                                                ? <ShieldCheck size={14} />
                                                : <Send size={14} />}
                                        {sending ? 'Sending...' : alreadySent ? 'Sent' : 'Send to Applicant'}
                                    </button>
                                </div>
                            </div>

                            {/* Letter body */}
                            <div ref={letterRef} className="p-8 md:p-12 overflow-y-auto max-h-[75vh] sidebar-scroll">
                                {previewData ? (
                                    isQualified
                                        ? <QualifiedLetter data={previewData} />
                                        : <DisqualifiedLetter data={previewData} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                                        <AlertCircle size={40} className="text-slate-300" />
                                        <p className="font-black text-slate-400 text-sm uppercase tracking-wide">Select an applicant to preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RSPCongratulatoryAdvice;
