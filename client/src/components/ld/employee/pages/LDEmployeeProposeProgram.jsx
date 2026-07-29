import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Send, Clock, CheckCircle, XCircle, RefreshCw, ChevronRight, Info, Trash2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE } from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';
import {
  TRAINING_CATEGORIES, DELIVERY_MODES, DURATION_OPTIONS, PARTICIPANT_TYPES,
} from '../../../ld/shared/programFormOptions';

// ── Status badge ───────────────────────────────────────────────────────────
const STATUS = {
  submitted:    { label: 'Submitted',    cls: 'bg-[#F3F4F6] text-[#6B7280]'  },
  under_review: { label: 'Under Review', cls: 'bg-[#FEF3C7] text-[#B45309]'  },
  approved:     { label: 'Approved',     cls: 'bg-[#DCFCE7] text-[#16A34A]'  },
  declined:     { label: 'Declined',     cls: 'bg-[#FEE2E2] text-[#DC2626]'  },
  converted:    { label: 'Converted to Program', cls: 'bg-[#DBEAFE] text-[#2563EB]' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold ${s.cls}`}
      style={{ fontSize: 10 }}>
      {s.label}
    </span>
  );
};

// ── Tooltip helper ─────────────────────────────────────────────────────────
const InfoTip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info size={12} style={{ color: '#6B7280', cursor: 'help' }} />
      {show && (
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-56 px-3 py-2 rounded-xl shadow-xl text-xs leading-snug"
          style={{ background: '#1B2A50', color: '#fff', whiteSpace: 'normal', pointerEvents: 'none' }}>
          {text}
        </span>
      )}
    </span>
  );
};

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ message, color = '#16A34A', onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: color }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

// ── Category options (same as admin PD Program Design) ────────────────────
const CATEGORIES = [
  'School-Based Learning Action Cell (LAC)',
  'Division-Initiated Training',
  'Seminar-Workshop',
  'Coaching & Mentoring',
  'Online Course / Webinar',
  'Conference / Forum',
  'Action Research',
  'ICT Integration Training',
  'Leadership & Management',
  'Other',
];

const MODES = ['Face-to-face', 'Online', 'Blended'];

const EMPTY_FORM = {
  title: '',
  category: '',
  other_category: '',
  rationale: '',
  participant_count: '',
  participant_type: 'all',
  proposed_date_from: '',
  proposed_date_to: '',
  estimated_budget: '',
  mode_of_delivery: '',
  duration_label: '',
  other_duration: '',
};

// ── Label component ────────────────────────────────────────────────────────
const Field = ({ label, required, tip, children }) => (
  <div>
    <label className="flex items-center gap-1 font-black uppercase mb-1"
      style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>
      {label}{required && <span style={{ color: '#DE4E2A' }}>*</span>}
      {tip && <InfoTip text={tip} />}
    </label>
    {children}
  </div>
);

const inputCls = "w-full rounded-lg px-3 py-2 focus:outline-none transition-colors";
const inputStyle = { border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' };

// ── Main page ──────────────────────────────────────────────────────────────
const LDEmployeeProposeProgram = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const { user } = useAuth();

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMyProposals = useCallback(async () => {
    setLoadingProposals(true);
    try {
      const res = await apiFetch('/api/ld/proposals');
      const data = await res.json();
      setProposals(Array.isArray(data) ? data : []);
    } catch {
      setProposals([]);
    } finally {
      setLoadingProposals(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProposals();

    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socket.on('connect', () => {
      if (user?.id) socket.emit('join-user-room', `ld-user-${user.id}`);
    });

    socket.on('ld:proposal:updated', (data) => {
      fetchMyProposals();
      showToast(data.message || 'Real-time update: Proposal status changed!', '#16A34A');
    });

    return () => {
      socket.off('ld:proposal:updated');
      socket.disconnect();
    };
  }, [fetchMyProposals, user?.id]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Program title is required.';
    if (!form.rationale.trim()) e.rationale = 'Please explain the gap this program fills.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const effectiveCategory = form.category === 'Other' ? form.other_category : form.category;
    const durationOpt = DURATION_OPTIONS.find(d => d.label === form.duration_label);
    const durationHours = form.duration_label === 'Other'
      ? (parseFloat(form.other_duration) || null)
      : (durationOpt?.hours ?? null);
    const durationLabel = form.duration_label === 'Other' && form.other_duration
      ? `${form.other_duration} hours`
      : form.duration_label;
    const typeLabel = PARTICIPANT_TYPES.find(t => t.value === form.participant_type)?.label || form.participant_type;
    const legacyParticipants = form.participant_count
      ? `${form.participant_count} ${typeLabel}`
      : typeLabel;
    const formatDateToISO = (val) => {
      if (!val) return null;
      const str = String(val).trim();
      if (!str) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      const parts = str.split('/');
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        if (year.length === 4) return `${year}-${month}-${day}`;
      }
      return str;
    };

    try {
      const res = await apiFetch('/api/ld/proposals', {
        method: 'POST',
        body: JSON.stringify({
          title:              form.title,
          category:           effectiveCategory,
          rationale:          form.rationale,
          target_participants: legacyParticipants,
          participant_count:  form.participant_count ? parseInt(form.participant_count, 10) : null,
          participant_type:   form.participant_type,
          proposed_date_from: formatDateToISO(form.proposed_date_from),
          proposed_date_to:   formatDateToISO(form.proposed_date_to),
          estimated_budget:   form.estimated_budget ? parseFloat(form.estimated_budget) : null,
          mode_of_delivery:   form.mode_of_delivery,
          duration_hours:     durationHours,
          duration_label:     durationLabel,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Submission failed.' }));
        showToast(err.message || 'Submission failed.', '#DC2626');
        return;
      }
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitted(true);
      showToast('Proposal submitted successfully!', '#16A34A');
      await fetchMyProposals();
    } catch (err) {
      console.error('Submit proposal error:', err);
      showToast(err.message || 'Network error. Please try again.', '#DC2626');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProposal = async (proposalId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await apiFetch(`/api/ld/proposals/${proposalId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Proposal deleted successfully', '#16A34A');
        fetchMyProposals();
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to delete' }));
        showToast(err.message || 'Delete failed', '#DC2626');
      }
    } catch {
      showToast('Error deleting proposal', '#DC2626');
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} color={toast.color} onClose={() => setToast(null)} />}

      {/* ── How it works ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue-100 p-4 flex items-start gap-3"
        style={{ background: '#EFF6FF' }}>
        <Lightbulb size={18} style={{ color: '#2563EB', marginTop: 1, flexShrink: 0 }} />
        <div>
          <p className="font-black uppercase" style={{ fontSize: 10, color: '#1E40AF', letterSpacing: '0.12em' }}>
            How Proposals Work
          </p>
          <p className="mt-1 leading-relaxed" style={{ fontSize: 11, color: '#1E3A8A' }}>
            Fill out the form below and click <strong>Submit Proposal for Review</strong>. Your proposal will be sent to the L&D Admin, who can approve it, convert it into an official PD Program, or reach out with questions. You'll be notified by the bell icon the moment there's an update.
          </p>
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>

        {/* ── Left: Form ───────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Confirmation state after first submit */}
          {submitted && (
            <div className="rounded-2xl border border-green-200 p-5 flex items-start gap-3"
              style={{ background: '#F0FDF4' }}>
              <CheckCircle size={20} style={{ color: '#16A34A', flexShrink: 0 }} />
              <div>
                <p className="font-black" style={{ fontSize: 13, color: '#15803D' }}>Proposal Submitted!</p>
                <p className="mt-1 leading-relaxed" style={{ fontSize: 11, color: '#166534' }}>
                  Your proposal has been sent to the L&D Admin for review. You'll be notified here once it's reviewed. Check your proposal status in the panel on the right.
                </p>
                <button onClick={() => setSubmitted(false)}
                  className="mt-2 font-bold hover:underline flex items-center gap-1"
                  style={{ fontSize: 11, color: '#16A34A' }}>
                  <ChevronRight size={13} /> Submit another proposal
                </button>
              </div>
            </div>
          )}

          {!submitted && (
            <div className="rounded-2xl border border-slate-100 p-5 space-y-4"
              style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>
                Proposal Details
              </p>

              {/* Title */}
              <Field label="Program / Activity Title" required tip="The official name of the training, seminar, or workshop you're proposing.">
                <input value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. PPST-Based Peer Coaching for Teacher I–III"
                  className={inputCls} style={inputStyle} />
                {errors.title && <p className="mt-1 font-semibold" style={{ fontSize: 10, color: '#DC2626' }}>{errors.title}</p>}
              </Field>

              {/* Category + Mode row */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Training Category" tip="The type of learning activity that best describes this proposal.">
                  <select value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className={inputCls + ' appearance-none'} style={inputStyle}>
                    <option value="">Select category…</option>
                    {TRAINING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {form.category === 'Other' && (
                    <input value={form.other_category}
                      onChange={e => setForm(p => ({ ...p, other_category: e.target.value }))}
                      placeholder="Specify training category…"
                      className={inputCls + ' mt-1.5'} style={inputStyle} />
                  )}
                </Field>
                <Field label="Mode of Delivery" tip="How the training will be delivered — in person, virtual, or both.">
                  <select value={form.mode_of_delivery}
                    onChange={e => setForm(p => ({ ...p, mode_of_delivery: e.target.value }))}
                    className={inputCls + ' appearance-none'} style={inputStyle}>
                    <option value="">Select mode…</option>
                    {DELIVERY_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
              </div>

              {/* Rationale */}
              <Field label="Rationale / Why is this needed?" required
                tip="Explain the specific competency gap or school need this program addresses. This is the most important part of your proposal.">
                <textarea value={form.rationale}
                  onChange={e => setForm(p => ({ ...p, rationale: e.target.value }))}
                  placeholder="Describe the gap or need this program will address…"
                  rows={4} className={inputCls} style={{ ...inputStyle, resize: 'vertical' }} />
                {errors.rationale && <p className="mt-1 font-semibold" style={{ fontSize: 10, color: '#DC2626' }}>{errors.rationale}</p>}
              </Field>

              {/* Target Participants — count + type */}
              <Field label="Target Participants" tip="Who should attend — select the personnel type and optionally enter an estimated headcount.">
                <div className="flex gap-2">
                  <input type="number" min="1" value={form.participant_count}
                    onChange={e => setForm(p => ({ ...p, participant_count: e.target.value }))}
                    placeholder="Count (e.g. 80)"
                    className={inputCls} style={{ ...inputStyle, width: '110px', flex: 'none' }} />
                  <select value={form.participant_type}
                    onChange={e => setForm(p => ({ ...p, participant_type: e.target.value }))}
                    className={inputCls + ' appearance-none flex-1'} style={inputStyle}>
                    {PARTICIPANT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </Field>

              {/* Duration */}
              <Field label="Duration" tip="Estimated length of the training activity.">
                <select value={form.duration_label}
                  onChange={e => setForm(p => ({ ...p, duration_label: e.target.value }))}
                  className={inputCls + ' appearance-none'} style={inputStyle}>
                  <option value="">Select duration…</option>
                  {DURATION_OPTIONS.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                </select>
                {form.duration_label === 'Other' && (
                  <input type="number" min="1" value={form.other_duration}
                    onChange={e => setForm(p => ({ ...p, other_duration: e.target.value }))}
                    placeholder="Enter total hours…"
                    className={inputCls + ' mt-1.5'} style={inputStyle} />
                )}
              </Field>

              {/* Dates + Budget row */}
              <div className="grid grid-cols-3 gap-3">
                <Field label="Proposed Date From">
                  <input type="date" value={form.proposed_date_from}
                    onChange={e => setForm(p => ({ ...p, proposed_date_from: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </Field>
                <Field label="Proposed Date To">
                  <input type="date" value={form.proposed_date_to}
                    onChange={e => setForm(p => ({ ...p, proposed_date_to: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </Field>
                <Field label="Estimated Budget (₱)" tip="Optional. Approximate cost for venue, materials, speaker fee, etc.">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold"
                      style={{ fontSize: 12, color: '#9CA3AF' }}>₱</span>
                    <input type="number" min="0" value={form.estimated_budget}
                      onChange={e => setForm(p => ({ ...p, estimated_budget: e.target.value }))}
                      placeholder="0.00"
                      className={inputCls} style={{ ...inputStyle, paddingLeft: '1.75rem' }} />
                  </div>
                </Field>
              </div>

              {/* Submit */}
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full text-white font-black uppercase py-3.5 rounded-xl transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: '#DE4E2A', fontSize: 12, letterSpacing: '0.12em', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? (
                  <><RefreshCw size={14} className="animate-spin" /> Submitting…</>
                ) : (
                  <><Send size={14} /> Submit Proposal for Review</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: My Proposals list ─────────────────────────── */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-100 p-5"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>
                My Proposals
              </p>
              <button onClick={fetchMyProposals}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Refresh">
                <RefreshCw size={12} style={{ color: '#6B7280' }} />
              </button>
            </div>

            {loadingProposals ? (
              <div className="py-8 text-center" style={{ fontSize: 11, color: '#9CA3AF' }}>Loading…</div>
            ) : proposals.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Lightbulb size={28} className="mx-auto" style={{ color: '#D1D5DB' }} />
                <p style={{ fontSize: 11, color: '#9CA3AF' }}>No proposals yet.</p>
                <p style={{ fontSize: 10, color: '#D1D5DB' }}>
                  Got a training idea? Fill out the form and submit your first proposal!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map(p => (
                  <div key={p.id}
                    className="p-3.5 rounded-xl hover:bg-slate-50 transition-colors"
                    style={{ border: '1px solid #E5E7EB' }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <p className="font-bold leading-tight" style={{ fontSize: 11, color: '#1B2A50' }}>{p.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={p.status} />
                        <button onClick={() => handleDeleteProposal(p.id, p.title)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete proposal">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {p.category && (
                      <p style={{ fontSize: 10, color: '#6B7280' }}>{p.category}</p>
                    )}
                    {(p.proposed_date_from || p.proposed_date_to) && (
                      <p className="flex items-center gap-1 mt-1" style={{ fontSize: 10, color: '#9CA3AF' }}>
                        <Clock size={10} />
                        {formatDate(p.proposed_date_from)}{p.proposed_date_to ? ` – ${formatDate(p.proposed_date_to)}` : ''}
                      </p>
                    )}

                    {/* Admin remarks shown when declined or under_review */}
                    {p.admin_remarks && (
                      <div className="mt-2 p-2.5 rounded-lg"
                        style={{
                          background: p.status === 'declined' ? '#FEF2F2' : '#FFFBEB',
                          border: `1px solid ${p.status === 'declined' ? '#FECACA' : '#FDE68A'}`,
                        }}>
                        <p className="font-black uppercase mb-0.5"
                          style={{ fontSize: 8, color: p.status === 'declined' ? '#DC2626' : '#B45309', letterSpacing: '0.1em' }}>
                          {p.status === 'declined' ? 'Reason for Decline' : 'Admin Remarks'}
                        </p>
                        <p style={{ fontSize: 10, color: '#374151' }}>{p.admin_remarks}</p>
                      </div>
                    )}

                    {/* Status icon row */}
                    <div className="flex items-center gap-1 mt-2">
                      {p.status === 'approved' && <CheckCircle size={11} style={{ color: '#16A34A' }} />}
                      {p.status === 'declined' && <XCircle size={11} style={{ color: '#DC2626' }} />}
                      {p.status === 'converted' && <CheckCircle size={11} style={{ color: '#2563EB' }} />}
                      <p style={{ fontSize: 9, color: '#9CA3AF' }}>
                        Submitted {formatDate(p.created_at)}
                        {p.reviewed_at ? ` • Reviewed ${formatDate(p.reviewed_at)}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDEmployeeProposeProgram;
