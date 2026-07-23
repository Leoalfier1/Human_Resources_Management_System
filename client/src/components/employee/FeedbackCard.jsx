import React from 'react';

const FeedbackCard = ({ feedback = [], phaseLabels = {} }) => {
    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 select-none">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest border-b border-slate-100 pb-3">Recent Feedback</h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {feedback.length > 0 ? (
                    feedback.map((fb) => (
                        <div key={fb.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-black text-black uppercase">{fb.rater_name || "Rater"}</span>
                                <span className="text-slate-600 font-bold">{fb.feedback_date ? fb.feedback_date.split('T')[0] : "—"}</span>
                            </div>
                            <p className="text-[11px] text-black leading-relaxed italic line-clamp-3">
                                "{fb.content}"
                            </p>
                            <div className="pt-1 flex items-center justify-between">
                                <span className="inline-block bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                    {phaseLabels[fb.phase] || "—"}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 text-xs text-slate-600 font-bold">
                        No recent feedback logs.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackCard;
