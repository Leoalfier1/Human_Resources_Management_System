import React from 'react';
import { motion } from 'framer-motion';

const NomineeTabs = ({ nominees, selectedNomineeId, onSelectNominee }) => {
    if (nominees.length === 0) {
        return (
            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest py-2">
                No nominees at this stage
            </div>
        );
    }

    return (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
            {nominees.map(nom => {
                const isActive = nom.nomination_id === selectedNomineeId;
                const lastName = nom.nominee_name?.split(' ').pop() || nom.nominee_name;
                return (
                    <button
                        key={nom.nomination_id}
                        onClick={() => onSelectNominee(nom.nomination_id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                            isActive
                                ? 'bg-[#1B3A6B] text-white shadow-md'
                                : 'border border-[#1B3A6B] text-[#1B3A6B] hover:bg-[#1B3A6B]/10'
                        }`}
                    >
                        {lastName}
                    </button>
                );
            })}
        </div>
    );
};

export default NomineeTabs;
