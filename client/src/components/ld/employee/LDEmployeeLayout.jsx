import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  User, ClipboardCheck, BookOpen, FileText,
  Monitor, CalendarCheck, Award, Bell, Sun,
  ArrowLeft, X, Lightbulb,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE } from '../../../utils/api';

const navItems = [
  { path: '/ld-employee/self-assessment',  label: 'Self-Assessment / TNA',  icon: ClipboardCheck },
  { path: '/ld-employee/propose-program',  label: 'Propose a Program',      icon: Lightbulb      },
  { path: '/ld-employee/browse-programs',  label: 'Browse PD Programs',     icon: BookOpen       },
  { path: '/ld-employee/program-detail',   label: 'Program Detail & Apply', icon: FileText       },
  { path: '/ld-employee/training-session', label: 'Training Session',       icon: Monitor        },
  { path: '/ld-employee/attendance',       label: 'Attendance',             icon: CalendarCheck  },
  { path: '/ld-employee/my-records',       label: 'My Records',             icon: Award          },
];

const pageMeta = {
  '/ld-employee/profile':          { title: 'My Profile',             subtitle: 'Personal information and personnel type setup' },
  '/ld-employee/self-assessment':  { title: 'Self-Assessment / TNA',  subtitle: 'e-SAT, IPCRF, and Individual Development Plan Input' },
  '/ld-employee/propose-program':  { title: 'Propose a Program',      subtitle: 'Share a training idea — your proposal goes directly to the L\u0026D Admin for review' },
  '/ld-employee/browse-programs':  { title: 'Browse PD Programs',     subtitle: 'Programs curated for your personnel type and development needs' },
  '/ld-employee/program-detail':   { title: 'Program Detail & Apply', subtitle: 'PPST-Based Coaching & Mentoring Program' },
  '/ld-employee/training-session': { title: 'Training Session',       subtitle: 'PPST-Based Coaching & Mentoring Program — Day 1' },
  '/ld-employee/attendance':       { title: 'Attendance',             subtitle: 'Upload your proof of attendance for enrolled PD programs' },
  '/ld-employee/my-records':       { title: 'My Records',             subtitle: 'Training history, certificates, and evaluation surveys' },
};

