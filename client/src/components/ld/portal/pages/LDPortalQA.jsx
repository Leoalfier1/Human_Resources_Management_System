import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE } from '../../../../utils/api';

const Toast = ({ message, onClose, type = 'success' }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: type === 'success' ? '#16A34A' : '#DE4E2A' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const pipelineStages = ['Draft', 'SGOD Review', 'SDS Approved', 'Memo Issued'];

const LDPortalQA = () => {
  const location = useLocation();
  const programIdParam = location.state?.programId || 'qa';
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [programData, setProgramData] = useState(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(null);

  const showToast = (msg, type) => { setToast({ message: msg, type: type || 'success' }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socket.on('connect', () => socket.emit('join-ld-room', 'ld-admin'));
    socket.on('ld:dashboard:update', () => fetchQAData());
    return () => socket.disconnect();
  }, [programIdParam]);

  useEffect(() => {
    const interval = setInterval(fetchQAData, 30000);
    return () => clearInterval(interval);
  }, [programIdParam]);

  const fetchQAData = () => {
    setLoading(true);
    const url = programIdParam && programIdParam !== 'qa'
      ? `/api/ld/programs/${programIdParam}/qa`
      : `/api/ld/programs/qa/review`;

    apiFetch(url)
      .then(r => r.json())
      .then(d => {
        if (d && d.id) {
          setProgramData(d);
          setComments(d.comments || '');
        }
      })
      .catch(err => console.error('QA fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQAData();
  }, [programIdParam]);

  const checklist = programData?.checklist || {};
  const currentStage = programData?.approvalStage || 'SGOD Review';
  const currentIdx = pipelineStages.indexOf(currentStage) !== -1 ? pipelineStages.indexOf(currentStage) : 1;

  const allItems = Object.values(checklist).flat();
  const doneCount = allItems.filter(i => i.done).length;
  const totalCount = allItems.length;
  const needsCount = totalCount - doneCount;

  const handleToggleChecklist = (sectionName, itemIndex) => {
    if (!programData) return;
    const updatedChecklist = { ...checklist };
    if (updatedChecklist[sectionName] && updatedChecklist[sectionName][itemIndex]) {
      updatedChecklist[sectionName][itemIndex].done = !updatedChecklist[sectionName][itemIndex].done;
    }

    setProgramData(prev => ({ ...prev, checklist: updatedChecklist }));

    // Persist to backend
    apiFetch(`/api/ld/programs/${programData.id}/qa`, {
      method: 'PATCH',
      body: JSON.stringify({ checklist: updatedChecklist }),
    }).then(res => {
      if (res.ok) showToast('Checklist updated');
      else showToast('Failed to update checklist', 'error');
    }).catch(err => showToast('Checklist update error', 'error'));
  };

  const handleApprove = async () => {
    if (!programData) return;
    setProcessing('approve');
    const nextStageIdx = Math.min(currentIdx + 1, pipelineStages.length - 1);
    const nextStage = pipelineStages[nextStageIdx];

    try {
      const res = await apiFetch(`/api/ld/programs/${programData.id}/qa`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStage: nextStage, comments }),
      });
      if (res.ok) {
        showToast(`Program approved and moved to ${nextStage}!`);
        fetchQAData();
      } else {
        showToast('Failed to update stage', 'error');
      }
    } catch {
      showToast('API Connection error', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReturn = async () => {
    if (!programData) return;
    setProcessing('return');
    const prevStage = 'Draft';

    try {
      const res = await apiFetch(`/api/ld/programs/${programData.id}/qa`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStage: prevStage, comments }),
      });
      if (res.ok) {
        showToast('Returned for revision with comments.', 'warning');
        fetchQAData();
      } else {
        showToast('Failed to update stage', 'error');
      }
    } catch {
      showToast('API Connection error', 'error');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#1B2A50]" />
        <p style={{ fontSize: 12, color: '#6B7280' }}>Loading QA Review Data...</p>
      </div>
    );
  }

  if (!programData) {
    return (
      <div className="py-20 text-center">
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>No programs available for QA review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Approval pipeline ───────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <p className="font-black uppercase mb-5" style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.14em' }}>
          Approval Pipeline — {programData.title}
        </p>
        <div className="flex items-center">
          {pipelineStages.map((label, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  {isDone ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#16A34A' }}>
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black" style={{ background: '#DE4E2A', fontSize: 13 }}>
                      {i + 1}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black" style={{ border: '2px solid #D1D5DB', fontSize: 13, color: '#6B7280' }}>
                      {i + 1}
                    </div>
                  )}
                  <p className="font-bold mt-1.5 whitespace-nowrap"
                    style={{ fontSize: 9, color: isDone ? '#16A34A' : isCurrent ? '#DE4E2A' : '#6B7280' }}>
                    {label}
                  </p>
                </div>
                {i < pipelineStages.length - 1 && (
                  <div className="flex-1 h-0.5 mx-3"
                    style={{ background: i < currentIdx ? '#16A34A' : '#E5E7EB' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Two-column ──────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 290px' }}>

        {/* NEAP Checklist */}
        <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="font-black uppercase mb-5" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>NEAP Quality Standards Checklist</p>
          <div className="space-y-6">
            {Object.entries(checklist).map(([section, items]) => (
              <div key={section}>
                <p className="font-black uppercase mb-2" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.16em' }}>{section}</p>
                <div className="space-y-2">
                  {(items || []).map((item, i) => (
                    <div key={i} onClick={() => handleToggleChecklist(section, i)}
                      className="flex items-start gap-2.5 cursor-pointer select-none hover:opacity-80 transition-opacity">
                      {item.done
                        ? <CheckCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#16A34A' }} />
                        : <Circle     size={16} className="shrink-0 mt-0.5" style={{ color: '#D1D5DB' }} />}
                      <p className="leading-snug" style={{ fontSize: 11, color: item.done ? '#374151' : '#6B7280' }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review panel */}
        <div className="rounded-2xl border border-slate-100 p-5 space-y-3" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Review Panel</p>

          {/* Program summary */}
          <div className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
            <p className="font-bold leading-tight" style={{ fontSize: 11, color: '#1B2A50' }}>{programData.title}</p>
            <p className="mt-1" style={{ fontSize: 10, color: '#6B7280' }}>
              {programData.startDate ? new Date(programData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'} · {programData.pax} pax
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: '#FEF3C7', border: '1px solid #fde68a' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: '#B45309' }} />
            <p className="font-semibold" style={{ fontSize: 10, color: '#B45309' }}>{needsCount} items need attention</p>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between">
            <p className="font-bold uppercase" style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.1em' }}>Checklist Score</p>
            <p className="font-black" style={{ fontSize: 24, color: '#DE4E2A' }}>{doneCount}/{totalCount}</p>
          </div>

          {/* Comments */}
          <textarea placeholder="Add review comments or revisions needed…" rows={4}
            value={comments} onChange={e => setComments(e.target.value)}
            className="w-full rounded-lg px-3 py-2 resize-none focus:outline-none transition-colors"
            style={{ border: '1px solid #E5E7EB', fontSize: 11, color: '#374151' }} />

          {/* Action buttons */}
          <button onClick={handleApprove} disabled={processing === 'approve'}
            className="w-full text-white font-black uppercase py-2.5 rounded-xl transition-opacity hover:opacity-90 flex items-center justify-center gap-1"
            style={{ background: '#16A34A', fontSize: 10, letterSpacing: '0.12em', opacity: processing === 'approve' ? 0.6 : 1 }}>
            {processing === 'approve' ? <RefreshCw size={12} className="animate-spin" /> : 'APPROVE & FORWARD'}
          </button>
          <button onClick={handleReturn} disabled={processing === 'return'}
            className="w-full font-black uppercase py-2.5 rounded-xl transition-colors hover:border-[#1B2A50] hover:text-[#1B2A50] flex items-center justify-center gap-1"
            style={{ border: '2px solid #D1D5DB', fontSize: 10, letterSpacing: '0.12em', color: '#6B7280', opacity: processing === 'return' ? 0.6 : 1 }}>
            {processing === 'return' ? <RefreshCw size={12} className="animate-spin" /> : 'RETURN FOR REVISION'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LDPortalQA;
