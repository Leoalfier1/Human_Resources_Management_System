import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
// lucide-react not needed — brand uses DepEd seal image
import ApplicantAccountBlock from '../shared/ApplicantAccountBlock';
import PortalBackButton from '../shared/PortalBackButton';

const RRPortalHeader = () => {
    const navigate = useNavigate();

    return (
        <nav className="bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto w-full px-6 h-16 flex items-center justify-between">

                {/* Left: Brand — clickable, routes to main portal */}
                <button
                    onClick={() => navigate('/jobs')}
                    className="flex items-center gap-3 group"
                >
                    <div className="bg-[#D6402F] p-2 rounded-xl shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
                        <img src="/assets/deped-seal.png" alt="DepEd" className="w-4 h-4 object-contain" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-[#1B3A6B] uppercase tracking-tight leading-none">
                            PRIME-HRM
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            Employee Portal
                        </p>
                    </div>
                </button>

                {/* Right: Nav links + account block + back button */}
                <div className="flex items-center gap-6">
                    <NavLink
                        to="/jobs/rr-opportunities"
                        className={({ isActive }) =>
                            `text-[10px] font-black uppercase tracking-widest transition-colors ${
                                isActive ? 'text-[#D6402F]' : 'text-slate-400 hover:text-[#1B3A6B]'
                            }`
                        }
                    >
                        My Nominations
                    </NavLink>
                    <NavLink
                        to="/jobs/my-awards"
                        className={({ isActive }) =>
                            `text-[10px] font-black uppercase tracking-widest transition-colors ${
                                isActive ? 'text-[#D6402F]' : 'text-slate-400 hover:text-[#1B3A6B]'
                            }`
                        }
                    >
                        Awardees
                    </NavLink>

                    <ApplicantAccountBlock />
                    <PortalBackButton />
                </div>
            </div>
        </nav>
    );
};

export default RRPortalHeader;
