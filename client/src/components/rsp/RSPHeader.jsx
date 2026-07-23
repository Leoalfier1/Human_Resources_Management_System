import React from 'react';
import { Bell } from 'lucide-react';

const RSPHeader = ({ title }) => {
  return (
    <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div>
        <h3 className="text-xl font-bold text-black leading-tight">{title}</h3>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
          RSP Module · Human Resource Management Information System · Schools Division Office of Dapitan City
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer text-slate-600 hover:text-black transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
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
