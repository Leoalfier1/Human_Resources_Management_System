import React from 'react';

const StatusBadge = ({ status }) => {
  const config = {
    submitted: "bg-blue-50 text-blue-600 border-blue-100",
    under_evaluation: "bg-purple-50 text-purple-600 border-purple-100",
    qualified: "bg-emerald-50 text-emerald-600 border-emerald-100",
    disqualified: "bg-red-50 text-red-600 border-red-100",
    shortlisted: "bg-amber-50 text-amber-600 border-amber-100",
    selected: "bg-teal-50 text-teal-600 border-teal-100",
    appointed: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config[status] || "bg-slate-50 text-slate-500"}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;