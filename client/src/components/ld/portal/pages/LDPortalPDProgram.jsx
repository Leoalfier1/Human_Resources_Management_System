import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Download, Upload, Plus, Lightbulb, RefreshCw, ChevronDown, Check, X, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { apiFetch, SERVER_BASE } from '../../../../utils/api';
import FileUpload from '../../shared/FileUpload';
import {
  TRAINING_CATEGORIES, DELIVERY_MODES, DURATION_OPTIONS, PARTICIPANT_TYPES,
  normalizeDurationLabel, normalizeParticipantType, extractParticipantCount,
} from '../../shared/programFormOptions';

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: '#16A34A' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const attachBadge = (s) => ({
  Approved:  'bg-[#DCFCE7] text-[#16A34A]',
  Completed: 'bg-[#DCFCE7] text-[#16A34A]',
  Pending:   'bg-[#FEF3C7] text-[#B45309]',
  Draft:     'bg-[#F3F4F6] text-[#6B7280]',
}[s] || 'bg-[#F3F4F6] text-[#6B7280]');

const TH = ({ children }) => (
  <th className="text-left px-3 py-2.5 font-black uppercase"
    style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em', background: '#F9FAFB' }}>
    {children}
  </th>
);

const PROP_STATUS = {
  submitted:    { label: 'Submitted',    cls: 'bg-[#F3F4F6] text-[#6B7280]'  },
  under_review: { label: 'Under Review', cls: 'bg-[#FEF3C7] text-[#B45309]'  },
  approved:     { label: 'Approved',     cls: 'bg-[#DCFCE7] text-[#16A34A]'  },
  declined:     { label: 'Declined',     cls: 'bg-[#FEE2E2] text-[#DC2626]'  },
  converted:    { label: 'Converted',    cls: 'bg-[#DBEAFE] text-[#2563EB]'  },
};

const ProposalBadge = ({ s }) => {
  const d = PROP_STATUS[s] || { label: s, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`font-bold rounded-full px-2.5 py-0.5 ${d.cls}`} style={{ fontSize: 9 }}>{d.label}</span>;
};

