import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, Bell, Star, UserCheck, Briefcase, FileText, ChevronDown, LogOut, LayoutGrid, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ApplicantNavbar = ({ user, branding, currentStage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const navigate = useNavigate();

    const isLocked = (stageRequired) => currentStage < stageRequired;

    const navLinks = [
    { label: 'Job Openings',      path: '/jobs',                  icon: <Briefcase size={18}/>, minStage: 0  },
    { label: 'My Application',    path: '/jobs/my-application',   icon: <FileText size={18}/>,  minStage: 2  },
    { label: 'Results / Notices', path: '/jobs/results',          icon: <Bell size={18}/>,      minStage: 5  },
    { label: 'Advice & Next Steps', path: '/jobs/advice',         icon: <Star size={18}/>,      minStage: 9  },
    { label: 'Appointment',       path: '/jobs/appointment',      icon: <UserCheck size={18}/>, minStage: 11 },
];

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm select-none">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">
                
                {/* 1. Branding (Left) */}
                <div className="flex items-center gap-3 z-10">
                    <div className="bg-[#1B3A6B] p-2 rounded-xl text-white shadow-lg shadow-blue-900/20">
                        <Shield size={24} fill="currentColor" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-black text-[#1B3A6B] uppercase tracking-tight leading-none">
                            {branding.office_name || "HRMIS Applicant Portal"}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tighter italic">
                            {branding.region || "Schools Division Office"}
                        </p>
                    </div>
                </div>

                {/* 2. Navigation (Center-Right) */}
                <div className="hidden lg:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const locked = isLocked(link.minStage);
                        return (
                            <NavLink
    key={link.path}
    to={locked ? '#' : link.path}
    end={link.path === '/jobs'}
    className={({ isActive }) => `
        flex flex-col items-center px-4 py-2 rounded-xl transition-all relative group
        ${locked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${isActive && !locked ? 'text-[#D6402F]' : 'text-slate-400 hover:text-[#1B3A6B]'}
    `}
>
                                {link.icon}
                                <span className="text-[9px] font-black uppercase mt-1 tracking-tighter whitespace-nowrap">
                                    {link.label}
                                </span>
                                {locked && <div className="absolute top-1 right-3 text-[8px] text-slate-400"><LayoutGrid size={10}/></div>}
                            </NavLink>
                        );
                    })}
                </div>

                {/* 3. User Dropdown (Far Right) */}
                <div className="flex items-center gap-4 z-10">
                    <div className="relative">
                        <button 
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-2xl transition-all"
                        >
                            <div className="w-9 h-9 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-black text-xs shadow-md border-2 border-white">
                                {user?.initials || "EG"}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-xs font-black text-[#1B3A6B] leading-none uppercase">{user?.fullName}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user?.applicantCode || "APP-006"}</p>
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden py-2"
                                >
                                    <button 
                                        onClick={() => navigate('/pillars')}
                                        className="w-full flex items-center gap-3 px-6 py-4 text-xs font-black text-[#1B3A6B] uppercase hover:bg-blue-50 transition-colors border-b border-slate-50"
                                    >
                                        <LayoutGrid size={16} /> Back to Pillars
                                    </button>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-6 py-4 text-xs font-black text-[#D6402F] uppercase hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile Menu Trigger */}
                    <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 text-[#1B3A6B]">
                        {mobileMenu ? <X /> : <Menu />}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default ApplicantNavbar;