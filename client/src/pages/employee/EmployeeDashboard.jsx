import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Clock, MessageSquare, Award, ExternalLink, GraduationCap } from 'lucide-react';
import { apiGet } from '../../utils/api';
import useEmployeeSocket from '../../hooks/useEmployeeSocket';

const getAdjectival = (war) => {
  if (war === null || war === undefined) return "Not Evaluated";
  const w = Number(war);
  if (w >= 4.5) return "Outstanding";
  if (w >= 3.5) return "Very Satisfactory";
  if (w >= 2.5) return "Satisfactory";
  if (w >= 1.5) return "Unsatisfactory";
  return "Poor";
};

const computeWAR = (objectives) => {
  let sum = 0;
  for (const obj of objectives) {
    if (obj.rating != null) {
      sum += Number(obj.rating) * (Number(obj.weight_percent) / 100);
    }
  }
  return sum;
};

const PHASES = [
  { num: 1, title: 'Planning & Commitment', months: 'January', route: '/pm/employee/ipcrf' },
  { num: 2, title: 'Monitoring & Coaching', months: 'March \u00B7 June \u00B7 September', route: '/pm/employee/progress' },
  { num: 3, title: 'Review & Evaluation', months: 'June \u00B7 October \u00B7 November', route: '/pm/employee/review' },
  { num: 4, title: 'Rewarding & Dev Planning', months: 'December', route: '/pm/employee/recognition-dev-plan' },
];

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiGet('/pm/employee/dashboard/summary');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load employee dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEmployeeSocket({
    'rating:finalized': fetchDashboard,
    'review:finalized': fetchDashboard,
    'review:rating_updated': fetchDashboard,
    'commitment:returned': fetchDashboard,
    'commitment:approved': fetchDashboard,
    'coaching:new': fetchDashboard,
    'feedback:received': fetchDashboard,
    'ipcrf:status_changed': fetchDashboard,
    'performance_update': fetchDashboard,
    'notification_received': fetchDashboard,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#F3F4F6]">
        <div className="text-xs font-bold text-slate-600 tracking-widest uppercase animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  const { employee, period, ipcrf, objectives, feedback, pendingActions, commitment } = data || {};
  console.log("DEBUG - Objectives at Glance:", objectives);
  const year = period?.year || new Date().getFullYear();
  const isFinalized = ipcrf && ['finalized', 'committed', 'approved'].includes(ipcrf.status);
  const war = isFinalized && commitment && commitment.overall_weighted_score !== null
    ? Number(commitment.overall_weighted_score)
    : (isFinalized ? computeWAR(objectives || []) : null);
  const isEligibleForIncentives = isFinalized && war !== null && war >= 3.5;
  const objectivesCount = objectives?.length || 0;

  const getPhaseStatus = (phaseNum) => {
    if (!ipcrf) return 'upcoming';
    if (ipcrf.status === 'finalized') return 'completed';
    if (phaseNum === 1 && ['submitted', 'under_review', 'reviewed', 'needs_revision'].includes(ipcrf.status)) return 'completed';
    if (phaseNum === 2 && ['submitted', 'under_review', 'reviewed', 'needs_revision'].includes(ipcrf.status)) return 'active';
    if (phaseNum === 3 && ['under_review', 'reviewed'].includes(ipcrf.status)) return 'active';
    if (phaseNum === 4 && ipcrf.status === 'finalized') return 'active';
    if (phaseNum === 1 && ['not_submitted'].includes(ipcrf.status)) return 'active';
    return 'upcoming';
  };

  const quickLinks = [
    { label: 'My IPCRF', sub: ipcrf?.status === 'under_review' ? 'Under Review' : (ipcrf?.status === 'not_submitted' ? 'Draft' : ipcrf?.status || 'Draft'), path: '/pm/employee/ipcrf', icon: 'P1' },
    { label: 'My Review', sub: period ? 'Midyear Open' : 'Not Started', path: '/pm/employee/review', icon: 'P3' },
    { label: 'Dev Plan', sub: ipcrf?.status === 'finalized' ? 'In Discussion' : 'Pending', path: '/pm/employee/recognition-dev-plan', icon: 'P4' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6">
      {/* Hero Banner */}
      <div className="bg-[#1B3A6B] rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1">
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest">Welcome back,</p>
            <h2 className="!text-white text-2xl md:text-3xl font-black tracking-tight">
              {employee?.name || user?.fullName || 'Employee'}
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-semibold">
              {employee?.position || ''}{employee?.position && employee?.unit ? ' \u00B7 ' : ''}{employee?.unit || ''}
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-5 text-center min-w-[180px] shadow-lg shrink-0">
            <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Finalized IPCRF Score</p>
            <p className="text-3xl md:text-4xl font-black text-white">{war !== null ? Number(war).toFixed(2) : '\u2014'}</p>
            <p className="text-xs font-bold text-blue-400 mt-0.5 uppercase tracking-wider">
              {war !== null ? getAdjectival(war) : (ipcrf?.status === 'submitted' ? 'Submitted — Under Review' : ipcrf?.status === 'under_review' ? 'Under Review' : 'Draft / Unfinalized')}
            </p>
          </div>
        </div>
      </div>

      {/* Performance-Based Incentives Recognition Card (Always visible container, updates content in real-time) */}
      <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border-2 transition-all hover:shadow-md ${
        isEligibleForIncentives ? 'bg-white border-blue-500/30' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shrink-0 shadow-sm ${
              isEligibleForIncentives ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <Award size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {isEligibleForIncentives ? 'Eligible for Performance-Based Incentives' : 'Performance-Based Incentives & Recognition'}
              </h4>
              <p className="text-xs font-semibold text-slate-600">
                {isEligibleForIncentives ? (
                  <>Congratulations! Your rating of <strong className="text-blue-700 font-bold">{Number(war).toFixed(4)} — {getAdjectival(war)}</strong> qualifies you for DepEd R&amp;R incentives and recognition.</>
                ) : (
                  <span>Pending Evaluation — R&amp;R incentive eligibility will update here automatically in real-time once your IPCRF evaluation is finalized by your Rater.</span>
                )}
              </p>
            </div>
          </div>
          {isEligibleForIncentives ? (
            <button
              onClick={() => navigate('/pm/employee/recognition-dev-plan')}
              className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer border border-blue-200 shrink-0"
            >
              <ExternalLink size={12} /> View R&amp;R details
            </button>
          ) : (
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
              <Clock size={12} /> Pending Release
            </span>
          )}
        </div>
      </div>

      {/* Two-column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Left Column: Objectives & Development Plan */}
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>My Objectives at a Glance</span>
            </h3>
            <div className="divide-y divide-slate-100 mt-4">
              {objectives?.length > 0 ? objectives.map((obj, idx) => (
                <div key={obj.id || idx} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-black text-[#D6402F] uppercase tracking-tight">{obj.kra_name}</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{obj.weight_percent}%</span>
                  </div>
                  <p className="text-xs text-black leading-relaxed line-clamp-2 mb-2">
                    {obj.objective_description || 'No description'}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <span
                          key={num}
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black border ${
                            obj.rating !== null && obj.rating !== undefined && Math.round(Number(obj.rating)) === num
                              ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white'
                              : 'bg-white border-slate-200 text-slate-300'
                          }`}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                    {obj.rating !== null && obj.rating !== undefined && (
                      <span className="text-[10px] font-bold uppercase text-slate-800">
                        {getAdjectival(Number(obj.rating))}
                      </span>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-600 font-bold py-6 text-center">No objectives found for the current period.</p>
              )}
            </div>
          </div>

          {/* My Development Plan Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap size={16} /> My Development Plan
            </h2>
            <p className="text-xs text-slate-800 font-bold py-4">
              No development programs mapped for this cycle.
            </p>
          </div>
        </div>

        {/* Right: Feedback & Pending Actions */}
        <div className="space-y-6">
          {/* Recent Feedback */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <MessageSquare size={14} /> Recent Feedback
            </h3>
            <div className="space-y-3 mt-4">
              {feedback?.length > 0 ? feedback.map((fb, idx) => (
                <div key={fb.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-black uppercase">{fb.sender_name || 'Rater'}</span>
                    <span className="text-slate-600 font-bold">
                      {fb.feedback_date ? fb.feedback_date.split('T')[0] : fb.created_at?.split('T')[0] || ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-black leading-relaxed italic line-clamp-3">
                    {fb.content?.length > 120 ? fb.content.slice(0, 120) + '...' : fb.content}
                  </p>
                  {fb.phase && (
                    <span className="inline-block bg-blue-50 text-blue-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                      Phase {fb.phase.replace('phase', '')} \u2013 {fb.phase === 'phase2' ? 'Monitoring' : fb.phase === 'phase3' ? 'Review' : fb.phase === 'phase4' ? 'Rewarding' : 'Planning'}
                    </span>
                  )}
                </div>
              )) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <MessageSquare size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-600">No coaching feedback received yet.</p>
                  <p className="text-[10px] text-slate-400 font-medium max-w-[220px] mx-auto">Feedback and coaching notes from your evaluator will appear here during review phases.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">
              Pending Actions
            </h3>
            <div className="space-y-2 mt-4">
              {pendingActions?.length > 0 ? pendingActions.map((action, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${
                    action.type === 'alert'
                      ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-black font-bold'
                  }`}
                >
                  {action.type === 'alert' ? (
                    <AlertTriangle size={15} className="text-red-500 shrink-0" />
                  ) : (
                    <Clock size={15} className="text-slate-600 shrink-0" />
                  )}
                  <span className="line-clamp-2">{action.text}</span>
                </div>
              )) : (
                <p className="text-center py-6 text-xs text-emerald-600 font-bold uppercase tracking-wider">
                  ✓ All tasks up to date!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
