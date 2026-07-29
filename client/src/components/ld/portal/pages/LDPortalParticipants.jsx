import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Search, Download, Printer, ChevronDown,
  CheckCircle, XCircle, Clock, ArrowLeft, RefreshCw, AlertCircle,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE, SERVER_BASE } from '../../../../utils/api';
import DepEdPrintHeader from '../DepEdPrintHeader';
import DepEdPrintSignatures from '../DepEdPrintSignatures';
import PrintSignatureModal from '../PrintSignatureModal';

// ── Status badges ────────────────────────────────────────────────────────────
const AttBadge = ({ s }) => {
  const map = {
    present:  'bg-[#DCFCE7] text-[#16A34A]',
    absent:   'bg-[#FEE2E2] text-[#DC2626]',
    excused:  'bg-[#FEF3C7] text-[#B45309]',
  };
  return <span className={`font-bold rounded-full px-2 py-0.5 ${map[s] || 'bg-gray-100 text-gray-600'}`} style={{ fontSize: 9 }}>{s || '—'}</span>;
};

const CompBadge = ({ s }) => {
  const map = {
    completed:  'bg-[#DCFCE7] text-[#16A34A]',
    incomplete: 'bg-[#FEF3C7] text-[#B45309]',
  };
  return <span className={`font-bold rounded-full px-2 py-0.5 ${map[s] || 'bg-gray-100 text-gray-600'}`} style={{ fontSize: 9 }}>{s || 'enrolled'}</span>;
};

// ── Summary card ────────────────────────────────────────────────────────────
const SumCard = ({ value, label, color, bg }) => (
  <div className="rounded-2xl p-5 border border-slate-100" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <p className="font-black leading-none" style={{ fontSize: 30, color }}>{value}</p>
    <p className="font-bold mt-1" style={{ fontSize: 12, color: '#1B2A50' }}>{label}</p>
  </div>
);

const TH = ({ children }) => (
  <th className="text-left px-3 py-2.5 font-black uppercase whitespace-nowrap"
    style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em', background: '#F9FAFB' }}>
    {children}
  </th>
);

