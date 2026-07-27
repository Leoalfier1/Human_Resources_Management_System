import React from 'react';
import { Bell } from 'lucide-react';

const RSPHeader = ({ title }) => {
  return (
    <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div>
        <h1 className="text-xl font-bold text-[#1B3A6B] leading-tight">{title}</h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          RSP Module · HRMIS · Schools Division Office of Dapitan City
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer text-slate-400 hover:text-[#1B3A6B] transition-colors">
          <Bell size={20} />
        </div>
        
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-100 group-hover:ring-[#1B3A6B]/20 transition-all">
            HR
          </div>
          {/* Dropdown would trigger here */}
        </div>
      </div>
    </header>
  );
};

export default RSPHeader;