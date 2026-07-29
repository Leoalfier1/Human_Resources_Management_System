import React, { useMemo, useState } from 'react';
import { Search, Filter, Paperclip, UserCheck, TrendingUp, Clock3, CircleCheckBig, AlertCircle, Download, Printer } from 'lucide-react';

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: '#16A34A' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const attendanceRows = [
  { id: 1, employeeNo: 'EMP-1042', name: 'Maria Santos', personnelType: 'Teaching', program: 'PPST Coaching', date: '2026-07-08', status: 'present', fileSubmitted: true },
  { id: 2, employeeNo: 'EMP-2215', name: 'Jhon Delos Reyes', personnelType: 'Non-Teaching', program: 'Leadership Seminar', date: '2026-07-09', status: 'excused', fileSubmitted: false },
  { id: 3, employeeNo: 'EMP-1180', name: 'Ariel Dela Cruz', personnelType: 'Teaching-related', program: 'Data Privacy Orientation', date: '2026-07-10', status: 'absent', fileSubmitted: false },
  { id: 4, employeeNo: 'EMP-3061', name: 'Liza Mercado', personnelType: 'Teaching', program: 'PPST Coaching', date: '2026-07-08', status: 'present', fileSubmitted: true },
];

const programSummary = [
  { title: 'PPST Coaching', rate: 90, color: 'bg-[#1B3A6B]' },
  { title: 'Leadership Seminar', rate: 68, color: 'bg-[#D6402F]' },
  { title: 'Data Privacy Orientation', rate: 82, color: 'bg-amber-500' },
];

const statusStyles = {
  present: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  excused: 'bg-amber-50 text-amber-700 border border-amber-100',
  absent: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const AttendanceMonitor = () => {
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filteredRows = useMemo(() => attendanceRows.filter(row => {
    const text = `${row.name} ${row.program} ${row.employeeNo}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }), [query]);

  const handleExportReport = () => {
    const rows = [['Employee No.', 'Name', 'Personnel Type', 'Program', 'Date', 'Status', 'File Submitted']];
    filteredRows.forEach(r => rows.push([r.employeeNo, r.name, r.personnelType, r.program, r.date, r.status, r.fileSubmitted ? 'Yes' : 'No']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'attendance-report.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Attendance report exported successfully');
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Attendance Monitor</p>
            <h2 className="mt-2 text-xl font-black text-[#1B3A6B]">Track participation and proof of attendance</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">A concise view of attendance records, submission status, and completion rate by program.</p>
          </div>
          <button onClick={handleExportReport}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#D6402F] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#b83525]">
            <Download size={16} /> Export Report
          </button>
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-[#1B3A6B] p-5 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200">Enrolled</p>
              <p className="mt-2 text-3xl font-black">246</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-2.5"><UserCheck size={18} /></div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Present</p>
              <p className="mt-2 text-3xl font-black text-[#1B3A6B]">198</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-600"><CircleCheckBig size={18} /></div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Attendance Rate</p>
              <p className="mt-2 text-3xl font-black text-[#D6402F]">80%</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-2.5 text-amber-600"><TrendingUp size={18} /></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">All Programs</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Clock3 size={14} className="text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">All Dates</span>
            </div>
            <div className="relative ml-auto flex-1 sm:max-w-xs">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employee" className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm font-semibold text-slate-600 outline-none" />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-[#1B3A6B] text-white">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em]">Employee</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em]">Program</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em]">Date</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em]">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em]">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-700">{row.name}</div>
                      <div className="text-xs text-slate-400">{row.employeeNo} · {row.personnelType}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.program}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{row.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusStyles[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.fileSubmitted ? (
                        <button className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                          <Paperclip size={12} /> Submitted
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          <AlertCircle size={12} /> None
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Attendance by Program</p>
              <h3 className="mt-1 text-lg font-black text-[#1B3A6B]">Completion overview</h3>
            </div>
            <div className="rounded-2xl bg-slate-50 p-2 text-slate-500"><TrendingUp size={16} /></div>
          </div>

          <div className="mt-5 space-y-4">
            {programSummary.map(item => (
              <div key={item.title}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">{item.title}</span>
                  <span className="font-black text-slate-500">{item.rate}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className={`h-2.5 rounded-full ${item.color}`} style={{ width: `${item.rate}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Watchlist</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#D6402F]">
              <AlertCircle size={16} /> Leadership Seminar is below the 75% target.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMonitor;
