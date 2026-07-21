import React from 'react';
import { motion } from 'framer-motion';

const SECTION_BAR_COLORS = [
  { bar: 'bg-blue-500', track: 'bg-blue-100' },
  { bar: 'bg-purple-500', track: 'bg-purple-100' },
  { bar: 'bg-teal-500', track: 'bg-teal-100' },
];

const GRID_COLS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const ScoreBreakdownPanel = ({ sectionScores, sectionsMeta, layoutMode }) => {
  if (layoutMode !== 'sectioned' || !sectionsMeta || sectionsMeta.length === 0) return null;

  const colsClass = GRID_COLS[Math.min(sectionsMeta.length, 4)] || 'grid-cols-3';

  return (
    <div className={`grid ${colsClass} gap-3`}>
      {sectionsMeta.map((sec, idx) => {
        const score = sectionScores?.[sec.key] ?? 0;
        const pct = sec.weightPercent > 0 ? Math.min(100, (score / sec.weightPercent) * 100) : 0;
        const colors = SECTION_BAR_COLORS[idx % SECTION_BAR_COLORS.length];

        return (
          <div key={sec.key} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {sec.key}. {sec.label}
              </p>
              <span className="text-[10px] font-black text-[#1B3A6B] bg-[#1B3A6B]/5 px-2 py-0.5 rounded-full">
                {sec.weightPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-xl font-black text-[#1B3A6B] tabular-nums">{score.toFixed(2)}</span>
              <span className="text-[10px] font-bold text-slate-400">/ {sec.weightPercent}</span>
            </div>
            {/* Colored progress bar */}
            <div className={`h-2 ${colors.track} rounded-full overflow-hidden`}>
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`h-full rounded-full ${colors.bar}`}
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-1.5 text-right tabular-nums">
              {pct.toFixed(0)}% of weight
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ScoreBreakdownPanel;
