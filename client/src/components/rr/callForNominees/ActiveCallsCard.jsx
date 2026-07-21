import React from 'react';
import { motion } from 'framer-motion';

const ActiveCallsCard = ({ calls, selectedCallId, onSelectCall }) => {
    const formatDate = (d) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 h-full"
        >
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B] mb-4">
                Active Calls
            </h3>

            {calls.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No nomination calls yet</p>
                    <p className="text-[10px] mt-1">Configure and publish a call to get started</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {calls.map((call, i) => {
                        const isSelected = call.id === selectedCallId;
                        const isClosed = call.computed_status === 'closed';
                        return (
                            <motion.button
                                key={call.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => onSelectCall(call)}
                                className={`w-full text-left p-4 rounded-xl transition-all ${
                                    isSelected
                                        ? 'bg-[#1B3A6B] text-white shadow-lg'
                                        : 'hover:bg-slate-50 border border-slate-100'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-[#1B3A6B]'}`}>
                                            {call.award_type_name}
                                        </p>
                                        <p className={`text-[10px] mt-1 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                            Closes {formatDate(call.nomination_closes)} · {call.nominee_count || 0} nominees
                                        </p>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ml-2 shrink-0 ${
                                        isClosed
                                            ? 'bg-slate-200 text-slate-500'
                                            : call.computed_status === 'published'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {isClosed ? 'CLOSED' : call.computed_status}
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default ActiveCallsCard;
