import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Briefcase, FileText, Bell, Star, UserCheck, Settings } from 'lucide-react';
import ApplicantAccountBlock from '../shared/ApplicantAccountBlock';
import PortalBackButton from '../shared/PortalBackButton';

const ApplicantPortalLayout = () => {
    const navItems = [
        { label: 'JOB OPENINGS', path: '/jobs', icon: Briefcase },
        { label: 'MY APPLICATION', path: '/jobs/my-application', icon: FileText },
        { label: 'RESULTS / NOTICES', path: '/jobs/results', icon: Bell },
        { label: 'ADVICE & NEXT STEPS', path: '/jobs/advice', icon: Star },
        { label: 'APPOINTMENT', path: '/jobs/appointment', icon: UserCheck },
        { label: 'PROFILE', path: '/jobs/profile', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#F1F3F6] flex flex-col font-sans">
            {/* TOP NAVBAR */}
            <nav className="bg-white border-b border-slate-200 relative overflow-hidden h-32 flex items-center shadow-sm">
                
                {/* Watermark Background Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <h1 className="text-[100px] font-black text-slate-50 opacity-[0.05] leading-none text-center uppercase">
                        HRMIS <br /> APPLICANT
                    </h1>
                </div>

                <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between relative z-10">
                    
                    {/* Brand Logo */}
                    <div className="flex flex-col items-center">
                        <div className="bg-[#1B3A6B] p-3 rounded-xl text-white shadow-lg overflow-hidden">
                            <img src="/assets/deped-seal.png" alt="DepEd" className="w-7 h-7 object-contain" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 mt-2 tracking-widest uppercase">SDO Dapitan City</p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/jobs'}
                                className={({ isActive }) => `
                                    flex flex-col items-center justify-center w-24 h-24 rounded-2xl transition-all
                                    ${isActive 
                                        ? 'bg-red-50 text-[#D6402F] shadow-inner' 
                                        : 'text-slate-400 hover:text-[#1B3A6B] hover:bg-slate-50'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
                                        <span className="text-[9px] font-black mt-3 tracking-tighter text-center leading-tight">
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    {/* User Info & Switch Module */}
                    <div className="flex items-center gap-4">
                        <ApplicantAccountBlock />
                        <PortalBackButton />
                    </div>
                </div>
            </nav>

            {/* PAGE CONTENT */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer className="p-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em] border-t border-slate-200 bg-white">
                DepEd Schools Division Office of Dapitan City · HRMIS RSP Module · For assistance call 065-908-1234
            </footer>
        </div>
    );
};

export default ApplicantPortalLayout;
