import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import PersonnelNavbar from './PersonnelNavbar';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const PersonnelLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationCount(data.count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  usePersonnelRealtime(['personnel:update', 'personnel:notification:update'], () => {
    fetchCount();
  });

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col font-sans relative pb-20 md:pb-0">
      <nav className="bg-white border-b border-slate-200 relative overflow-hidden min-h-[80px] md:h-32 flex items-center shadow-sm py-4 md:py-0">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <h1 className="text-[60px] md:text-[100px] font-black text-slate-50 opacity-[0.05] leading-none text-center uppercase">
            HRMIS <br /> PERSONNEL
          </h1>
        </div>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between relative z-10 gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#1B3A6B] p-2.5 sm:p-3 rounded-xl text-white shadow-lg overflow-hidden shrink-0">
              <img src="/assets/deped-seal.png" alt="DepEd" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
            </div>
            <div>
              <p className="text-xs font-black text-[#1B3A6B] uppercase tracking-tight md:hidden">HRMIS Personnel</p>
              <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">SDO Dapitan City</p>
            </div>
          </div>

          <PersonnelNavbar notificationCount={notificationCount} />

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right border-r pr-6 border-slate-100 hidden lg:block">
              <h3 className="text-sm font-black text-[#1B3A6B] leading-none uppercase truncate max-w-[180px]">
                {user?.fullName || 'Employee'}
              </h3>
              <p className="text-[10px] font-black text-[#D6402F] mt-1 tracking-tighter uppercase">
                Employee Portal
              </p>
            </div>
            <button onClick={() => navigate('/pillars')} className="group flex flex-col items-center gap-1 shrink-0" title="Back to Pillars">
              <div className="bg-slate-50 text-slate-400 p-2.5 sm:p-3 rounded-full group-hover:bg-red-50 group-hover:text-[#D6402F] transition-all border border-slate-100">
                <LogOut size={18} />
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="p-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-t border-slate-200 bg-white">
        DepEd Schools Division Office of Dapitan City &middot; HRMIS Personnel Module
      </footer>
    </div>
  );
};

export default PersonnelLayout;
