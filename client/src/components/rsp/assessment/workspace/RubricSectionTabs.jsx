import React from 'react';
import { motion } from 'framer-motion';

const RubricSectionTabs = ({ sections, activeSection, onSelect, sectionScores }) => {
  return (
    <div className="flex gap-2 border-b border-slate-200">
      {sections.map(sec => {
        const active = activeSection === sec.key;
        const score = sectionScores?.[sec.key] ?? 0;
        return (
          <button
            key={sec.key}
            onClick={() => onSelect(sec.key)}
            className={`relative flex-1 px-4 py-3 text-left transition-colors ${
              active ? 'bg-[#1B3A6B]/5' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-[#1B3A6B]' : 'text-slate-400'}`}>
                  {sec.key}. {sec.label}
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{sec.category}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-black ${active ? 'text-[#1B3A6B]' : 'text-slate-500'}`}>
                    {score.toFixed(1)}
                  </p>
                  <span className="text-[9px] font-black text-[#1B3A6B] bg-[#1B3A6B]/5 px-1.5 py-0.5 rounded-full">
                    {sec.weightPercent}%
                  </span>
                </div>
                <p className="text-[9px] font-bold text-slate-400">/ {sec.weightPercent}</p>
              </div>
            </div>
            {active && (
              <motion.div
                layoutId="section-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1B3A6B] rounded-t-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default RubricSectionTabs;
