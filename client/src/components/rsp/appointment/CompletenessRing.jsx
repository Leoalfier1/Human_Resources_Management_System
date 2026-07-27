import React from 'react';

const CompletenessRing = ({ verified, total }) => {
  const percentage = (verified / total) * 100;
  const stroke = 8;
  const radius = 50;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-40 h-40 mx-auto">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle stroke="#e2e8f0" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke="#10b981" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-[#1B3A6B]">{verified}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase">of {total}</span>
      </div>
    </div>
  );
};

export default CompletenessRing;