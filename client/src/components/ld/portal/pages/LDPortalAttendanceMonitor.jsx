import React, { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle, Download, ChevronDown, Users, RefreshCw, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE } from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';
import DepEdPrintHeader from '../DepEdPrintHeader';
import DepEdPrintSignatures from '../DepEdPrintSignatures';
import PrintSignatureModal from '../PrintSignatureModal';

const statusBadge = (s) => ({
  'Completed':      'bg-[#DCFCE7] text-[#16A34A]',
  'Checked In':     'bg-[#DBEAFE] text-[#2563EB]',
  'Not Checked In': 'bg-[#FEF3C7] text-[#B45309]',
  'Excused':        'bg-[#E0E7FF] text-[#4F46E5]',
  'Absent':         'bg-[#FEF2F2] text-[#DC2626]',
}[s] || 'bg-[#F3F4F6] text-[#6B7280]');

const typeBadge = (t) => ({
  'Teaching':         'bg-[#DBEAFE] text-[#2563EB]',
  'Teaching-related': 'bg-purple-100 text-purple-700',
  'Non-teaching':     'bg-[#F3F4F6] text-[#6B7280]',
}[t] || 'bg-[#F3F4F6] text-[#6B7280]');

const TH = ({ children }) => (
  <th className="text-left px-2.5 py-2.5 font-black uppercase whitespace-nowrap"
    style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em', background: '#F9FAFB' }}>
    {children}
  </th>
);

