import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, FileText,
  AlertTriangle, ArrowRight, CornerDownRight, RefreshCw, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPut, SOCKET_URL } from '../utils/api';
import io from 'socket.io-client';

const PlanningCommitment = () => {
  const { token } = useAuth();

  // Data States
  const [commitments, setCommitments] = useState([]);
  const [stats, setStats] = useState([]);
  const [targets, setTargets] = useState({});
  const [loading, setLoading] = useState(true);

  // Filtering & Selection
  const [posType, setPosType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch commitments and stats
  const fetchAll = async () => {
    try {
      setLoading(true);
      const periodId = localStorage.getItem('selected_period_id') || '';
      const urlParams = periodId ? `&period_id=${periodId}` : '';
      const statsParams = periodId ? `?period_id=${periodId}` : '';
      const [commRes, statsRes] = await Promise.all([
        apiGet(`/pm/planning/commitments?position_type=${posType}&status=${statusFilter}${urlParams}`),
        apiGet(`/pm/planning/stats/summary${statsParams}`)
      ]);

      if (commRes.ok) setCommitments(await commRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error("Fetch Planning Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAll();
  }, [token, posType, statusFilter]);

  // Listen for local changes to selected period ID in header
  useEffect(() => {
    const handlePeriodChange = () => {
      setSelectedCommitment(null);
      fetchAll();
    };
    window.addEventListener('selected_period_changed', handlePeriodChange);
    return () => window.removeEventListener('selected_period_changed', handlePeriodChange);
  }, []);

  // Real-time socket updates
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join_admin_room');

    const handleRefresh = () => fetchAll();
    socket.on('notification_received', handleRefresh);
    socket.on('commitment:submitted', handleRefresh);
    socket.on('ipcrf:status_changed', handleRefresh);
    socket.on('performance_update', handleRefresh);

    return () => {
      socket.off('notification_received', handleRefresh);
      socket.off('commitment:submitted', handleRefresh);
      socket.off('ipcrf:status_changed', handleRefresh);
      socket.off('performance_update', handleRefresh);
      socket.disconnect();
    };
  }, [token]);

  // Polling fallback every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { if (token) fetchAll(); }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Load detailed targets for selected commitment
  const handleSelectCommitment = async (comm) => {
    if (selectedCommitment?.id === comm.id) {
      setSelectedCommitment(null);
      return;
    }

    try {
      setDetailLoading(true);
      setSelectedCommitment(comm);
      const res = await apiGet(`/pm/planning/commitments/${comm.id}/targets`);
      if (res.ok) {
        const data = await res.json();
        setTargets(prev => ({ ...prev, [comm.id]: data }));
      }
    } catch (e) {
      console.error("Fetch Targets Error:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  // Return for Revision Action
  const handleReturn = async (id) => {
    if (!confirm("Are you sure you want to return this performance commitment for revision?")) return;
    try {
      const res = await apiPut(`/pm/planning/commitments/${id}/return`);
      if (res.ok) {
        alert("Commitment returned to employee for revision.");
        setSelectedCommitment(null);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Approve Commitment Action
  const handleApprove = async (id) => {
    if (!confirm("Are you sure you want to approve and lock this performance commitment?")) return;
    try {
      const res = await apiPut(`/pm/planning/commitments/${id}/approve`);
      if (res.ok) {
        alert("Commitment approved and locked successfully.");
        setSelectedCommitment(null);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compute total counts for summary
  const getBulkCounts = () => {
    let draft = 0, submitted = 0, committed = 0;
    stats.forEach(s => {
      draft += parseInt(s.draft_count || 0);
      submitted += parseInt(s.submitted_count || 0);
      committed += parseInt(s.committed_count || 0);
    });
    return { draft, submitted, committed };
  };

  const totals = getBulkCounts();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-blue-100 text-blue-700 border border-blue-200">Submitted</span>;
      case 'under_review':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">Under Review</span>;
      case 'committed':
      case 'approved':
      case 'finalized':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-green-100 text-green-700 border border-green-200">Approved &amp; Locked</span>;
      case 'returned':
      case 'needs_revision':
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-amber-100 text-amber-700 border border-amber-200">Returned</span>;
      default:
        return <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-slate-100 text-slate-800 border border-slate-200">Draft</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6">

      {/* Filter and Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-6">

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <select
              value={posType}
              onChange={e => { setPosType(e.target.value); setSelectedCommitment(null); }}
              className="bg-yellow-50 border border-yellow-200/80 text-yellow-800 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer transition-colors hover:bg-yellow-100/50"
            >
              <option value="all">All Position Types</option>
              <option value="non_teaching">Non-Teaching Staff</option>
              <option value="teaching">Teaching Staff</option>
              <option value="teaching_related">Teaching-Related Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setSelectedCommitment(null); }}
              className="bg-yellow-50 border border-yellow-200/80 text-yellow-800 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer transition-colors hover:bg-yellow-100/50"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="committed">Approved</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 border border-[#D6402F]/20 bg-[#D6402F]/5 text-[#D6402F] hover:bg-[#D6402F]/10 hover:border-[#D6402F]/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors"
          >
            <RefreshCw size={12} /> Sync Data
          </button>
        </div>

        {/* Table List */}
        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">Loading commitments list...</div>
        ) : commitments.length === 0 ? (
          <div className="text-center py-12 text-xs font-bold text-slate-600 uppercase tracking-widest">No performance commitments found.</div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 text-slate-600">
                    <th className="px-6 py-3.5">Employee Name / Position</th>
                    <th className="px-6 py-3.5">Unit</th>
                    <th className="px-6 py-3.5 hidden md:table-cell">Type</th>
                    <th className="px-6 py-3.5 hidden md:table-cell">Weight Sum Check</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {commitments.map(pc => {
                    const isExpanded = selectedCommitment?.id === pc.id;
                    const weightSumNum = parseFloat(pc.weight_sum) || 0;
                    const isWeightInvalid = Math.abs(weightSumNum - 100.00) > 0.1 && (weightSumNum < 95.0 || weightSumNum > 100.1);

                    return (
                      <React.Fragment key={pc.id}>
                        <tr className={`hover:bg-slate-50/40 transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="font-black uppercase text-black">{pc.employee_name}</div>
                            <div className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">{pc.employee_position}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-semibold">{pc.employee_unit || '—'}</td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-wider rounded-md border border-slate-200/60">
                              {(pc.position_type || 'teaching').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            {isWeightInvalid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                <AlertTriangle size={10} /> {pc.weight_sum}% Invalid Sum
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[9px] font-black uppercase tracking-wider">
                                100% OK
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(pc.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleSelectCommitment(pc)}
                              className="inline-flex items-center gap-1 text-[9px] font-black text-black hover:text-[#D6402F] uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              {isExpanded ? 'Collapse' : 'Inspect'} <ArrowRight size={10} />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Drill-in Drawer using simple conditional rendering */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="bg-slate-50/40 p-6 border-t border-b border-slate-200/80">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-4"
                                >
                                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                                      <CornerDownRight size={12} /> Committed Objectives &amp; Parameters
                                    </h4>

                                    {pc.status === 'submitted' && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleReturn(pc.id)}
                                          className="flex items-center gap-1 bg-[#D6402F] hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow"
                                        >
                                          <XCircle size={12} /> Return for Revision
                                        </button>
                                        <button
                                          onClick={() => handleApprove(pc.id)}
                                          disabled={isWeightInvalid}
                                          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow ${
                                            isWeightInvalid
                                              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                              : 'bg-[#1B3A6B] hover:bg-slate-800 text-white'
                                          }`}
                                        >
                                          <CheckCircle2 size={12} /> Approve Commitment
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {detailLoading ? (
                                    <div className="text-center py-6 text-slate-600 font-bold uppercase tracking-wider animate-pulse">Loading targets...</div>
                                  ) : !targets[pc.id] || targets[pc.id].length === 0 ? (
                                    <div className="text-center py-6 text-slate-600 font-bold uppercase tracking-wider">No targets submitted for this commitment.</div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {targets[pc.id].map((t, idx) => (
                                        <div key={t.id || idx} className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm space-y-2">
                                          <div className="flex justify-between items-start flex-wrap gap-2">
                                            <span className="text-[10px] font-black text-[#D6402F] uppercase tracking-tight">{t.kra_category}</span>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-wider rounded">Weight: {t.weight_percent}%</span>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs font-bold text-black italic">"{t.target_description}"</p>
                                            {t.success_indicator && (
                                              <p className="text-[10px] font-semibold text-slate-600">
                                                <strong className="text-black font-bold uppercase tracking-wider text-[8px] mr-1 block">Success Indicator:</strong>
                                                {t.success_indicator}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default PlanningCommitment;
