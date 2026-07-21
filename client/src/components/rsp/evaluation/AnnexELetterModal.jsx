import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Download, Loader2, AlertCircle, FileText, CheckCircle2, Clock } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

// ─── helpers ─────────────────────────────────────────────────────────────────

const QUALIFIED_COLOR = 'text-emerald-700 bg-emerald-50 border-emerald-200';
const DISQ_COLOR = 'text-red-700 bg-red-50 border-red-200';

function RemarksChip({ text }) {
    const isDisq = (text || '').startsWith('DISQUALIFIED');
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${isDisq ? DISQ_COLOR : QUALIFIED_COLOR}`}>
            {isDisq ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
            {text}
        </span>
    );
}

// ─── Shared MQS Table ────────────────────────────────────────────────────────

function MqsTable({ tableRows, positionTitle }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-[#1B3A6B] text-white">
                        <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide w-[18%]">Position Applied for:</th>
                        <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide w-[20%]">CSC Approved QS of the Position</th>
                        <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide w-[28%]">Your Qualifications</th>
                        <th className="px-3 py-2.5 text-left font-bold text-[10px] uppercase tracking-wide w-[34%]">Remarks / Details</th>
                    </tr>
                </thead>
                <tbody>
                    {tableRows.map((row, i) => (
                        <tr key={row.criterion_id} className={i % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'}>
                            <td className="px-3 py-3 border-b border-slate-100 align-top">
                                <span className="font-bold text-[#1B3A6B]">{positionTitle}</span>
                            </td>
                            <td className="px-3 py-3 border-b border-slate-100 align-top">
                                <span className="text-slate-700">{row.cs_qs}</span>
                                {row.is_required && (
                                    <span className="block text-[9px] font-bold text-red-500 uppercase mt-0.5">Required</span>
                                )}
                            </td>
                            <td className="px-3 py-3 border-b border-slate-100 align-top text-slate-600">
                                {row.your_qualifications || 'None'}
                            </td>
                            <td className="px-3 py-3 border-b border-slate-100 align-top">
                                <RemarksChip text={row.remarks} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Footer Band ───────────────────────────────────────────────────────────────

function FooterBand({ office }) {
    return (
        <div className="mt-16 pt-4 border-t-2 border-[#1B3A6B] flex items-center justify-between font-sans text-slate-600">
            {/* Logos Placeholders */}
            <div className="flex items-center gap-2">
                {['DepEd', 'Bagong Pilipinas', 'Division Seal', 'PRIME', 'Shriners'].map(logo => (
                    <div key={logo} className="w-10 h-10 border border-slate-200 bg-slate-50 flex items-center justify-center text-[6px] font-bold text-center leading-tight">
                        {logo}
                    </div>
                ))}
            </div>

            {/* Contact Info */}
            <div className="text-[9px] space-y-0.5 px-4 border-l border-slate-200">
                <div className="flex gap-2"><span className="font-bold text-[#1B3A6B] w-16">Address:</span><span>Sunset Boulevard, Dawo, Dapitan City</span></div>
                <div className="flex gap-2"><span className="font-bold text-[#1B3A6B] w-16">Telephone No:</span><span>{office.contact}</span></div>
                <div className="flex gap-2"><span className="font-bold text-[#1B3A6B] w-16">Website:</span><span>www.depeddapitancity.net</span></div>
                <div className="flex gap-2"><span className="font-bold text-[#1B3A6B] w-16">Email Address:</span><span>{office.email}</span></div>
            </div>

            {/* Doc Ref Table */}
            <div className="text-[8px] border border-[#1B3A6B] shrink-0">
                <div className="bg-[#1B3A6B] text-white font-bold flex divide-x divide-white text-center">
                    <div className="px-2 py-1 w-20">Doc. Ref. Code</div>
                    <div className="px-1 py-1 w-8">Rev</div>
                    <div className="px-2 py-1 w-16">Effectivity</div>
                    <div className="px-2 py-1 w-12">Page</div>
                </div>
                <div className="flex divide-x divide-[#1B3A6B] text-center font-bold text-slate-700">
                    <div className="px-2 py-1 w-20">SDO-OSDS-F001</div>
                    <div className="px-1 py-1 w-8">00</div>
                    <div className="px-2 py-1 w-16">03.18.26</div>
                    <div className="px-2 py-1 w-12">1 of 1</div>
                </div>
            </div>
        </div>
    );
}

// ─── Qualified variant preview ────────────────────────────────────────────────

function QualifiedLetter({ data }) {
    const { applicant, vacancy, table_rows, signatory, office } = data;
    const lastName = applicant.full_name.trim().split(/\s+/).pop();
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const evalDate = applicant.evaluated_at
        ? new Date(applicant.evaluated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : today;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 font-serif text-sm leading-relaxed shadow-sm space-y-5 max-w-3xl mx-auto">
            {/* Letterhead */}
            <div className="text-center space-y-0.5">
                <p className="text-[11px] text-slate-600">Republic of the Philippines</p>
                <p className="text-[11px] text-slate-600">Department of Education</p>
                <p className="text-[11px] text-slate-600">Region IX – Zamboanga Peninsula</p>
                <p className="text-[12px] font-black text-[#1B3A6B] uppercase tracking-wide">Schools Division Office of Dapitan City</p>
            </div>
            <div className="border-t-2 border-[#1B3A6B]" />

            {/* Date + Annex label */}
            <div className="flex justify-between items-start">
                <p className="text-[12px] text-slate-700">{today}</p>
                <p className="text-[11px] font-black text-[#1B3A6B] uppercase tracking-widest">ANNEX E</p>
            </div>

            {/* Addressee */}
            <div className="space-y-0.5">
                <p className="font-black text-[#1B3A6B] text-[13px] uppercase">{applicant.full_name}</p>
                <p className="text-[11px] text-slate-600">{applicant.address}</p>
            </div>

            <p className="text-[12px]">Dear Mr./Ms. {lastName}:</p>

            {/* Body */}
            <div className="space-y-3 text-[12px] text-slate-700">
                <p><strong className="text-[#1B3A6B]">Congratulations!</strong></p>
                <p className="text-justify">
                    We are pleased to inform you that based on the initial evaluation, we have found your
                    qualifications to be substantial vis-à-vis the Civil Service Commission (CSC) approved
                    Qualification Standards (QS) of the <strong>{vacancy.position_title}</strong> position
                    under ({vacancy.office_abbreviation}). Below are the results of the initial evaluation
                    conducted by the undersigned dated <strong>{evalDate}</strong>.
                </p>
            </div>

            {/* Table */}
            <MqsTable tableRows={table_rows} positionTitle={vacancy.position_title} />

            {/* Closing */}
            <p className="text-justify text-[12px] text-slate-700">
                Please be advised of your assigned application code{' '}
                <strong className="text-[#1B3A6B]">{applicant.ref_no}</strong> which shall be used as you
                proceed with the next stage of the selection process. You may refer to the official issuances
                of DepEd {office.name} for the additional announcements in this regard. For inquiries, you
                may communicate with the office number: <strong>{office.contact}</strong> and email
                address: <strong>{office.email}</strong>. Thank you.
            </p>

            <p className="text-[12px] text-slate-700">Very truly yours,</p>
            <div className="mt-8 mb-8">
                <p className="font-black text-[#1B3A6B] uppercase text-[12px]">{signatory.name}</p>
                <p className="text-[11px] text-slate-600">{signatory.position}</p>
            </div>

            <FooterBand office={office} />
        </div>
    );
}

// ─── Disqualified variant preview ─────────────────────────────────────────────

function DisqualifiedLetter({ data }) {
    const { applicant, vacancy, table_rows, signatory, office } = data;
    const lastName = applicant.full_name.trim().split(/\s+/).pop();
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 font-serif text-sm leading-relaxed shadow-sm space-y-5 max-w-3xl mx-auto">
            {/* Letterhead */}
            <div className="text-center space-y-0.5">
                <p className="text-[11px] text-slate-600">Republic of the Philippines</p>
                <p className="text-[11px] text-slate-600">Department of Education</p>
                <p className="text-[11px] text-slate-600">Region IX – Zamboanga Peninsula</p>
                <p className="text-[12px] font-black text-[#1B3A6B] uppercase tracking-wide">Schools Division Office of Dapitan City</p>
            </div>
            <div className="border-t-2 border-[#1B3A6B]" />

            <div className="flex justify-between items-start">
                <p className="text-[12px] text-slate-700">{today}</p>
                <p className="text-[11px] font-black text-[#1B3A6B] uppercase tracking-widest">ANNEX E</p>
            </div>

            <div className="space-y-0.5">
                <p className="font-black text-[#1B3A6B] text-[13px] uppercase">{applicant.full_name}</p>
                <p className="text-[11px] text-slate-600">{applicant.address}</p>
            </div>

            <p className="text-[12px]">Dear Mr./Ms. {lastName}:</p>

            <p className="text-justify text-[12px] text-slate-700">
                Please be informed of the results of the initial evaluation of your qualifications vis-à-vis
                the Civil Service Commission (CSC) approved Qualification Standards (QS) of
                the <strong>{vacancy.position_title}</strong> position under ({vacancy.office_abbreviation}), as follows:
            </p>

            <MqsTable tableRows={table_rows} positionTitle={vacancy.position_title} />

            <div className="space-y-3 text-[12px] text-slate-700">
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
                    <strong className="text-[#1B3A6B]">{applicant.ref_no}</strong> in the official posting of the results.
                </p>
                <p>Thank you and we wish you the best of luck in your future success.</p>
            </div>

            <p className="text-[12px] text-slate-700">Very truly yours,</p>
            <div className="mt-8 mb-8">
                <p className="font-black text-[#1B3A6B] uppercase text-[12px]">{signatory.name}</p>
                <p className="text-[11px] text-slate-600">{signatory.position}</p>
            </div>

            <FooterBand office={office} />
        </div>
    );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function AnnexELetterModal({ isOpen, applicationId, applicantName, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!applicationId) return;
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/${applicationId}/annex-e`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Failed to load Annex E data.');
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [applicationId]);

    useEffect(() => {
        if (isOpen) {
            setData(null);
            fetchData();
        }
    }, [isOpen, fetchData]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/rsp/evaluation/${applicationId}/annex-e/pdf`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const j = await res.json();
                throw new Error(j.message || 'PDF generation failed.');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const lastName = applicantName?.trim().split(/\s+/).pop() || 'Applicant';
            a.href = url;
            a.download = `AnnexE_${lastName}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-slate-50 rounded-[2rem] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
                    >
                        {/* Header bar */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#1B3A6B]/10 rounded-xl">
                                    <FileText size={18} className="text-[#1B3A6B]" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-black text-[#1B3A6B] uppercase tracking-wide">Annex E — Initial Evaluation Result</p>
                                    <p className="text-[10px] text-slate-400 font-semibold">{applicantName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {data && (
                                    <button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] hover:bg-[#162E55] text-white text-[11px] font-bold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        {downloading ? 'Generating…' : 'Download PDF'}
                                    </button>
                                )}
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Variant badge */}
                        {data && (
                            <div className="px-6 py-2 bg-white border-b border-slate-100 shrink-0">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${data.variant === 'qualified' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                                    {data.variant === 'qualified' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                                    {data.variant === 'qualified' ? 'Variant 1 — Qualified Letter' : 'Variant 2 — Disqualified Letter'}
                                </span>
                                {data.applicant?.evaluated_at && (
                                    <span className="ml-3 text-[10px] text-slate-400 font-semibold inline-flex items-center gap-1">
                                        <Clock size={10} />
                                        Evaluated: {new Date(data.applicant.evaluated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 sidebar-scroll">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <Loader2 size={36} className="animate-spin text-[#1B3A6B]" />
                                    <p className="text-[#1B3A6B] font-bold text-sm">Preparing Annex E letter…</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <AlertCircle size={40} className="text-amber-400" />
                                    <p className="font-black text-amber-600 text-sm uppercase tracking-wide">{error}</p>
                                    <button onClick={fetchData} className="px-4 py-2 text-xs font-bold bg-amber-50 text-amber-600 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors">
                                        Retry
                                    </button>
                                </div>
                            ) : data ? (
                                data.variant === 'qualified'
                                    ? <QualifiedLetter data={data} />
                                    : <DisqualifiedLetter data={data} />
                            ) : null}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