// ── Export dropdown ─────────────────────────────────────────────────────────
const ExportDropdown = ({ programId, programTitle, onExportComplete }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const ref = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const doExport = async (format) => {
    setLoading(format);
    setOpen(false);
    try {
      const url = `${API_BASE}/api/ld/reports/attendance/export?programId=${programId}&format=${format}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setLoading(null); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `attendance-${programTitle || programId}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      a.click();
      URL.revokeObjectURL(a.href);
      if (onExportComplete) onExportComplete(`Participants list exported as ${format.toUpperCase()}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors"
        style={{ background: '#1B2A50', color: '#fff', fontSize: 11, opacity: loading ? 0.7 : 1 }}>
        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
        {loading ? `Generating ${loading.toUpperCase()}…` : 'Export'}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          {[{ f: 'pdf', label: 'Export as PDF' }, { f: 'docx', label: 'Export as DOCX' }].map(({ f, label }) => (
            <button key={f} onClick={() => doExport(f)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors font-semibold flex items-center gap-2"
              style={{ fontSize: 11, color: '#374151' }}>
              <Download size={12} style={{ color: '#6B7280' }} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
const LDPortalParticipants = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [toast, setToast] = useState(null);
  const showToast = (msg, color = '#16A34A') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!id) return;
    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socket.on('connect', () => socket.emit('join-ld-room', 'ld-admin'));
    socket.on('ld_attendance_updated', () => fetchData());
    socket.on('ld:dashboard:update', () => fetchData());
    return () => socket.disconnect();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await apiFetch(`/api/ld/reports/programs/${id}/participants`);
      if (!res.ok) {
        res = await apiFetch(`/api/ld/programs/${id}/participants`);
      }
      if (!res.ok) { setError('Could not load participant data.'); return; }
      setData(await res.json());
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const participants = data?.participants || [];
  const filtered = participants.filter(p => {
    const matchSearch = !search ||
      (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.employee_no || '').includes(search) ||
      (p.school_office || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.completion_status === filterStatus || p.attendance_status === filterStatus;
    const matchType = filterType === 'all' || (p.personnel_type || '') === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [signatureData, setSignatureData] = useState({
    preparedByName: "JUAN DELA CRUZ",
    reviewedByName: "JAY MONTEALTO, CESO V",
    approvedByName: "SUDI G. ALOLOD, CESO VI",
  });

  const handlePrintConfirm = (newSignatures) => {
    setSignatureData(newSignatures);
    setPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrint = () => setPrintModalOpen(true);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <RefreshCw size={28} className="animate-spin mx-auto" style={{ color: '#1B2A50' }} />
        <p style={{ fontSize: 12, color: '#6B7280' }}>Loading participants…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="rounded-2xl p-10 text-center border border-red-100" style={{ background: '#FEF2F2' }}>
      <AlertCircle size={32} className="mx-auto mb-3" style={{ color: '#DC2626' }} />
      <p className="font-bold" style={{ fontSize: 13, color: '#DC2626' }}>{error}</p>
      <button onClick={fetchData} className="mt-3 font-bold hover:underline" style={{ fontSize: 11, color: '#DC2626' }}>Retry</button>
    </div>
  );

  const prog = data?.program;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
          style={{ background: toast.color }}>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* ── Official DepEd Print Header ──────────────────────── */}
      <DepEdPrintHeader
        reportTitle="OFFICIAL ATTENDANCE REGISTER / PARTICIPANTS LIST"
        subTitle={prog?.title}
        syPeriod={prog?.start_date ? `${formatDate(prog.start_date)}${prog.end_date ? ` – ${formatDate(prog.end_date)}` : ''}` : undefined}
        officeTitle="Human Resource Development (HRD) Unit"
      />

      {/* Back link */}
      <button onClick={() => navigate(location.state?.from || -1, { state: location.state })}
        className="flex items-center gap-1.5 font-bold hover:underline no-print print:hidden"
        style={{ fontSize: 11, color: '#6B7280' }}>
        <ArrowLeft size={13} /> Back
      </button>

      {/* ── Program header card ──────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 p-5 no-print print:hidden"
        style={{ background: '#1B2A50', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-black uppercase mb-1" style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em' }}>
              PROGRAM — PARTICIPANTS VIEW
            </p>
            <h2 className="font-black text-white leading-tight" style={{ fontSize: 18 }}>
              {prog?.title || `Program #${id}`}
            </h2>
            <div className="flex flex-wrap gap-4 mt-2">
              {[
                { icon: '📅', text: prog?.start_date ? `${formatDate(prog.start_date)}${prog.end_date ? ` – ${formatDate(prog.end_date)}` : ''}` : 'No date set' },
                { icon: '📍', text: prog?.venue || 'Venue TBD' },
                { icon: '🎓', text: prog?.methodology || 'Mode TBD' },
              ].map((i, idx) => (
                <span key={idx} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  <span>{i.icon}</span>{i.text}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <ExportDropdown programId={id} programTitle={prog?.title} onExportComplete={showToast} />
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border border-white/30 hover:bg-white/10 transition-colors"
              style={{ fontSize: 11, color: '#fff' }}>
              <Printer size={12} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 no-print print:hidden">
        <SumCard value={prog?.total_enrolled ?? 0} label="Total Enrolled" color="#1B2A50" bg="#DBEAFE" />
        <SumCard value={prog?.total_present ?? 0}  label="Total Present"  color="#16A34A" bg="#DCFCE7" />
        <SumCard value={`${data?.completionRate ?? 0}%`} label="Completion Rate" color="#DE4E2A" bg="#fff5f2" />
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap no-print print:hidden">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, employee no., or school…"
            className="w-full rounded-lg pl-8 pr-4 py-2 focus:outline-none"
            style={{ border: '1px solid #E5E7EB', fontSize: 11, color: '#374151' }} />
        </div>
        {[
          { val: filterStatus, set: setFilterStatus, opts: [['all','All Statuses'],['present','Present'],['absent','Absent'],['excused','Excused'],['completed','Completed'],['incomplete','Incomplete']] },
          { val: filterType, set: setFilterType, opts: [['all','All Personnel'],['teaching','Teaching'],['non_teaching','Non-Teaching']] },
        ].map(({ val, set, opts }, i) => (
          <select key={i} value={val} onChange={e => set(e.target.value)}
            className="rounded-lg px-3 py-2 focus:outline-none appearance-none"
            style={{ border: '1px solid #E5E7EB', fontSize: 11, color: '#6B7280', background: '#fff' }}>
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {/* ── Participants table ───────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 p-5 overflow-x-auto"
        style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>
          Participant List <span style={{ color: '#6B7280', fontWeight: 400 }}>({filtered.length} of {participants.length})</span>
        </p>

        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Users size={32} className="mx-auto" style={{ color: '#D1D5DB' }} />
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>
              {participants.length === 0
                ? 'No participants enrolled in this program yet.'
                : 'No participants match your current filters.'}
            </p>
            {participants.length === 0 && (
              <p style={{ fontSize: 10, color: '#D1D5DB' }}>
                Enrollment happens when the Admin seeds attendance or participants register.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {['Emp. No.', 'Full Name', 'Position', 'School / Office', 'Personnel Type',
                  'Enrollment Date', 'Attendance %', 'Status', 'Certificate'].map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.user_id ?? i}
                  className="hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td className="px-3 py-2.5 font-mono" style={{ fontSize: 10, color: '#6B7280' }}>
                    {p.employee_no || '—'}
                  </td>
                  <td className="px-3 py-2.5 font-semibold whitespace-nowrap" style={{ fontSize: 11, color: '#1B2A50' }}>
                    {p.full_name}
                  </td>
                  <td className="px-3 py-2.5" style={{ fontSize: 11, color: '#6B7280' }}>
                    {p.position || '—'}
                  </td>
                  <td className="px-3 py-2.5 max-w-[130px] truncate" style={{ fontSize: 10, color: '#6B7280' }}>
                    {p.school_office || '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-bold rounded-full px-2 py-0.5 ${p.personnel_type === 'teaching' ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                      style={{ fontSize: 9 }}>
                      {p.personnel_type || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ fontSize: 10, color: '#6B7280' }}>
                    {formatDate(p.enrollment_date)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${p.attendance_pct}%`, background: p.attendance_pct >= 75 ? '#16A34A' : '#DE4E2A' }} />
                      </div>
                      <span className="font-bold" style={{ fontSize: 10, color: p.attendance_pct >= 75 ? '#16A34A' : '#DE4E2A' }}>
                        {p.attendance_pct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <AttBadge s={p.attendance_status} />
                      {p.completion_status && <CompBadge s={p.completion_status} />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.certificate_issued ? (
                      p.certificate_path ? (
                        <a href={`${SERVER_BASE}/${p.certificate_path}`} target="_blank" rel="noreferrer" title="View Certificate">
                          <CheckCircle size={14} className="hover:opacity-80 transition-opacity inline" style={{ color: '#16A34A' }} />
                        </a>
                      ) : (
                        <CheckCircle size={14} className="inline" style={{ color: '#16A34A' }} />
                      )
                    ) : (
                      <span style={{ fontSize: 10, color: '#D1D5DB' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <DepEdPrintSignatures
          preparedByName={signatureData.preparedByName}
          reviewedByName={signatureData.reviewedByName}
          approvedByName={signatureData.approvedByName}
        />
      </div>

      {/* Print Signature Modal */}
      <PrintSignatureModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        onConfirm={handlePrintConfirm}
        initialData={signatureData}
        documentTitle={`Attendance Register — ${prog?.title || 'Program'}`}
      />
    </div>
  );
};

export default LDPortalParticipants;
