import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Minus } from 'lucide-react';

const ApplicantSwitcherTabs = ({ applicants, selectedId, onSelect, scoresMap, criteria }) => {
  const getApplicantStatus = (appId) => {
    if (!criteria || criteria.length === 0) return 'none';
    const appScores = scoresMap?.[appId] || {};
    let scored = 0;
    let total = criteria.length;
    for (const c of criteria) {
      if (appScores[c.id] !== undefined && appScores[c.id] !== null) {
        scored++;
      }
    }
    if (scored === total) return 'complete';
    if (scored > 0) return 'in-progress';
    return 'not-started';
  };

  const statusConfig = {
    'complete': { icon: Check, dot: 'bg-emerald-400', label: 'Complete' },
    'in-progress': { icon: Minus, dot: 'bg-amber-400', label: 'In progress' },
    'not-started': { icon: Circle, dot: 'bg-slate-300', label: 'Not started' },
    'none': { icon: Circle, dot: 'bg-transparent', label: '' },
  };

  return (
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">
        Select Applicant to Rate
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {applicants.map(app => {
          const active = selectedId === app.id;
          const status = getApplicantStatus(app.id);
          const cfg = statusConfig[status];
          return (
            <motion.button
              key={app.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(app.id)}
              className={`relative shrink-0 text-left px-5 py-3 rounded-xl border-2 transition-colors ${
                active
                  ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white shadow-lg'
                  : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="text-xs font-black uppercase truncate max-w-[140px]">{app.full_name}</p>
                {status !== 'none' && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} title={cfg.label} />
                )}
              </div>
              <p className={`text-[10px] font-bold mt-0.5 ${active ? 'text-blue-200' : 'text-slate-400'}`}>
                {app.applicant_code}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicantSwitcherTabs;
