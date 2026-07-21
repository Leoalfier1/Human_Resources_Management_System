import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const STATUS_TABS = ['pending', 'approved', 'rejected', 'all'];

const STATUS_STYLE = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending' },
  approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
};

const FIELD_LABELS = {
  first_name: 'First Name', middle_name: 'Middle Name', last_name: 'Last Name',
  name_extension: 'Name Extension', date_of_birth: 'Date of Birth', place_of_birth: 'Place of Birth',
  sex: 'Sex', civil_status: 'Civil Status', blood_type: 'Blood Type',
  mobile_no: 'Mobile No.', email: 'Email',
  gsis_id: 'GSIS ID', pagibig_id: 'PAG-IBIG ID', philhealth_no: 'PhilHealth No.', tin_no: 'TIN No.',
};

const ProfileChangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async (statusFilter, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      const res = await fetch(`${API_BASE}/api/personnel/employees/change-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRequests(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData(filter);
  }, [fetchData, filter]);

  usePersonnelRealtime(['personnel:update', 'personnel:profile-change:update'], () => {
    console.log('⚡ Live update received [personnel:profile-change:update] - Refreshing ProfileChangeRequests...');
    fetchData(filter, true);
  });

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/employees/change-requests/${reviewModal.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: reviewAction, review_notes: reviewNotes || undefined })
      });
      if (res.ok) { setReviewModal(null); setReviewNotes(''); fetchData(filter); }
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">Profile Change Requests</h1>
        <p className="text-xs font-bold text-slate-400 mt-1">Review and approve employee profile update requests</p>
      </div>

      <div className="flex items-center gap-2">
        {STATUS_TABS.map(tab => {
          const count = tab === 'pending' ? requests.filter(r => r.status === 'pending').length : null;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filter === tab ? 'bg-[#1B3A6B] text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-[#1B3A6B]/30'
              }`}
            >
              <Filter size={12} />
              {tab}
              {count > 0 && filter === tab && (
                <span className="ml-1 bg-white/20 text-[10px] px-1.5 rounded-md">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-wider">
            {filter === 'pending' ? 'No pending requests' : `No ${filter} requests`}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {filter === 'pending' ? 'All caught up!' : 'Try a different filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const badge = STATUS_STYLE[req.status];
            const changes = typeof req.changes_json === 'string' ? JSON.parse(req.changes_json) : req.changes_json;
            const fields = Object.keys(changes);
            const isExpanded = expandedId === req.id;

            return (
              <motion.div
                key={req.id}
                layout
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-[#1B3A6B]">
                        {req.first_name?.[0]}{req.last_name?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">{req.first_name} {req.last_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {req.employee_no} · {req.position_title || '—'} · {fields.length} field{fields.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                      <badge.icon size={12} /> {badge.label}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="px-6 py-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {fields.map(field => (
                            <div key={field} className="bg-slate-50 rounded-xl px-4 py-2.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{FIELD_LABELS[field] || field}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-red-500 line-through">{changes[field].old || '—'}</span>
                                <span className="text-[10px] text-slate-400">→</span>
                                <span className="text-xs font-bold text-emerald-600">{changes[field].new || '—'}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {req.reason && (
                          <p className="text-xs text-slate-500 italic">Reason: {req.reason}</p>
                        )}
                        {req.review_notes && (
                          <p className="text-xs text-slate-500 italic">Review notes: {req.review_notes}</p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Submitted {new Date(req.created_at).toLocaleString('en-PH')}
                          {req.reviewed_at && ` · Reviewed ${new Date(req.reviewed_at).toLocaleString('en-PH')}`}
                          {req.reviewed_by_name && ` by ${req.reviewed_by_name}`}
                        </p>

                        {req.status === 'pending' && (
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setReviewAction('approved'); setReviewModal(req); setReviewNotes(''); }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setReviewAction('rejected'); setReviewModal(req); setReviewNotes(''); }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-red-500 text-white hover:bg-red-600 transition-all"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {reviewModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setReviewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className={`text-lg font-black ${reviewAction === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
                {reviewAction === 'approved' ? 'Approve Change Request' : 'Reject Change Request'}
              </h3>
              <p className="text-sm text-slate-600">
                {reviewAction === 'approved'
                  ? 'This will apply the requested changes to the employee\'s profile.'
                  : 'The employee will be notified that their request was declined.'}
              </p>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes (optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add a reason or note..."
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-[#1B3A6B] transition-colors resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setReviewModal(null)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={submitting}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50 ${
                    reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {submitting ? 'Processing...' : reviewAction === 'approved' ? 'Confirm Approve' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileChangeRequests;
