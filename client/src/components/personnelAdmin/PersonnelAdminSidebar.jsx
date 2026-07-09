import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Users, UserPlus, CalendarCheck, Plane, FileText,
  BarChart3, ClipboardList, LogOut, Shield, ChevronLeft, ScrollText
} from 'lucide-react';

const NAV_ITEMS = [
  { section: 'OVERVIEW', items: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/personnel-admin/dashboard' },
  ]},
  { section: 'EMPLOYEE RECORDS', items: [
    { key: 'employees', label: 'Employee Directory', icon: Users, path: '/personnel-admin/employees' },
    { key: 'add-employee', label: 'Add Employee', icon: UserPlus, path: '/personnel-admin/employees/new' },
  ]},
  { section: 'LEAVE MANAGEMENT', items: [
    { key: 'leave', label: 'Leave Applications', icon: CalendarCheck, path: '/personnel-admin/leave' },
  ]},
  { section: 'TRAVEL', items: [
    { key: 'travel', label: 'Travel Requests', icon: Plane, path: '/personnel-admin/travel' },
  ]},
  { section: 'DOCUMENTS & CERTIFICATES', items: [
    { key: 'documents', label: 'Document Requests', icon: FileText, path: '/personnel-admin/document-requests' },
  ]},
  { section: 'RSP TOOLS', items: [
    { key: 'eligibility', label: 'Eligibility Screening', icon: ClipboardList, path: '/personnel-admin/eligibility-screening' },
  ]},
  { section: 'REPORTS', items: [
    { key: 'reports', label: 'Reports & Analytics', icon: BarChart3, path: '/personnel-admin/reports' },
    { key: 'audit', label: 'Audit Log', icon: ScrollText, path: '/personnel-admin/audit' },
  ]},
];

const PersonnelAdminSidebar = ({ userName, userRole, onBack }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-[#1B3A6B] text-white flex flex-col sticky top-0 left-0 z-[100] shadow-2xl select-none"
    >
      <div className="p-4 flex items-center justify-between border-b border-white/5 h-[72px] bg-[#162E55] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-[#D6402F] p-2.5 rounded-xl shadow-lg shrink-0">
            <Shield size={20} className="text-white" fill="currentColor" />
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
              <p className="font-black text-sm uppercase tracking-tighter leading-tight">Personnel</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70">HR Admin</p>
            </motion.div>
          )}
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-slate-500 hover:text-white transition-colors p-1">
          <ChevronLeft className={`transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} size={20} />
        </button>
      </div>

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
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="pers-nav-active"
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

      <div className="p-4 border-t border-white/5 bg-[#162E55] shrink-0">
        {!isCollapsed && (
          <div className="mb-4 px-3">
            <p className="text-xs font-black text-white uppercase tracking-tight truncate">{userName || 'HR Administrator'}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate opacity-70">{userRole || 'Administrator'}</p>
          </div>
        )}
        <button onClick={onBack} className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
          <LogOut size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Pillars</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default PersonnelAdminSidebar;
