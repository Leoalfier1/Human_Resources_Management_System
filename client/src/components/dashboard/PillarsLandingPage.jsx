import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, GraduationCap, ClipboardList, Trophy, Folder, Shield, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ModuleCard from './ModuleCard';
import { InfoBanner, DashboardFooter } from './DashboardLayout';

const PillarsLandingPage = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // The 5 Pillars of PRIME-HRM
  const modules = [
    {
      id: 'RSP',
      icon: Users,
      title: "Recruitment, Selection and Placement",
      description: "Manage hiring, screening, and appointment workflows",
      badge: "RSP",
      status: "active"
    },
    {
      id: 'L&D',
      icon: GraduationCap,
      title: "Learning and Development",
      description: "Plan, implement, and evaluate training programs",
      badge: "L&D",
      status: "active"
    },
    {
      id: 'PM',
      icon: ClipboardList,
      title: "Performance Management",
      description: "Track goals, appraisals, and performance ratings",
      badge: "PM",
      status: "active"
    },
    {
      id: 'R&R',
      icon: Trophy,
      title: "Rewards and Recognition",
      description: "Recognize outstanding performance and achievements",
      badge: "R&R",
      status: "active"
    },
    {
      id: 'PERS',
      icon: Folder,
      title: "Personnel",
      description: "Manage employee records, 201 files, and personal information",
      badge: "PERS",
      status: "active"
    }
  ];

  // ROLE-BASED NAVIGATION LOGIC
  const handleModuleSelect = (moduleId) => {
    if (moduleId === 'RSP') {
      // If the user is an Admin or Staff member
      if (isAdmin) {
        navigate('/rsp/dashboard'); 
      } 
      // If the user is an Applicant
      else {
        navigate('/jobs'); 
      }
    } else if (moduleId === 'PERS') {
      navigate('/personnel/pds');
    } else {
      // Temporary handler for other modules
      alert(`${moduleId} Module is coming soon in the next phase.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col select-none">
      {/* Top Decorative Strip */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#0F172A] z-50" />

      {/* ── TOP NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-1 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">

          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-[#1B3A6B] p-2 rounded-xl">
              <Shield size={20} fill="white" className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-[#1B3A6B] uppercase tracking-tight leading-none">
                DepEd SDO Dapitan City
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                HRMIS Portal
              </p>
            </div>
          </div>

          {/* Center: PRIME-HRM badge */}
          <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-5 py-2 rounded-full text-[#1B3A6B]">
            <Shield size={16} fill="#1B3A6B" className="opacity-80" />
            <span className="font-black text-xs tracking-[0.2em] uppercase">PRIME-HRM</span>
          </div>

          {/* Right: User info + Sign Out */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-[#1B3A6B] leading-none uppercase">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[10px] font-bold text-[#D6402F] uppercase tracking-widest mt-0.5">
                {user?.role}
              </p>
            </div>
            <div className="w-9 h-9 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-black text-xs shadow">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-[10px] font-black text-red-600 border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 active:scale-95 transition-all uppercase tracking-widest"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-[1440px] mx-auto w-full px-6 py-12">
        
        {/* PAGE HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-[#1B3A6B] tracking-tight uppercase italic mb-1">
            Pillars of PRIME-HRM
          </h1>
          <p className="text-slate-500 font-bold text-sm">
            Select a module below to get started.
          </p>
        </div>

        {/* MODULE CARDS GRID */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {modules.map((mod) => (
            <ModuleCard 
              key={mod.id} 
              {...mod} 
              // Passing the role-aware click handler
              onClick={() => handleModuleSelect(mod.id)}
            />
          ))}
        </motion.div>

        {/* SYSTEM INFO BANNER */}
        <InfoBanner />
      </main>

      <DashboardFooter />
    </div>
  );
};

export default PillarsLandingPage;