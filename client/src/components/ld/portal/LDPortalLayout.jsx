import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, BookOpen, ShieldCheck,
  Monitor, UserCheck, BarChart3, Bell, Sun, ArrowLeft, X,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE } from '../../../utils/api';

const navItems = [
  { path: '/ld-portal/dashboard',          label: 'Dashboard',                icon: LayoutDashboard },
  { path: '/ld-portal/needs-analysis',     label: 'Needs Analysis & HRD Plan',icon: ClipboardList   },
  { path: '/ld-portal/pd-program-design',  label: 'PD Program Design',        icon: BookOpen        },
  { path: '/ld-portal/quality-assurance',  label: 'Quality Assurance',        icon: ShieldCheck     },
  { path: '/ld-portal/conduct-monitor',    label: 'Conduct & Monitor',        icon: Monitor         },
  { path: '/ld-portal/attendance-monitor', label: 'Attendance Monitor',       icon: UserCheck       },
  { path: '/ld-portal/reports',            label: 'Reports & HRD Database',   icon: BarChart3       },
];

const pageMeta = {
  '/ld-portal/dashboard':          { title: 'Learning & Development Dashboard',     subtitle: 'School Year 2025–2026 • Q3 Overview' },
  '/ld-portal/needs-analysis':     { title: 'Needs Analysis & HRD Plan',            subtitle: 'Annual Training Needs Assessment and Human Resource Development Planning' },
  '/ld-portal/pd-program-design':  { title: 'PD Program Design',                    subtitle: 'Build and package your Professional Development program' },
  '/ld-portal/quality-assurance':  { title: 'Quality Assurance & Approval',         subtitle: 'NEAP Standards Review and Approval Workflow' },
  '/ld-portal/conduct-monitor':    { title: 'Conduct & Monitor',                    subtitle: 'Registration, Attendance Tracking, and Live M&E' },
  '/ld-portal/attendance-monitor': { title: 'Attendance Monitor',                   subtitle: 'Track and monitor employee attendance per PD program' },
  '/ld-portal/reports':            { title: 'Reports & HRD Database',               subtitle: 'Completion Reports, Participant Profiles, and Training Records Archive' },
};

const LDPortalLayout = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [toast, setToast] = useState(null);
  const socketRef = useRef(null);
  const notifIdRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-ld-room', 'ld-admin');
    });

    const handleLdNotif = (data) => {
      notifIdRef.current += 1;
      setNotifications(prev => [{ id: notifIdRef.current, ...data, time: new Date() }, ...prev].slice(0, 20));
    };

    const handleAdminNotif = (data) => {
      if (data.type === 'ld' || data.type === 'ld_applicant') {
        notifIdRef.current += 1;
        setNotifications(prev => [{ id: notifIdRef.current, ...data, time: new Date() }, ...prev].slice(0, 20));
      }
    };

    const handleProposalNew = (data) => {
      notifIdRef.current += 1;
      const msg = data.message || `New proposal: "${data.title}" from ${data.proposedBy}`;
      setNotifications(prev => [{ id: notifIdRef.current, message: msg, type: 'proposal_new', link: '/ld-portal/pd-program-design', time: new Date() }, ...prev].slice(0, 20));
      setToast(msg);
    };

    socket.on('ld:notification:admin', handleLdNotif);
    socket.on('notification:admin', handleAdminNotif);
    socket.on('ld:proposal:new', handleProposalNew);

    return () => {
      socket.off('ld:notification:admin', handleLdNotif);
      socket.off('notification:admin', handleAdminNotif);
      socket.off('ld:proposal:new', handleProposalNew);
      socket.disconnect();
    };
  }, [isAuthenticated, isAdmin]);

  const unreadCount = notifications.length;

  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;

  const isActive = (path) => {
    if (location.pathname === path || location.pathname.startsWith(path + '/')) return true;
    if (path === '/ld-portal/conduct-monitor' && location.pathname.includes('/participants')) return true;
    if (path === '/ld-portal/attendance-monitor' && location.pathname.includes('/attendance-monitor')) return true;
    return false;
  };
  const meta = pageMeta[location.pathname] ||
    (location.pathname.includes('/participants') ? { title: 'Program Participants', subtitle: 'Enrollment, attendance, and completion overview' } : { title: 'L&D Module', subtitle: '' });

  return (
    <div className="flex bg-[#F4F6FA] min-h-screen">

      {/* ── Toast snackbar (proposals & live events) ─────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm px-5 py-3 rounded-xl shadow-xl text-white font-bold text-sm flex items-center gap-2"
          style={{ background: '#1B2A50', border: '2px solid #DE4E2A' }}>
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-xs">✕</button>
        </div>
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        style={{ width: 200, background: '#1B2A50' }}
        className="text-white flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden z-50"
      >
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

        {/* Logo block */}
        <div className="px-4 pt-2 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <img src="/deped-logo.png" alt="DepEd Logo" className="w-10 h-10 object-contain shrink-0 drop-shadow" />
            <div>
              <p className="font-black uppercase tracking-tight leading-none text-white" style={{ fontSize: 13 }}>DEPED</p>
              <p className="leading-tight mt-0.5" style={{ fontSize: 8, color: '#6B7280' }}>Dapitan City SDO</p>
            </div>
          </div>
          {/* ADMIN PORTAL pill */}
          <div className="w-full text-white font-black uppercase text-center py-1.5 rounded-full"
            style={{ background: '#DE4E2A', fontSize: 9, letterSpacing: '0.14em' }}>
            ADMIN PORTAL
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-4 px-2.5">
          <p className="px-2 mb-2 font-bold uppercase"             style={{ fontSize: 7, color: '#6B7280', letterSpacing: '0.22em' }}>
            L&amp;D MODULE
          </p>
          <div className="space-y-0.5">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = isActive(path);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-2.5 rounded-xl transition-all text-left"
                  style={{
                    padding: '9px 10px',
                    background: active ? '#DE4E2A' : 'transparent',
                    color: active ? '#fff' : '#6B7280',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="font-semibold leading-tight" style={{ fontSize: 10.5 }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
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
            {/* User chip */}
            <div className="flex items-center gap-2 pl-3" style={{ borderLeft: '1px solid #E5E7EB' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black"
                style={{ background: '#1B2A50', fontSize: 11 }}>
                {(user?.full_name || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold leading-none" style={{ fontSize: 11, color: '#374151' }}>{user?.full_name || 'Admin'}</p>
                <p className="leading-none mt-0.5" style={{ fontSize: 9, color: '#6B7280' }}>{user?.role ? user.role.replace('_', ' ').toUpperCase() : 'ADMIN'}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LDPortalLayout;
