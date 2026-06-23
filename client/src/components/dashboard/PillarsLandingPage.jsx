import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // NEW: For routing
import { 
  Users, GraduationCap, ClipboardList, Trophy, Folder, Shield 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // NEW: Access global user/logout
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

  // Logic to handle module selection
  // Inside PillarsLandingPage.jsx
const handleModuleSelect = (moduleId) => {
  if (moduleId === 'RSP') {
    navigate('/rsp/dashboard'); // This matches our new route
  } else {
    alert("Module coming soon...");
  }
};

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col pt-2 select-none">
      {/* Top Decorative Strip */}
      <div className="fixed top-0 left-0 w-full h-2 bg-[#0F172A] z-50 shadow-md" />

      <main className="flex-grow max-w-[1440px] mx-auto w-full px-6 py-12">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
               <h1 className="text-3xl md:text-4xl font-black text-[#1B3A6B] tracking-tight uppercase italic">
                Pillars of PRIME-HRM
              </h1>
              <button 
                onClick={logout}
                className="text-[10px] font-black text-red-600 border border-red-200 px-3 py-1 rounded-full hover:bg-red-50 transition-all uppercase tracking-widest"
              >
                Sign Out
              </button>
            </div>
            <p className="text-slate-500 font-bold text-sm">
              Welcome, <span className="text-[#1B3A6B]">{user?.fullName || 'User'}</span> 
              <span className="mx-2 opacity-30">|</span> 
              Select a module to continue
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-2.5 rounded-full text-[#1B3A6B] shadow-sm">
            <Shield size={18} fill="#1B3A6B" className="opacity-90" />
            <span className="font-black text-xs tracking-[0.2em] uppercase">PRIME-HRM</span>
          </div>
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
              // Passing the click handler to the card
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