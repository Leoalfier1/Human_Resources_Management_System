import React, { useState, useEffect, useCallback } from 'react';
import { Upload, BookOpen, CheckCircle, Award, X, PartyPopper } from 'lucide-react';
import { apiFetch, SERVER_BASE } from '../../../../utils/api';

/* ── Toast ─────────────────────────────────────────────────── */
const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white animate-slide-up"
      style={{
        background: isSuccess ? '#16A34A' : '#DC2626',
        minWidth: 280,
        maxWidth: 360,
        border: `1px solid ${isSuccess ? '#15803d' : '#b91c1c'}`,
      }}
    >
      <div className="shrink-0 mt-0.5">
        {isSuccess
          ? <CheckCircle size={20} />
          : <X size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm leading-tight">{isSuccess ? 'Submitted!' : 'Error'}</p>
        <p className="text-white/80 text-xs mt-0.5 leading-snug">{toast.msg}</p>
      </div>
      <button onClick={onClose} className="shrink-0 text-white/60 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

/* ── Success overlay — shows briefly after submission ───────── */
const SuccessOverlay = ({ programTitle, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="flex flex-col items-center gap-4 px-10 py-10 rounded-3xl shadow-2xl text-center"
        style={{ background: '#fff', maxWidth: 340, width: '90%' }}
      >
        {/* Animated green ring + icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: '#DCFCE7', border: '3px solid #16A34A' }}
        >
          <CheckCircle size={42} style={{ color: '#16A34A' }} strokeWidth={2.5} />
        </div>

        <div>
          <p className="font-black text-xl" style={{ color: '#1B2A50' }}>Submitted!</p>
          <p className="text-sm font-semibold mt-1" style={{ color: '#4B5563' }}>
            Your attendance proof has been sent.
          </p>
          {programTitle && (
            <p className="text-xs mt-2 px-3 py-1.5 rounded-lg font-semibold" style={{ background: '#F0F9FF', color: '#0369A1' }}>
              {programTitle}
            </p>
          )}
        </div>

        <p className="text-xs" style={{ color: '#9CA3AF' }}>This will close automatically…</p>
      </div>
    </div>
  );
};

/* ── Status badge helper ────────────────────────────────────── */
const statusBadge = (s) => ({
  present:   { bg: '#DCFCE7', color: '#16A34A', label: 'Present' },
  absent:    { bg: '#FEF2F2', color: '#DC2626', label: 'Absent' },
  excused:   { bg: '#FEF3C7', color: '#B45309', label: 'Excused' },
  upcoming:  { bg: '#DBEAFE', color: '#2563EB', label: 'Upcoming' },
  ongoing:   { bg: '#E0E7FF', color: '#4F46E5', label: 'Ongoing' },
  Completed: { bg: '#DCFCE7', color: '#16A34A', label: 'Completed' },
  Enrolled:  { bg: '#DBEAFE', color: '#2563EB', label: 'Enrolled' },
}[s] || { bg: '#F9FAFB', color: '#6B7280', label: s || '—' });

/* ── Main component ─────────────────────────────────────────── */
const LDEmployeeAttendance = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(null);
  const [files, setFiles] = useState({});
  const [toast, setToast] = useState(null);         // { type: 'success'|'error', msg: string }
  const [submitting, setSubmitting] = useState(null);
  const [successOverlay, setSuccessOverlay] = useState(null); // { title: string }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/ld/programs/my-enrollments');
      if (res.ok) {
        const data = await res.json();
        setPrograms(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch enrollments error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const handleFileSelect = (e, programId) => {
    const f = e.target.files?.[0];
    if (f) setFiles(prev => ({ ...prev, [programId]: f }));
  };

  const handleDrop = (e, programId) => {
    e.preventDefault();
    setDragOver(null);
    const f = e.dataTransfer.files?.[0];
    if (f) setFiles(prev => ({ ...prev, [programId]: f }));
  };

  const handleSubmitAttendance = async (programId, programTitle) => {
    if (!files[programId]) return;
    setSubmitting(programId);
    try {
      const formData = new FormData();
      formData.append('program_id', programId);
      formData.append('proof', files[programId]);

      const token = localStorage.getItem('token');
      const res = await fetch(`${SERVER_BASE}/api/ld/programs/my/attendance/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit proof');
      }

      // Show the full-screen success overlay
      setSuccessOverlay({ title: programTitle });
      setFiles(prev => { const n = { ...prev }; delete n[programId]; return n; });
      fetchEnrollments();
    } catch (e) {
      showToast(e.message || 'Failed to submit attendance', 'error');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Full-screen success overlay */}
      {successOverlay && (
        <SuccessOverlay
          programTitle={successOverlay.title}
          onDone={() => setSuccessOverlay(null)}
        />
      )}

      {/* ── Stat card ───────────────────────────────── */}
      <div className="inline-flex items-center gap-4 rounded-2xl border border-slate-100 px-6 py-4"
        style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE' }}>
          <BookOpen size={20} style={{ color: '#2563EB' }} />
        </div>
        <div>
          <p className="font-black leading-none" style={{ fontSize: 28, color: '#1B2A50' }}>{programs.length}</p>
          <p className="font-bold mt-0.5" style={{ fontSize: 12, color: '#4B5563' }}>Programs Enrolled</p>
        </div>
      </div>

      {/* ── Program cards ───────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
          <div className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
        </div>
      ) : programs.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 p-8 text-center bg-white space-y-2">
          <p className="font-bold text-sm text-[#1B2A50]">No enrolled programs yet</p>
          <p className="text-xs text-gray-400">Browse available PD programs to apply and enroll.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map(p => {
            const attStatus = statusBadge(p.status);
            const hasFile = !!files[p.id];
            const isCompleted = p.status === 'Completed' || p.status === 'present';

            return (
              <div key={p.id} className="rounded-2xl border border-slate-100 p-5"
                style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

                {/* Title row */}
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold leading-tight" style={{ fontSize: 14, color: '#1B2A50' }}>
                    {p.title}
                  </p>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full font-bold"
                      style={{ background: attStatus.bg, color: attStatus.color, fontSize: 9 }}>
                      {attStatus.label}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <p className="mb-4" style={{ fontSize: 10, color: '#6B7280' }}>
                  {p.dates} • {p.venue || 'SDO Conference Hall'} • {p.hours} hrs
                </p>

                {/* Status-specific content */}
                {isCompleted ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
                    <CheckCircle size={20} style={{ color: '#16A34A' }} />
                    <div>
                      <p className="font-bold" style={{ fontSize: 12, color: '#16A34A' }}>Attendance Confirmed</p>
                      <p style={{ fontSize: 10, color: '#166534' }}>Your attendance has been recorded</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Drop zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(p.id); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleDrop(e, p.id)}
                      className="flex flex-col items-center justify-center py-8 rounded-xl mb-3 transition-colors"
                      style={{
                        border: `2px dashed ${dragOver === p.id ? '#DE4E2A' : hasFile ? '#16A34A' : '#E5E7EB'}`,
                        background: dragOver === p.id ? '#fff5f2' : hasFile ? '#DCFCE7' : '#fafafa',
                      }}>
                      <Upload size={22} style={{ color: hasFile ? '#16A34A' : '#6B7280', marginBottom: 8 }} />
                      {hasFile ? (
                        <p className="font-bold" style={{ fontSize: 12, color: '#16A34A' }}>✓ {files[p.id].name}</p>
                      ) : (
                        <>
                          <p className="font-bold" style={{ fontSize: 12, color: '#6B7280' }}>Upload proof of attendance</p>
                          <p className="mt-1" style={{ fontSize: 10, color: '#6B7280' }}>PDF, JPG, PNG • max 10MB</p>
                          <label className="mt-3 cursor-pointer font-bold underline underline-offset-2 transition-colors hover:text-[#1B2A50]"
                            style={{ fontSize: 11, color: '#6B7280' }}>
                            Browse file
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                              onChange={e => handleFileSelect(e, p.id)} />
                          </label>
                        </>
                      )}
                    </div>

                    {/* Submit button */}
                    <button
                      onClick={() => handleSubmitAttendance(p.id, p.title)}
                      disabled={!hasFile || submitting === p.id}
                      className="w-full font-black uppercase py-3 rounded-xl transition-all"
                      style={{
                        background: hasFile ? '#DE4E2A' : '#fdd5cc',
                        color: '#fff',
                        fontSize: 12,
                        letterSpacing: '0.12em',
                        cursor: hasFile ? 'pointer' : 'not-allowed',
                        opacity: submitting === p.id ? 0.6 : (hasFile ? 1 : 0.8),
                      }}>
                      {submitting === p.id ? '⏳ Submitting...' : 'SUBMIT ATTENDANCE'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LDEmployeeAttendance;