const ReviewModal = ({ proposal, onClose, onSubmit }) => {
  const [action, setAction] = useState('under_review');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const doSubmit = async () => {
    if (action === 'declined' && !remarks.trim()) {
      alert('Please provide a reason for declining this proposal.');
      return;
    }
    setLoading(true);
    await onSubmit(proposal.id, action, remarks);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md space-y-4" style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between">
          <p className="font-black" style={{ fontSize: 14, color: '#1B2A50' }}>Review Proposal</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <p className="font-semibold" style={{ fontSize: 12, color: '#374151' }}>"{proposal.title}"</p>
        <p className="text-xs" style={{ color: '#6B7280' }}>By: {proposal.proposer_name}</p>

        {proposal.rationale && (
          <div className="p-3 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <p className="font-black uppercase mb-1" style={{ fontSize: 8, color: '#6B7280', letterSpacing: '0.1em' }}>Rationale</p>
            <p style={{ fontSize: 11, color: '#374151' }}>{proposal.rationale}</p>
          </div>
        )}

        <div>
          <label className="font-black uppercase block mb-2" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.12em' }}>Action</label>
          <div className="flex gap-2">
            {[
              { val: 'under_review', label: 'Request More Info', style: { background: '#FEF3C7', color: '#B45309' } },
              { val: 'approved',     label: 'Approve',           style: { background: '#DCFCE7', color: '#16A34A' } },
              { val: 'declined',     label: 'Decline',           style: { background: '#FEE2E2', color: '#DC2626' } },
            ].map(({ val, label, style }) => (
              <button key={val} onClick={() => setAction(val)}
                className="flex-1 py-2 rounded-lg font-bold transition-all"
                style={{ fontSize: 10, border: `2px solid ${action === val ? style.color : 'transparent'}`, ...style, opacity: action === val ? 1 : 0.6 }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-black uppercase block mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.12em' }}>
            Admin Remarks{action === 'declined' && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
            placeholder={action === 'declined' ? 'Required: explain why this proposal is declined…' : 'Optional: notes or questions for the employee…'}
            rows={3} className="w-full rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: '1px solid #E5E7EB', fontSize: 11, resize: 'vertical' }} />
          {action === 'declined' && !remarks.trim() && (
            <p style={{ fontSize: 9, color: '#DC2626' }}>Remarks are required when declining.</p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold" style={{ background: '#F3F4F6', fontSize: 11, color: '#6B7280' }}>Cancel</button>
          <button onClick={doSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-bold text-white" style={{ background: '#1B2A50', fontSize: 11, opacity: loading ? 0.7 : 1 }}>
            {loading ? <RefreshCw size={12} className="animate-spin mx-auto" /> : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConvertModal = ({ proposal, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const doConfirm = async () => { setLoading(true); await onConfirm(proposal.id); setLoading(false); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md space-y-4" style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between">
          <p className="font-black" style={{ fontSize: 14, color: '#1B2A50' }}>Convert to PD Program</p>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 12, color: '#374151' }}>
          This will create a new draft PD Program from <strong>"{proposal.title}"</strong>.
          You can edit the program details after conversion.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold" style={{ background: '#F3F4F6', fontSize: 11, color: '#6B7280' }}>Cancel</button>
          <button onClick={doConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-bold text-white" style={{ background: '#DE4E2A', fontSize: 11 }}>
            {loading ? <RefreshCw size={12} className="animate-spin mx-auto" /> : 'Approve & Convert'}
          </button>
        </div>
      </div>
    </div>
  );
};

const LDPortalPDProgram = () => {
  const location = useLocation();
  const initialTab = (location.state?.tab || new URLSearchParams(location.search).get('tab')) === 'proposals' ? 'proposals' : 'programs';
  const [tab, setTab] = useState(initialTab);
  const [toast, setToast] = useState(null);

  // My Programs State
  const [programId, setProgramId] = useState(location.state?.programId || null);
  const programIdRef = useRef(programId);
  // Keep ref always in sync with state — works regardless of how programId is set
  useEffect(() => { programIdRef.current = programId; }, [programId]);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [programForm, setProgramForm] = useState({
    title: '',
    training_category: '',
    methodology: '',
    duration_hours: '',       // stores the dropdown label (e.g. '3 days (24 hours)') or 'Other'
    venue: '',
    target_participants_count: '', // numeric count
    target_position_type: 'all',  // teaching | non_teaching | all
    budget_estimate: '',
  });

  const [matrix, setMatrix] = useState([]);
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  const [editMatrixIdx, setEditMatrixIdx] = useState(null);
  const [matrixForm, setMatrixForm] = useState({ session: '', duration: '', speaker: '', method: '', materials: '' });

  const [attachments, setAttachments] = useState([]);
  const [submittingQA, setSubmittingQA] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Assessment / Test Questions State
  const [testQuestions, setTestQuestions] = useState({ pre_test: [], post_test: [] });
  const [activeTestTab, setActiveTestTab] = useState('pre_test');
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editQuestionIdx, setEditQuestionIdx] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    id: null,
    test_type: 'pre_test',
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: ''
  });

  // "Other" free-text overrides for Training Category and Duration
  const [otherCategory, setOtherCategory] = useState('');
  const [otherDuration, setOtherDuration] = useState('');

  // Proposals State
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [convertModal, setConvertModal] = useState(null);
  const [proposalStatusFilter, setProposalStatusFilter] = useState('all');

  const showToast = (msg, color = '#16A34A') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3500); };

  // Fetch Program Details & Materials
  const fetchProgramDetails = useCallback(async () => {
    setLoadingProgram(true);
    try {
      let targetId = programId;
      if (!targetId) {
        const resList = await apiFetch('/api/ld/programs');
        const progs = await resList.json();
        if (Array.isArray(progs) && progs.length > 0) {
          targetId = progs[0].id;
          setProgramId(targetId);
          programIdRef.current = targetId;
        }
      }
      if (targetId) programIdRef.current = targetId;

      if (targetId) {
        const res = await apiFetch(`/api/ld/programs/${targetId}`);
        const data = await res.json();
        if (data && data.id) {
          // Normalize duration label from saved hours/label
          const savedLabel = data.duration_label || normalizeDurationLabel(data.duration_hours ? String(data.duration_hours) : '');
          const isOtherDur = savedLabel && !DURATION_OPTIONS.find(d => d.label === savedLabel && d.label !== 'Other');

          const savedCat = data.training_category || '';
          const isOtherCat = savedCat && !TRAINING_CATEGORIES.slice(0, -1).includes(savedCat); // not in preset list

          const savedPType = data.target_position_type
            || normalizeParticipantType(data.target_participants || '');
          const savedCount = data.participant_count
            || extractParticipantCount(data.target_participants || '');

          setProgramForm({
            title: data.title || '',
            training_category: isOtherCat ? 'Other' : savedCat,
            methodology: data.methodology || '',
            duration_hours: savedLabel === 'Other' || isOtherDur ? 'Other' : savedLabel,
            venue: data.venue || '',
            target_participants_count: String(savedCount),
            target_position_type: savedPType,
            budget_estimate: data.budget_estimate ? String(data.budget_estimate) : '',
          });

          if (isOtherCat) setOtherCategory(savedCat);
          if (savedLabel === 'Other' || isOtherDur) setOtherDuration(data.duration_hours ? String(data.duration_hours) : '');

          // Matrix parsed from JSON
          let parsedMatrix = [];
          if (data.training_matrix) {
            try {
              parsedMatrix = typeof data.training_matrix === 'string' ? JSON.parse(data.training_matrix) : data.training_matrix;
            } catch (e) {}
          }
          setMatrix(Array.isArray(parsedMatrix) ? parsedMatrix : []);
        }

        // Fetch materials
        const matRes = await apiFetch(`/api/ld/programs/materials/list?program_id=${targetId}`);
        const matData = await matRes.json();
        setAttachments(Array.isArray(matData) ? matData.map(m => ({
          id: m.id,
          name: m.title || m.file_name,
          status: 'Approved',
          path: m.file_path,
        })) : []);

        // Fetch tests
        const testRes = await apiFetch(`/api/ld/programs/${targetId}/tests`);
        if (testRes.ok) {
          const tData = await testRes.json();
          setTestQuestions({ pre_test: tData.pre_test || [], post_test: tData.post_test || [] });
        }
      }
    } catch (err) {
      console.error('Fetch program details error:', err);
    } finally {
      setLoadingProgram(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchProgramDetails();
  }, [fetchProgramDetails]);

  // Assessment Question Handlers
  const saveTestQuestionsToDB = async (updatedTests) => {
    setTestQuestions(updatedTests);
    if (!programId) return;
    try {
      const res = await apiFetch(`/api/ld/programs/${programId}/tests`, {
        method: 'POST',
        body: JSON.stringify(updatedTests),
      });
      if (!res.ok) throw new Error('Save tests failed');
      showToast('Assessment questions saved successfully');
    } catch (err) {
      showToast('Failed to save assessment questions', '#DC2626');
    }
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim()) return;
    const type = questionForm.test_type;
    const currentList = [...(testQuestions[type] || [])];

    let updatedList = [];
    if (editQuestionIdx !== null) {
      updatedList = currentList.map((q, idx) => idx === editQuestionIdx ? questionForm : q);
    } else {
      updatedList = [...currentList, questionForm];
    }

    const updatedTests = {
      ...testQuestions,
      [type]: updatedList
    };

    await saveTestQuestionsToDB(updatedTests);
    setQuestionModalOpen(false);
    setEditQuestionIdx(null);
  };

  const handleDeleteQuestion = async (type, idx) => {
    const currentList = [...(testQuestions[type] || [])];
    const updatedList = currentList.filter((_, i) => i !== idx);
    const updatedTests = {
      ...testQuestions,
      [type]: updatedList
    };
    await saveTestQuestionsToDB(updatedTests);
  };

  // Auto-save Program Form field
  const saveProgramField = async (fieldKey, value) => {
    if (!programId) return;
    try {
      const res = await apiFetch(`/api/ld/programs/${programId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [fieldKey]: value }),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch (err) {
      showToast(`Failed to save ${fieldKey}`, '#DC2626');
    }
  };

  const handleProgramFieldChange = (key, val) => {
    setProgramForm(p => ({ ...p, [key]: val }));
    // Resolve what to actually save to each DB column
    if (key === 'training_category') {
      const effective = val === 'Other' ? otherCategory : val;
      saveProgramField('training_category', effective);
    } else if (key === 'duration_hours') {
      // val is the label string or 'Other'
      const opt = DURATION_OPTIONS.find(d => d.label === val);
      if (opt && opt.hours !== null) {
        saveProgramField('duration_hours', opt.hours);
        saveProgramField('duration_label', opt.label);
      }
      // 'Other' — saved when otherDuration changes (see handleOtherDurationBlur)
    } else if (key === 'target_participants_count') {
      saveProgramField('participant_count', val ? parseInt(val, 10) : null);
    } else if (key === 'target_position_type') {
      saveProgramField('target_position_type', val);
      // Also compose legacy target_participants for backward compat
      const typeLabel = PARTICIPANT_TYPES.find(t => t.value === val)?.label || val;
      const count = programForm.target_participants_count;
      saveProgramField('target_participants', count ? `${count} ${typeLabel}` : typeLabel);
    } else {
      saveProgramField(key, val);
    }
  };

  const handleOtherCategoryBlur = () => {
    if (programForm.training_category === 'Other' && otherCategory.trim()) {
      saveProgramField('training_category', otherCategory.trim());
    }
  };

  const handleOtherDurationBlur = () => {
    if (programForm.duration_hours === 'Other' && otherDuration.trim()) {
      const hrs = parseFloat(otherDuration);
      if (!isNaN(hrs)) {
        saveProgramField('duration_hours', hrs);
        saveProgramField('duration_label', `${otherDuration} hours`);
      }
    }
  };

  // Persist Matrix
  const saveMatrixToDB = async (newMatrix) => {
    setMatrix(newMatrix);
    if (!programId) return;
    try {
      const res = await apiFetch(`/api/ld/programs/${programId}`, {
        method: 'PATCH',
        body: JSON.stringify({ training_matrix: newMatrix }),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch (err) {
      showToast('Failed to save training matrix', '#DC2626');
    }
  };

  const handleSaveMatrixRow = async () => {
    if (!matrixForm.session.trim()) return;
    setSavingMatrix(true);
    let updated = [];
    if (editMatrixIdx !== null) {
      updated = matrix.map((r, i) => i === editMatrixIdx ? matrixForm : r);
    } else {
      updated = [...matrix, matrixForm];
    }
    await saveMatrixToDB(updated);
    setSavingMatrix(false);
    setMatrixModalOpen(false);
    setMatrixForm({ session: '', duration: '', speaker: '', method: '', materials: '' });
    setEditMatrixIdx(null);
    showToast(editMatrixIdx !== null ? 'Session updated successfully' : 'Session added successfully');
  };

  const handleDeleteMatrixRow = async (i) => {
    const updated = matrix.filter((_, idx) => idx !== i);
    await saveMatrixToDB(updated);
    showToast('Session removed successfully');
  };

  // Submit for QA Review
  const handleSubmitForQA = async () => {
    if (!programId) return;
    setSubmittingQA(true);
    try {
      const res = await apiFetch(`/api/ld/programs/${programId}/submit-qa`, { method: 'POST' });
      if (res.ok) {
        showToast('Program submitted for QA review successfully!');
        fetchProgramDetails();
      } else {
        showToast('Failed to submit for QA', '#DC2626');
      }
    } catch {
      showToast('API Connection error', '#DC2626');
    } finally {
      setSubmittingQA(false);
    }
  };

  // Fetch Proposals
  const fetchProposals = useCallback(async () => {
    setLoadingProposals(true);
    try {
      const url = proposalStatusFilter === 'all'
        ? '/api/ld/proposals'
        : `/api/ld/proposals?status=${proposalStatusFilter}`;
      const res = await apiFetch(url);
      const d = await res.json();
      setProposals(Array.isArray(d) ? d : []);
    } catch { setProposals([]); }
    finally { setLoadingProposals(false); }
  }, [proposalStatusFilter]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleReview = async (id, status, admin_remarks) => {
    const res = await apiFetch(`/api/ld/proposals/${id}/review`, {
      method: 'PATCH', body: JSON.stringify({ status, admin_remarks }),
    });
    if (res.ok) { showToast('Proposal updated.'); fetchProposals(); }
    else { const e = await res.json(); showToast(e.message || 'Error', '#DC2626'); }
  };

  const handleConvert = async (id) => {
    const res = await apiFetch(`/api/ld/proposals/${id}/convert`, { method: 'POST' });
    if (res.ok) { showToast('Proposal converted to PD Program!'); fetchProposals(); }
    else { const e = await res.json(); showToast(e.message || 'Error', '#DC2626'); }
  };

  const handleDeleteProposal = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete proposal "${title}"?`)) return;
    const res = await apiFetch(`/api/ld/proposals/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Proposal deleted successfully.'); fetchProposals(); }
    else { const e = await res.json().catch(() => ({ message: 'Failed to delete' })); showToast(e.message || 'Error', '#DC2626'); }
  };

  const handleDeleteProgram = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete program "${title}"?`)) return;
    const res = await apiFetch(`/api/ld/programs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Program deleted successfully.');
      fetchProgramList();
    } else {
      const e = await res.json().catch(() => ({ message: 'Failed to delete' }));
      showToast(e.message || 'Error', '#DC2626');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const pendingCount = proposals.filter(p => p.status === 'submitted').length;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.msg || toast} onClose={() => setToast(null)} />}
      {reviewModal && <ReviewModal proposal={reviewModal} onClose={() => setReviewModal(null)} onSubmit={handleReview} />}
      {convertModal && <ConvertModal proposal={convertModal} onClose={() => setConvertModal(null)} onConfirm={handleConvert} />}

      {/* ── Tab switcher ─────────────────────────────────────────── */}
      <div className="flex gap-2 items-center">
        {[
          { key: 'programs',  label: 'My Programs' },
          { key: 'proposals', label: 'Employee Proposals', badge: pendingCount },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="relative px-5 py-2 rounded-full font-bold transition-all flex items-center gap-1.5"
            style={{ fontSize: 11, background: tab === t.key ? '#1B2A50' : '#fff', color: tab === t.key ? '#fff' : '#6B7280', border: tab === t.key ? 'none' : '1px solid #E5E7EB' }}>
            {t.key === 'proposals' && <Lightbulb size={12} />}
            {t.label}
            {t.badge > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black"
                style={{ background: '#DE4E2A', fontSize: 8 }}>{t.badge > 9 ? '9+' : t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: My Programs ────────────────────────────────────── */}
      {tab === 'programs' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 270px' }}>
          {/* ── Left ──────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Program Info form */}
            <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Program Information</p>
              {loadingProgram ? (
                <div className="space-y-3 py-4">
                  <div className="h-4 bg-slate-100 animate-pulse rounded w-full" />
                  <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Program/Activity Title</label>
                    <input value={programForm.title} onChange={e => handleProgramFieldChange('title', e.target.value)}
                      placeholder="Enter program title…"
                      className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors"
                      style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Training Category</label>
                    <select value={programForm.training_category}
                      onChange={e => handleProgramFieldChange('training_category', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors appearance-none"
                      style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }}>
                      <option value="">Select category…</option>
                      {TRAINING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {programForm.training_category === 'Other' && (
                      <input value={otherCategory}
                        onChange={e => setOtherCategory(e.target.value)}
                        onBlur={handleOtherCategoryBlur}
                        placeholder="Specify training category…"
                        className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors mt-1.5"
                        style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
                    )}
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Mode of Delivery</label>
                    <select value={programForm.methodology}
                      onChange={e => handleProgramFieldChange('methodology', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors appearance-none"
                      style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }}>
                      <option value="">Select mode…</option>
                      {DELIVERY_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Duration</label>
                    <select value={programForm.duration_hours}
                      onChange={e => handleProgramFieldChange('duration_hours', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors appearance-none"
                      style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }}>
                      <option value="">Select duration…</option>
                      {DURATION_OPTIONS.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                    </select>
                    {programForm.duration_hours === 'Other' && (
                      <input type="number" min="1" value={otherDuration}
                        onChange={e => setOtherDuration(e.target.value)}
                        onBlur={handleOtherDurationBlur}
                        placeholder="Enter total hours…"
                        className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors mt-1.5"
                        style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
                    )}
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Venue</label>
                    <input value={programForm.venue} onChange={e => handleProgramFieldChange('venue', e.target.value)}
                      placeholder="e.g. DCNHS Audio-Visual Room"
                      className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors"
                      style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
                  </div>

                  {/* Target Participants — split into count + type */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Target Participants</label>
                    <div className="flex gap-2">
                      <input type="number" min="1" value={programForm.target_participants_count}
                        onChange={e => handleProgramFieldChange('target_participants_count', e.target.value)}
                        placeholder="Count (e.g. 80)"
                        className="rounded-lg px-3 py-2 focus:outline-none transition-colors"
                        style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151', width: '110px' }} />
                      <select value={programForm.target_position_type}
                        onChange={e => handleProgramFieldChange('target_position_type', e.target.value)}
                        className="flex-1 rounded-lg px-3 py-2 focus:outline-none transition-colors appearance-none"
                        style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }}>
                        {PARTICIPANT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Budget / Fund Source</label>
                    <input value={programForm.budget_estimate} onChange={e => handleProgramFieldChange('budget_estimate', e.target.value)}
                      placeholder="e.g. 120000"
                      className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors"
                      style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Training Matrix */}
            <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Training Matrix</p>
                <button onClick={() => { setEditMatrixIdx(null); setMatrixForm({ session: '', duration: '', speaker: '', method: '', materials: '' }); setMatrixModalOpen(true); }}
                  className="flex items-center gap-1 font-bold text-white px-2.5 py-1 rounded-lg text-xs" style={{ background: '#DE4E2A' }}>
                  <Plus size={12} /> Add Session
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr>
                    {['Session / Topic', 'Duration', 'Resource Speaker', 'Methodology', 'Materials', 'Actions'].map(h => <TH key={h}>{h}</TH>)}
                  </tr>
                </thead>
                <tbody>
                  {matrix.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center" style={{ fontSize: 11, color: '#9CA3AF' }}>
                        No session topics added yet
                      </td>
                    </tr>
                  ) : (
                    matrix.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F9FAFB' }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ fontSize: 11, color: '#1B2A50' }}>{r.session}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap" style={{ fontSize: 11, color: '#6B7280' }}>{r.duration}</td>
                        <td className="px-3 py-2.5" style={{ fontSize: 11, color: '#4B5563' }}>{r.speaker}</td>
                        <td className="px-3 py-2.5" style={{ fontSize: 11, color: '#6B7280' }}>{r.method}</td>
                        <td className="px-3 py-2.5" style={{ fontSize: 11, color: '#2563EB' }}>{r.materials}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditMatrixIdx(i); setMatrixForm(r); setMatrixModalOpen(true); }} className="p-1 text-gray-500 hover:text-gray-700"><Pencil size={12} /></button>
                            <button onClick={() => handleDeleteMatrixRow(i)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {matrixModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-sm text-[#1B2A50]">{editMatrixIdx !== null ? 'Edit Session' : 'Add Session'}</p>
                      <button onClick={() => setMatrixModalOpen(false)}><X size={16} /></button>
                    </div>
                    <input placeholder="e.g. Classroom Observation Techniques" value={matrixForm.session} onChange={e => setMatrixForm(p => ({ ...p, session: e.target.value }))} className="w-full text-xs p-2 border rounded" />
                    <input placeholder="e.g. 3 hrs" value={matrixForm.duration} onChange={e => setMatrixForm(p => ({ ...p, duration: e.target.value }))} className="w-full text-xs p-2 border rounded" />
                    <input placeholder="e.g. Dr. Ma. Lim, PhD" value={matrixForm.speaker} onChange={e => setMatrixForm(p => ({ ...p, speaker: e.target.value }))} className="w-full text-xs p-2 border rounded" />
                    <input placeholder="e.g. Lecture-Discussion, Workshop, Demonstration & Practice" value={matrixForm.method} onChange={e => setMatrixForm(p => ({ ...p, method: e.target.value }))} className="w-full text-xs p-2 border rounded" />
                    <input placeholder="e.g. Slide deck, Handouts, Coaching templates" value={matrixForm.materials} onChange={e => setMatrixForm(p => ({ ...p, materials: e.target.value }))} className="w-full text-xs p-2 border rounded" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setMatrixModalOpen(false)} disabled={savingMatrix} className="px-3 py-1 text-xs text-gray-500 font-bold">Cancel</button>
                      <button onClick={handleSaveMatrixRow} disabled={savingMatrix} className="px-3 py-1 text-xs text-white bg-[#1B2A50] rounded-lg font-bold flex items-center gap-1">
                        {savingMatrix ? <RefreshCw size={10} className="animate-spin" /> : null}
                        {savingMatrix ? 'Saving...' : 'Save Session'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Program Assessments (Pre-Test & Post-Test Questions) */}
            <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Program Assessments</p>
                  <p className="text-[10px] text-gray-500">Configure optional Pre-Test and Post-Test questions for this program.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTestTab('pre_test')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeTestTab === 'pre_test' ? 'bg-[#1B2A50] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pre-Test ({(testQuestions.pre_test || []).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTestTab('post_test')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeTestTab === 'post_test' ? 'bg-[#1B2A50] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Post-Test ({(testQuestions.post_test || []).length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditQuestionIdx(null);
                      setQuestionForm({
                        id: null,
                        test_type: activeTestTab,
                        question_text: '',
                        question_type: 'multiple_choice',
                        options: ['', '', '', ''],
                        correct_answer: ''
                      });
                      setQuestionModalOpen(true);
                    }}
                    className="flex items-center gap-1 font-bold text-white px-2.5 py-1.5 rounded-xl text-xs"
                    style={{ background: '#DE4E2A' }}
                  >
                    <Plus size={12} /> Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {(testQuestions[activeTestTab] || []).length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl">
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                      No {activeTestTab === 'pre_test' ? 'Pre-Test' : 'Post-Test'} questions added yet. This program has no {activeTestTab === 'pre_test' ? 'Pre-Test' : 'Post-Test'} requirement.
                    </p>
                  </div>
                ) : (
                  (testQuestions[activeTestTab] || []).map((q, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-[#1B2A50]">Q{idx + 1}.</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                            {q.question_type === 'true_false' ? 'True / False' : 'Multiple Choice'}
                          </span>
                        </div>
                        <p className="font-bold text-xs text-slate-800">{q.question_text}</p>
                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 pt-1">
                          <span>Options: <strong>{(q.options || []).join(', ') || 'True, False'}</strong></span>
                          <span className="text-emerald-600 font-bold">• Correct: {q.correct_answer}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditQuestionIdx(idx);
                            setQuestionForm({
                              ...q,
                              test_type: activeTestTab,
                              options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ['', '', '', '']
                            });
                            setQuestionModalOpen(true);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(activeTestTab, idx)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Question Editor Modal */}
              {questionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <p className="font-black text-sm text-[#1B2A50]">
                        {editQuestionIdx !== null ? 'Edit Question' : 'Add Question'} ({activeTestTab === 'pre_test' ? 'Pre-Test' : 'Post-Test'})
                      </p>
                      <button onClick={() => setQuestionModalOpen(false)}><X size={16} /></button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Question Text</label>
                      <textarea
                        rows={2}
                        placeholder="Enter question text..."
                        value={questionForm.question_text}
                        onChange={e => setQuestionForm(p => ({ ...p, question_text: e.target.value }))}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Question Type</label>
                      <select
                        value={questionForm.question_type}
                        onChange={e => {
                          const newType = e.target.value;
                          setQuestionForm(p => ({
                            ...p,
                            question_type: newType,
                            options: newType === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
                            correct_answer: newType === 'true_false' ? 'True' : ''
                          }));
                        }}
                        className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="multiple_choice">Multiple Choice (4 Choices)</option>
                        <option value="true_false">True / False</option>
                      </select>
                    </div>

                    {questionForm.question_type === 'multiple_choice' ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-600">Answer Options & Correct Answer</label>
                        {questionForm.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correct_answer_choice"
                              checked={questionForm.correct_answer === opt && opt.trim() !== ''}
                              onChange={() => setQuestionForm(p => ({ ...p, correct_answer: opt }))}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                              value={opt}
                              onChange={e => {
                                const newOpts = [...questionForm.options];
                                newOpts[oIdx] = e.target.value;
                                const isWasCorrect = questionForm.correct_answer === opt;
                                setQuestionForm(p => ({
                                  ...p,
                                  options: newOpts,
                                  correct_answer: isWasCorrect ? e.target.value : p.correct_answer
                                }));
                              }}
                              className="flex-1 text-xs p-2 border border-slate-200 rounded-lg focus:outline-none"
                            />
                          </div>
                        ))}
                        <p className="text-[10px] text-slate-400">Select the radio button next to the correct answer choice.</p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Correct Answer</label>
                        <div className="flex gap-4">
                          {['True', 'False'].map(tf => (
                            <label key={tf} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input
                                type="radio"
                                name="correct_answer_tf"
                                value={tf}
                                checked={questionForm.correct_answer === tf}
                                onChange={() => setQuestionForm(p => ({ ...p, correct_answer: tf, options: ['True', 'False'] }))}
                              />
                              {tf}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setQuestionModalOpen(false)}
                        className="px-4 py-2 text-xs text-slate-500 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveQuestion}
                        disabled={!questionForm.question_text.trim() || !questionForm.correct_answer}
                        className="px-4 py-2 text-xs text-white bg-[#1B2A50] rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
                      >
                        Save Question
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right ───────────────────────────────── */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>File Attachments</p>
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <p className="text-center py-4" style={{ fontSize: 10, color: '#9CA3AF' }}>No files attached yet</p>
                ) : (
                  attachments.map((a, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                      style={{ border: '1px solid #E5E7EB' }}>
                      <FileText size={14} className="shrink-0" style={{ color: '#6B7280' }} />
                      <span className="flex-1 truncate font-medium" style={{ fontSize: 11, color: '#4B5563' }}>{a.name}</span>
                      <span className={`font-bold rounded-full px-1.5 py-0.5 ${attachBadge(a.status)}`} style={{ fontSize: 9 }}>{a.status}</span>
                      {a.path && (
                        <a href={`${SERVER_BASE}/${a.path}`} target="_blank" rel="noreferrer">
                          <Download size={13} className="shrink-0 cursor-pointer hover:text-slate-700" style={{ color: '#6B7280' }} />
                        </a>
                      )}
                    </div>
                  ))
                )}
                <FileUpload
                    endpoint={`${SERVER_BASE}/api/ld/programs/materials/upload`}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                    extraFormData={{ program_id: () => programIdRef.current, title: (f) => f.name }}
                    onSuccess={(data) => {
                      showToast('File uploaded successfully');
                      if (data) {
                        const newAttachment = {
                          id: data.id,
                          name: data.title || data.file_name || 'Uploaded File',
                          status: 'Approved',
                          path: data.file_path,
                        };
                        setAttachments(prev => [newAttachment, ...prev.filter(a => a.id !== data.id)]);
                      }
                      fetchProgramDetails();
                    }}
                    onError={(err) => showToast(err.message || 'Upload failed', '#DC2626')}>
                    {({ status }) => (
                      <div className="w-full flex items-center justify-center gap-1.5 font-bold rounded-xl py-2.5 mt-2 transition-colors"
                        style={{
                          border: '2px dashed #E5E7EB',
                          fontSize: 11,
                          color: '#6B7280',
                          cursor: 'pointer',
                          opacity: status === 'uploading' ? 0.6 : 1,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#1B2A50';
                          e.currentTarget.style.color = '#1B2A50';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.color = '#6B7280';
                        }}>
                        {status === 'uploading'
                          ? <><RefreshCw size={13} className="animate-spin" /> Uploading...</>
                          : <><Upload size={13} /> Upload File</>}
                      </div>
                    )}
                  </FileUpload>
              </div>
            </div>

            <button onClick={handleSubmitForQA} disabled={submittingQA}
              className="w-full text-white font-black uppercase py-3 rounded-xl transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
              style={{ background: '#DE4E2A', fontSize: 11, letterSpacing: '0.12em', opacity: submittingQA ? 0.6 : 1 }}>
              {submittingQA ? <RefreshCw size={14} className="animate-spin" /> : 'SUBMIT FOR QA REVIEW'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Employee Proposals ──────────────────────────────── */}
      {tab === 'proposals' && (
        <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Employee Proposals</p>
            <div className="flex gap-2 items-center">
              <select value={proposalStatusFilter} onChange={e => setProposalStatusFilter(e.target.value)}
                className="rounded-lg px-3 py-1.5 focus:outline-none appearance-none"
                style={{ border: '1px solid #E5E7EB', fontSize: 10, color: '#6B7280' }}>
                {[['all','All Statuses'],['submitted','Submitted'],['under_review','Under Review'],['approved','Approved'],['declined','Declined'],['converted','Converted']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <button onClick={fetchProposals} className="p-1.5 rounded-lg hover:bg-slate-100">
                <RefreshCw size={12} style={{ color: '#6B7280' }} />
              </button>
            </div>
          </div>

          {loadingProposals ? (
            <div className="py-10 text-center"><RefreshCw size={20} className="animate-spin mx-auto" style={{ color: '#1B2A50' }} /></div>
          ) : proposals.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Lightbulb size={28} className="mx-auto" style={{ color: '#D1D5DB' }} />
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>No proposals found.</p>
              <p style={{ fontSize: 10, color: '#D1D5DB' }}>Employees submit proposals via their Employee Portal → Propose a Program.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {['Title', 'Proposed By', 'Category', 'Dates', 'Budget', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-black uppercase"
                      style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em', background: '#F9FAFB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proposals.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td className="px-3 py-3">
                      <p className="font-semibold leading-tight" style={{ fontSize: 11, color: '#1B2A50' }}>{p.title}</p>
                      {p.admin_remarks && (
                        <p className="mt-0.5 truncate max-w-[180px]" style={{ fontSize: 9, color: '#6B7280' }} title={p.admin_remarks}>
                          Remarks: {p.admin_remarks}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3" style={{ fontSize: 11, color: '#6B7280' }}>{p.proposer_name}</td>
                    <td className="px-3 py-3" style={{ fontSize: 10, color: '#6B7280' }}>{p.category || '—'}</td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ fontSize: 10, color: '#6B7280' }}>
                      {formatDate(p.proposed_date_from)}{p.proposed_date_to ? ` – ${formatDate(p.proposed_date_to)}` : ''}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ fontSize: 10, color: '#374151' }}>
                      {p.estimated_budget ? `₱${Number(p.estimated_budget).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-3 py-3"><ProposalBadge s={p.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {(p.status === 'submitted' || p.status === 'under_review') && (
                          <button onClick={() => setReviewModal(p)}
                            className="px-2.5 py-1 rounded-lg font-bold transition-colors hover:opacity-80"
                            style={{ background: '#1B2A50', color: '#fff', fontSize: 9 }}>Review</button>
                        )}
                        {(p.status === 'approved') && (
                          <button onClick={() => setConvertModal(p)}
                            className="px-2.5 py-1 rounded-lg font-bold transition-colors hover:opacity-80"
                            style={{ background: '#DE4E2A', color: '#fff', fontSize: 9 }}>Convert</button>
                        )}
                        {p.status === 'submitted' && (
                          <button onClick={() => setConvertModal(p)}
                            className="px-2.5 py-1 rounded-lg font-bold transition-colors hover:opacity-80"
                            style={{ background: '#DE4E2A', color: '#fff', fontSize: 9 }}>Approve & Convert</button>
                        )}
                        <button onClick={() => handleDeleteProposal(p.id, p.title)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete proposal">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default LDPortalPDProgram;
