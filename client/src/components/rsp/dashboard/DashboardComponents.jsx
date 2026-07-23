import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, AlertTriangle, UserPlus, Info, ChevronRight } from 'lucide-react';

// Animated Stat Counter Hook
const AnimatedNumber = ({ value }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        clearInterval(timer);
        setCount(value);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}</span>;
};

// 1. STAT CARD COMPONENT
export const StatCard = ({ icon: Icon, value, label, context, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
        {context}
      </span>
    </div>
    <div>
      <h3 className="text-3xl font-black text-black">
        <AnimatedNumber value={value || 0} />
      </h3>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);

// 2. TURNAROUND TIME (TAT) CARD
export const TATCard = ({ items, target }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
    <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Turnaround Time (TAT)</h4>
    <div className="space-y-4 flex-1">
      {items?.map(item => (
        <div key={item.ref_no}>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-black">{item.ref_no}</span>
            {item.is_over ? (
              <span className="text-red-600 animate-pulse">{item.working_days_elapsed} WD ⚠ OVER</span>
            ) : (
              <span className="text-emerald-600">{item.working_days_elapsed} WD / {target}</span>
            )}
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${item.is_over ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min((item.working_days_elapsed / target) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
    <p className="text-[10px] text-slate-600 italic mt-4 pt-3 border-t border-slate-100">
      Target: {target} working days per DepEd PRIME-HRM
    </p>
  </div>
);

// 3. UPCOMING DEADLINES CARD
export const DeadlinesCard = ({ items }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
    <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Upcoming Deadlines</h4>
    <div className="space-y-3 flex-1">
      {items?.map((item, i) => {
        const colors = {
          red: 'text-red-500 bg-red-50 border-red-200',
          orange: 'text-amber-500 bg-amber-50 border-amber-200',
          default: 'text-blue-500 bg-blue-50 border-blue-200'
        }[item.urgency];

        return (
          <div key={i} className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.urgency === 'red' ? 'bg-red-500 animate-ping' : 'bg-blue-500'}`} />
              <span className="font-bold text-black">{item.label}</span>
            </div>
            <span className={`font-black px-2 py-0.5 rounded-md border ${colors}`}>
              {item.days_remaining}d left
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// 4. RECENT ACTIVITY CARD
export const ActivityCard = ({ items }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
    <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Recent Activity</h4>
    <div className="space-y-4 flex-1 overflow-y-auto max-h-[250px]">
      {items?.map((act, i) => (
        <div key={i} className="flex gap-3 text-xs border-b border-slate-50 pb-3 last:border-0">
          <div className="mt-0.5 text-blue-500 bg-blue-50 p-1.5 rounded-lg shrink-0 h-fit">
            <Info size={14} />
          </div>
          <div>
            <p className="text-black leading-relaxed font-medium">
              <span className="font-bold text-black">{act.actor_name}:</span> {act.action_description}
            </p>
            <span className="text-[10px] text-slate-600 font-bold">{new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 5. PROGRESS TRACKER CARD
export const VacancyProgressTracker = ({ vacancies }) => {
  const [selectedId, setSelectedId] = useState(vacancies?.[0]?.id);
  const navigate = useNavigate();
  const currentVac = vacancies?.find(v => v.id === selectedId) || vacancies?.[0];

  if (!currentVac) return null;

  // Route map based on stage
  const stageRoutes = [
    '/rsp/vacancy-posting', '/rsp/applicants', '/rsp/initial-evaluation', '/rsp/initial-evaluation',
    '/rsp/comparative-assessment', '/rsp/comparative-assessment', '/rsp/results-posting', 
    '/rsp/deliberation', '/rsp/congratulatory-advice', '/rsp/appointment-processing', '/rsp/notice-of-appointment'
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 my-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
        <div>
          <h3 className="text-xl font-black text-black uppercase">Active Vacancy Progress Tracker</h3>
          <p className="text-xs text-slate-600 font-bold">11-Stage RSP Workflow — 26 Working Day Target</p>
        </div>
        <button onClick={() => navigate('/rsp/vacancy-posting')} className="text-xs font-black text-[#D6402F] hover:underline uppercase">
          Manage Vacancies →
        </button>
      </div>

      {/* Vacancy Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {vacancies.map(v => (
          <button
            key={v.id}
            onClick={() => setSelectedId(v.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              v.id === currentVac.id ? 'bg-[#1B3A6B] text-white shadow-md' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {v.position_title} ({v.ref_no})
          </button>
        ))}
      </div>

      {/* Selected Vacancy Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-6 rounded-2xl mb-8">
        <div>
          <h4 className="text-2xl font-black text-black uppercase">{currentVac.position_title}</h4>
          <p className="text-xs font-bold text-slate-600 uppercase mt-0.5">{currentVac.assigned_school}</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0 shrink-0">
          <span className="text-xs font-black text-slate-800 bg-white px-3 py-1.5 rounded-xl border">
            Applicants: <strong className="text-black">{currentVac.total_applicants}</strong>
          </span>
          <span className="text-xs font-black text-[#D6402F] bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl animate-pulse">
            ⏱ {currentVac.days_left}d left
          </span>
        </div>
      </div>

      {/* Horizontally Scrollable 11 Stages */}
      <div className="overflow-x-auto sidebar-scroll pb-6 mb-6">
        <div className="min-w-[1000px] flex justify-between items-center relative px-4">
          
          {/* Connecting Background Line */}
          <div className="absolute left-8 right-8 top-6 h-1 bg-slate-200 -z-0" />
          <div 
            className="absolute left-8 top-6 h-1 bg-emerald-500 transition-all duration-1000 -z-0"
            style={{ width: `${((currentVac.current_stage - 1) / 10) * 92}%` }}
          />

          {currentVac.workflow.map((node) => {
            const isComplete = node.status === 'complete';
            const isActive = node.status === 'active';

            return (
              <div key={node.stage} className="flex flex-col items-center relative z-10 w-20">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shadow-md transition-all ${
                  isComplete ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' :
                  (isActive ? 'bg-[#1B3A6B] text-white ring-4 ring-blue-100 scale-110' : 'bg-white text-slate-300 border-2 border-slate-200')
                }`}>
                  {isComplete ? <Check strokeWidth={3} size={20} /> : node.stage}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-tighter mt-3 text-center leading-none ${
                  isActive ? 'text-black' : 'text-slate-600'
                }`}>
                  {node.name}
                </span>
                <span className="text-[9px] font-bold text-slate-600 mt-1">{node.target}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Row */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#1B3A6B]/5 p-6 rounded-2xl gap-4">
        <span className="text-sm font-black text-black uppercase">
          Currently in: <span className="text-[#D6402F] underline">Stage {currentVac.current_stage} – {currentVac.stage_name}</span>
        </span>
        <button
          onClick={() => navigate(stageRoutes[currentVac.current_stage - 1] || '/rsp/dashboard')}
          className="px-6 py-3 bg-[#1B3A6B] hover:bg-[#162E55] text-white font-black text-xs rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
        >
          Continue Process <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
