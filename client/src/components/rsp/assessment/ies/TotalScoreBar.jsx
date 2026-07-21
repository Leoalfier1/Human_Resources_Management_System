import React from 'react';

const TotalScoreBar = ({ runningTotal }) => (
    <div className="bg-[#D6402F] rounded-2xl px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-black uppercase tracking-widest text-white">Total Score</span>
        <span className="text-2xl font-black text-white">
            {Number(runningTotal).toFixed(2)}
            <span className="text-sm font-bold text-white/70 ml-1">/ 100</span>
        </span>
    </div>
);

export default TotalScoreBar;
