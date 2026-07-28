import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, LogOut, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const RSPHeader = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return 'HR';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const fetchUnreadCount = useCallback(async (silent = false) => {
    try {
      const res = await apiFetch('/rsp/notifications/unread-count');
      if (res?.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/rsp/notifications');
      if (res?.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {}
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await apiFetch(`/rsp/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiFetch('/rsp/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  }, []);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  usePersonnelRealtime(['personnel:notification:update'], () => {
    fetchUnreadCount(true);
  });

  const toggleDropdown = async () => {
    const next = !showNotifs;
    setShowNotifs(next);
    if (next) {
      await fetchNotifications();
      await markAllAsRead();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showNotifs) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifs]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div>
        <h1 className="text-xl font-bold text-[#1B3A6B] leading-tight">{title}</h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          RSP Module · HRMIS · Schools Division Office of Dapitan City
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="relative p-2 text-slate-400 hover:text-[#1B3A6B] transition-colors focus:outline-none cursor-pointer rounded-lg hover:bg-slate-50"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#D6402F] text-white text-[9px] font-black rounded-full w-4.5 h-4.5 min-w-[18px] flex items-center justify-center border border-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
              <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-[#D6402F] hover:text-[#b83520] uppercase tracking-wider cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`px-5 py-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                        notif.is_read ? 'bg-white hover:bg-slate-50/50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        notif.is_read ? 'bg-slate-200' : 'bg-[#D6402F]'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-normal ${
                          notif.is_read ? 'text-slate-500 font-medium' : 'text-slate-800 font-semibold'
                        }`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          {formatTime(notif.created_at)}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <Check size={12} className="text-blue-400 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center">
                    <Bell size={24} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { logout(); navigate('/'); }}>
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-[#1B3A6B] leading-tight">{user?.full_name || 'Admin User'}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              {user?.role === 'admin' ? 'System Administrator' : 'HR Staff'}
            </p>
          </div>
          <div className="w-9 h-9 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-100 group-hover:ring-[#1B3A6B]/20 transition-all">
            {getInitials(user?.full_name)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default RSPHeader;
