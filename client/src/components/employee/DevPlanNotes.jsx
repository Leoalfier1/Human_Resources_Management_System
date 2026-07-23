import React from 'react';

const DevPlanNotes = ({ raterName, notes }) => {
    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3 select-none">
            <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">Development Plan Discussion Notes</h3>
            
            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">From your rater ({raterName || "Evaluator"})</span>
                <p className="text-xs font-bold text-black leading-relaxed max-w-3xl italic">
                    {notes || "No notes registered. Development needs discussions will show up here after midyear review session."}
                </p>
            </div>
        </div>
    );
};

export default DevPlanNotes;
