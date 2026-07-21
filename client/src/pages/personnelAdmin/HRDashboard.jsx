import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarCheck, FileText, ClipboardCheck, Activity, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color || 'bg-[#1B3A6B] bg-opacity-10'}`}>
        <Icon size={24} className={color ? 'text-white' : 'text-[#1B3A6B]'} />
      </div>
    </div>
    <p className="text-3xl font-black text-slate-800">{value ?? '—'}</p>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
    {sub && <p className="text-xs font-bold text-slate-500 mt-2">{sub}</p>}
  </div>
);

const ACTION_LABELS = {
  employee_created: 'Employee Created',
  employee_updated: 'Employee Updated',
  employee_archived: 'Employee Archived',
  employee_restored: 'Employee Restored',
  leave_submitted: 'Leave Submitted',
  leave_recommended: 'Leave Recommended',
  leave_approved_final: 'Leave Approved',
  leave_disapproved_recommendation: 'Leave Disapproved',
  leave_disapproved_final: 'Leave Rejected',
  document_submitted: 'Document Requested',
  document_processed: 'Document Processing',
  document_released: 'Document Released',
  document_rejected: 'Document Rejected',
  travel_approved: 'Travel Approved',
  travel_rejected: 'Travel Rejected',
};

const timeAgo = (dateString) => {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const HRDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/reports/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSummary(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  usePersonnelRealtime(['personnel:update'], () => {
    fetchDashboard(true);
  });

  // Refetch when browser tab regains focus
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') fetchDashboard(true);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [fetchDashboard]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  const teachCount = summary?.by_employment_type?.find(t => t.employment_type === 'teaching')?.count || 0;
  const nonTeachCount = summary?.by_employment_type?.find(t => t.employment_type === 'non_teaching')?.count || 0;
  const teachRelCount = summary?.by_employment_type?.find(t => t.employment_type === 'teaching_related')?.count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Dashboard</h2>
        <p className="text-xs font-bold text-slate-400">Personnel module overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Employees" value={summary?.total_employees} sub={`${teachCount} Teaching · ${nonTeachCount} Non-Tch · ${teachRelCount} Tch-Related`} color="bg-blue-600" />
        <StatCard icon={CalendarCheck} label="Pending Leaves" value={summary?.pending_leave} sub="Includes recommended for approval" color="bg-amber-600" />
        <StatCard icon={FileText} label="Pending Documents" value={summary?.pending_documents} color="bg-emerald-600" />
        <StatCard icon={ClipboardCheck} label="201 File Compliance" value={summary?.avg_201_compliance != null ? `${summary.avg_201_compliance}%` : '—'} sub="Average across all employees" color="bg-[#1B3A6B]" />
      </div>

      {summary?.by_employment_status && summary.by_employment_status.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">By Employment Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {summary.by_employment_status.map(s => (
              <div key={s.employment_status} className="text-center bg-slate-50 rounded-xl p-4">
                <p className="text-2xl font-black text-slate-800">{s.count}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.employment_status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic flex items-center gap-2">
            <Activity size={20} /> Recent Activity
          </h3>
          <Link
            to="/personnel-admin/audit-log"
            className="text-[10px] font-black text-[#1B3A6B] uppercase px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1"
          >
            View Full Audit Log <ChevronRight size={14} />
          </Link>
        </div>

        {!summary?.recent_activity || summary.recent_activity.length === 0 ? (
          <p className="text-sm font-bold text-slate-400 text-center py-8">No recent activity</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {summary.recent_activity.map(log => (
              <div key={log.id} className="py-4 flex items-start justify-between">
                <div>
                  <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full uppercase mb-1.5">
                    {ACTION_LABELS[log.action_type] || log.action_type.replace(/_/g, ' ')}
                  </span>
                  <p className="text-sm font-bold text-slate-700">{log.description}</p>
                  {log.actor_name && (
                    <p className="text-[10px] font-bold text-slate-400 mt-1">By: {log.actor_name}</p>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 shrink-0 ml-4">{timeAgo(log.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;
