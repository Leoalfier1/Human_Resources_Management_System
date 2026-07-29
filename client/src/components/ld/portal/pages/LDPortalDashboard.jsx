import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, Users, TrendingUp, Eye, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE } from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';

/* ─── shared badge ─── */
const Badge = ({ status }) => {
  const map = {
    Pending:   'bg-[#FEF3C7] text-[#B45309]',
    Draft:     'bg-[#F3F4F6] text-[#6B7280]',
    Approved:  'bg-[#DCFCE7] text-[#16A34A]',
    Completed: 'bg-[#DCFCE7] text-[#16A34A]',
    Active:    'bg-[#DBEAFE] text-[#2563EB]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold ${map[status] || 'bg-gray-100 text-gray-600'}`}
      style={{ fontSize: 10 }}>
      {status}
    </span>
  );
};

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: '#16A34A' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const tagStyle = {
  'Teaching':     'bg-[#DBEAFE] text-[#2563EB]',
  'Non-teaching': 'bg-[#F3F4F6] text-[#6B7280]',
  'Tchg-related': 'bg-purple-100 text-purple-700',
};

const TH = ({ children }) => (
  <th className="text-left py-2.5 pr-4 uppercase font-black" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.12em' }}>
    {children}
  </th>
);

const LDPortalDashboard = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      pendingApprovals: 0,
      upcomingPrograms: 0,
      enrolledParticipants: 0,
      meCompletionRate: '0%',
      newProposals: 0,
    },
    pendingRows: [],
    upcomingPrograms: [],
  });
  const socketRef = useRef(null);

  const fetchDashboardData = () => {
    setLoading(true);
    apiFetch('/api/ld/programs/dashboard-stats')
      .then(r => r.json())
      .then(d => {
        if (d && d.stats) {
          setData(d);
        }
      })
      .catch(err => console.error('Dashboard stats fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join-admin-room', 'ld-admin'));
    socket.on('ld:dashboard:update', () => fetchDashboardData());
    socket.on('ld:proposal:new', () => fetchDashboardData());
    return () => socket.disconnect();
  }, [isAuthenticated]);

  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = data.stats || {};
  const pendingRows = data.pendingRows || [];
  const upcomingPrograms = data.upcomingPrograms || [];

  const statCards = [
    {
      icon: Clock,
      value: stats.pendingApprovals,
      label: 'Pending Approvals',
      sub: `${stats.pendingApprovals} awaiting review`,
      color: '#DE4E2A',
      bg: '#fff5f2',
      onClick: () => navigate('/ld-portal/pd-program-design', { state: { tab: 'proposals' } }),
    },
    { icon: Calendar, value: stats.upcomingPrograms, label: 'Upcoming PD Programs', sub: upcomingPrograms.length > 0 ? `Next: ${upcomingPrograms[0].date}` : 'None scheduled', color: '#2563EB', bg: '#DBEAFE' },
    { icon: Users,    value: stats.enrolledParticipants, label: 'Enrolled Participants', sub: 'Across active programs', color: '#16A34A', bg: '#DCFCE7' },
    { icon: TrendingUp, value: stats.meCompletionRate, label: 'M&E Completion Rate', sub: 'Completed evaluations', color: '#7c3aed', bg: '#f5f3ff' },
    {
      icon: Inbox,
      value: stats.newProposals,
      label: 'New Proposals',
      sub: stats.newProposals === 0 ? 'No pending proposals' : `${stats.newProposals} awaiting review`,
      color: '#DE4E2A',
      bg: '#FFF7ED',
      onClick: () => navigate('/ld-portal/pd-program-design', { state: { tab: 'proposals' } }),
    },
  ];

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {statCards.map(({ icon: Icon, value, label, sub, color, bg, onClick }) => (
          <div key={label}
            className={`rounded-2xl p-5 border border-slate-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            onClick={onClick}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div className="flex items-start gap-1">
              {loading ? (
                <div className="h-7 w-12 bg-slate-200 animate-pulse rounded" />
              ) : (
                <p className="font-black leading-none" style={{ fontSize: 28, color }}>{value}</p>
              )}
              {label === 'New Proposals' && stats.newProposals > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-black mt-1"
                  style={{ background: '#DE4E2A', fontSize: 8 }}>{stats.newProposals > 9 ? '9+' : stats.newProposals}</span>
              )}
            </div>
            <p className="font-bold mt-1" style={{ fontSize: 12, color: '#1B2A50' }}>{label}</p>
            <p className="mt-0.5" style={{ fontSize: 10, color: '#6B7280' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Two-column section ──────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 320px' }}>

        {/* Pending Approvals table */}
        <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Pending Approvals</p>
            <button onClick={() => navigate('/ld-portal/pd-program-design', { state: { tab: 'proposals' } })}
              className="font-bold hover:underline" style={{ fontSize: 11, color: '#DE4E2A' }}>
              View All Proposals →
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                {['Program', 'Submitted By', 'Stage', 'Status', 'Action'].map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td colSpan={5} className="py-3">
                      <div className="h-4 bg-slate-100 animate-pulse rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : pendingRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center" style={{ fontSize: 11, color: '#9CA3AF' }}>
                    No pending approvals
                  </td>
                </tr>
              ) : (
                pendingRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td className="py-3 pr-4 font-semibold" style={{ fontSize: 11, color: '#1B2A50' }}>{r.program}</td>
                    <td className="py-3 pr-4" style={{ fontSize: 11, color: '#6B7280' }}>{r.by}</td>
                    <td className="py-3 pr-4" style={{ fontSize: 11, color: '#6B7280' }}>{r.stage}</td>
                    <td className="py-3 pr-4"><Badge status={r.status} /></td>
                    <td onClick={() => navigate('/ld-portal/quality-assurance', { state: { programId: r.id } })}
                      className="py-3 font-bold cursor-pointer hover:underline" style={{ fontSize: 11, color: '#DE4E2A' }}>
                      <span className="flex items-center gap-1"><Eye size={12} /> Review</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Upcoming PD Programs */}
        <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Upcoming PD Programs</p>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" />
                    <div className="h-2 bg-slate-100 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : upcomingPrograms.length === 0 ? (
              <p className="text-center py-6" style={{ fontSize: 11, color: '#9CA3AF' }}>No upcoming programs</p>
            ) : (
              upcomingPrograms.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#1B2A50' }}>
                    <Calendar size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold leading-tight" style={{ fontSize: 11, color: '#1B2A50' }}>{p.title}</p>
                    <p className="mt-0.5" style={{ fontSize: 10, color: '#6B7280' }}>{p.date} • {p.pax} pax</p>
                    <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full font-bold ${tagStyle[p.tag] || tagStyle['Teaching']}`} style={{ fontSize: 9 }}>{p.tag}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDPortalDashboard;
