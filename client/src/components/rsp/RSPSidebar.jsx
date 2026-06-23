import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Briefcase, Users, ClipboardCheck, BarChart3, 
  FileText, ListChecks, Star, Award, FileEdit, ChevronLeft, Shield, LogOut 
} from 'lucide-react';

const NAV_ITEMS = [
  { section: 'OVERVIEW', items: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/rsp/dashboard' },
    { key: 'vacancy', label: 'Vacancy Posting', icon: Briefcase, path: '/rsp/vacancy-posting' },
    { key: 'applicants', label: 'Applicant Management', icon: Users, path: '/rsp/applicants' },
  ]},
  { section: 'RSP PROCESS', items: [
    { key: 'evaluation', label: 'Initial Evaluation', icon: ClipboardCheck, path: '/rsp/initial-evaluation' },
    { key: 'assessment', label: 'Comparative Assessment', icon: BarChart3, path: '/rsp/comparative-assessment' },
    { key: 'results', label: 'Results Posting', icon: FileText, path: '/rsp/results-posting' },
    { key: 'shortlist', label: 'Deliberation & Shortlist', icon: ListChecks, path: '/rsp/deliberation' },
  ]},
  { section: 'APPOINTMENT', items: [
    { key: 'advice', label: 'Congratulatory Advice', icon: Star, path: '/rsp/congratulatory-advice' },
    { key: 'processing', label: 'Appointment Processing', icon: Award, path: '/rsp/appointment-processing' },
    { key: 'notice', label: 'Notice of Appointment', icon: FileEdit, path: '/rsp/notice-of-appointment' },
  ]}
];

const RSPSidebar = ({ userName, userRole, onBack }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            <Shield size={20} className="text-white" fill="currentColor" />
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
              <p className="font-black text-sm uppercase tracking-tighter leading-tight">DepEd Division</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70">Dapitan City</p>
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
                {/* Red Active Indicator Background */}
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active" 
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
      <div className="p-4 border-t border-white/5 bg-[#162E55]">
        {!isCollapsed && (
          <div className="mb-4 px-3">
            <p className="text-xs font-black text-white uppercase tracking-tight truncate">{userName || "HR Administrator"}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate opacity-70">{userRole || "HRMPSB Secretariat"}</p>
          </div>
        )}
        <button 
          onClick={onBack} 
          className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
        >
          <LogOut size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Pillars</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default RSPSidebar;