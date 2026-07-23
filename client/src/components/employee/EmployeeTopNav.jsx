import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Menu, X, LogOut } from 'lucide-react';
import { apiGet, apiPut, SOCKET_URL } from '../../utils/api';
import io from 'socket.io-client';

const NAV_LINKS = [
  { to: '/pm/employee/dashboard', label: 'Dashboard' },
  { to: '/pm/employee/ipcrf', label: 'My IPCRF' },
  { to: '/pm/employee/review', label: 'My Review' },
  { to: '/pm/employee/performance-history', label: 'Performance History' },
];

const EmployeeTopNav = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL);
    socket.emit('join_employee_room', user.id);

    const inc = () => setUnreadCount(prev => prev + 1);
    socket.on('ipcrf:status_changed', inc);
    socket.on('feedback:received', inc);
    socket.on('coaching:plan_assigned', inc);
    socket.on('review:rating_updated', inc);
    socket.on('review:finalized', inc);
    socket.on('devplan:updated', inc);

    return () => { socket.disconnect(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    apiGet('/notifications/mine').then(res => res.json()).then(data => {
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    }).catch(() => {});
  }, [user]);

  const handleBellClick = async () => {
    setUnreadCount(0);
    try {
      const res = await apiGet('/notifications/mine');
      const notifications = await res.json();
      for (const n of notifications) {
        if (!n.is_read) {
          await apiPut(`/notifications/${n.id}/read`, {});
        }
      }
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const getShortName = (fullName) => {
    if (!fullName) return "Employee";
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return fullName;
  };

  const getInitials = (fullName) => {
    if (!fullName) return "EE";
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName[0]?.toUpperCase() || "E";
  };

  return (
    <>
      <nav className="bg-[#1B3A6B] text-white h-[56px] sticky top-0 left-0 w-full z-[100] shadow-md select-none">
        <div className="max-w-full h-full px-4 md:px-6 flex items-center justify-between">
          {/* Left: Logo & Hamburger */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden text-white/70 hover:text-white p-1.5 cursor-pointer transition-colors rounded-lg hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center gap-2 bg-white/10 py-1.5 px-3 md:px-3.5 rounded-xl border border-white/10 shadow-inner">
              <div className="bg-[#D6402F] p-1 rounded shadow shrink-0">
                <div className="w-3 h-3 bg-white rounded-sm" />
              </div>
              <span className="font-black text-[10px] md:text-xs tracking-tight whitespace-nowrap text-white flex items-center gap-1.5">
                <span className="hidden xs:inline">HRMIS</span>
                <span className="opacity-40 hidden xs:inline">&middot;</span>
                <span>Performance Management</span>
              </span>
            </div>
          </div>

          {/* Center: Nav Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-10 md:gap-16 lg:gap-20">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/pm/employee/dashboard'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wide transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Notification Bell */}
            <button
              onClick={handleBellClick}
              className="relative text-white/50 hover:text-white transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-white/10"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#D6402F] text-[9px] font-black text-white px-1.5 py-0.5 rounded-full border border-[#1B3A6B] leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                onClick={() => navigate('/pm/dashboard')}
                className="hidden sm:inline-flex px-3 py-1.5 border border-white/30 text-white hover:bg-white/10 hover:border-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
              >
                Switch to Admin
              </button>
            )}

            {/* Back to Pillars */}
            <button
              onClick={() => navigate('/pillars')}
              title="Main Menu"
              className="p-1.5 border border-white/20 hover:border-[#D6402F] hover:bg-[#D6402F]/10 hover:text-[#D6402F] text-white/50 rounded-full transition-all cursor-pointer shrink-0"
            >
              <LogOut size={16} className="rotate-180" />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#D6402F] flex items-center justify-center font-black text-[10px] md:text-xs text-white shadow shrink-0">
                {getInitials(user?.fullName || user?.name)}
              </div>
              <span className="hidden min-[900px]:inline text-xs font-bold text-white/80">
                {getShortName(user?.fullName || user?.name)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="fixed top-[56px] left-0 w-full bg-[#1B3A6B] border-t border-white/10 shadow-xl flex flex-col p-4 gap-1.5 lg:hidden z-[99]">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/pm/employee/dashboard'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
            {isAdmin && (
              <button
                onClick={() => { setMenuOpen(false); navigate('/pm/dashboard'); }}
                className="mt-2 px-4 py-3 border border-white/30 text-white hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-left"
              >
                Switch to Admin
              </button>
            )}
        </div>
      )}

      {/* Page Content */}
      <main className="min-h-[calc(100vh-56px)] bg-[#F3F4F6]">
        <Outlet />
      </main>
    </>
  );
};

export default EmployeeTopNav;
