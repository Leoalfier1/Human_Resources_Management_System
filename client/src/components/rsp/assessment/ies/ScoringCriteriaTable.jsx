import React from 'react';
import { ClipboardList } from 'lucide-react';

const CATEGORY_BADGE = {
    teacher_i: 'Teacher I - Teaching Position',
    teaching_related: 'Teaching Related Position',
    non_teaching: 'Non-Teaching Position',
};

const numeric = (v) => Number(v || 0).toFixed(2);

const ScoringCriteriaTable = ({ evaluation, getCriterionValue, getActualScore, onScoreChange, isLocked }) => {
    if (!evaluation || !evaluation.criteria) return null;

    return (
        <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden">
            <div className="bg-[#1B3A6B] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardList size={14} className="text-white" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Scoring Criteria</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-[9px] font-black text-white uppercase tracking-wider">
                    {CATEGORY_BADGE[evaluation.position_category] || evaluation.position_category}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 w-[15%]">Criteria</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 w-[8%] text-center">Weight</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 w-[30%]">Details of Applicant's Actual Qualifications</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 w-[27%]">Computation</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 w-[10%] text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evaluation.criteria.map(criterion => {
                            const max = Number(criterion.weight_allocation || 0);
                            const score = getActualScore(criterion.criteria_key);
                            const hasExceeded = score > max;

                            return (
                                <tr key={criterion.criteria_key} className="border-b border-slate-100 align-top hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-black text-[#D6402F]">{criterion.criteria_label}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[#1B3A6B]/10 text-[10px] font-black text-[#1B3A6B]">
                                            {numeric(max)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <textarea
                                            value={getCriterionValue(criterion.criteria_key, 'qualification_notes')}
                                            onChange={(e) => onScoreChange(criterion.criteria_key, 'qualification_notes', e.target.value)}
                                            disabled={isLocked}
                                            rows={3}
                                            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] font-semibold text-slate-600 outline-none focus:border-[#1B3A6B] transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed placeholder:text-slate-300"
                                            placeholder="Enter applicant's actual qualifications..."
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <textarea
                                            value={getCriterionValue(criterion.criteria_key, 'computation_notes')}
                                            onChange={(e) => onScoreChange(criterion.criteria_key, 'computation_notes', e.target.value)}
                                            disabled={isLocked}
                                            rows={3}
                                            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] font-semibold text-slate-600 outline-none focus:border-[#1B3A6B] transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed placeholder:text-slate-300"
                                            placeholder="Note / formula used..."
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <input
                                            type="number"
                                            min="0"
                                            max={max}
                                            step="0.01"
                                            value={score}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const clamped = val === '' ? null : Math.max(0, Math.min(max, Number(val)));
                                                onScoreChange(criterion.criteria_key, 'actual_score', clamped);
                                            }}
                                            disabled={isLocked}
                                            className={`w-20 rounded-xl border px-2.5 py-2 text-right text-xs font-black outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed ${
                                                hasExceeded
                                                    ? 'border-[#D6402F] text-[#D6402F]'
                                                    : 'border-slate-200 text-slate-700 focus:border-[#1B3A6B]'
                                            }`}
                                        />
                                        {hasExceeded && (
                                            <p className="mt-1 text-[9px] font-black text-[#D6402F]">Max {numeric(max)}</p>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScoringCriteriaTable;
