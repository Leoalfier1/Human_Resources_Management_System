import React, { useEffect, useState } from 'react';
import { Users, CalendarCheck, Plane, FileText, Activity } from 'lucide-react';
import { API_BASE } from '../../utils/api';

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

const HRDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/personnel/reports/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setSummary(await res.json());
      } catch {} finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  const teachCount = summary?.by_employment_type?.find(t => t.employment_type === 'teaching')?.count || 0;
  const nonTeachCount = summary?.by_employment_type?.find(t => t.employment_type === 'non-teaching')?.count || 0;
  const teachRelCount = summary?.by_employment_type?.find(t => t.employment_type === 'teaching_related')?.count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Dashboard</h2>
        <p className="text-xs font-bold text-slate-400">Personnel module overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Employees" value={summary?.total_employees} sub={`${teachCount} Teaching · ${nonTeachCount} Non-Tch · ${teachRelCount} Tch-Related`} color="bg-blue-600" />
        <StatCard icon={CalendarCheck} label="Pending Leaves" value={summary?.pending_leave} color="bg-amber-600" />
        <StatCard icon={Plane} label="Pending Travel" value={summary?.pending_travel} color="bg-purple-600" />
        <StatCard icon={FileText} label="Pending Documents" value={summary?.pending_documents} color="bg-emerald-600" />
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
        <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic flex items-center gap-2 mb-6">
          <Activity size={20} /> Recent Activity
        </h3>
        <p className="text-sm font-bold text-slate-400 text-center py-8">View the Audit Log for detailed activity tracking</p>
      </div>
    </div>
  );
};

export default HRDashboard;
