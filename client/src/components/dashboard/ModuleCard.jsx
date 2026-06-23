import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const ModuleCard = ({ icon: Icon, badge, title, description, status, onClick }) => {
  const isActive = status === 'active';

  return (
    <motion.div
      // 1. Entrance Animation
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      // 2. Hover Animation (Only if active)
      whileHover={isActive ? { y: -8, scale: 1.02, transition: { duration: 0.2 } } : {}}
      // 3. The Click Handler (Triggers the module selection in App.jsx)
      onClick={() => {
        if (isActive && onClick) {
          onClick();
        }
      }}
      className={`relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full transition-shadow duration-300 ${
        isActive ? 'cursor-pointer hover:shadow-2xl' : 'opacity-80 cursor-default'
      }`}
    >
      {/* Colored Left Edge Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isActive ? 'bg-[#D6402F]' : 'bg-slate-300'}`} />

      <div className="p-7 flex-grow">
        {/* Top Row: Icon and Badge */}
        <div className="flex justify-between items-start mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${
            isActive ? 'bg-[#1B3A6B]' : 'bg-slate-400'
          }`}>
            <Icon size={32} strokeWidth={1.5} />
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${
            isActive ? 'bg-red-50 text-[#D6402F] border border-red-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {badge}
          </span>
        </div>

        {/* Module Text Content */}
        <h3 className={`text-xl font-black leading-tight mb-3 uppercase tracking-tight ${
          isActive ? 'text-[#1B3A6B]' : 'text-slate-400'
        }`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed mb-6 ${isActive ? 'text-slate-500 font-medium' : 'text-slate-400 italic'}`}>
          {description}
        </p>
      </div>

      {/* Bottom Action/Status Bar */}
      <div className={`px-7 py-5 border-t mt-auto flex justify-between items-center ${
        isActive ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-100/30 border-slate-200'
      }`}>
        {isActive ? (
          <>
            <div className="flex items-center gap-1.5 text-[#D6402F] text-xs font-black uppercase tracking-widest">
              Open Module <ChevronRight size={16} />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
            />
          </>
        ) : (
          <>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coming Soon</span>
            <div className="w-2.5 h-2.5 border-2 border-slate-300 rounded-full" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ModuleCard;