import React from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';

const DevPlanItemsList = ({ items = [], onLDRedirect }) => {
    const badgeStyles = {
        enrolled: "bg-emerald-100 text-emerald-800 border-emerald-200",
        nominated: "bg-blue-100 text-blue-800 border-blue-200",
        scheduled: "bg-amber-100 text-amber-800 border-amber-200",
        completed: "bg-slate-100 text-black border-slate-200"
    };

    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 select-none">
            <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-slate-800" /> My Development Plan
            </h3>

            <div className="space-y-4">
                {items.map((item) => (
                    <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-[#1e293b] uppercase tracking-tight">{item.program_name}</h4>
                            </div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider text-[9px]">Addresses: <span className="font-medium text-black uppercase text-[10px]">{item.addresses}</span></p>

                            <button
                                onClick={() => onLDRedirect(item.program_name)}
                                className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1 pt-1 transition-colors cursor-pointer"
                            >
                                <GraduationCap size={13} /> View in L&D Module
                            </button>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2 shrink-0">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${badgeStyles[item.status]}`}>
                                {item.status}
                            </span>
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">{item.scheduled_date}</span>
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-600 font-bold">
                        No development programs mapped for this cycle.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DevPlanItemsList;
