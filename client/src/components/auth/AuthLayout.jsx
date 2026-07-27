import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, BookOpen, Users, Star, CheckCircle } from 'lucide-react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans text-slate-900 bg-[#F1F3F6]">
      {/* TOP DECORATIVE STRIP (PH FLAG COLORS) */}
      <div className="fixed top-0 left-0 w-full h-1 flex z-50">
        <div className="h-full w-1/4 bg-[#1B3A6B]"></div>
        <div className="h-full w-1/4 bg-[#E11D48]"></div>
        <div className="h-full w-1/4 bg-[#FACC15]"></div>
        <div className="h-full w-1/4 bg-[#1B3A6B]"></div>
      </div>

      {/* LEFT PANEL - PERSISTENT BRANDING */}
      <div className="relative w-full md:w-[42%] bg-[#1B3A6B] text-white p-8 md:p-12 flex flex-col justify-between overflow-hidden">
        
        {/* Subtle Decorative Rings */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 border-4 border-white/5 rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 border-4 border-white/5 rounded-full"></div>

        <div className="relative z-10">
          {/* Header Logos Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20 text-[10px] text-center p-2">DepEd Seal</div>
            <div className="text-center">
              <p className="text-[10px] tracking-widest uppercase opacity-80">Republic of the Philippines</p>
              <h2 className="text-lg font-bold leading-tight uppercase">Department of Education</h2>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20 text-[10px] text-center p-2">Region IX Seal</div>
          </div>

          <p className="text-[#FACC15] text-center font-bold text-xs tracking-wider mb-4">
            REGION IX – SCHOOLS DIVISION OFFICE OF DAPITAN CITY
          </p>
          
          <div className="h-px bg-white/20 w-full mb-8"></div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Human Resource Management Information System
          </h1>

          <div className="inline-flex items-center gap-2 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-6">
            <CheckCircle size={14} />
            PRIME-HRM COMPLIANT SYSTEM
          </div>

          <p className="text-slate-300 text-sm leading-relaxed mb-10 max-w-md">
            Empowering Human Resource Management through PRIME-HRM — streamlining processes for a more efficient, transparent, and accountable public service.
          </p>

          {/* Module Grid */}
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-4">System Modules</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'RSP', name: 'Recruitment & Placement', icon: <Users size={18} /> },
              { id: 'L&D', name: 'Learning & Development', icon: <BookOpen size={18} /> },
              { id: 'PM', name: 'Performance Management', icon: <Award size={18} /> },
              { id: 'R&R', name: 'Rewards & Recognition', icon: <Star size={18} /> }
            ].map((mod) => (
              <div key={mod.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-2">
                <div className="bg-orange-600 w-8 h-8 rounded-lg flex items-center justify-center">
                  {mod.icon}
                </div>
                <div>
                  <div className="font-bold text-sm">{mod.id}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{mod.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info at bottom of left panel */}
        <div className="mt-12 relative z-10">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
            <p className="text-[10px] uppercase text-slate-400 mb-1">DepEd Core Values</p>
            <p className="italic text-sm text-slate-200 font-serif">"Maka-Diyos, Makatao, Makakalikasan, at Makabansa"</p>
          </div>
          <p className="text-[10px] text-slate-500">
            © 2026 DepEd Schools Division Office of Dapitan City | Region IX<br/>
            All Rights Reserved | Official Government Portal
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - DYNAMIC AUTH CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        {children}
        <p className="mt-8 text-slate-400 text-xs flex items-center gap-1">
          <Shield size={14} /> Secured by PRIME-HRM Standards
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;