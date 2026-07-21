import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, CheckCircle, XCircle, ClipboardCheck } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const CHECKLIST_TYPES = [
  'Transcript of Records',
  'Marriage Contract',
  'Marriage Certificate',
  'CSC Form 211',
  'SALN',
  'NBI Clearance',
  'Police Clearance',
  'BIR Form 1902/2305',
  'DBP ATM Application',
  'PhilHealth No. (PEN)',
  'Pag-IBIG MID No.',
];

const CHECKLIST_LABELS = [
  'Transcript of Records / S.O.',
  'Marriage Contract',
  'CSC Form 211',
  'SALN',
  'NBI Clearance',
  'Police Clearance',
  'BIR Form 1902/2305',
  'DBP ATM Application',
  'PhilHealth No. (PEN)',
  'Pag-IBIG MID No.',
];

const isChecklistType = (docType) => {
  const lower = (docType || '').toLowerCase();
  return CHECKLIST_TYPES.some(ct => ct.toLowerCase() === lower);
};

const getChecklistIndex = (docType) => {
  const lower = (docType || '').toLowerCase();
  return CHECKLIST_TYPES.findIndex(ct => ct.toLowerCase() === lower);
};

const FileChecklistAdmin = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/documents/201-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSummary(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePersonnelRealtime(['personnel:update', 'personnel:document:update'], () => {
    fetchData(true);
  });

  const filtered = summary.filter(emp =>
    emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    (emp.employee_no || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">201 File Checklist</h2>
          <p className="text-xs font-bold text-slate-400">OSDS-ADMS-RSP-13 compliance across all employees</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardCheck size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-400">No employees found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Employee No.</th>
                  <th className="px-6 py-4 text-center">Completed</th>
                  <th className="px-6 py-4 text-center">Progress</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => {
                  const pct = Math.round((emp.completed_count / 10) * 100);
                  return (
                    <tr key={emp.employee_id} className="border-b border-slate-50 text-sm hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{emp.employee_name}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-semibold">{emp.employee_no || '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-black ${
                          emp.completed_count === 10 ? 'text-green-600' :
                          emp.completed_count >= 7 ? 'text-[#1B3A6B]' :
                          'text-amber-600'
                        }`}>
                          {emp.completed_count}<span className="text-xs text-slate-400">/10</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct === 100 ? 'bg-green-500' : pct >= 70 ? 'bg-[#1B3A6B]' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/personnel-admin/employees/${emp.employee_id}`)}
                          className="inline-flex items-center gap-1.5 bg-[#1B3A6B] text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl hover:bg-[#162E55] transition-colors"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileChecklistAdmin;
