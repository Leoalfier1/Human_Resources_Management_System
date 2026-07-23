import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, MessageSquare } from 'lucide-react';
import { apiGet } from '../../utils/api';
import useEmployeeSocket from '../../hooks/useEmployeeSocket';

const getProgressPercent = (obj) => {
  if (obj.actual_accomplishment && obj.actual_accomplishment.trim() !== '') {
    if (obj.target_statement) {
      const numTarget = obj.target_statement.match(/\d+/g);
      const numActual = obj.actual_accomplishment.match(/\d+/g);
      if (numTarget && numActual && numTarget.length > 0) {
        const t = parseInt(numTarget[0]);
        const a = parseInt(numActual[0]);
        if (t > 0) return Math.min(Math.round((a / t) * 100), 100);
      }
    }
    return 50;
  }
  return 0;
};

const getPhaseLabel = (phase) => {
  const map = { phase1: 'Phase 1 \u2013 Planning', phase2: 'Phase 2 \u2013 Monitoring', phase3: 'Phase 3 \u2013 Review', phase4: 'Phase 4 \u2013 Rewarding' };
  return map[phase] || '\u2014';
};

const MyProgress = () => {
  const { token } = useAuth();
  const [objectives, setObjectives] = useState([]);
  const [coachingPlans, setCoachingPlans] = useState([]);
  const [coachingFeedback, setCoachingFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await apiGet('/pm/employee/progress');
      if (res.ok) {
        const data = await res.json();
        setObjectives(data.objectives || []);
        setCoachingPlans(data.coachingPlans || []);
        setCoachingFeedback(data.coachingFeedback || []);
      }
    } catch (err) {
      console.error("Failed to load progress:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchProgress();
  }, [token, fetchProgress]);

  useEmployeeSocket({
    'coaching:new': fetchProgress,
    'feedback:received': fetchProgress,
    'review:rating_updated': fetchProgress,
    'performance_update': fetchProgress,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#F3F4F6]">
        <div className="text-xs font-bold text-slate-600 tracking-widest uppercase animate-pulse">Loading Performance Tracking...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">My Performance Tracking</h1>
        <p className="text-xs text-slate-800 font-bold uppercase tracking-widest mt-1">
          Your progress against targets \u00B7 Phase 2 \u2014 Monitoring
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 lg:col-span-2 space-y-6">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
            <TrendingUp size={16} /> Objective Progress
          </h3>

          <div className="space-y-6 divide-y divide-slate-100">
            {objectives.length > 0 ? objectives.map((obj) => {
              const pct = getProgressPercent(obj);
              const isHigh = pct >= 80;
              return (
                <div key={obj.id} className="pt-6 first:pt-0 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-black text-[#D6402F] uppercase tracking-tight">{obj.kra_name}</span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Wt: {obj.weight_percent}%</span>
                    </div>
                    <p className="text-xs text-black font-bold leading-relaxed">{obj.objective_description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Target</span>
                      <p className="text-xs font-bold text-black leading-relaxed">{obj.target_statement || 'Not specified'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Current Progress</span>
                      <p className="text-xs font-bold text-black leading-relaxed">
                        {obj.actual_accomplishment || 'No progress registered yet.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-800 uppercase">
                      <span>Milestone Completion</span>
                      <span className={isHigh ? 'text-emerald-600' : 'text-black'}>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${isHigh ? 'bg-emerald-500' : 'bg-[#1B3A6B]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-slate-600 font-bold py-8 text-center">No objectives found for the current period.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <MessageSquare size={16} /> Coaching Feedback Inbox
            </h3>

            <div className="space-y-3 max-h-[350px] overflow-y-auto mt-4 pr-1">
              {coachingFeedback.length > 0 ? coachingFeedback.map((fb) => (
                <div
                  key={fb.id}
                  onClick={() => setSelectedFeedback(fb)}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 cursor-pointer hover:border-blue-200 transition-colors"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-black uppercase">{fb.sender_name || 'Evaluator'}</span>
                    <span className="text-slate-600 font-bold">{fb.created_at ? fb.created_at.split('T')[0] : ''}</span>
                  </div>
                  <p className="text-[11px] text-black leading-relaxed italic line-clamp-3">
                    {fb.feedback_text?.length > 120 ? fb.feedback_text.slice(0, 120) + '...' : fb.feedback_text}
                  </p>
                  <span className="inline-block bg-blue-50 text-blue-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                    {getPhaseLabel(fb.phase)}
                  </span>
                </div>
              )) : (
                <p className="text-center py-6 text-xs text-slate-600 font-bold">No coaching feedback received yet.</p>
              )}
            </div>
          </div>

          {selectedFeedback && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setSelectedFeedback(null)}>
              <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Feedback Detail</h3>
                  <button onClick={() => setSelectedFeedback(null)} className="text-slate-600 hover:text-black cursor-pointer text-lg leading-none">&times;</button>
                </div>
                <div className="text-[10px] font-bold text-slate-800 uppercase">
                  From: {selectedFeedback.sender_name || 'Evaluator'} \u00B7 {selectedFeedback.created_at?.split('T')[0] || ''}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-black leading-relaxed italic whitespace-pre-wrap">{selectedFeedback.feedback_text}</p>
                </div>
                <span className="inline-block bg-blue-50 text-blue-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                  {getPhaseLabel(selectedFeedback.phase)}
                </span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">My Coaching Plans</h3>
            <div className="space-y-3 mt-4">
              {coachingPlans.length > 0 ? coachingPlans.map((plan) => {
                const isOpen = plan.status === 'open' || plan.status === 'planned';
                return (
                  <div key={plan.id} className={`p-4 rounded-2xl border transition-all ${isOpen ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-xs font-bold uppercase tracking-tight ${isOpen ? 'text-amber-700' : 'text-black'}`}>
                      {plan.topic}
                    </p>
                    <p className="text-[11px] text-slate-800 font-bold mt-1">
                      <span className="uppercase">Action:</span> <span className="font-normal text-black">{plan.agreed_actions}</span>
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase">
                      <span className="text-slate-600">
                        Due: {plan.session_date ? new Date(plan.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                      <span className={isOpen ? 'text-amber-600' : 'text-emerald-600'}>
                        \u00B7 {plan.status || 'open'}
                      </span>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center py-6 text-xs text-slate-600 font-bold">No coaching plans assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProgress;