const LDEmployeeLayout = () => {
  const { isAuthenticated, isApplicant, user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [toast, setToast] = useState(null);
  const socketRef = useRef(null);
  const notifIdRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !isApplicant || !user?.id) return;
    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-user-room', `ld-user-${user.id}`);
    });

    const handleApplicantNotif = (data) => {
      notifIdRef.current += 1;
      setNotifications(prev => [{ id: notifIdRef.current, ...data, time: new Date() }, ...prev].slice(0, 20));
    };

    const handleDashboardUpdate = () => {
      notifIdRef.current += 1;
      setNotifications(prev => [{ id: notifIdRef.current, message: 'L&D data has been updated.', type: 'info', time: new Date() }, ...prev].slice(0, 20));
    };

    const handleProposalUpdate = (data) => {
      notifIdRef.current += 1;
      const msg = data.message || `Your proposal status changed to: ${data.status}`;
      setNotifications(prev => [{ id: notifIdRef.current, message: msg, type: 'proposal', link: '/ld-employee/propose-program', time: new Date() }, ...prev].slice(0, 20));
      setToast(msg);
    };

    socket.on('ld:notification:applicant', handleApplicantNotif);
    socket.on('ld:dashboard:update', handleDashboardUpdate);
    socket.on('ld:proposal:updated', handleProposalUpdate);

    return () => {
      socket.off('ld:notification:applicant', handleApplicantNotif);
      socket.off('ld:dashboard:update', handleDashboardUpdate);
      socket.off('ld:proposal:updated', handleProposalUpdate);
      socket.disconnect();
    };
  }, [isAuthenticated, isApplicant, user?.id]);

  const unreadCount = notifications.length;

  if (!isAuthenticated || !isApplicant) return <Navigate to="/" replace />;

  const isActive = (path) => {
    if (location.pathname === path || location.pathname.startsWith(path + '/')) return true;
    if (path === '/ld-employee/program-detail' && location.pathname.startsWith('/ld-employee/programs/')) return true;
    return false;
  };
  const meta = pageMeta[location.pathname] || { title: 'L&D Employee Portal', subtitle: '' };

  return (
    <div className="flex bg-[#F4F6FA] min-h-screen">

      {/* ── Toast snackbar ────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm px-5 py-3 rounded-xl shadow-xl text-white font-bold text-sm flex items-center gap-2 animate-pulse-once"
          style={{ background: '#1B2A50', border: '2px solid #DE4E2A' }}>
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-xs">✕</button>
        </div>
      )}

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside style={{ width: 200, background: '#1B2A50' }}
        className="text-white flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden z-50">

        {/* Back to Dashboard — top of sidebar */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => navigate('/pillars')}
            className="w-full flex items-center gap-1.5 transition-colors hover:text-white"
            style={{ fontSize: 9, color: '#6B7280' }}
          >
            <ArrowLeft size={12} />
            <span className="font-semibold">Back to Main Dashboard</span>
          </button>
        </div>

        {/* Logo */}
        <div className="px-4 pt-2 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <img src="/deped-logo.png" alt="DepEd Logo" className="w-10 h-10 object-contain shrink-0 drop-shadow" />
            <div>
              <p className="font-black uppercase tracking-tight leading-none text-white" style={{ fontSize: 13 }}>DEPED</p>
              <p className="leading-tight mt-0.5" style={{ fontSize: 8, color: '#6B7280' }}>Dapitan City SDO</p>
            </div>
          </div>
          {/* EMPLOYEE PORTAL pill — muted blue-gray */}
          <div className="w-full text-white font-black uppercase text-center py-1.5 rounded-full"
            style={{ background: '#2d4a6b', fontSize: 9, letterSpacing: '0.14em', border: '1px solid rgba(255,255,255,0.12)' }}>
            EMPLOYEE PORTAL
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-2.5">
          <p className="px-2 mb-2 font-bold uppercase" style={{ fontSize: 7, color: '#6B7280', letterSpacing: '0.22em' }}>
            L&amp;D MODULE
          </p>
          <div className="space-y-0.5">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = isActive(path);
              return (
                <button key={path} onClick={() => navigate(path)}
                  className="w-full flex items-center gap-2.5 rounded-xl transition-all text-left"
                  style={{ padding: '9px 10px', background: active ? '#DE4E2A' : 'transparent', color: active ? '#fff' : '#6B7280' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; } }}>
                  <Icon size={14} className="shrink-0" />
                  <span className="font-semibold leading-tight" style={{ fontSize: 10.5 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top bar */}
        <header className="shrink-0 bg-white flex items-center justify-between px-6"
          style={{ height: 68, borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 className="font-black leading-tight" style={{ fontSize: 17, color: '#1B2A50' }}>{meta.title}</h1>
            <p className="font-medium mt-0.5 uppercase" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.2em' }}>{meta.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Bell with dynamic notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifPanel(p => !p)}
                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                <Bell size={16} />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-[15px] h-[15px] rounded-full flex items-center justify-center text-white font-black"
                  style={{ background: '#DE4E2A', fontSize: 8 }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
              {showNotifPanel && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-50 overflow-hidden"
                  style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.1em' }}>Notifications</p>
                    <button onClick={() => { setNotifications([]); setShowNotifPanel(false); }}
                      className="hover:opacity-70"><X size={14} style={{ color: '#6B7280' }} /></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6" style={{ fontSize: 11, color: '#9CA3AF' }}>No notifications yet</p>
                    ) : notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors"
                        style={{ borderBottom: '1px solid #F9FAFB' }}>
                        <p style={{ fontSize: 11, color: '#374151' }}>{n.message}</p>
                        <p style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>
                          {n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/ld-employee/profile')}
              title="View My Profile"
              className={`flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-xl transition-all border cursor-pointer group ${
                location.pathname === '/ld-employee/profile'
                  ? 'bg-slate-100 border-slate-300 shadow-sm'
                  : 'bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200 active:scale-95'
              }`}
              style={{ borderLeft: '1px solid #E5E7EB' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black shrink-0 transition-transform group-hover:scale-105"
                style={{ background: '#DE4E2A', fontSize: 11 }}>
                {(user?.full_name || 'E').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-bold leading-none text-slate-700 group-hover:text-[#1B2A50] transition-colors" style={{ fontSize: 11 }}>
                  {user?.full_name || 'Employee'}
                </p>
                <p className="leading-none mt-1 text-slate-400 group-hover:text-slate-600 transition-colors" style={{ fontSize: 9 }}>
                  {user?.applicant_type === 'teaching' ? 'Teaching' : user?.applicant_type === 'non_teaching' ? 'Non-Teaching' : 'Employee'}
                </p>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LDEmployeeLayout;
