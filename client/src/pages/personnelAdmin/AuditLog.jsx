import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: 50, offset: page * 50 });
      if (actionFilter) params.append('action_type', actionFilter);
      const res = await fetch(`${API_BASE}/api/personnel/reports/audit-log?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  usePersonnelRealtime(['personnel:update'], () => {
    fetchLogs(true);
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Audit Log</h2>
        <p className="text-xs font-bold text-slate-400">Personnel activity tracking trail</p>
      </div>

      <div className="flex gap-4">
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(0); }}
          className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
        >
          <option value="">All Actions</option>
          <option value="employee_created">Employee Created</option>
          <option value="employee_updated">Employee Updated</option>
          <option value="employee_archived">Employee Archived</option>
          <option value="employee_restored">Employee Restored</option>
          <option value="leave_submitted">Leave Submitted</option>
          <option value="leave_approved">Leave Approved</option>
          <option value="leave_rejected">Leave Rejected</option>
          <option value="travel_approved">Travel Approved</option>
          <option value="travel_rejected">Travel Rejected</option>
        </select>
        <p className="text-xs font-bold text-slate-400 self-center">{total} total entries</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <ScrollText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-400">No activity logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map(log => (
              <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full uppercase mb-2">
                      {log.action_type.replace(/_/g, ' ')}
                    </span>
                    <p className="text-sm font-bold text-slate-700">{log.description}</p>
                    {log.actor_name && (
                      <p className="text-[10px] font-bold text-slate-400 mt-1">By: {log.actor_name}</p>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">Page {page + 1}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-[10px] font-black text-[#1B3A6B] uppercase px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 50 >= total} className="text-[10px] font-black text-[#1B3A6B] uppercase px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
