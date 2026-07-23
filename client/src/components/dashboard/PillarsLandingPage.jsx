import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, Users, GraduationCap, Trophy, Folder, Shield, LogOut, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PillarsLandingPage = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const modules = [
    { id: 'RSP', icon: Users, title: "RECRUITMENT, SELECTION & PLACEMENT", desc: "Manage job vacancies, applicant screening, and hiring workflows.", badge: "RSP", route: '/rsp/dashboard' },
    { id: 'L&D', icon: GraduationCap, title: "LEARNING & DEVELOPMENT", desc: "Training programs, competency development, and capability building.", badge: "L&D", route: '/ld/dashboard' },
    { id: 'PM', icon: ClipboardList, title: "PERFORMANCE MANAGEMENT", desc: "PRIME-HRM aligned IPCRF/OPCRF tracking, monitoring, and evaluation.", badge: "PM", route: '/pm/dashboard' },
    { id: 'R&R', icon: Trophy, title: "REWARDS & RECOGNITION", desc: "Employee incentives, awards, and recognition programs.", badge: "R&R", route: '/rr/dashboard' },
    { id: 'PERS', icon: Folder, title: "PERSONNEL MANAGEMENT", desc: "Employee records, appointments, and personnel administration.", badge: "PERS", route: '/pers/dashboard' },
  ];

  const handleModuleSelect = (moduleId) => {
    if (moduleId !== 'PM') return;
    
    if (isAdmin) {
      navigate('/pm/dashboard');
    } else {
      navigate('/pm/employee/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <header className="w-full pt-12 px-8 md:px-16 flex flex-col items-center">
        <div className="w-full flex justify-end mb-8">
            <button 
                onClick={logout} 
                className="flex items-center gap-2 px-5 py-2 bg-white border border-red-100 text-[#0891b2] font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-red-50 transition-all shadow-sm active:scale-95"
            >
                <LogOut size={12} /> Sign Out
            </button>
        </div>
        
        <div className="w-full flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <p className="text-slate-500 font-bold text-sm">
                    Welcome, <span className="text-[#1B3A6B] font-black">{user?.fullName ? user.fullName.toUpperCase() : "ADMIN"}</span>
                </p>
                <h1 className="text-[#1B3A6B] text-3xl font-black tracking-tighter mt-2 uppercase">HRMIS Portal</h1>
            </div>
            
            <div className="flex items-center gap-3 bg-[#1B3A6B] text-white px-6 py-3 rounded-2xl shadow-xl">
                <Shield size={20} fill="#0891b2" stroke="#0891b2" className="opacity-100" />
                <div className="flex flex-col">
                    <span className="font-black text-[11px] tracking-[0.2em] uppercase leading-none">PRIME-HRM</span>
                    <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Integrated HR System</span>
                </div>
            </div>
        </div>
      </header>

      {/* MODULE CARDS */}
      <main className="w-full px-8 md:px-16 flex-grow mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
            {modules.map((mod) => {
              const isActive = mod.id === 'PM';
              return (
                <motion.div 
                    key={mod.id} 
                    whileHover={isActive ? { y: -6, scale: 1.02 } : {}}
                    whileTap={isActive ? { scale: 0.98 } : {}}
                    onClick={() => handleModuleSelect(mod.id)}
                    className={`bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col relative group transition-all min-h-[280px] ${
                      isActive ? 'cursor-pointer hover:border-blue-300' : 'cursor-not-allowed'
                    }`}
                >
                    {/* Visual Indicator of Active Phase (Red-Orange Vertical Line) */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#D6402F]" />
                    
                    <div className="p-6 lg:p-8 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-4 lg:mb-6">
                            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 bg-[#1B3A6B]">
                                <mod.icon className="text-white" size={24} />
                            </div>
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest bg-red-50 text-[#D6402F] border border-red-100 shrink-0">
                              {mod.badge}
                            </span>
                        </div>

                        <h3 className="text-[12px] lg:text-[13px] font-black text-[#1B3A6B] uppercase leading-tight mb-3 lg:mb-4 tracking-tighter">
                            {mod.title}
                        </h3>
                        
                        <p className="text-[10px] lg:text-[11px] text-slate-500 font-bold leading-relaxed opacity-80 flex-grow">
                            {mod.desc}
                        </p>
                    </div>

                    {/* Footer section of Card */}
                    <div className={`border-t border-slate-50 p-4 lg:p-5 bg-slate-50/30 flex justify-between items-center transition-colors duration-300 ${
                      isActive ? 'group-hover:bg-[#1B3A6B]' : ''
                    }`}>
                        <span className={`text-[9px] lg:text-[10px] font-black tracking-widest uppercase transition-colors ${
                          isActive ? 'text-[#0891b2] group-hover:text-white' : 'text-slate-400'
                        }`}>
                          {isActive ? 'Open Module' : 'Coming Soon'}
                        </span>
                        <div className="flex items-center gap-2">
                            {isActive ? (
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                            ) : (
                              <Lock size={12} className="text-slate-400" />
                            )}
                        </div>
                    </div>
                </motion.div>
              );
            })}
        </div>

        {/* INFO BANNER */}
        <div className="bg-white border-2 border-[#1B3A6B]/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="bg-[#1B3A6B] p-4 rounded-2xl shadow-xl flex-shrink-0">
                <Shield size={28} className="text-[#0891b2]" />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h4 className="text-[13px] font-black text-[#1B3A6B] uppercase tracking-[0.1em] mb-2">
                    Human Resource Management Information System
                </h4>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-4xl">
                    Integrated HR pillars covering recruitment, learning and development, performance management,
                    rewards and recognition, and personnel administration.
                </p>
            </div>
            <div className="flex-shrink-0">
                <div className="px-6 py-2 border-2 border-dashed border-[#1B3A6B]/20 rounded-xl">
                   <span className="text-[10px] font-black text-[#1B3A6B] uppercase opacity-50">HRMIS</span>
                </div>
            </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#1B3A6B] py-10 px-12 border-t-8 border-[#0891b2]">
        <div className="w-full px-8 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div>
                <div className="text-[12px] font-black text-white tracking-widest uppercase mb-1">
                    HRMIS
                </div>
                <div className="text-[10px] font-bold text-white/40 tracking-wider">
                    Human Resource Management Information System
                </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black text-white/80 uppercase tracking-widest">
                <a href="#" className="hover:text-[#0891b2] transition-colors">Dashboard</a>
                <a href="#" className="hover:text-[#0891b2] transition-colors">Reports</a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default PillarsLandingPage;
