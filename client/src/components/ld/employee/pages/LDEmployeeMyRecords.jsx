import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Clock, Star, Download, Printer } from 'lucide-react';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE, SERVER_BASE } from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';

const statusBadge = (s) => ({
  Completed: { bg: '#DCFCE7', color: '#16A34A' },
  Enrolled:  { bg: '#DBEAFE', color: '#2563EB' },
}[s] || { bg: '#F9FAFB', color: '#6B7280' });

const typeBadge = (t) => ({
  'Face-to-Face': { bg: '#DBEAFE', color: '#2563EB' },
  Blended:        { bg: '#f5f3ff', color: '#7c3aed' },
  Online:         { bg: '#FEF3C7', color: '#92400E' },
}[t] || { bg: '#F9FAFB', color: '#6B7280' });

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

const LDEmployeeMyRecords = () => {
  const [data, setData] = useState({
    kpi: { trainingsCompleted: 0, totalHours: 0, avgIpcrf: 3.8 },
    history: [],
    latestCertificate: null,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/ld/reports/my-records');
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
      }
    } catch (e) {
      console.error('Fetch my-records error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socket.on('connect', () => { if (user?.id) socket.emit('join-user-room', `ld-user-${user.id}`); });
    socket.on('ld:dashboard:update', () => fetchRecords());
    socket.on('ld:proposal:updated', () => fetchRecords());
    return () => socket.disconnect();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const interval = setInterval(fetchRecords, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExportAll = () => {
    if (!data.history || data.history.length === 0) {
      showToast('No records to export');
      return;
    }
    const rows = [['Program Title', 'Date', 'Hours', 'Type', 'Status']];
    data.history.forEach(r => rows.push([r.title, r.date, r.hours, r.type, r.status]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'my-training-records.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Training records exported successfully');
  };

  const latestCert = data.latestCertificate;

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: GraduationCap, value: data.kpi.trainingsCompleted, label: 'Trainings Completed', color: '#1B2A50', bg: '#DBEAFE' },
          { icon: Clock, value: `${data.kpi.totalHours} hrs`, label: 'Total Training Hours', color: '#7c3aed', bg: '#f5f3ff' },
          { icon: Star, value: data.kpi.avgIpcrf, label: 'Average IPCRF Rating', color: '#d97706', bg: '#FEF3C7' },
        ].map(({ icon: Icon, value, label, color, bg }) => (
          <div key={label} className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <p className="font-black leading-none" style={{ fontSize: 28, color }}>{value}</p>
            <p className="font-bold mt-1" style={{ fontSize: 12, color: '#1B2A50' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Two-column ───────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 290px' }}>

        {/* Training history table */}
        <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Training History</p>
            <div className="flex items-center gap-3">
              <button onClick={handleExportAll}
                className="flex items-center gap-1.5 font-bold hover:opacity-80 transition-opacity"
                style={{ fontSize: 11, color: '#1B2A50' }}>
                <Download size={13} /> Export All
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 font-bold hover:opacity-80 transition-opacity"
                style={{ fontSize: 11, color: '#6B7280' }}>
                <Printer size={13} /> Print
              </button>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr>
                {['Program Title', 'Date', 'Hrs', 'Pre-Test', 'Post-Test', 'Status', 'Certificate'].map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-6" style={{ fontSize: 11, color: '#6B7280' }}>Loading training records…</td></tr>
              ) : !data.history || data.history.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6" style={{ fontSize: 11, color: '#6B7280' }}>No training records yet</td></tr>
              ) : data.history.map((r, i) => {
                const st = statusBadge(r.status);
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ fontSize: 11, color: '#1B2A50', maxWidth: 180 }}>{r.title}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ fontSize: 10, color: '#6B7280' }}>{r.date}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ fontSize: 10, color: '#4B5563' }}>{r.hours}</td>
                    <td className="px-3 py-2.5">
                      {r.preTestScore !== null ? (
                        <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {r.preTestScore}%
                        </span>
                      ) : <span style={{ fontSize: 10, color: '#9CA3AF' }}>—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {r.postTestScore !== null ? (
                        <span className="font-bold text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {r.postTestScore}%
                        </span>
                      ) : <span style={{ fontSize: 10, color: '#9CA3AF' }}>—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold rounded-full px-1.5 py-0.5" style={{ background: st.bg, color: st.color, fontSize: 9 }}>{r.status}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {r.certificatePath
                        ? <a href={`${SERVER_BASE}/${r.certificatePath}`} target="_blank" rel="noreferrer"
                            className="font-bold hover:underline" style={{ fontSize: 11, color: '#1B2A50' }}>↓ PDF</a>
                        : <span style={{ fontSize: 11, color: '#D1D5DB' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="font-black uppercase mb-3" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Latest Certificate</p>

            <div className="rounded-xl p-5 text-center" style={{ background: '#1B2A50' }}>
              <p className="font-black uppercase tracking-widest mb-1" style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
                REPUBLIC OF THE PHILIPPINES
              </p>
              <p className="font-black uppercase tracking-widest mb-3" style={{ fontSize: 9, color: '#FFCF40' }}>
                DEPARTMENT OF EDUCATION
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)', padding: '10px 0', margin: '0 0 10px' }}>
                <p className="font-black uppercase" style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.2em' }}>
                  CERTIFICATE OF COMPLETION
                </p>
              </div>
              {latestCert ? (
                <>
                  <p className="font-bold leading-snug mb-2" style={{ fontSize: 10, color: '#fff' }}>
                    {latestCert.title}
                  </p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
                    {latestCert.issueDate}
                  </p>
                  <p className="font-black mt-2" style={{ fontSize: 11, color: '#FFCF40' }}>Participant</p>
                </>
              ) : (
                <p className="font-bold" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>No certificate yet</p>
              )}
            </div>

            {latestCert?.path ? (
              <a href={`${SERVER_BASE}/${latestCert.path}`} target="_blank" rel="noreferrer"
                className="block w-full text-center font-black uppercase py-2.5 rounded-xl mt-3 transition-colors hover:border-[#1B2A50] hover:text-[#1B2A50]"
                style={{ border: '2px solid #E5E7EB', fontSize: 11, letterSpacing: '0.1em', color: '#6B7280', textDecoration: 'none' }}>
                <Download size={13} className="inline mr-1.5" />
                DOWNLOAD CERTIFICATE
              </a>
            ) : (
              <button className="w-full font-black uppercase py-2.5 rounded-xl mt-3 transition-colors"
                disabled
                style={{ border: '2px solid #E5E7EB', fontSize: 11, letterSpacing: '0.1em', color: '#D1D5DB' }}>
                <Download size={13} className="inline mr-1.5" />
                DOWNLOAD CERTIFICATE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDEmployeeMyRecords;
