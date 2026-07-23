import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Users, BookOpen, Award, Settings, ArrowLeft, 
  ChevronLeft, ChevronDown, Bell, FileText, FileCheck, BarChart3, Shield, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../utils/api';
import PMHeader from './PMHeader';

const NAV_ITEMS = [
  { section: 'PERFORMANCE MANAGEMENT', items: [
    { key: 'dashboard', label: 'PM Dashboard', icon: BarChart3, path: '/pm/dashboard' },
    { key: 'planning', label: 'Planning & Commitment', icon: FileCheck, path: '/pm/planning' },
    { key: 'monitoring', label: 'Monitoring & Coaching', icon: ClipboardList, path: '/pm/monitoring' },
    { key: 'review', label: 'Review & Evaluation', icon: FileText, path: '/pm/review', badge: true },
    { key: 'rewarding', label: 'Rewarding & Dev Planning', icon: Award, path: '/pm/rewarding' },
    { key: 'form-config', label: 'Form Configuration', icon: Settings, path: '/pm/form-config' },
  ]}
];

const PMAdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(3);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    apiGet('/pm/dashboard/stats')
    .then(res => res.json())
    .then(data => {
      if (data && data.stats) {
        setPendingReviewsCount(data.stats.pendingReviews || 0);
      }
    })
    .catch(err => console.error("Layout stats fetch error:", err));
  }, [token]);

  const handleBackToPillars = () => {
    navigate('/pillars');
  };

  return (
    <div className="flex bg-[#F1F3F6] min-h-screen">
      
      {/* LEFT SIDEBAR */}
      <motion.div 
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className="h-screen bg-[#1B3A6B] text-white flex flex-col sticky top-0 left-0 z-[100] shadow-2xl select-none"
      >
        {/* 1. BRAND HEADER */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 h-[72px] bg-[#162E55]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-[#D6402F] p-2.5 rounded-xl shadow-lg shrink-0">
              <Shield size={20} className="text-white" fill="currentColor" />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                <p className="font-black text-sm uppercase tracking-tighter leading-tight">DepEd Division</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70">Dapitan City</p>
              </motion.div>
            )}
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <ChevronLeft className={`transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} size={20} />
          </button>
        </div>

        {/* 2. SCROLLABLE NAVIGATION */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-6">
          {NAV_ITEMS.map((section) => (
            <div key={section.section} className="mb-8">
              {!collapsed && (
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-3 mb-3 opacity-60">
                  {section.section}
                </p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={({ isActive }) => `
                    relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all mb-1 group
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
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <item.icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                          {!collapsed && (
                            <span className={`text-sm tracking-wide ${isActive ? 'font-black' : 'font-semibold'}`}>
                              {item.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* 3. FOOTER SECTION (PAGES BACK) */}
        <div className="p-4 border-t border-white/5 bg-[#162E55]">
          {!collapsed && (
            <div className="mb-4 px-3 text-center">
              <p className="text-xs font-black text-white uppercase tracking-tight truncate">{user?.fullName || "PM Administrator"}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate opacity-70">
                {user?.role === 'admin' ? 'PM Administrator' : 'PM Supervisor'}
              </p>
            </div>
          )}
          <button 
            onClick={handleBackToPillars} 
            className="w-full flex items-center justify-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
          >
            <LogOut size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            {!collapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Pillars</span>}
          </button>
        </div>
      </motion.div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <PMHeader />

        {/* DYNAMIC PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default PMAdminLayout;
