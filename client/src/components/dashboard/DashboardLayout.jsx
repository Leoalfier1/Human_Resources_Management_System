import React from 'react';
import { Shield } from 'lucide-react';

export const InfoBanner = () => (
  <div className="bg-slate-200/50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 mt-12">
    <div className="w-12 h-12 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white shrink-0">
      <Shield size={24} />
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
);

export const DashboardFooter = () => (
  <footer className="w-full bg-[#1B3A6B] mt-20 relative">
    <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-400/50" />
    <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-slate-300 text-xs">
        © 2026 DepEd Schools Division Office of Dapitan City | Region IX
      </p>
      <div className="flex gap-6">
        {["Privacy Policy", "Accessibility", "Help Desk"].map((link) => (
          <a key={link} href="#" className="text-slate-300 hover:text-white text-xs transition-colors">
            {link}
          </a>
        ))}
      </div>
    </div>
  </footer>
);