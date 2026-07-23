import React from 'react';

const HeroBanner = ({ name, position, unit, rating, ratingLabel }) => {
    return (
        <div className="bg-[#1e293b] text-white rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden select-none">
            <div className="space-y-2 z-10">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Welcome back,</p>
                <div className="text-3xl font-black tracking-tight text-white">{name || "Employee"}</div>
                {(position || unit) ? (
                    <p className="text-sm text-white/60 font-medium">
                        {position} {position && unit && <span>&middot;</span>} <span className="opacity-80">{unit}</span>
                    </p>
                ) : (
                    <p className="text-sm text-white/40 font-medium italic">No position on file</p>
                )}
            </div>

            {/* Projected midyear rating */}
            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center min-w-[200px] shadow-lg z-10 shrink-0">
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Midyear Rating (projected)</p>
                <p className="text-4xl font-black text-white">{rating ? Number(rating).toFixed(2) : "—"}</p>
                <p className="text-xs font-bold text-blue-400 mt-1 uppercase tracking-wider">{ratingLabel || "—"}</p>
            </div>
        </div>
    );
};

export default HeroBanner;
