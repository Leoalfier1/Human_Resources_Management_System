import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import RSPAdminLayout from '../rsp/RSPAdminLayout';
import { motion } from 'framer-motion';

const RSPModule = ({ onBack }) => {
  const { user, isAdmin, isApplicant } = useAuth();
  
  // Track which RSP screen is currently active
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- 1. ADMIN / STAFF VIEW ---
  // If the user is an Admin, HR Staff, or HRMPSB, they see the Sidebar + Header Layout
  if (isAdmin || user.role === 'hr_staff' || user.role === 'hrmpsb' || user.role === 'appointing_authority') {
    return (
      <RSPAdminLayout 
        activeTab={activeTab} 
        onNavigate={setActiveTab} 
        onBack={onBack}
        userName={user?.fullName}
        userRoleLabel={user?.role === 'admin' ? 'HR Administrator' : 'HRMPSB Secretariat'}
      >
        {/* PHASE 0 PLACEHOLDER CONTENT */}
        {/* In Phases 1-9, we will replace this div with actual screens */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[calc(100vh-180px)] p-12 flex flex-col items-center justify-center text-center"
        >
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B3A6B] mb-6">
             <span className="text-3xl font-black italic">RSP</span>
          </div>
          <h2 className="text-3xl font-black text-[#1B3A6B] uppercase tracking-tight mb-2">
            {activeTab.replace('-', ' ')}
          </h2>
          <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
            Phase 0 Foundation Ready. The infrastructure for the 11-stage RSP process is connected to MySQL. 
            <br />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D6402F] mt-4 block">
              Authorized Personnel Access Only
            </span>
          </p>
        </motion.div>
      </RSPAdminLayout>
    );
  }

  // --- 2. APPLICANT VIEW ---
  // Applicants get a completely different, simplified view with no admin sidebar.
  if (isApplicant) {
    return (
      <div className="min-h-screen bg-[#F1F3F6]">
        {/* Simple Applicant Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 md:px-20">
          <div className="flex items-center gap-4">
             <div className="bg-[#D6402F] p-2 rounded-lg">
                <span className="text-white font-black text-lg">D</span>
             </div>
             <div>
               <h1 className="text-xl font-bold text-[#1B3A6B]">Applicant Job Portal</h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SDO Dapitan City</p>
             </div>
          </div>
          <button onClick={onBack} className="text-sm font-bold text-[#1B3A6B] hover:underline">
            ← Back to Pillars
          </button>
        </header>

        <main className="max-w-5xl mx-auto py-12 px-6">
          <div className="bg-white p-12 rounded-[40px] shadow-xl border border-slate-200">
            <h2 className="text-3xl font-black text-[#1B3A6B] mb-4">Welcome, {user?.fullName}</h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              Explore available teaching and non-teaching vacancies in Region IX. Submit your 
              documents digitally and track your application progress in real-time.
            </p>

            <div className="grid gap-6">
               <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest">Active Vacancies will appear here</p>
               </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Fallback if role is undefined
  return <div className="p-20 text-center">Unauthorized Access</div>;
};

export default RSPModule;
