import React from 'react';
import { motion } from 'framer-motion';

const CriterionScoreRow = ({ criterion, score, onScoreChange, onScoreCommit }) => {
    const max = Number(criterion.max_score || 0);
    const val = Number(score) || 0;
    const pct = max ? Math.min(100, Math.round((val / max) * 100)) : 0;

    return (
        <tr className="align-middle">
            <td className="px-5 py-4">
                <p className="text-xs font-black text-slate-700">{criterion.sub_criterion_label}</p>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ width: `${pct}%` }}
                            className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-slate-300'}`}
                        />
                    </div>
                    <span className="text-[9px] font-black text-slate-400">{pct}%</span>
                </div>
            </td>
            <td className="px-5 py-4 text-right text-xs font-black text-[#D6402F]">
                {Number(criterion.weight_percent).toFixed(2)} pts
            </td>
            <td className="px-5 py-4 text-right">
                <input
                    type="number"
                    min="0"
                    max={criterion.max_score}
                    step="0.01"
                    value={val.toFixed ? val.toFixed(2) : val}
                    onChange={e => onScoreChange(criterion.id, e.target.value)}
                    onBlur={e => onScoreCommit(criterion, e.target.value)}
                    className="w-20 text-center font-black text-[#1B3A6B] border border-slate-200 rounded-lg py-1 text-sm outline-none focus:border-[#1B3A6B]"
                />
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">of {Number(criterion.max_score).toFixed(2)}</p>
            </td>
            <td className="px-5 py-4 text-right text-sm font-black text-[#1B3A6B]">
                {((val / max) * criterion.weight_percent).toFixed(2)}
            </td>
        </tr>
    );
};

const FlatCriteriaList = ({ criteria, localScores, scores, onScoreChange, onScoreCommit }) => {
    const getScore = (criterionId) =>
        localScores[criterionId] !== undefined ? localScores[criterionId] : (scores[criterionId] ?? 0);

    const getWeightedScore = (criterion) => {
        const max = Number(criterion.max_score) || 0;
        if (!max) return 0;
        return (getScore(criterion.id) / max) * criterion.weight_percent;
    };

    const runningTotal = criteria.reduce((acc, c) => acc + getWeightedScore(c), 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-black text-[#1B3A6B] uppercase flex items-center gap-2">
                    COMPARATIVE ASSESSMENT CRITERIA
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                        <tr>
                            <th className="px-5 py-3">Criteria</th>
                            <th className="px-5 py-3 text-right">Weight Allocation</th>
                            <th className="px-5 py-3 text-right">Actual Score</th>
                            <th className="px-5 py-3 text-right">Weighted Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {criteria.map(c => (
                            <CriterionScoreRow
                                key={c.id}
                                criterion={c}
                                score={getScore(c.id)}
                                onScoreChange={onScoreChange}
                                onScoreCommit={onScoreCommit}
                            />
                        ))}
                        <tr className="bg-slate-50/60 font-black">
                            <td className="px-5 py-4 text-xs text-slate-500 uppercase" colSpan="3">Running Total</td>
                            <td className="px-5 py-4 text-right text-xl font-black text-[#D6402F]">
                                {runningTotal.toFixed(2)} <span className="text-xs text-slate-400">/ 100.00</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FlatCriteriaList;