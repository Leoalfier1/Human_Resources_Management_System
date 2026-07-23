import React from 'react';

const CoachingPlansCard = ({ plans = [] }) => {
    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 select-none">
            <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">My Coaching Plans</h3>

            <div className="space-y-3">
                {plans.map((plan) => {
                    const isOpen = plan.status === 'open' || plan.status === 'planned';
                    return (
                        <div 
                            key={plan.id} 
                            className={`p-4 rounded-2xl border transition-all
                                ${isOpen 
                                    ? 'bg-amber-50/60 border-amber-300 shadow-sm' 
                                    : 'bg-slate-50 border-slate-100'}`}
                        >
                            <p className={`text-xs font-black uppercase tracking-tight ${isOpen ? 'text-amber-700' : 'text-[#1e293b]'}`}>{plan.topic}</p>
                            <p className="text-[11px] text-slate-800 font-bold mt-1 uppercase">Action: <span className="font-normal text-black lowercase first-letter:uppercase">{plan.agreed_actions}</span></p>
                            
                            <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase">
                                <span className="text-slate-600 font-bold">Due: {plan.session_date}</span>
                                {isOpen ? (
                                    <span className="text-amber-600 font-black tracking-wide">
                                        &middot; open
                                    </span>
                                ) : (
                                    <span className="text-emerald-600 font-black tracking-wide">
                                        &middot; resolved
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
                {plans.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-600 font-bold">
                        No scheduled coaching plans.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoachingPlansCard;
