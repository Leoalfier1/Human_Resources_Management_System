import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, CalendarCheck, ChevronDown, ChevronUp, FileText, ShieldCheck } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const FILTER_TABS = ['pending', 'recommended', 'approved', 'rejected', 'all'];

const statusBadge = (app) => {
  const { status, rejection_step } = app;
  if (status === 'rejected') {
    if (rejection_step === 'recommendation') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase bg-red-50 text-red-700">
          <X size={12} /> Rejected at Recommendation
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase bg-red-50 text-red-600">
        <X size={12} /> Rejected at Final Action
      </span>
    );
  }
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    recommended: 'bg-blue-50 text-blue-700',
    approved: 'bg-green-50 text-green-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
      {status === 'pending' && <><X size={12} /> Pending</>}
      {status === 'recommended' && <><Check size={12} /> Recommended</>}
      {status === 'approved' && <><Check size={12} /> Approved</>}
      {status === 'cancelled' && <><X size={12} /> Cancelled</>}
    </span>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-20 shrink-0">{label}</span>
    <span className="text-xs font-bold text-slate-600">{value}</span>
  </div>
);

const LeaveManagement = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [expandedRow, setExpandedRow] = useState(null);

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectStage, setRejectStage] = useState('recommendation');

  const [recommendModal, setRecommendModal] = useState(null);
  const [recommendAction, setRecommendAction] = useState('approve');
  const [recommendRemark, setRecommendRemark] = useState('');

  const [finalModal, setFinalModal] = useState(null);
  const [finalDaysType, setFinalDaysType] = useState('with_pay');
  const [finalRemark, setFinalRemark] = useState('');
  const [finalSignatory, setFinalSignatory] = useState('');
  const [signatories, setSignatories] = useState([]);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: 50 });
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      const res = await fetch(`${API_BASE}/api/personnel/leave/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchSignatories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/signatories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const rows = await res.json();
        setSignatories(rows.filter(s => s.is_active));
      }
    } catch {}
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSignatories(); }, []);

  usePersonnelRealtime(['personnel:update', 'personnel:leave:update'], () => {
    fetchData(true);
  });

  const handleRecommend = async () => {
    if (!recommendModal) return;
    const token = localStorage.getItem('token');
    if (recommendAction === 'approve') {
      await fetch(`${API_BASE}/api/personnel/leave/${recommendModal.id}/recommend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recommendation: 'approve', remark: recommendRemark || null })
      });
    } else {
      await fetch(`${API_BASE}/api/personnel/leave/${recommendModal.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stage: 'recommendation', rejection_reason: recommendRemark || null })
      });
    }
    setRecommendModal(null);
    setRecommendAction('approve');
    setRecommendRemark('');
    fetchData();
  };

  const handleFinalAction = async () => {
    if (!finalModal) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/personnel/leave/${finalModal.id}/final-approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        days_type: finalDaysType,
        remark: finalRemark || null,
        signatory_id: finalSignatory || null,
      })
    });
    setFinalModal(null);
    setFinalDaysType('with_pay');
    setFinalRemark('');
    setFinalSignatory('');
    fetchData();
  };

  const handleRejectFromFinal = async () => {
    if (!rejectModal) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/personnel/leave/${rejectModal.id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stage: 'final_action', rejection_reason: rejectReason || null })
    });
    setRejectModal(null);
    setRejectReason('');
    fetchData();
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Leave Management</h2>
          <p className="text-xs font-bold text-slate-400">CS Form 6 — Two-level approval workflow</p>
        </div>
        <div className="flex gap-2">
          {FILTER_TABS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s === 'all' ? '' : s)}
              className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all ${
                filterStatus === s || (s === 'all' && !filterStatus)
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s || 'all'}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
          </div>
        ) : !data?.applications?.length ? (
          <div className="p-8 text-center">
            <CalendarCheck size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-400">No leave applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">From</th>
                  <th className="p-4">To</th>
                  <th className="p-4">Days</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.applications.map(app => (
                  <React.Fragment key={app.id}>
                    <tr className="border-b border-slate-50 text-sm hover:bg-slate-50">
                      <td className="p-4">
                        <button
                          onClick={() => setExpandedRow(expandedRow === app.id ? null : app.id)}
                          className="text-slate-400 hover:text-[#1B3A6B] transition-colors"
                        >
                          {expandedRow === app.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700">{app.last_name}, {app.first_name}</p>
                        <p className="text-[10px] text-slate-400">{app.employee_no || ''}</p>
                      </td>
                      <td className="p-4 capitalize text-slate-600">{app.leave_type.replace(/_/g, ' ')}</td>
                      <td className="p-4 text-slate-600">{new Date(app.date_from).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-600">{new Date(app.date_to).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-600">{app.num_days || '—'}</td>
                      <td className="p-4">{statusBadge(app)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {/* STEP 1: Recommend (pending only) */}
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setRecommendModal(app); setRecommendAction('approve'); }}
                                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                                title="Recommend for Approval"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => { setRecommendModal(app); setRecommendAction('disapprove'); }}
                                className="bg-[#D6402F] text-white p-2 rounded-lg hover:bg-[#b53526] transition-colors"
                                title="Disapprove at Recommendation"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {/* STEP 2: Final Action (recommended only) */}
                          {app.status === 'recommended' && (
                            <>
                              <button
                                onClick={() => setFinalModal(app)}
                                className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                                title="Final Approval"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => { setRejectModal(app); setRejectStage('final_action'); }}
                                className="bg-[#D6402F] text-white p-2 rounded-lg hover:bg-[#b53526] transition-colors"
                                title="Disapprove at Final Action"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* EXPANDED DETAIL ROW */}
                    {expandedRow === app.id && (
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Application Details</p>
                              <DetailRow label="Reason" value={app.reason || '—'} />
                              {app.leave_details && <DetailRow label="Details" value={app.leave_details} />}
                              {app.commutation && <DetailRow label="Commutation" value={app.commutation.replace('_', ' ')} />}
                              {app.esignature_consented ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <ShieldCheck size={12} />
                                  <span className="text-[10px] font-bold">E-signed {app.esignature_timestamp ? new Date(app.esignature_timestamp).toLocaleString() : ''}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">No e-signature</span>
                              )}
                            </div>
                            {app.status !== 'pending' && (
                              <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recommendation (7.B)</p>
                                {app.recommended_by ? (
                                  <>
                                    <DetailRow label="By" value={`${app.recommender_name || `User #${app.recommended_by}`}`} />
                                    <DetailRow label="At" value={app.recommended_at ? new Date(app.recommended_at).toLocaleString() : '—'} />
                                    {app.recommendation_remark && <DetailRow label="Remark" value={app.recommendation_remark} />}
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400">Pending</span>
                                )}
                              </div>
                            )}
                            {(app.status === 'approved' || app.status === 'rejected') && (
                              <div className="space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Action (7.C/7.D)</p>
                                {app.final_action_by ? (
                                  <>
                                    <DetailRow label="By" value={`${app.final_approver_name || `User #${app.final_action_by}`}`} />
                                    <DetailRow label="At" value={app.final_action_at ? new Date(app.final_action_at).toLocaleString() : '—'} />
                                    {app.final_action_days_type && <DetailRow label="Days" value={app.final_action_days_type.replace('_', ' ')} />}
                                    {app.final_action_remark && <DetailRow label="Remark" value={app.final_action_remark} />}
                                    {app.signatory_name && <DetailRow label="Signatory" value={`${app.signatory_name} — ${app.signatory_position || ''}`} />}
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400">Pending</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: RECOMMEND (Step 1 — hr_staff/admin) */}
      {recommendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-2">
              {recommendAction === 'approve' ? 'Recommend for Approval' : 'Disapprove'}
            </h3>
            <p className="text-sm font-bold text-slate-500 mb-1">
              {recommendModal.last_name}, {recommendModal.first_name}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              {recommendModal.leave_type.replace(/_/g, ' ')} — {recommendModal.num_days || '?'} day(s)
            </p>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              {recommendAction === 'approve' ? 'Remark (optional)' : 'Reason for Disapproval'}
            </label>
            <textarea
              value={recommendRemark}
              onChange={e => setRecommendRemark(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none mb-6"
              placeholder={recommendAction === 'approve' ? 'Optional remark...' : 'Reason for disapproval...'}
            />
            <div className="flex gap-3">
              <button
                onClick={handleRecommend}
                className={`rounded-xl font-black uppercase text-xs px-6 py-3 flex-1 text-white ${
                  recommendAction === 'approve'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-[#D6402F] hover:bg-[#b53526]'
                }`}
              >
                {recommendAction === 'approve' ? 'Confirm Recommend' : 'Confirm Disapprove'}
              </button>
              <button
                onClick={() => { setRecommendModal(null); setRecommendRemark(''); }}
                className="border border-slate-200 text-slate-500 rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-slate-50 flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FINAL ACTION (Step 2 — appointing_authority/admin) */}
      {finalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-2">Final Approval (7.C)</h3>
            <p className="text-sm font-bold text-slate-500 mb-1">
              {finalModal.last_name}, {finalModal.first_name}
            </p>
            <p className="text-xs text-slate-400 mb-5">
              {finalModal.leave_type.replace(/_/g, ' ')} — {finalModal.num_days || '?'} day(s)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Approved For (7.C)</label>
                <div className="flex gap-3">
                  {[
                    { value: 'with_pay', label: 'Days with Pay' },
                    { value: 'without_pay', label: 'Days without Pay' },
                    { value: 'others', label: 'Others' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        finalDaysType === opt.value
                          ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B]'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="final_days_type"
                        value={opt.value}
                        checked={finalDaysType === opt.value}
                        onChange={e => setFinalDaysType(e.target.value)}
                        className="sr-only"
                      />
                      <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                        finalDaysType === opt.value ? 'border-[#1B3A6B]' : 'border-slate-300'
                      }`}>
                        {finalDaysType === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-[#1B3A6B]" />}
                      </span>
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {finalDaysType === 'others' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Specify</label>
                  <input
                    type="text"
                    value={finalRemark}
                    onChange={e => setFinalRemark(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
                    placeholder="Specify others..."
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Signatory</label>
                <select
                  value={finalSignatory}
                  onChange={e => setFinalSignatory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none"
                >
                  <option value="">Select signatory...</option>
                  {signatories.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} — {s.position}</option>
                  ))}
                </select>
                {finalSignatory && (() => {
                  const sel = signatories.find(s => String(s.id) === String(finalSignatory));
                  return sel?.signature_path ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400">Signature preview:</span>
                      <img src={`${SERVER_BASE}${sel.signature_path}`} alt="Signature" className="h-8 object-contain" />
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleFinalAction} className="bg-green-500 text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-green-600 flex-1 flex items-center justify-center gap-2">
                <Check size={16} /> Confirm Approval
              </button>
              <button onClick={() => { setFinalModal(null); setFinalDaysType('with_pay'); setFinalRemark(''); setFinalSignatory(''); }} className="border border-slate-200 text-slate-500 rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-slate-50 flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT AT FINAL ACTION */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-2">Disapprove at Final Action (7.D)</h3>
            <p className="text-sm font-bold text-slate-500 mb-1">
              {rejectModal.last_name}, {rejectModal.first_name}
            </p>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">Reason for Disapproval</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none mb-6"
              placeholder="Reason..."
            />
            <div className="flex gap-3">
              <button onClick={handleRejectFromFinal} className="bg-[#D6402F] text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-[#b53526] flex-1">Confirm Reject</button>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="border border-slate-200 text-slate-500 rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-slate-50 flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
