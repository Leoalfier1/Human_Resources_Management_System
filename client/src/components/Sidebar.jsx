import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, FileCheck, MessageSquare, BarChart3, Award, 
  Settings, Shield, ChevronLeft, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/pm/dashboard' },
  { key: 'planning', label: 'Planning & Commitment', icon: FileCheck, path: '/pm/planning' },
  { key: 'monitoring', label: 'Monitoring & Coaching', icon: MessageSquare, path: '/pm/monitoring' },
  { key: 'review', label: 'Review & Evaluation', icon: BarChart3, path: '/pm/review', badge: true },
  { key: 'rewarding', label: 'Rewarding & Dev Planning', icon: Award, path: '/pm/rewarding' },
  { key: 'config', label: 'Form Configuration', icon: Settings, path: '/pm/form-config' },
];

// Other modules removed from Admin PM Sidebar

import { apiGet, apiPost, SOCKET_URL } from '../utils/api';
import io from 'socket.io-client';

const Sidebar = () => {
  const navigate = useNavigate();
  const { token, user, login } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  const handleQuickSwitch = async () => {
    try {
      const response = await apiPost('/auth/login', {
        identifier: 'kadongtata1975@gmail.com',
        password: 'password123',
        loginType: 'staff'
      });
      if (response.ok) {
        const data = await response.json();
        login(data.user, data.token);
        window.location.href = '/pm/employee/dashboard';
      } else {
        alert("Failed to quick-switch account");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch dynamic stats for Review & Evaluation badge count
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiGet('/pm/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setPendingReviewCount(data.stats?.pendingReviews || 0);
        }
      } catch (err) {
        console.error("Failed to load sidebar stats:", err);
      }
    };
    if (token) {
      fetchStats();
      const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socket.emit('join_admin_room');
      const handleRefresh = () => fetchStats();
      socket.on('performance_update', handleRefresh);
      socket.on('commitment:submitted', handleRefresh);
      socket.on('commitment:approved', handleRefresh);
      socket.on('commitment:returned', handleRefresh);
      socket.on('ipcrf:status_changed', handleRefresh);
      return () => socket.disconnect();
    }
  }, [token]);

  const handleBackToPillars = () => {
    navigate('/pillars');
  };

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-[#1e293b] text-white flex flex-col sticky top-0 left-0 z-[100] shadow-2xl select-none shrink-0"
    >
      {/* 1. BRAND HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 h-[72px] bg-[#16223b] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-[#D6402F] p-2.5 rounded-xl shadow-lg shrink-0">
            <Shield size={20} className="text-white" fill="currentColor" />
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
              <p className="font-black text-sm uppercase tracking-tighter leading-tight">Performance</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70">Management</p>
            </motion.div>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer"
        >
          <ChevronLeft className={`transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} size={20} />
        </button>
      </div>



      {/* 2. SCROLLABLE NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-3 py-6">
        {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) => `
                  relative flex items-center justify-between px-3 py-3 rounded-xl transition-all mb-1 group
                  ${isActive ? 'text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}
                `}
              >
                {/* Red Active Indicator Background */}
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active-pm" 
                        className="absolute inset-0 bg-[#D6402F] rounded-xl shadow-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3 w-full justify-between">
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                        {!isCollapsed && (
                          <span className={`text-sm tracking-wide ${isActive ? 'font-black' : 'font-semibold'}`}>
                            {item.label}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && item.badge && pendingReviewCount > 0 && (
                        <span className="w-2.5 h-2.5 bg-[#D6402F] rounded-full border border-[#1B3A6B] animate-pulse" />
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            ))}
      </div>

      {/* 3. FOOTER SECTION (PROFILE & PILLARS BACK) */}
      <div className="p-4 border-t border-white/5 bg-[#16223b] shrink-0">
        {!isCollapsed && (
          <div className="mb-4 px-3">
            <p className="text-xs font-black text-white uppercase tracking-tight truncate">
              {user?.fullName || "Administrator"}
            </p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate opacity-70">
              Administrator
            </p>
          </div>
        )}
        <button 
          onClick={handleQuickSwitch} 
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all mb-2 group cursor-pointer border border-white/5 bg-[#1b253b]/50 shadow-inner"
          title="Switch to Raul (Employee)"
        >
          <div className="w-4 h-4 rounded bg-emerald-600 flex items-center justify-center font-black text-[9px] text-white shrink-0">RC</div>
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Switch to Raul</span>}
        </button>
        <button 
          onClick={handleBackToPillars} 
          className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group cursor-pointer"
        >
          <LogOut size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Back to Pillars</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
