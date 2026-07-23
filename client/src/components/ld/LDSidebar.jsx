import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, GraduationCap, ClipboardList, Target, BookOpen, 
  CalendarCheck, BarChart3, FileSpreadsheet, ChevronLeft, Shield, LogOut 
} from 'lucide-react';

const NAV_ITEMS = [
  { section: 'OVERVIEW', items: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/ld/dashboard' },
  ]},
  { section: 'L&D PROCESS', items: [
    { key: 'tna', label: 'Needs Assessment (TNA)', icon: ClipboardList, path: '/ld/tna' },
    { key: 'objectives', label: 'L&D Objectives', icon: Target, path: '/ld/objectives' },
    { key: 'planning', label: 'Program Planning & Design', icon: BookOpen, path: '/ld/planning' },
    { key: 'implementation', label: 'Implementation Tracking', icon: CalendarCheck, path: '/ld/implementation' },
    { key: 'evaluation', label: 'Impact Evaluation', icon: BarChart3, path: '/ld/evaluation' },
  ]},
  { section: 'REPORTS', items: [
    { key: 'reports', label: 'Consolidated Reports', icon: FileSpreadsheet, path: '/ld/reports' },
  ]}
];

const LDSidebar = ({ userName, userRole, onBack }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-[#1B3A6B] text-white flex flex-col sticky top-0 left-0 z-[100] shadow-2xl select-none"
    >
      {/* 1. BRAND HEADER */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 h-[72px] bg-[#162E55]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-[#D6402F] p-2.5 rounded-xl shadow-lg shrink-0">
            <GraduationCap size={20} className="text-white" fill="currentColor" />
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
              <p className="font-black text-sm uppercase tracking-tighter leading-tight">DepEd Division</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70">L&D Admin Portal</p>
            </motion.div>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-slate-500 hover:text-white transition-colors p-1"
        >
          <ChevronLeft className={`transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} size={20} />
        </button>
      </div>

      {/* 2. SCROLLABLE NAVIGATION */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-6">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="mb-8">
            {!isCollapsed && (
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
                {/* Red/Orange Active Indicator Background */}
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div 
                        layoutId="ld-nav-active" 
                        className="absolute inset-0 bg-[#D6402F] rounded-xl shadow-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      <item.icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                      {!isCollapsed && (
                        <span className={`text-sm tracking-wide ${isActive ? 'font-black' : 'font-semibold'}`}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* 3. FOOTER SECTION (PAGES BACK) */}
      <div className="p-4 border-t border-white/5 bg-[#162E55] space-y-1">
        {!isCollapsed && (
          <div className="mb-4 px-3">
            <p className="text-xs font-black text-white uppercase tracking-tight truncate">{userName || "HR L&D Admin"}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate opacity-70">{userRole || "HR Specialist"}</p>
          </div>
        )}
        <button 
          onClick={() => navigate('/employee/learning')} 
          className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group cursor-pointer"
        >
          <GraduationCap size={18} className="group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Switch to Trainee</span>}
        </button>
        <button 
          onClick={onBack} 
          className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group cursor-pointer"
        >
          <LogOut size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Pillars</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default LDSidebar;
