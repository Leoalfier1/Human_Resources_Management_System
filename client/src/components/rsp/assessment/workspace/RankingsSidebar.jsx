import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Loader2 } from 'lucide-react';

const RANK_STYLES = [
  { bg: 'bg-yellow-400', text: 'text-yellow-900', label: 'Gold' },
  { bg: 'bg-slate-300', text: 'text-slate-700', label: 'Silver' },
  { bg: 'bg-amber-600', text: 'text-amber-50', label: 'Bronze' },
];

const SECTION_COLORS = ['#3b82f6', '#a855f7', '#14b8a6'];
const SECTION_BG = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500'];

const LEGACY_KEYS = ['A', 'B', 'C'];

const RankingsSidebar = ({
  rankings, selectedApplicantId, onSelectApplicant,
  sectionScores, totalScore, currentTimestamp,
  saving, onExport, layoutMode, criteria, sectionsMeta
}) => {
  const maxScore = rankings.length > 0 ? Math.max(1, Number(rankings[0].total_score || 0)) : 1;
  const flatMax = 100;

  const sectionKeys = useMemo(() => {
    if (sectionsMeta && sectionsMeta.length > 0) return sectionsMeta.map(s => s.key);
    return LEGACY_KEYS;
  }, [sectionsMeta]);

  const getSubscore = (r, key) => {
    if (key === 'A') return Number(r.category_subscore_classroom || 0);
    if (key === 'B') return Number(r.category_subscore_nonclassroom || 0);
    if (key === 'C') return Number(r.category_subscore_document || 0);
    return 0;
  };

  return (
    <div className="w-[380px] shrink-0 space-y-4">
      {/* Rankings Card */}
      <div className="bg-[#1B3A6B] rounded-[2rem] p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Comparative Assessment Rankings</h3>
            <p className="text-[10px] font-bold text-blue-300 mt-0.5">Real-time ranked results</p>
          </div>
          <button
            onClick={onExport}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Bulk-Download results"
          >
            <Download size={16} className="text-blue-300" />
          </button>
        </div>

        <div className="space-y-3">
          {rankings.map((r, i) => {
            const isSelected = r.id === selectedApplicantId;
            const rankStyle = i < 3 ? RANK_STYLES[i] : null;
            const barWidth = maxScore > 0 ? ((Number(r.total_score || 0) / maxScore) * 100) : 0;

            return (
              <motion.button
                key={r.id}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => onSelectApplicant(r.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-white/15 ring-1 ring-white/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    rankStyle ? `${rankStyle.bg} ${rankStyle.text}` : 'bg-white/10 text-white'
                  }`}>
                    {i === 0 ? <Award size={14} /> : `#${r.rank_val || i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate">{r.full_name}</p>
                    <p className="text-[9px] font-bold text-blue-300">{r.applicant_code}</p>
                  </div>
                  <span className="text-sm font-black text-yellow-400 shrink-0 tabular-nums">
                    {parseFloat(r.total_score || 0).toFixed(2)}
                  </span>
                </div>

                {/* Per-applicant category mini-bars */}
                {layoutMode === 'sectioned' && sectionKeys.length > 0 ? (
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${sectionKeys.length}, 1fr)` }}>
                    {sectionKeys.map((key, idx) => {
                      const meta = sectionsMeta?.find(s => s.key === key);
                      const max = meta?.weightPercent || 1;
                      const score = getSubscore(r, key);
                      const pct = max > 0 ? Math.min(100, (score / max) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: `${pct}%` }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: SECTION_COLORS[idx % SECTION_COLORS.length] }}
                            />
                          </div>
                          <p className="text-[7px] font-bold text-blue-300/60 mt-0.5">
                            {meta?.label?.split(' ')[0] || key} {score.toFixed(1)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${barWidth}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="h-full bg-gradient-to-r from-blue-400 to-yellow-400 rounded-full"
                    />
                  </div>
                )}
              </motion.button>
            );
          })}
          {rankings.length === 0 && (
            <p className="text-xs text-blue-300 text-center py-4">No applicants yet</p>
          )}
        </div>
      </div>

      {/* Score Breakdown Panel */}
      {selectedApplicantId && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">
            Score Breakdown &middot; {rankings.find(r => r.id === selectedApplicantId)?.applicant_code || '—'}
          </h4>

          <div className="space-y-4 mb-5">
            {layoutMode === 'sectioned' && sectionsMeta ? (
              sectionsMeta.map((sec, idx) => (
                <BreakdownRow
                  key={sec.key}
                  label={`${sec.key}. ${sec.label}`}
                  score={sectionScores[sec.key] ?? 0}
                  max={sec.weightPercent}
                  color={SECTION_COLORS[idx % SECTION_COLORS.length]}
                  colorBg={SECTION_BG[idx % SECTION_BG.length]}
                />
              ))
            ) : (
              <BreakdownRow label="Total Weighted Score" score={totalScore} max={flatMax} color="#3b82f6" colorBg="bg-blue-500" />
            )}
          </div>

          {/* Stacked Total Bar */}
          {layoutMode === 'sectioned' && sectionsMeta && sectionsMeta.length > 0 && totalScore > 0 && (
            <div className="mb-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Score</p>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                {sectionsMeta.map((sec, idx) => {
                  const score = sectionScores[sec.key] ?? 0;
                  const pctOfTotal = totalScore > 0 ? (score / totalScore) * 100 : 0;
                  return (
                    <motion.div
                      key={sec.key}
                      animate={{ width: `${pctOfTotal}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{ backgroundColor: SECTION_COLORS[idx % SECTION_COLORS.length] }}
                      title={`${sec.label}: ${score.toFixed(2)}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Score</span>
              <div className="text-right">
                <span className="text-3xl font-black text-[#D6402F] tabular-nums">{totalScore.toFixed(2)}</span>
                <span className="text-xs text-slate-400 ml-1">/ {flatMax}</span>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-400 text-right mt-1">
              as of {currentTimestamp}
            </p>
          </div>

          {saving && (
            <div className="flex items-center gap-2 justify-center mt-3 text-[10px] font-bold text-slate-400">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BreakdownRow = ({ label, score, max, color, colorBg }) => {
  const ratio = max > 0 ? score / max : 0;
  const pct = Math.min(100, ratio * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-bold text-slate-600">{label}</span>
        <span className="text-[11px] font-black text-[#1B3A6B] tabular-nums">{score.toFixed(2)}/{max}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default RankingsSidebar;
