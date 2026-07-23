import React from 'react';

const ProgressCard = ({ obj }) => {
    const isHighProgress = (obj.progress_percent || 0) >= 75;

    return (
        <div className="pt-6 first:pt-0 space-y-4 select-none">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-[#1e293b] uppercase tracking-tight">{obj.kra_name}</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Wt: {obj.weight_percent}%</span>
                </div>
                <p className="text-xs text-black font-bold leading-relaxed">{obj.objective_description}</p>
            </div>

            {/* Side by side Target & Progress boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Target</span>
                    <p className="text-xs font-bold text-black leading-relaxed">{obj.target_statement}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Current Progress</span>
                    <p className="text-xs font-bold text-black leading-relaxed">{obj.actual_accomplishment || "No progress registered yet."}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-800 uppercase">
                    <span>Milestone Completion</span>
                    <span className={isHighProgress ? 'text-emerald-600' : 'text-black'}>
                        {obj.progress_percent}%
                    </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex items-center">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${isHighProgress ? 'bg-emerald-600' : 'bg-[#1e293b]'}`}
                        style={{ width: `${obj.progress_percent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProgressCard;
