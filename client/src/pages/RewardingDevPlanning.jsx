import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, CheckCircle2, RefreshCw, Send,
  ClipboardList, AlertCircle, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut, apiDelete, SOCKET_URL } from '../utils/api';
import { io } from 'socket.io-client';

const RewardingDevPlanning = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [eligible, setEligible] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [rewardTypes, setRewardTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Nominate State
  const [showNomModal, setShowNomModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [rewardType, setRewardType] = useState('');
  const [customAward, setCustomAward] = useState('');
  const [nomNotes, setNomNotes] = useState('');
  const [nominating, setNominating] = useState(false);

  // PDP Modal State
  const [showPdpModal, setShowPdpModal] = useState(false);
  const [selectedCommId, setSelectedCommId] = useState(null);
  const [selectedCommEmpName, setSelectedCommEmpName] = useState('');
  const [pdpTargets, setPdpTargets] = useState([]);
  const [pdpLoading, setPdpLoading] = useState(false);
  const [pushingPdp, setPushingPdp] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const periodId = localStorage.getItem('selected_period_id') || '';
      const urlParams = periodId ? `?period_id=${periodId}` : '';
      const [eligibleRes, nominationsRes, rewardsRes] = await Promise.all([
        apiGet(`/pm/rewarding/eligible${urlParams}`),
        apiGet(`/pm/rewarding/nominations${urlParams}`),
        apiGet('/pm/config/reward-types')
      ]);

      if (eligibleRes.ok) setEligible(await eligibleRes.json());
      if (nominationsRes.ok) setNominations(await nominationsRes.json());
      if (rewardsRes.ok) setRewardTypes(await rewardsRes.json());
    } catch (e) {
      console.error("Fetch Rewarding Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Listen for local changes to selected period ID in header
  useEffect(() => {
    const handlePeriodChange = () => {
      setSelectedEmp(null);
      fetchData();
    };
    window.addEventListener('selected_period_changed', handlePeriodChange);
    return () => window.removeEventListener('selected_period_changed', handlePeriodChange);
  }, []);

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('join_admin_room');
    const handleUpdate = () => fetchData();
    socket.on('performance_update', handleUpdate);
    socket.on('commitment:approved', handleUpdate);
    socket.on('rating:finalized', handleUpdate);
    socket.on('ipcrf:status_changed', handleUpdate);
    return () => socket.disconnect();
  }, []);

  // Polling fallback every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { if (token) fetchData(); }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Submit Nomination
  const handleNominateSubmit = async (e) => {
    e.preventDefault();
    if (!rewardType) return;
    try {
      setNominating(true);
      const finalAwardName = rewardType === 'custom_other' ? customAward : rewardType;
      const res = await apiPost('/pm/rewarding/nominate', {
        commitment_id: selectedEmp.commitment_id,
        employee_id: selectedEmp.employee_id,
        reward_type: finalAwardName,
        notes: nomNotes
      });

      if (res.ok) {
        alert("Nomination successfully submitted!");
        setShowNomModal(false);
        setRewardType('');
        setCustomAward('');
        setNomNotes('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNominating(false);
    }
  };

  // Approve/Reject Nomination
  const handleNominationAction = async (nomId, status) => {
    const actionText = status === 'approved' 
      ? "Approve nomination and send signed finalized IPCRF to employee?" 
      : `Are you sure you want to mark this nomination as ${status}?`;

    if (!confirm(actionText)) return;
    try {
      const res = await apiPut(`/pm/rewarding/nomination/${nomId}`, {
        nomination_status: status
      });
      if (res.ok) {
        window.dispatchEvent(new Event('storage'));
        if (status === 'approved') {
          alert("Nomination approved! Signed finalized IPCRF form successfully sent to Employee Dashboard!");
        } else {
          alert(`Nomination status updated to ${status}!`);
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Reward Notification Email
  const [sendingEmail, setSendingEmail] = useState(null);
  const handleSendEmail = async (nom) => {
    try {
      setSendingEmail(nom.id);
      const res = await apiPost('/pm/rewarding/send-email', {
        employee_id: nom.employee_id,
        reward_type: nom.reward_type,
        notes: nom.notes
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Reward notification sent successfully!');
      } else {
        alert(data.message || 'Failed to send email');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send reward notification email');
    } finally {
      setSendingEmail(null);
    }
  };

  // Inspect PDP Gaps
  const handleInspectPdp = async (emp) => {
    try {
      setPdpLoading(true);
      setSelectedCommId(emp.commitment_id);
      setSelectedCommEmpName(emp.employee_name);
      setShowPdpModal(true);

      const res = await apiGet(`/pm/rewarding/pdp/${emp.commitment_id}`);
      if (res.ok) {
        setPdpTargets(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPdpLoading(false);
    }
  };

  // Push PDP to L&D Intake stub
  const handlePushPdpToLd = async () => {
    const focusAreas = pdpTargets.map(t => `${t.kra_category}: ${t.target_description}`);
    if (focusAreas.length === 0) {
      alert("No development training needs found. This employee scored Satisfactory or higher in all metrics!");
      return;
    }

    try {
      setPushingPdp(true);
      const res = await apiPost('/ld/intake', {
        employee_id: selectedEmp ? selectedEmp.employee_id : 1,
        source: 'pm_module',
        focus_areas: focusAreas
      });

      if (res.ok) {
        alert("Professional Development Gaps successfully pushed to L&D Intake hub!");
        setShowPdpModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPushingPdp(false);
    }
  };

  const handleDeleteNomination = async (id) => {
    if (!confirm("Are you sure you want to remove this nomination?")) return;
    try {
      const res = await apiDelete(`/pm/rewarding/nomination/${id}`);
      if (res.ok) {
        setNominations(prev => prev.filter(n => n.id !== id));
        fetchData();
      }
    } catch (e) {
      console.error("Failed to delete nomination:", e);
    }
  };

  // Group eligible employees by adjectival rating
  const grouped = {
    Outstanding: [],
    'Very Satisfactory': [],
    Satisfactory: [],
    Unsatisfactory: [],
    Poor: []
  };

  eligible.forEach(e => {
    const rawScore = parseFloat(e.overall_weighted_score);
    const score = (!isNaN(rawScore) && rawScore > 0) ? rawScore : 5.0000;
    let band = e.adjectival_rating;
    if (!band || band === 'Poor' || band === 'Not Rated') {
      if (score >= 4.5) band = 'Outstanding';
      else if (score >= 3.5) band = 'Very Satisfactory';
      else if (score >= 2.5) band = 'Satisfactory';
      else if (score >= 1.5) band = 'Unsatisfactory';
      else band = 'Outstanding';
    }
    const item = { ...e, overall_weighted_score: score.toFixed(4), adjectival_rating: band };
    if (grouped[band]) {
      grouped[band].push(item);
    } else {
      grouped['Outstanding'].push(item);
    }
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6">

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 border border-[#D6402F]/20 bg-[#D6402F]/5 text-[#D6402F] hover:bg-[#D6402F]/10 hover:border-[#D6402F]/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors"
        >
          <RefreshCw size={12} /> Sync Lists
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">Loading rewarding lists...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left/Middle: Eligibility and Grouped Ratings */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-6">
              <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">Finalized Personnel Performance Rankings</h3>

              {eligible.length === 0 ? (
                <div className="text-center py-8 text-xs font-bold text-slate-600 uppercase">No finalized evaluations available yet.</div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(grouped).map(band => {
                    const employeesList = grouped[band];
                    if (employeesList.length === 0) return null;

                    return (
                      <div key={band} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md text-white ${
                            band === 'Outstanding' ? 'bg-green-600' :
                            band === 'Very Satisfactory' ? 'bg-blue-600' :
                            band === 'Satisfactory' ? 'bg-yellow-500 text-slate-900' :
                            band === 'Unsatisfactory' ? 'bg-amber-600' :
                            'bg-red-600'
                          }`}>
                            {band}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 uppercase">({employeesList.length} Personnel)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {employeesList.map(emp => {
                            const canNominate = band === 'Outstanding' || band === 'Very Satisfactory';

                            return (
                              <div key={emp.commitment_id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
                                <div>
                                  <div className="font-black uppercase text-black text-xs">{emp.employee_name}</div>
                                  <div className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">{emp.employee_position} &bull; {emp.employee_unit}</div>

                                  <div className="flex gap-2 items-center mt-3">
                                    <span className="text-[9px] font-black text-slate-600 uppercase">Score:</span>
                                    <span className="text-xs font-black text-[#1B3A6B]">{parseFloat(emp.overall_weighted_score).toFixed(4)}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap border-t border-slate-200/60 pt-3">
                                  {canNominate && (
                                    <button
                                      onClick={() => {
                                        setSelectedEmp(emp);
                                        setShowNomModal(true);
                                      }}
                                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-[#1B3A6B] hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all active:scale-95"
                                    >
                                      <Trophy size={12} /> Nominate
                                    </button>
                                  )}

                                  <button
                                     onClick={() => navigate(`/pm/review?select_id=${emp.commitment_id}`)}
                                     className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 px-3.5 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider cursor-pointer border border-amber-500/30 shadow-sm transition-all active:scale-95"
                                     title="Click to view & review IPCRF details in real time"
                                   >
                                     <ClipboardList size={12} /> Review
                                   </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nominations List */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">Rewards &amp; Recognition Nominations</h3>

              <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 text-slate-600">
                      <th className="px-6 py-3.5">Employee Name</th>
                      <th className="px-6 py-3.5">Award Type</th>
                      <th className="px-6 py-3.5 hidden md:table-cell">Nominated By</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {nominations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-6 text-center text-slate-600 font-bold uppercase">No nominations submitted yet</td>
                      </tr>
                    ) : (
                      nominations.map(nom => (
                        <tr key={nom.id} className="hover:bg-slate-50/40">
                          <td className="px-6 py-4">
                            <div className="font-black uppercase text-black">{nom.employee_name}</div>
                            <div className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">{nom.employee_position}</div>
                          </td>
                          <td className="px-6 py-4 font-black uppercase text-[#D6402F]">{nom.reward_type}</td>
                          <td className="px-6 py-4 font-semibold text-slate-600 hidden md:table-cell">{nom.nominator_name || 'System Admin'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                              nom.nomination_status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                              nom.nomination_status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                              'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}>
                              {nom.nomination_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 flex items-center justify-end">
                            {nom.nomination_status === 'nominated' && (
                              <>
                                <button
                                  onClick={() => handleNominationAction(nom.id, 'approved')}
                                  className="text-green-600 hover:text-green-800 font-black uppercase tracking-widest text-[9px] cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleNominationAction(nom.id, 'rejected')}
                                  className="text-red-600 hover:text-red-800 font-black uppercase tracking-widest text-[9px] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {nom.nomination_status === 'approved' && (
                              <button
                                onClick={() => handleSendEmail(nom)}
                                disabled={sendingEmail === nom.id}
                                className="inline-flex items-center gap-1 bg-[#1B3A6B] hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                              >
                                <Send size={10} /> {sendingEmail === nom.id ? 'Sending...' : 'Send'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNomination(nom.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
                              title="Remove nomination"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Panel: Reward Reference Tips */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">Rewards Nomination Rules</h3>
            <div className="space-y-3 text-xs leading-relaxed text-slate-700 font-semibold">
              <p>
                DepEd SDO Dapitan City HRMIS Rewards &amp; Recognition policies determine candidate pools from Phase 3 cycle final scores:
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <strong className="text-black font-black uppercase text-[10px]">Outstanding:</strong> Eligible for National and Division Level major rewards/recognition tags.
                </li>
                <li>
                  <strong className="text-black font-black uppercase text-[10px]">Very Satisfactory:</strong> Eligible for Division level performance incentives.
                </li>
                <li>
                  <strong className="text-black font-black uppercase text-[10px]">Satisfactory or lower:</strong> Not eligible for nomination; redirected to PDP planning.
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: NOMINATION FORM */}
      {showNomModal && selectedEmp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <form onSubmit={handleNominateSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-black uppercase text-black tracking-tight">Nominate Achiever for Award</h3>

            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-600 uppercase block">Candidate Name</span>
              <strong className="text-xs font-black uppercase text-black block">{selectedEmp.employee_name}</strong>
              <span className="text-[9px] font-semibold text-slate-600 block">{selectedEmp.employee_position} &bull; Score: {parseFloat(selectedEmp.overall_weighted_score).toFixed(4)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Choose Award Category</label>
              <select
                required
                value={rewardType}
                onChange={e => {
                  setRewardType(e.target.value);
                  if (e.target.value !== 'custom_other') {
                    setCustomAward('');
                  }
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 font-bold"
              >
                <option value="">Select Award...</option>
                {rewardTypes.filter(r => r.is_active).map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
                <option value="custom_other">Others (Specify award name)</option>
              </select>
            </div>

            {rewardType === 'custom_other' && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Specify Award Name</label>
                <input
                  type="text"
                  required
                  placeholder="Type specific award name here..."
                  value={customAward}
                  onChange={e => setCustomAward(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 font-bold"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Justification / Nomination Notes</label>
              <textarea
                required
                value={nomNotes}
                onChange={e => setNomNotes(e.target.value)}
                placeholder="Provide details about the candidate's exemplary accomplishments..."
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 h-24"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNomModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={nominating}
                className="px-4 py-2 bg-[#1B3A6B] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow"
              >
                {nominating ? 'Nominating...' : 'Submit Nomination'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: RATING REVIEW MODAL */}
      {showPdpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black uppercase text-black tracking-tight">Review IPCRF Evaluation &amp; Development Plan</h3>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wide mt-0.5"> Verify DepEd performance score metrics for <strong className="text-black">{selectedCommEmpName}</strong></p>
            </div>

            {pdpLoading ? (
              <div className="text-center py-12 text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">Loading previous ratings...</div>
            ) : pdpTargets.length === 0 ? (
              <div className="space-y-4 text-center py-6">
                <CheckCircle2 size={36} className="text-green-600 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  No targets configured for this commitment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Individual target ratings breakdown:</span>

                <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                  {pdpTargets.map((t, idx) => (
                    <div key={t.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm space-y-2">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <span className="text-[9px] font-black text-[#D6402F] uppercase tracking-tight">{t.kra_category}</span>
                        <span className="px-2 py-0.5 bg-[#1B3A6B] text-white text-[9px] font-black uppercase tracking-wider rounded">Final: {t.final_rating ? parseFloat(t.final_rating).toFixed(2) : '—'}</span>
                      </div>
                      <p className="text-xs font-semibold text-black leading-relaxed">"{t.target_description}"</p>

                      <div className="flex gap-4 pt-1 text-[10px] text-slate-600 border-t border-slate-200/50">
                        <div>
                          <strong className="block text-[8px] font-black uppercase text-slate-500 tracking-wider">Self Rating</strong>
                          <span className="font-bold text-slate-800">{t.self_rating ? parseFloat(t.self_rating).toFixed(2) : '—'}</span>
                        </div>
                        <div>
                          <strong className="block text-[8px] font-black uppercase text-slate-500 tracking-wider">Rater Rating</strong>
                          <span className="font-bold text-slate-800">{t.rater_rating ? parseFloat(t.rater_rating).toFixed(2) : '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold uppercase text-[10px]">
                    <AlertCircle size={14} className="text-amber-700" />
                    <span>Are these rating calculations and scores correct?</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await apiPut(`/pm/review/commitment/${selectedCommId}/unlock`);
                        } catch (e) {
                          console.error("Failed to unlock for re-rating:", e);
                        }
                        setShowPdpModal(false);
                        navigate(`/pm/review?select_id=${selectedCommId}`);
                      }}
                      className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all active:scale-95"
                    >
                      Re-rate
                    </button>
                    <button
                      onClick={() => {
                        setShowPdpModal(false);
                        alert("Rating confirmed as correct!");
                      }}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all active:scale-95"
                    >
                      OK
                    </button>
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

export default RewardingDevPlanning;
