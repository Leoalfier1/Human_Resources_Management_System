import React, { useState, useRef, useEffect } from 'react';
import { Download, Printer, Users, ChevronDown, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE } from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';
import DepEdPrintHeader from '../DepEdPrintHeader';
import DepEdPrintSignatures from '../DepEdPrintSignatures';
import PrintSignatureModal from '../PrintSignatureModal';

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: '#16A34A' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const statusBadge = (s) => ({
  'Completed':      'bg-[#DCFCE7] text-[#16A34A]',
  'Checked In':     'bg-[#DBEAFE] text-[#2563EB]',
  'Not Checked In': 'bg-[#FEF3C7] text-[#B45309]',
  'Excused':        'bg-[#E0E7FF] text-[#4F46E5]',
  'Absent':         'bg-[#FEF2F2] text-[#DC2626]',
}[s] || 'bg-[#F3F4F6] text-[#6B7280]');

const TH = ({ children }) => (
  <th className="text-left px-2 py-2.5 font-black uppercase"
    style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em', background: '#F9FAFB' }}>
    {children}
  </th>
);

const ExportDropdown = ({ programId, onExportComplete }) => {
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
      const url = `${API_BASE}/api/ld/reports/attendance/export?programId=${programId || 1}&format=${format}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setLoading(null); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `attendance-export.${format === 'pdf' ? 'pdf' : 'docx'}`;
      a.click();
      URL.revokeObjectURL(a.href);
      if (onExportComplete) onExportComplete(`Attendance register exported as ${format.toUpperCase()}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} disabled={!!loading}
        className="flex items-center gap-1.5 text-white px-3 py-1.5 rounded-full font-bold hover:opacity-90 transition-opacity"
        style={{ background: '#1B2A50', fontSize: 10, opacity: loading ? 0.7 : 1 }}>
        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
        {loading ? `Exporting…` : 'Export Register'}
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

const LDPortalConduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const programId = location.state?.programId || 1;
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const [loading, setLoading] = useState(true);
  const [conductData, setConductData] = useState(null);
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

  const fetchConductData = () => {
    setLoading(true);
    apiFetch(`/api/ld/programs/${programId}/conduct`)
      .then(r => r.json())
      .then(d => {
        // Accept data whether or not it has a program key
        if (d && (d.program || d.statCards || d.attendanceRows)) {
          setConductData(d);
        } else if (d && typeof d === 'object') {
          // Partial or empty response — still set it so the page renders
          setConductData(d);
        }
      })
      .catch(err => console.error('Conduct fetch error:', err))
      .finally(() => setLoading(false));
  };

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socket.on('connect', () => socket.emit('join-ld-room', 'ld-admin'));
    socket.on('ld_attendance_updated', () => fetchConductData());
    socket.on('ld:dashboard:update', () => fetchConductData());
    return () => socket.disconnect();
  }, [isAuthenticated, programId]);

  useEffect(() => {
    const interval = setInterval(fetchConductData, 30000);
    return () => clearInterval(interval);
  }, [programId]);

  useEffect(() => {
    fetchConductData();
  }, [programId]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#1B2A50]" />
        <p style={{ fontSize: 12, color: '#6B7280' }}>Loading Conduct & Monitoring Data...</p>
      </div>
    );
  }

  const statCards = conductData?.statCards || [];
  const attendanceRows = conductData?.attendanceRows || [];
  const metrics = conductData?.metrics || [];
  const program = conductData?.program || {};

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* ── Colored stat cards ──────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 no-print print:hidden">
        {statCards.map((c, i) => (
          <div key={i} className="rounded-2xl p-5 text-white" style={{ background: c.bg }}>
            <p className="font-black leading-none" style={{ fontSize: 30 }}>{c.value}</p>
            <p className="font-bold mt-1 opacity-90" style={{ fontSize: 12 }}>{c.label}</p>
            <p className="opacity-60 mt-0.5" style={{ fontSize: 10 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Two-column ──────────────────────────────────── */}
      <div className="grid gap-4 print:block" style={{ gridTemplateColumns: '1fr 290px' }}>

        {/* Attendance register */}
        <div className="rounded-2xl border border-slate-100 p-5 print:p-0 print:border-none" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <DepEdPrintHeader
            reportTitle="OFFICIAL ATTENDANCE REGISTER"
            subTitle={program.title}
            syPeriod={program.startDate ? `CONDUCT DATE: ${new Date(program.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : undefined}
            officeTitle="Human Resource Development (HRD) Unit"
          />

          <div className="flex items-center justify-between mb-4 flex-wrap gap-2 no-print print:hidden">
            <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>
              Attendance Register — {program.title}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/ld-portal/programs/${program.id || 1}/participants`)}
                className="flex items-center gap-1.5 text-white px-3 py-1.5 rounded-full font-bold hover:opacity-90 transition-opacity"
                style={{ background: '#DE4E2A', fontSize: 10 }}>
                <Users size={12} /> View Participants
              </button>
              <ExportDropdown programId={program.id || 1} onExportComplete={showToast} />
              <button onClick={() => setPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold border border-slate-200 hover:bg-slate-50 transition-opacity"
                style={{ fontSize: 10, color: '#1B2A50' }}>
                <Printer size={12} /> Print
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                {['#', 'Name', 'Position', 'School', 'Time In', 'Time Out', 'Status'].map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {attendanceRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center" style={{ fontSize: 11, color: '#9CA3AF' }}>
                    No registered participants found for this program
                  </td>
                </tr>
              ) : (
                attendanceRows.map(r => (
                  <tr key={r.num} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td className="px-2 py-2.5" style={{ fontSize: 11, color: '#6B7280' }}>{r.num}</td>
                    <td className="px-2 py-2.5 font-semibold" style={{ fontSize: 11, color: '#1B2A50' }}>{r.name}</td>
                    <td className="px-2 py-2.5" style={{ fontSize: 11, color: '#6B7280' }}>{r.position}</td>
                    <td className="px-2 py-2.5" style={{ fontSize: 11, color: '#6B7280' }}>{r.school}</td>
                    <td className="px-2 py-2.5 font-mono" style={{ fontSize: 10, color: r.am !== '—' ? '#16A34A' : '#9CA3AF' }}>
                      {r.am}
                    </td>
                    <td className="px-2 py-2.5 font-mono" style={{ fontSize: 10, color: r.pm !== '—' ? '#2563EB' : '#9CA3AF' }}>
                      {r.pm}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className={`font-bold rounded-full px-1.5 py-0.5 ${statusBadge(r.status)}`} style={{ fontSize: 9 }}>{r.status}</span>
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

        {/* Live M&E */}
        <div className="rounded-2xl border border-slate-100 p-5 no-print print:hidden" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Live M&E Dashboard</p>

          <div className="space-y-4 mb-5">
            {metrics.map((m, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold" style={{ fontSize: 10, color: '#4B5563' }}>{m.label}</p>
                  <p className="font-black"    style={{ fontSize: 10, color: '#1B2A50' }}>{m.value}%</p>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: '#E5E7EB' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${m.value}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2" style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
            <p className="font-black uppercase mb-2" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.16em' }}>Program Info</p>
            {[
              { icon: '📅', text: program.startDate ? new Date(program.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD' },
              { icon: '📍', text: program.venue || 'DCNHS Audio-Visual Room' },
              { icon: '👥', text: `${program.registered || 0} / ${program.targetPax || 80} Registered` },
            ].map((info, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ fontSize: 13 }}>{info.icon}</span>
                <p style={{ fontSize: 11, color: '#4B5563' }}>{info.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDPortalConduct;
