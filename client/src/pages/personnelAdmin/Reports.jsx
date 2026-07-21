import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { API_BASE, downloadFile } from '../../utils/api';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [summary, setSummary] = useState(null);
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'summary') {
        const res = await fetch(`${API_BASE}/api/personnel/reports/summary`, { headers });
        if (res.ok) setSummary(await res.json());
      } else if (activeTab === 'movement') {
        const res = await fetch(`${API_BASE}/api/personnel/reports/employee-movement`, { headers });
        if (res.ok) setMovement(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const exportLeaveReport = async () => {
    await downloadFile('/api/personnel/leave/report?format=csv', 'leave_report.csv');
  };

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'movement', label: 'Employee Movement' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Reports & Analytics</h2>
          <p className="text-xs font-bold text-slate-400">Personnel data insights and exports</p>
        </div>
        <button onClick={exportLeaveReport} className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-[#162E55] flex items-center gap-2">
          <Download size={16} /> Export Leave Report
        </button>
      </div>

      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-[10px] font-black uppercase px-6 py-3 rounded-xl transition-all ${activeTab === tab.key ? 'bg-[#1B3A6B] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
        </div>
      ) : activeTab === 'summary' && summary ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <p className="text-4xl font-black text-[#1B3A6B]">{summary.total_employees || 0}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Total Employees</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <p className="text-4xl font-black text-blue-600">{summary.by_employment_type?.find(t => t.employment_type === 'teaching')?.count || 0}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Teaching</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <p className="text-4xl font-black text-purple-600">{summary.by_employment_type?.find(t => t.employment_type === 'non_teaching')?.count || 0}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Non-Teaching</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <p className="text-4xl font-black text-violet-600">{summary.by_employment_type?.find(t => t.employment_type === 'teaching_related')?.count || 0}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Tch-Related</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <p className="text-4xl font-black text-amber-600">{summary.pending_leave || 0}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Pending Leaves</p>
            </div>
          </div>

          {summary.by_employment_status?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">By Employment Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {summary.by_employment_status.map(s => (
                  <div key={s.employment_status} className="text-center bg-slate-50 rounded-xl p-4">
                    <p className="text-2xl font-black text-slate-800">{s.count}</p>
                    <p className="text-[10px] font-black text-slate-400 capitalize mt-1">{s.employment_status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'movement' && movement ? (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">Recent Hires (Last 90 Days)</h3>
            {movement.recent_hires?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Position</th>
                      <th className="pb-3 pr-4">School</th>
                      <th className="pb-3 pr-4">Date Hired</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movement.recent_hires.map(h => (
                      <tr key={h.id} className="border-b border-slate-50 text-sm">
                        <td className="py-3 pr-4 font-bold text-slate-700">{h.last_name}, {h.first_name}</td>
                        <td className="py-3 pr-4 text-slate-600">{h.position_title || '—'}</td>
                        <td className="py-3 pr-4 text-slate-600">{h.assigned_school || '—'}</td>
                        <td className="py-3 pr-4 text-slate-600">{h.date_hired ? new Date(h.date_hired).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-400 text-center py-6">No recent hires</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm font-bold text-slate-400">Select a report type</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
