import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, ChevronRight, RefreshCw, Award, FileText, RotateCcw, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPut, SOCKET_URL } from '../utils/api';
import io from 'socket.io-client';
import OfficialDepEdIPCRFPart2Table from '../components/pm/OfficialDepEdIPCRFPart2Table';
import OfficialDepEdIPCRFTable from '../components/employee/OfficialDepEdIPCRFTable';
import RaterCertification from '../components/pm/RaterCertification';
import SignaturePadModal from '../components/employee/SignaturePadModal';

const ReviewEvaluation = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data States
  const [queue, setQueue] = useState([]);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [targets, setTargets] = useState([]);
  const [adjectivalBands, setAdjectivalBands] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  // UI States
  const [activePart, setActivePart] = useState('part1'); // 'part1' or 'part2a'
  const [viewMode, setViewMode] = useState('form_table'); // 'form_table' or 'eval_matrix'
  const [showRaterSigModal, setShowRaterSigModal] = useState(false);
  const [isRaterSigned, setIsRaterSigned] = useState(false);
  const [raterSigDate, setRaterSigDate] = useState(null);
  const [raterSignatureDataUrl, setRaterSignatureDataUrl] = useState(null);

  const handleSaveRaterSignature = (dataUrl) => {
    setRaterSignatureDataUrl(dataUrl);
    setIsRaterSigned(true);
    const dateNow = new Date().toISOString();
    setRaterSigDate(dateNow);
    const empId = selectedCommitment?.employee_id;
    if (empId) {
      try {
        localStorage.setItem(`ipcrf_rater_signature_${empId}`, dataUrl);
        localStorage.setItem(`ipcrf_rater_sig_date_${empId}`, dateNow);
      } catch (e) {
        console.warn("LocalStorage save error:", e);
      }
    }
    // Clear old legacy static keys if present
    try {
      localStorage.removeItem('ipcrf_rater_signature_7');
      localStorage.removeItem('ipcrf_rater_signature_8');
      localStorage.removeItem('ipcrf_rater_sig_date_7');
    } catch (e) {}

    try {
      const socket = io(SOCKET_URL);
      socket.emit('join_admin_room');
      socket.emit('performance_update', { employee_id: empId, type: 'rater_signature_updated', signature: dataUrl });
      socket.disconnect();
    } catch (e) {
      console.warn("Socket broadcast error:", e);
    }
    window.dispatchEvent(new Event('storage'));
    setShowRaterSigModal(false);
  };

  const handleClearRaterSignature = () => {
    setRaterSignatureDataUrl(null);
    setIsRaterSigned(false);
    setRaterSigDate(null);
    const empId = selectedCommitment?.employee_id;
    if (empId) {
      try {
        localStorage.removeItem(`ipcrf_rater_signature_${empId}`);
        localStorage.removeItem(`ipcrf_rater_sig_date_${empId}`);
      } catch (e) {
        console.warn("Clear signature error:", e);
      }
    }
    try {
      localStorage.removeItem('ipcrf_rater_signature_7');
      localStorage.removeItem('ipcrf_rater_signature_8');
      localStorage.removeItem('ipcrf_rater_sig_date_7');
    } catch (e) {}

    try {
      const socket = io(SOCKET_URL);
      socket.emit('join_admin_room');
      socket.emit('performance_update', { employee_id: empId, type: 'rater_signature_cleared', signature: null });
      socket.disconnect();
    } catch (e) {
      console.warn("Socket broadcast error:", e);
    }
    window.dispatchEvent(new Event('storage'));
  };

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingTargetId, setSavingTargetId] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // Fetch pending review count & queue
  // Select a commitment from queue
  const handleSelectCommitment = async (comm) => {
    if (!comm) return;
    try {
      setDetailLoading(true);
      setSelectedCommitment(comm);

      // Check rater signature strictly for selected employee
      if (comm.rater_signature) {
        setIsRaterSigned(true);
        setRaterSignatureDataUrl(comm.rater_signature);
        setRaterSigDate(comm.rater_rating_submitted_at || new Date().toISOString());
      } else {
        setIsRaterSigned(false);
        setRaterSignatureDataUrl(null);
        setRaterSigDate(null);
      }

      const res = await apiGet(`/pm/review/commitment/${comm.id}`);
      if (res.ok) {
        const data = await res.json();
        setTargets(data.targets || []);
      }
    } catch (e) {
      console.error("Fetch Commitment Detail Error:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchQueue = async (overrideIncludeId = undefined) => {
    try {
      setLoading(true);
      const periodId = localStorage.getItem('selected_period_id') || '';
      const includeId = overrideIncludeId !== undefined ? overrideIncludeId : searchParams.get('select_id');
      
      let queueUrl = `/pm/review/queue?position_type=all`;
      if (periodId) queueUrl += `&period_id=${periodId}`;
      if (includeId) queueUrl += `&include_id=${includeId}`;

      const [countRes, queueRes, bandsRes] = await Promise.all([
        apiGet(`/pm/review/pending-count${periodId ? `?period_id=${periodId}` : ''}`),
        apiGet(queueUrl),
        apiGet('/pm/config/adjectival-bands')
      ]);

      if (countRes.ok) {
        const countData = await countRes.json();
        setPendingCount(countData.count);
      }
      if (queueRes.ok) {
        const qData = await queueRes.json();
        setQueue(qData);
        if (includeId) {
          const match = qData.find(item => String(item.id) === String(includeId));
          if (match) {
            handleSelectCommitment(match);
          } else if (qData.length > 0) {
            handleSelectCommitment(qData[0]);
          } else {
            setSelectedCommitment(null);
            setTargets([]);
          }
        } else if (qData.length > 0) {
          // Strictly auto-select first pending un-approved item in queue
          handleSelectCommitment(qData[0]);
        } else {
          setSelectedCommitment(null);
          setTargets([]);
        }
      }
      if (bandsRes.ok) setAdjectivalBands(await bandsRes.json());
    } catch (e) {
      console.error("Fetch Review Queue Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      const loadQueue = async () => {
        const selectId = searchParams.get('select_id');
        if (selectId) {
          try {
            const res = await apiGet(`/pm/review/commitment/${selectId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.commitment && data.commitment.status === 'draft') {
                // If this commitment is draft, do NOT keep select_id in URL
                setSearchParams({}, { replace: true });
                await fetchQueue(null);
                return;
              }
              setSelectedCommitment(data.commitment);
              setTargets(data.targets || []);
              await fetchQueue(selectId);
              return;
            }
          } catch (e) {
            console.error("Failed to auto-select commitment from URL:", e);
          }
        }
        await fetchQueue(null);
      };
      loadQueue();
    }
  }, [token, searchParams]);

  // Listen for local changes to selected period ID in header
  useEffect(() => {
    const handlePeriodChange = () => {
      setSelectedCommitment(null);
      setTargets([]);
      fetchQueue();
    };
    window.addEventListener('selected_period_changed', handlePeriodChange);
    return () => window.removeEventListener('selected_period_changed', handlePeriodChange);
  }, []);

  // Socket updates for real-time badge count changes
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join_admin_room');

    const handleRefresh = () => fetchQueue();
    socket.on('notification_received', handleRefresh);
    socket.on('commitment:submitted', handleRefresh);
    socket.on('ipcrf:status_changed', handleRefresh);
    socket.on('rating:finalized', handleRefresh);

    return () => {
      socket.off('notification_received', handleRefresh);
      socket.off('commitment:submitted', handleRefresh);
      socket.off('ipcrf:status_changed', handleRefresh);
      socket.off('rating:finalized', handleRefresh);
      socket.disconnect();
    };
  }, [token]);

  // Live Score Calculator (Weighted score based on values changed locally)
  const calculateOverallScore = () => {
    if (!targets || targets.length === 0) return 5.0000;
    let totalWeightedSum = 0;
    let totalWeightSum = 0;
    targets.forEach(t => {
      const q = t.final_rating_q ?? t.self_rating_q ?? t.self_rating ?? t.final_rating ?? t.rater_rating ?? 5;
      const e = t.final_rating_e ?? t.self_rating_e ?? t.self_rating ?? t.final_rating ?? t.rater_rating ?? 5;
      const tim = t.final_rating_t ?? t.self_rating_t ?? t.self_rating ?? t.final_rating ?? t.rater_rating ?? 5;

      const extract = (val) => {
        const num = parseFloat(val);
        return (!isNaN(num) && num >= 1 && num <= 5) ? num : 5;
      };

      const aveRating = (extract(q) + extract(e) + extract(tim)) / 3;
      const weight = parseFloat(t.weight_percent) || (100 / targets.length);

      totalWeightedSum += (aveRating * weight);
      totalWeightSum += weight;
    });

    return totalWeightSum > 0 ? (totalWeightedSum / totalWeightSum) : 5.0000;
  };

  const getAdjectivalLabel = (score) => {
    if (score >= 4.5) return 'Outstanding';
    if (score >= 3.5) return 'Very Satisfactory';
    if (score >= 2.5) return 'Satisfactory';
    if (score >= 1.5) return 'Unsatisfactory';
    return 'Poor';
  };

  const overallScore = calculateOverallScore();
  const currentAdjectival = getAdjectivalLabel(overallScore);

  // Update target final rating on change/slider drag
  const handleRatingChange = async (targetId, value) => {
    setTargets(prev => prev.map(t => t.id === targetId ? { ...t, final_rating: parseFloat(value), rater_rating: parseFloat(value) } : t));

    // Save target changes to server immediately to keep state
    try {
      setSavingTargetId(targetId);
      await apiPut(`/pm/review/target/${targetId}`, {
        final_rating: parseFloat(value),
        rater_rating: parseFloat(value)
      });
    } catch (err) {
      console.error("Failed to auto-save target rating:", err);
    } finally {
      setSavingTargetId(null);
    }
  };

  // Mark as Reviewed (Draft Save)
  const handleReview = async () => {
    if (!selectedCommitment) return;
    try {
      setReviewing(true);
      const res = await apiPut(`/pm/review/commitment/${selectedCommitment.id}/review`);
      if (res.ok) {
        alert("Evaluation marked as Reviewed and saved as draft.");
        fetchQueue();
      }
    } catch (e) {
      console.error("Failed to mark as reviewed:", e);
    } finally {
      setReviewing(false);
    }
  };

  // Finalize ratings submission
  const handleFinalize = async () => {
    if (!selectedCommitment) return;

    if (!confirm("After clicking OK, it will proceed to Rewarding & Development Planning and lock.")) return;

    try {
      setFinalizing(true);
      const approvedId = selectedCommitment.id;
      const res = await apiPut(`/pm/review/commitment/${approvedId}/finalize`, {
        rater_signature: raterSignatureDataUrl
      });

      if (res.ok) {
        // Clear searchParams in React Router state
        setSearchParams({}, { replace: true });
        setSelectedCommitment(null);
        setTargets([]);
        setQueue(prev => prev.filter(item => item.id !== approvedId));
        await fetchQueue(null);
        navigate('/pm/rewarding', { replace: true });
      }
    } catch (err) {
      console.error("Failed to finalize evaluation:", err);
    } finally {
      setFinalizing(false);
    }
  };

  // Reject / Return for Revision
  const handleReject = async () => {
    if (!selectedCommitment) return;
    const reason = window.prompt("Enter reason for returning IPCRF to employee for revision:", "Please review and revise your self-ratings and MOVs.");
    if (reason === null) return;
    try {
      setFinalizing(true);
      const res = await apiPut(`/pm/review/commitment/${selectedCommitment.id}/return`, { reason });
      if (res.ok) {
        alert("IPCRF returned to employee for revision.");
        fetchQueue();
        setSelectedCommitment(null);
      }
    } catch (e) {
      console.error("Reject Error:", e);
      alert("Failed to return IPCRF.");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6">

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchQueue}
          className="flex items-center gap-1.5 border border-[#D6402F]/20 bg-[#D6402F]/5 text-[#D6402F] hover:bg-[#D6402F]/10 hover:border-[#D6402F]/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors"
        >
          <RefreshCw size={12} /> Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">Loading review queue...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left Panel: Pending Queue */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">Evaluation Review Queue</h3>

            {queue.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-slate-600 uppercase">Queue is empty</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
                {queue.map(pc => {
                  const isActive = selectedCommitment?.id === pc.id;
                  return (
                    <button
                      key={pc.id}
                      onClick={() => handleSelectCommitment(pc)}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between cursor-pointer group mb-1 ${
                        isActive
                          ? 'bg-[#1B3A6B] text-white shadow-md'
                          : 'hover:bg-slate-50 text-black border border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div>
                        <div className={`font-black uppercase text-xs ${isActive ? 'text-white' : 'text-black'}`}>{pc.employee_name}</div>
                        <div className={`text-[9px] font-bold uppercase mt-0.5 ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>{pc.employee_position}</div>
                        <span className={`inline-block text-[8px] font-black uppercase tracking-widest mt-1 px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-slate-700/60 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {pc.position_type.replace('_', ' ')}
                        </span>
                      </div>
                      <ChevronRight size={14} className={isActive ? 'text-white' : 'text-slate-600 group-hover:text-black'} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Scoring Sheet & Details */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedCommitment ? (
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-12 text-center text-xs font-bold text-slate-600 uppercase">
                Select an employee from the queue to start evaluating
              </div>
            ) : detailLoading ? (
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-12 text-center text-xs font-bold text-slate-600 uppercase animate-pulse">
                Loading commitment target metrics...
              </div>
            ) : selectedCommitment.position_type === 'teaching_related' && targets.length === 0 ? (
              /* Cover Teaching-Related Template Gap */
              <div className="bg-white rounded-3xl border border-red-200 p-8 text-center space-y-4 shadow-sm">
                <AlertCircle className="text-[#D6402F] mx-auto animate-bounce" size={32} />
                <div>
                  <h3 className="text-sm font-black uppercase text-black">Rubric Template Missing</h3>
                  <p className="text-xs font-bold text-slate-600 uppercase mt-1">
                    Teaching-Related positions do not have KRA objective matrices configured yet.
                  </p>
                </div>
                <a
                  href="/pm/form-configuration"
                  className="inline-block bg-[#D6402F] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow"
                >
                  Configure Rubric Templates Now
                </a>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Header Banner */}
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase text-black">{selectedCommitment.employee_name}</h3>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide mt-0.5">{selectedCommitment.employee_position} &bull; {selectedCommitment.employee_unit}</p>
                  </div>
                  <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    {(selectedCommitment.position_type || 'teaching').replace('_', ' ')}
                  </div>
                </div>

                {/* Part 1 vs Part 2-A Tab Switcher */}
                <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300 gap-2">
                  <button
                    onClick={() => setActivePart('part1')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activePart === 'part1'
                        ? 'bg-[#1B3A6B] text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-300/60'
                    }`}
                  >
                    <FileText size={14} /> Part 1: Performance Objectives (95%)
                  </button>
                  <button
                    onClick={() => setActivePart('part2a')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activePart === 'part2a'
                        ? 'bg-[#D6402F] text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-300/60'
                    }`}
                  >
                    <Award size={14} /> Part 2 - A: Core Competencies (5%)
                  </button>
                </div>

                {activePart === 'part2a' ? (
                  <OfficialDepEdIPCRFPart2Table
                    employee={{
                      name: selectedCommitment.employee_name,
                      full_name: selectedCommitment.employee_name,
                      position: selectedCommitment.employee_position,
                      unit: selectedCommitment.employee_unit
                    }}
                    period={{ year: 2026 }}
                    raterInfo={{ name: 'Jay Montealto, CESO V', title: 'Schools Division Superintendent' }}
                    approverInfo={{ name: 'Aurelio A. Santisas, CESO VI' }}
                    isSigned={selectedCommitment?.ratee_signed || !!localStorage.getItem(`ipcrf_ratee_signature_${selectedCommitment.employee_id}`)}
                    signatureDataUrl={localStorage.getItem(`ipcrf_ratee_signature_${selectedCommitment.employee_id}`)}
                    raterSignatureDataUrl={raterSignatureDataUrl}
                    readOnly={true}
                    onSavePart2={(ratings, score) => {
                      alert(`Core Competencies Part 2-A saved successfully! Overall Part 2-A Score: ${score}`);
                    }}
                  />
                ) : (
                  <OfficialDepEdIPCRFTable
                    employee={{
                      name: selectedCommitment.employee_name,
                      full_name: selectedCommitment.employee_name,
                      position: selectedCommitment.employee_position,
                      unit: selectedCommitment.employee_unit
                    }}
                    period={{ year: 2026 }}
                    raterInfo={{ name: 'Jay Montealto, CESO V', title: 'Schools Division Superintendent' }}
                    approverInfo={{ name: 'Aurelio A. Santisas, CESO VI' }}
                    objectives={targets.map((t, idx) => ({
                      id: t.id,
                      kra_name: t.kra_category || t.kra_name || `KRA ${idx + 1}`,
                      target_description: t.target_description,
                      weight_percent: t.weight_percent,
                      self_rating: t.self_rating ?? 5,
                      self_rating_q: t.self_rating_q ?? t.self_rating ?? 5,
                      self_rating_e: t.self_rating_e ?? t.self_rating ?? 5,
                      self_rating_t: t.self_rating_t ?? t.self_rating ?? 5,
                      final_rating: t.final_rating,
                      final_rating_q: t.final_rating_q,
                      final_rating_e: t.final_rating_e,
                      final_rating_t: t.final_rating_t,
                      perf_objectives: [
                        {
                          id: t.id,
                          objective_text: t.target_description,
                          weight_percent: t.weight_percent,
                          quality_score: t.self_rating_q ?? t.self_rating ?? 5,
                          efficiency_score: t.self_rating_e ?? t.self_rating ?? 5,
                          timeliness_score: t.self_rating_t ?? t.self_rating ?? 5,
                          average_score: t.self_rating ?? 5,
                          final_quality_score: t.final_rating_q,
                          final_efficiency_score: t.final_rating_e,
                          final_timeliness_score: t.final_rating_t,
                          final_average_score: t.final_rating,
                          mov_files: t.mov_files || []
                        }
                      ]
                    }))}
                    isSigned={selectedCommitment?.ratee_signed || !!localStorage.getItem(`ipcrf_ratee_signature_${selectedCommitment.employee_id}`)}
                    signatureDataUrl={localStorage.getItem(`ipcrf_ratee_signature_${selectedCommitment.employee_id}`)}
                    raterSignatureDataUrl={raterSignatureDataUrl}
                    sigDate={selectedCommitment.submitted_at}
                    isEditable={false}
                  />
                )}

                {/* Official Rater Electronic Signature & Certification Card */}
                <RaterCertification
                  isSigned={isRaterSigned}
                  signatureDataUrl={raterSignatureDataUrl}
                  name="Jay Montealto, CESO V"
                  position="Schools Division Superintendent"
                  unit="City Schools Division of Dapitan"
                  date={raterSigDate ? new Date(raterSigDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString()}
                  onSignClick={() => setShowRaterSigModal(true)}
                  onClearSignature={handleClearRaterSignature}
                />

                {/* Signature Pad Touch Canvas Modal for Rater */}
                <SignaturePadModal
                  isOpen={showRaterSigModal}
                  onClose={() => setShowRaterSigModal(false)}
                  onSave={handleSaveRaterSignature}
                  title="Rater Signature Pad — Jay Montealto, CESO V"
                />

                {/* Rater Electronic Signature & Approval Action Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 font-black text-lg">
                        ✍️
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Rater Electronic Signature</label>
                        <span className="text-xs font-black text-slate-900">Jay Montealto, CESO V</span>
                        <span className="text-[10px] text-slate-600 block">Schools Division Superintendent · Verified Official Rater</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-black uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Verified Rater Signature
                    </div>
                  </div>

                  {/* Always Visible Responsive Action Buttons */}
                  <div className="pt-2 w-full">
                    {selectedCommitment.final_rating_submitted_at !== null ? (
                      <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider">
                          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                          <span>IPCRF Approved &amp; Finalized by Rater</span>
                        </div>
                        <button
                          onClick={handleReject}
                          disabled={finalizing}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50 text-center"
                        >
                          <RotateCcw size={16} className="shrink-0" />
                          <span>Return for Revision</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full">
                        <button
                          onClick={handleReject}
                          disabled={finalizing}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50 text-center"
                        >
                          <RotateCcw size={16} className="shrink-0" />
                          <span>Reject / Return for Revision</span>
                        </button>

                        <button
                          onClick={handleFinalize}
                          disabled={finalizing}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95 text-center"
                        >
                          <CheckCircle2 size={16} className="shrink-0" />
                          <span>{finalizing ? 'Approving...' : 'Approve IPCRF & Lock Ratings'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default ReviewEvaluation;
