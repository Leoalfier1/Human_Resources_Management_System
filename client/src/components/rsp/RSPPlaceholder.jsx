import React from 'react';
import { motion } from 'framer-motion';
import { Construction, ShieldCheck, Activity, Info } from 'lucide-react';

const RSPPlaceholder = ({ title }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-6xl mx-auto"
    >
      {/* 1. Module Status Bar */}
      <div className="flex items-center justify-between mb-6 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Module Status</p>
            <p className="text-sm font-bold text-black leading-none uppercase tracking-tight">Phase 0: Infrastructure Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider">Ready for Implementation</span>
        </div>
      </div>

      {/* 2. Main Placeholder Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col items-center justify-center relative">
        
        {/* Subtle Background Decoration */}
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <ShieldCheck size={300} />
        </div>

        {/* Content Section */}
        <div className="text-center relative z-10 px-6">
          <div className="inline-flex p-5 bg-slate-50 rounded-3xl border border-slate-100 mb-6 text-slate-300">
            <Construction size={64} strokeWidth={1.5} className="animate-bounce duration-[2000ms]" />
          </div>
          
          <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter mb-4">
            {title}
          </h2>
          
          <div className="max-w-md mx-auto space-y-4">
            <p className="text-slate-800 font-medium leading-relaxed">
              This workspace is part of the <span className="text-black font-bold">11-Stage RSP Workflow</span>. 
              The backend infrastructure and database schema are currently connected.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {['MySQL Connected', 'JWT Auth Active', 'RBAC Secured', 'File Upload Ready'].map((tag) => (
                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box Footer */}
        <div className="mt-12 flex items-center gap-3 bg-blue-50/50 border border-blue-100 p-4 rounded-2xl max-w-lg mx-auto">
          <Info size={20} className="text-black shrink-0" />
          <p className="text-xs text-black leading-relaxed text-left">
            <strong>System Developer Note:</strong> Access to this screen is restricted to authorized HR Personnel. 
            Detailed UI for <span className="font-bold">"{title}"</span> will be implemented in the next development sprint.
          </p>
        </div>
      </div>

      {/* 3. Small Footer Label */}
      <p className="mt-6 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
        DepEd SDO Dapitan City · PRIME-HRM Compliant System
      </p>
    </motion.div>
  );
};

export default RSPPlaceholder;
