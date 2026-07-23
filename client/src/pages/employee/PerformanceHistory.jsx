import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, FileText, ClipboardCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useEmployeeSocket from '../../hooks/useEmployeeSocket';
import { apiGet, apiPost } from '../../utils/api';

const PerformanceHistory = () => {
  const { token, user } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEval, setSelectedEval] = useState(null);
  const [evalDetails, setEvalDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAckConfirm, setShowAckConfirm] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet('/pm/performance/history');
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data || []);
        if (data.length > 0) {
          setSelectedEval(data[0]);
          fetchEvalDetails(data[0].id);
        }
      } else {
        console.error("Failed to load performance history");
      }
    } catch (err) {
      console.error("Error fetching performance history:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchHistory();
  }, [token, fetchHistory]);

  useEmployeeSocket({
    'rating:finalized': fetchHistory,
    'review:finalized': fetchHistory,
    'performance_update': fetchHistory,
    'notification_received': fetchHistory,
  });

  const fetchEvalDetails = async (evalId) => {
    try {
      setDetailsLoading(true);
      const res = await apiGet(`/pm/performance/evaluation/details/${evalId}`);
      if (res.ok) {
        const data = await res.json();
        setEvalDetails(data);
      } else {
        console.error("Failed to fetch evaluation details");
      }
    } catch (err) {
      console.error("Error fetching evaluation details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSelectEvaluation = (evaluation) => {
    setSelectedEval(evaluation);
    fetchEvalDetails(evaluation.id);
  };

  const handleAcknowledge = () => {
    if (!selectedEval) return;
    setErrorMsg('');
    setSuccessMsg('');
    setShowAckConfirm(true);
  };

  const confirmAcknowledgeAction = async () => {
    setShowAckConfirm(false);
    try {
      setActionLoading(true);
      const res = await apiPost(`/pm/performance/evaluation/${selectedEval.id}/acknowledge`, {});
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Evaluation acknowledged successfully!");
        await fetchHistory();
        fetchEvalDetails(selectedEval.id);
      } else {
        setErrorMsg(data.message || "Failed to acknowledge evaluation.");
      }
    } catch (err) {
      setErrorMsg("Server error acknowledging evaluation.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'acknowledged':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'submitted':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      default:
        return { bg: 'bg-slate-50 text-black border-slate-200', dot: 'bg-slate-400' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#1e293b] border-t-[#D6402F] rounded-full animate-spin" />
          <p className="text-slate-800 text-xs font-bold uppercase tracking-wider">Loading Performance History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* Header banner */}
      <div className="bg-white text-slate-800 py-8 px-4 sm:py-10 sm:px-8 md:px-16 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#D6402F] tracking-widest mb-2">
            <FileText size={14} />
            <span>Personnel Profile Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#1B3A6B]">Performance History</h1>
          <p className="text-slate-500 text-[11px] font-bold mt-1 uppercase tracking-wider">
            View past performance ratings, criteria breakdowns, and submit electronic acknowledgment.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        {evaluations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-16 text-center shadow-sm max-w-2xl mx-auto mt-12">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
              <FileText size={28} />
            </div>
            <h3 className="text-sm font-black text-black uppercase">No Performance Evaluations Available</h3>
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">
              There are currently no performance evaluations submitted for your profile.
              Evaluations will appear here once your supervisor submits a rating cycle.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar: Evaluation Periods */}
            <div className="lg:col-span-4 space-y-4">
              <span className="block text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Rating Cycles</span>
              <div className="space-y-3">
                {evaluations.map((ev) => {
                  const isSelected = selectedEval?.id === ev.id;
                  const statusStyles = getStatusStyles(ev.status);

                  return (
                    <button
                      key={ev.id}
                      onClick={() => handleSelectEvaluation(ev)}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-white border-[#1e293b] shadow-md ring-1 ring-[#1e293b]'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D6402F]" />}

                      <div className="flex justify-between items-start">
                        <span className="block text-[11px] font-black text-[#1e293b] uppercase tracking-tight max-w-[70%]">
                          {ev.period_name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase flex items-center gap-1 shrink-0 ${statusStyles.bg}`}>
                          <span className={`w-1 h-1 rounded-full ${statusStyles.dot}`} />
                          {ev.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] text-slate-600 font-bold uppercase mt-1">
                        <Calendar size={12} />
                        <span>
                          {new Date(ev.start_date).toLocaleDateString()} - {new Date(ev.end_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        <span className="text-[9px] text-slate-600 font-bold">Rater: {ev.supervisor_name}</span>
                        <span className="text-xs font-black text-[#1e293b]">{Number(ev.overall_score).toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail Pane */}
            <div className="lg:col-span-8">
              {detailsLoading ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#D6402F] rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Loading details...</p>
                </div>
              ) : (
                evalDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Status messages */}
                    {errorMsg && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3 text-red-700 text-xs font-bold">
                        <span>{errorMsg}</span>
                      </div>
                    )}
                    {successMsg && (
                      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-start gap-3 text-emerald-700 text-xs font-bold">
                        <span>{successMsg}</span>
                      </div>
                    )}

                    {/* Top Stats Banner */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#D6402F]" />

                      <div>
                        <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Rater & Assessment</span>
                        <h2 className="text-lg font-black text-[#1e293b] uppercase tracking-tight leading-none mb-1">
                          {evalDetails.evaluation.period_name}
                        </h2>
                        <p className="text-[10px] text-slate-800 font-bold uppercase flex items-center gap-1.5 mt-2">
                          <User size={12} className="text-slate-600" />
                          <span>Supervisor: {evalDetails.evaluation.supervisor_name}</span>
                        </p>
                      </div>

                      {/* Score */}
                      <div className="bg-[#1e293b] text-white rounded-2xl p-4 sm:p-5 flex items-center gap-6 shadow-md md:w-72 justify-between shrink-0">
                        <div>
                          <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Overall Score</span>
                          <span className="text-3xl font-black">{Number(evalDetails.evaluation.overall_score).toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Status</span>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg block mt-1 tracking-wider border ${
                            evalDetails.evaluation.status === 'acknowledged'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {evalDetails.evaluation.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acknowledged Badge Info */}
                    {evalDetails.evaluation.status === 'acknowledged' ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                        <div className="bg-emerald-500 p-2.5 rounded-xl text-white">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <span className="block text-xs font-black uppercase text-emerald-800">Electronic Acknowledgment Complete</span>
                          <span className="block text-[10px] text-emerald-600 mt-0.5">
                            You acknowledged this performance rating on {new Date(evalDetails.evaluation.acknowledged_at).toLocaleString()}.
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Acknowledge Action Box */
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500 p-2.5 rounded-xl text-white shrink-0">
                            <ClipboardCheck size={20} />
                          </div>
                          <div>
                            <span className="block text-xs font-black uppercase text-blue-900 leading-tight">Acknowledgment Pending</span>
                            <span className="block text-[9px] text-blue-600/90 mt-0.5">
                              Click the button to acknowledge receipt and review of this performance evaluation.
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleAcknowledge}
                          disabled={actionLoading}
                          className="bg-[#1e293b] hover:bg-[#D6402F] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95 disabled:opacity-50"
                        >
                          <span>Confirm Acknowledge</span>
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    )}

                    {/* Criteria ratings list */}
                    <div className="space-y-4">
                      <span className="block text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Detailed Breakdown</span>

                      {evalDetails.ratings.map((r, index) => {
                        const score = Number(r.score);
                        const weight = parseFloat(r.weight);
                        const weightedScore = (score * weight) / 100;

                        return (
                          <div
                            key={r.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-slate-100 text-black w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-[#1e293b] uppercase tracking-tight leading-snug">
                                  {r.criteria_name}
                                </h4>
                                <span className="block text-[9px] text-slate-600 font-bold uppercase mt-0.5">
                                  Weight: {weight.toFixed(0)}% &bull; Max Score: {r.max_score}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-4 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-100 justify-center sm:justify-start">
                              <div className="text-center px-1.5">
                                <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Score</span>
                                <span className="text-[11px] font-black text-[#1e293b]">{score.toFixed(1)}</span>
                              </div>
                              <div className="border-l border-slate-200" />
                              <div className="text-center px-1.5">
                                <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Weighted</span>
                                <span className="text-[11px] font-black text-[#D6402F]">{weightedScore.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Qualitative remarks */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm">
                      <h3 className="text-xs font-black text-[#1e293b] uppercase tracking-tight mb-3">Supervisor Feedback & Comments</h3>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-black leading-relaxed shadow-inner">
                        {evalDetails.evaluation.comments || "No comments or remarks provided by the supervisor."}
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Acknowledge Confirm Modal */}
      {showAckConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={() => setShowAckConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight text-center">Confirm Acknowledgment</h3>
            <div className="bg-emerald-50 p-4 rounded-xl text-xs text-emerald-800 border border-emerald-200">
              <strong>Info:</strong> Acknowledging your performance evaluation confirms you have reviewed the ratings. This action is final and cannot be undone.
            </div>
            <p className="text-xs text-black text-center">Are you sure you want to acknowledge this performance evaluation?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAckConfirm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-black hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={confirmAcknowledgeAction} className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 cursor-pointer shadow-md transition-all active:scale-95">Acknowledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceHistory;