const ExportDropdown = ({ programId = 1, onExportComplete }) => {
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
      a.download = `attendance-export.${format === 'pdf' ? 'pdf' : 'docx'}`;
      a.click();
      URL.revokeObjectURL(a.href);
      if (onExportComplete) onExportComplete(`Attendance exported as ${format.toUpperCase()}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors"
        style={{ background: '#1B2A50', color: '#fff', fontSize: 11, opacity: loading ? 0.7 : 1 }}>
        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
        {loading ? `Exporting…` : 'Export Attendance'}
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

const LDPortalAttendanceMonitor = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
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
  const [selectedProg, setSelectedProg] = useState('all');
  const [selectedPersonnel, setSelectedPersonnel] = useState('All Personnel Types');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    statCards: [],
    records: [],
    programs: [],
  });
  const [toast, setToast] = useState(null);
  const showToast = (msg, color = '#16A34A') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socket.on('connect', () => socket.emit('join-ld-room', 'ld-admin'));
    socket.on('ld_attendance_updated', () => fetchAttendanceMonitor());
    socket.on('ld:dashboard:update', () => fetchAttendanceMonitor());
    return () => socket.disconnect();
  }, [isAuthenticated, selectedProg, selectedPersonnel, search]);

  useEffect(() => {
    const interval = setInterval(fetchAttendanceMonitor, 30000);
    return () => clearInterval(interval);
  }, [selectedProg, selectedPersonnel, search]);

  const fetchAttendanceMonitor = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedProg && selectedProg !== 'all') params.append('program_id', selectedProg);
    if (selectedPersonnel && selectedPersonnel !== 'All Personnel Types') params.append('personnel_type', selectedPersonnel);
    if (search.trim()) params.append('search', search.trim());

    apiFetch(`/api/ld/programs/attendance-monitor?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.records) setData(d);
      })
      .catch(err => console.error('Attendance Monitor fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAttendanceMonitor();
  }, [selectedProg, selectedPersonnel, search]);

  const statCards = data.statCards || [
    { value: 0, label: 'Total Enrolled', color: '#1B2A50', bg: '#DBEAFE' },
    { value: 0, label: 'Total Present', color: '#16A34A', bg: '#DCFCE7' },
    { value: '0%', label: 'Attendance Rate', color: '#DE4E2A', bg: '#fff5f2', note: 'No records' },
  ];
  const records = data.records || [];
  const programs = data.programs || [];

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
          style={{ background: toast.color }}>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 no-print print:hidden">
        {statCards.map((c, i) => (
          <div key={i} className="rounded-2xl p-5 border border-slate-100" style={{ background: c.bg }}>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
            ) : (
              <p className="font-black leading-none" style={{ fontSize: 30, color: c.color }}>{c.value}</p>
            )}
            <p className="font-bold mt-1" style={{ fontSize: 12, color: '#1B2A50' }}>{c.label}</p>
            {c.note && <p className="font-semibold mt-0.5" style={{ fontSize: 10, color: '#DE4E2A' }}>{c.note}</p>}
          </div>
        ))}
      </div>

      {/* ── Filter bar ──────────────────────────────────── */}
      <div className="flex items-center gap-3 no-print print:hidden">
        <select value={selectedProg} onChange={e => setSelectedProg(e.target.value)}
          className="rounded-lg px-3 py-2 focus:outline-none appearance-none cursor-pointer"
          style={{ border: '1px solid #E5E7EB', fontSize: 11, color: '#6B7280', background: '#fff' }}>
          <option value="all">All Programs</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select value={selectedPersonnel} onChange={e => setSelectedPersonnel(e.target.value)}
          className="rounded-lg px-3 py-2 focus:outline-none appearance-none cursor-pointer"
          style={{ border: '1px solid #E5E7EB', fontSize: 11, color: '#6B7280', background: '#fff' }}>
          <option value="All Personnel Types">All Personnel Types</option>
          <option value="teaching">Teaching</option>
          <option value="teaching_related">Teaching-related</option>
          <option value="non_teaching">Non-teaching</option>
        </select>

        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or employee no."
            className="w-full rounded-lg pl-8 pr-4 py-2 focus:outline-none transition-colors"
            style={{ border: '1px solid #E5E7EB', fontSize: 11, color: '#374151' }} />
        </div>

        <button onClick={() => navigate(`/ld-portal/programs/${selectedProg === 'all' ? 1 : selectedProg}/participants`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-colors text-white"
          style={{ background: '#DE4E2A', fontSize: 11 }}>
          <Users size={12} /> View Participants
        </button>

        <ExportDropdown programId={selectedProg === 'all' ? 1 : selectedProg} onExportComplete={showToast} />
        <button onClick={() => setPrintModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
          style={{ fontSize: 11, color: '#1B2A50' }}>
          <Printer size={12} /> Print
        </button>
      </div>

      {/* ── Official DepEd Print Header ──────────────────────── */}
      <DepEdPrintHeader
        reportTitle="EMPLOYEE ATTENDANCE RECORDS MONITORING REPORT"
        syPeriod={`REPORT DATE: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
        officeTitle="Human Resource Development (HRD) Unit"
      />

      {/* ── Two-column ──────────────────────────────────── */}
      <div className="grid gap-4 print:block" style={{ gridTemplateColumns: '1fr 270px' }}>

        {/* Records table */}
        <div className="rounded-2xl border border-slate-100 p-5 overflow-x-auto print:p-0 print:border-none" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4 print:hidden">
            <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Attendance Records</p>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                {['Employee No.', 'Full Name', 'Personnel Type', 'Program Title', 'Date', 'Status', 'File Submitted'].map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td colSpan={7} className="py-3">
                      <div className="h-4 bg-slate-100 animate-pulse rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center" style={{ fontSize: 11, color: '#9CA3AF' }}>
                    No attendance records found matching filters
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td className="px-2.5 py-2.5 font-mono" style={{ fontSize: 10, color: '#6B7280' }}>{r.empNo}</td>
                    <td className="px-2.5 py-2.5 font-semibold whitespace-nowrap" style={{ fontSize: 11, color: '#1B2A50' }}>{r.name}</td>
                    <td className="px-2.5 py-2.5">
                      <span className={`font-bold rounded-full px-1.5 py-0.5 ${typeBadge(r.type)}`} style={{ fontSize: 9 }}>{r.type}</span>
                    </td>
                    <td className="px-2.5 py-2.5 max-w-[140px] truncate" style={{ fontSize: 10, color: '#6B7280' }}>{r.program}</td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap" style={{ fontSize: 10, color: '#6B7280' }}>{r.date}</td>
                    <td className="px-2.5 py-2.5">
                      <span className={`font-bold rounded-full px-1.5 py-0.5 ${statusBadge(r.status)}`} style={{ fontSize: 9 }}>{r.status}</span>
                    </td>
                    <td className="px-2.5 py-2.5">
                      {r.filed
                        ? <span className="flex items-center gap-1 font-bold" style={{ fontSize: 10, color: '#16A34A' }}><CheckCircle size={11} /> submitted</span>
                        : <span style={{ fontSize: 10, color: '#D1D5DB' }}>none</span>
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <DepEdPrintSignatures
            preparedByName={signatureData.preparedByName}
            reviewedByName={signatureData.reviewedByName}
            approvedByName={signatureData.approvedByName}
          />
        </div>

        {/* Bar chart */}
        <div className="rounded-2xl border border-slate-100 p-5 print:hidden" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Attendance by Program</p>
          <div className="space-y-4">
            {programs.length === 0 ? (
              <p className="text-center py-4" style={{ fontSize: 10, color: '#9CA3AF' }}>No programs data</p>
            ) : (
              programs.map((p, i) => {
                const onTarget = p.rate >= 75;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold truncate max-w-[170px]" style={{ fontSize: 10, color: '#4B5563' }} title={p.name}>{p.name}</p>
                      <p className="font-black"    style={{ fontSize: 10, color: onTarget ? '#1B2A50' : '#DE4E2A' }}>{p.rate}%</p>
                    </div>
                    <div className="w-full rounded-full overflow-hidden" style={{ height: 10, background: '#E5E7EB' }}>
                      <div className="h-full rounded-full" style={{ width: `${p.rate}%`, background: onTarget ? '#1B2A50' : '#DE4E2A' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="space-y-1.5 mt-5" style={{ borderTop: '1px solid #E5E7EB', paddingTop: 14 }}>
            {[
              { color: '#1B2A50', label: '≥ 75% target' },
              { color: '#DE4E2A', label: 'Below 75% — needs attention' },
            ].map((leg, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: leg.color }} />
                <p style={{ fontSize: 10, color: '#6B7280' }}>{leg.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDPortalAttendanceMonitor;
