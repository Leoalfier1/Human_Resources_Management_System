import React, { useState, useEffect } from 'react';
import { FileText, Users, BarChart3, Search, Filter, Download, Eye, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, SERVER_BASE, API_BASE } from '../../../../utils/api';
import CompletionReportForm from './CompletionReportForm';
import MESummaryReport from './MESummaryReport';
import DepEdPrintHeader from '../DepEdPrintHeader';
import DepEdPrintSignatures from '../DepEdPrintSignatures';
import PrintSignatureModal from '../PrintSignatureModal';

const statusBadge = (s) => ({
  completed: 'bg-[#DCFCE7] text-[#16A34A]',
  ongoing:   'bg-[#DBEAFE] text-[#2563EB]',
}[s] || 'bg-[#F9FAFB] text-[#6B7280]');

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TH = ({ children }) => (
  <th className="text-left px-3 py-2.5 font-black uppercase whitespace-nowrap"
    style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em', background: '#F9FAFB' }}>
    {children}
  </th>
);

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: '#16A34A' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const LDPortalReports = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('All');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showMESummary, setShowMESummary] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [toast, setToast] = useState(null);
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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchRecords = () => {
    setLoading(true);
    apiFetch('/api/ld/reports/archive/completed-programs')
      .then(r => r.ok ? r.json() : [])
      .then(d => setRecords(Array.isArray(d) ? d : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(); }, []);

  const filtered = records.filter(r => {
    const matchesSearch = !search || (r.title || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterMode === 'All' || (r.methodology || '').toLowerCase() === filterMode.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleExportSheet = async () => {
    if (records.length === 0) { showToast('No records to export'); return; }
    const firstProgId = records[0]?.id || 1;
    const token = localStorage.getItem('token');
    try {
      const url = `${API_BASE}/api/ld/reports/attendance/export?programId=${firstProgId}&format=pdf`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { showToast('Export failed', '#DC2626'); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `participants-profile-${firstProgId}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('Participants profile exported successfully');
    } catch {
      showToast('Export error', '#DC2626');
    }
  };

  const handleViewReport = (programId) => {
    setSelectedProgramId(programId);
    setShowMESummary(true);
  };

  const modes = ['All', ...new Set(records.map(r => r.methodology).filter(Boolean))];

  const actionCards = [
    {
      icon: FileText, color: '#2563EB', bg: '#DBEAFE',
      title: 'Program Completion Report',
      desc: 'Generate DepEd Memo No. 044, s. 2023 form',
      btn: 'GENERATE REPORT',
      onClick: () => setShowCompletionForm(true),
    },
    {
      icon: Users, color: '#7c3aed', bg: '#f5f3ff',
      title: 'Participants Profile Sheet',
      desc: 'Export actual participants profile as required',
      btn: 'EXPORT SHEET',
      onClick: handleExportSheet,
    },
    {
      icon: BarChart3, color: '#16A34A', bg: '#DCFCE7',
      title: 'M&E Summary Report',
      desc: 'Program evaluation and M&E results summary',
      btn: 'VIEW REPORT',
      onClick: () => { setSelectedProgramId(null); setShowMESummary(true); },
    },
  ];

  return (
    <div className="space-y-5">

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {showCompletionForm && <CompletionReportForm onClose={() => { setShowCompletionForm(false); fetchRecords(); }} />}
      {showMESummary && <MESummaryReport programId={selectedProgramId} onClose={() => { setShowMESummary(false); setSelectedProgramId(null); }} />}

      {/* ── Action cards ────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 print:hidden">
        {actionCards.map(({ icon: Icon, color, bg, title, desc, btn, onClick }) => (
          <div key={title} className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <p className="font-bold leading-tight" style={{ fontSize: 13, color: '#1B2A50' }}>{title}</p>
            <p className="mt-1 mb-4 leading-snug" style={{ fontSize: 10, color: '#6B7280' }}>{desc}</p>
            <button onClick={onClick}
              className="w-full text-white font-black uppercase py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: '#1B2A50', fontSize: 10, letterSpacing: '0.12em' }}>
              {btn}
            </button>
          </div>
        ))}
      </div>

      {/* ── Training Records Archive ─────────────────────── */}
      <div className="rounded-2xl border border-slate-100 p-5 print:p-0 print:border-none" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <DepEdPrintHeader
          reportTitle="HUMAN RESOURCE DEVELOPMENT TRAINING RECORDS ARCHIVE"
          syPeriod={`PERIOD: ALL COMPLETED PROGRAMS (${records.length})`}
          officeTitle="Human Resource Development (HRD) Unit"
        />

        <div className="flex items-center justify-between mb-4 print:hidden">
          <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Training Records Archive</p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search programs…"
                className="rounded-lg pl-8 pr-3 py-1.5 focus:outline-none transition-colors"
                style={{ border: '1px solid #E5E7EB', fontSize: 11, width: 200 }} />
            </div>
            <div className="relative">
              <select value={filterMode} onChange={e => setFilterMode(e.target.value)}
                className="rounded-lg px-3 py-1.5 font-medium appearance-none cursor-pointer focus:outline-none transition-colors"
                style={{ border: '1px solid #E5E7EB', fontSize: 11, color: '#6B7280', background: '#fff', paddingRight: 24 }}>
                <option value="All">All Modes</option>
                {modes.filter(m => m !== 'All').map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <Filter size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7280' }} />
            </div>
            <button onClick={() => setPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 font-bold hover:bg-slate-50 transition-colors"
              style={{ fontSize: 10, color: '#1B2A50' }}>
              <Printer size={12} /> Print
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              {['Program Title', 'Date Conducted', 'Participants', 'Mode', 'Status', 'Certificate', 'Actions'].map(h => <TH key={h}>{h}</TH>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6" style={{ fontSize: 11, color: '#6B7280' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6" style={{ fontSize: 11, color: '#6B7280' }}>No programs found</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F9FAFB' }}>
                <td className="px-3 py-3 font-semibold" style={{ fontSize: 11, color: '#1B2A50' }}>{r.title}</td>
                <td className="px-3 py-3 whitespace-nowrap" style={{ fontSize: 11, color: '#6B7280' }}>
                  {formatDate(r.start_date)}{r.end_date ? ` – ${formatDate(r.end_date)}` : ''}
                </td>
                <td className="px-3 py-3 font-mono" style={{ fontSize: 11, color: '#4B5563' }}>{r.present_count}/{r.total_enrolled}</td>
                <td className="px-3 py-3" style={{ fontSize: 11, color: '#6B7280' }}>{r.methodology || '—'}</td>
                <td className="px-3 py-3">
                  <span className={`font-bold rounded-full px-1.5 py-0.5 ${statusBadge(r.status)}`} style={{ fontSize: 9 }}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {r.report_pdf_path
                    ? <a href={`${SERVER_BASE}/${r.report_pdf_path}`} target="_blank" rel="noreferrer"
                        className="font-bold hover:underline flex items-center gap-1" style={{ fontSize: 11, color: '#1B2A50' }}>
                        <Download size={11} /> PDF
                      </a>
                    : <span style={{ fontSize: 11, color: '#D1D5DB' }}>—</span>}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/ld-portal/programs/${r.id}/participants`)}
                      className="font-bold hover:underline flex items-center gap-1 print:hidden" style={{ fontSize: 11, color: '#2563EB' }}>
                      <Users size={11} /> Participants
                    </button>
                    <button onClick={() => handleViewReport(r.id)}
                      className="font-bold hover:underline flex items-center gap-1 print:hidden" style={{ fontSize: 11, color: '#DE4E2A' }}>
                      <Eye size={11} /> View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
        documentTitle="Training Records Archive"
      />
    </div>
  );
};

export default LDPortalReports;
