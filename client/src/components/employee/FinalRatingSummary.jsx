import React from 'react';
import { Star } from 'lucide-react';

const FinalRatingSummary = ({ ratingPeriodLabel, score, label, ratings = [] }) => {
    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-6 select-none w-full">
            <div className="w-full text-left">
                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest border-b border-slate-100 pb-3">Final Rating Summary — {ratingPeriodLabel}</h3>
            </div>

            {/* Big Score Card */}
            <div className="space-y-2">
                <p className="text-6xl font-black text-[#1e293b] tracking-tighter">{score ?? "—"}</p>
                <p className="text-sm font-black text-blue-600 uppercase tracking-wider">{label || "—"}</p>
                
                <div className="pt-2 flex justify-center">
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
                        <Star size={12} className="fill-current" /> {score ?? "—"} &mdash; {label || "—"}
                    </span>
                </div>
            </div>

            {/* KRA Breakdown Table list */}
            <div className="w-full space-y-3 pt-4 border-t border-slate-100">
                {ratings.length > 0 ? (
                    ratings.map((r, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold py-1 border-b border-slate-50 last:border-0">
                            <span className="text-slate-800 text-left line-clamp-1 max-w-[200px] uppercase text-[10px] tracking-tight">{r.name}</span>
                            <div className="flex items-center gap-4 shrink-0 text-black">
                                <span className="font-black text-sm">{r.rating || "-"}</span>
                                <span className="text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">x{r.weight}%</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-6 text-center">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">No ratings yet</p>
                        <p className="text-[10px] text-slate-300 mt-1">Ratings will appear once your IPCRF has been evaluated</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinalRatingSummary;
