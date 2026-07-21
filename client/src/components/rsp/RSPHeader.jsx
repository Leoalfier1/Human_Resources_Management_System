import React, { useState } from 'react';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RSPHeader = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'HR';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
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
        <div className="relative">
          <div 
            className="cursor-pointer text-slate-400 hover:text-[#1B3A6B] transition-colors"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={20} />
            {/* Optional dot indicator could go here */}
          </div>
          
          {showNotifs && (
            <div className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
              <div className="p-4 border-b border-slate-50">
                <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest">Notifications</h3>
              </div>
              <div className="p-8 text-center">
                <Bell size={24} className="mx-auto text-slate-200 mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No new notifications</p>
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