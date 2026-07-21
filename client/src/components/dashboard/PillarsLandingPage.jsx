import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, ClipboardList, Trophy, Folder, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ModuleCard from './ModuleCard';
import { DashboardFooter } from './DashboardLayout';

const PillarsLandingPage = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const modules = [
    {
      id: 'RSP',
      icon: Users,
      title: 'Recruitment, Selection & Placement',
      description: 'Manage hiring, screening, and appointment workflows end-to-end.',
      badge: 'RSP',
      status: 'active'
    },
    {
      id: 'L&D',
      icon: GraduationCap,
      title: 'Learning & Development',
      description: 'Plan, implement, and evaluate training programs for staff growth.',
      badge: 'L&D',
      status: 'active'
    },
    {
      id: 'PM',
      icon: ClipboardList,
      title: 'Performance Management',
      description: 'Track goals, appraisals, and performance ratings across offices.',
      badge: 'PM',
      status: 'active'
    },
    {
      id: 'R&R',
      icon: Trophy,
      title: 'Rewards & Recognition',
      description: 'Recognize outstanding performance and celebrate achievements.',
      badge: 'R&R',
      status: 'active'
    },
    {
      id: 'PERS',
      icon: Folder,
      title: 'Personnel',
      description: 'Employee 201 files, service records, and personnel management.',
      badge: 'PERS',
      status: 'active'
    }
  ];

  const handleModuleSelect = (moduleId) => {
    if (moduleId === 'RSP') {
      if (isAdmin) {
        navigate('/rsp/dashboard');
      } else {
        navigate('/jobs');
      }
    } else if (moduleId === 'L&D') {
      if (isAdmin) {
        navigate('/ld/dashboard');
      } else {
        navigate('/jobs/my-learning');
      }
    } else if (moduleId === 'PM') {
      if (isAdmin) {
        navigate('/pm/dashboard');
      } else {
        navigate('/jobs/my-performance');
      }
    } else if (moduleId === 'R&R') {
      if (isAdmin) {
        navigate('/rr/dashboard');
      } else {
        navigate('/jobs/rr-opportunities');
      }
    } else if (moduleId === 'PERS') {
      if (isAdmin) {
        navigate('/personnel-admin/dashboard');
      } else {
        navigate('/personnel/pds');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col select-none">
      {/* Top Decorative Strip */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#0F172A] z-50" />

      {/* ── TOP NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-1 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#1B3A6B] p-2 rounded-xl overflow-hidden">
              <img src="/assets/deped-seal.png" alt="DepEd" className="w-5 h-5 object-contain" />
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

          <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-5 py-2 rounded-full text-[#1B3A6B]">
            <img src="/assets/deped-seal.png" alt="" className="w-4 h-4 object-contain opacity-80" />
            <span className="font-black text-xs tracking-[0.2em] uppercase">PRIME-HRM Compliant</span>
          </div>

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

      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <section className="bg-[#1B3A6B] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#D6402F]" />

        <div className="max-w-[1440px] mx-auto px-6 pt-14 pb-16 text-center relative z-10 flex flex-col items-center">
          {/* Seals + Agency Text */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-white/20 overflow-hidden bg-white/10 shrink-0">
              <img src="/assets/deped-seal.png" alt="DepEd Seal" className="w-full h-full object-contain p-1.5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest leading-none mb-1">
                Republic of the Philippines
              </p>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight">
                Department of Education
              </h2>
              <p className="text-xs font-bold text-[#D6402F] uppercase tracking-widest mt-1.5">
                Region IX – Schools Division Office of Dapitan City
              </p>
            </div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-white/20 overflow-hidden bg-white/10 shrink-0">
              <img src="/assets/deped-seal.png" alt="Region IX Seal" className="w-full h-full object-contain p-1.5" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-5">
            Human Resource Management<br className="hidden md:block" /> Information System
          </h1>

          {/* PRIME-HRM Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-[#D6402F] text-white px-5 py-2 rounded-full mb-6">
            <img src="/assets/deped-seal.png" alt="" className="w-4 h-4 object-contain" />
            <span className="text-[11px] font-black uppercase tracking-widest">PRIME-HRM Compliant System</span>
          </div>

          {/* Tagline */}
          <p className="max-w-2xl mx-auto text-sm md:text-base text-white/70 leading-relaxed">
            Empowering DepEd Dapitan City's human resource management through a
            unified digital platform aligned with the Civil Service Commission's
            PRIME-HRM framework — ensuring merit-based, transparent, and
            excellence-driven HR processes across all pillars.
          </p>
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto w-full px-6 py-12">

        {/* SYSTEM MODULES SECTION */}
        <div className="mb-8">
          <p className="text-[10px] font-black text-[#D6402F] uppercase tracking-[0.3em] mb-2">
            System Modules
          </p>
          <h2 className="text-2xl font-black text-[#1B3A6B] tracking-tight">
            Select a module below to get started.
          </h2>
        </div>

        {/* MODULE CARDS GRID */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch"
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
              onClick={() => handleModuleSelect(mod.id)}
            />
          ))}
        </motion.div>

        {/* ── DEPED CORE VALUES QUOTE ───────────────────────────── */}
        <motion.div
          className="mt-14 bg-[#1B3A6B]/[0.03] border border-[#1B3A6B]/10 rounded-[2rem] px-8 py-10 text-center flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="text-[10px] font-black text-[#D6402F] uppercase tracking-[0.3em] mb-3">
            DepEd Core Values
          </p>
          <p className="text-lg md:text-xl font-bold text-[#1B3A6B] italic leading-relaxed max-w-xl mx-auto">
            "Maka-Diyos, Makatao, Makakalikasan, at Makabansa"
          </p>
        </motion.div>

        {/* SYSTEM INFO BANNER */}
        <div className="mt-10 bg-slate-200/50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="w-12 h-12 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white shrink-0">
            <img src="/assets/deped-seal.png" alt="" className="w-6 h-6 object-contain" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-[#1B3A6B] font-bold text-xs md:text-sm uppercase tracking-tight mb-1">
              Program to Institutionalize Meritocracy and Excellence in Human Resource Management
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              PRIME-HRM is the CSC framework that evaluates agencies on four core HRM systems. Modules marked "Coming Soon" are currently in development.
            </p>
          </div>
        </div>
      </main>

      <div className="mt-auto">
        <DashboardFooter />
      </div>
    </div>
  );
};

export default PillarsLandingPage;