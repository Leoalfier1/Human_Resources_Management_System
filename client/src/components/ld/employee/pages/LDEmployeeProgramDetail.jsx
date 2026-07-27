import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw, ArrowLeft, AlertCircle, Play } from 'lucide-react';
import { apiFetch } from '../../../../utils/api';
import LDEmployeeTestModal from './LDEmployeeTestModal';

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: '#16A34A' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const LDEmployeeProgramDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [program, setProgram] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState(null);
  const [applying, setApplying] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let progId = id || location.state?.programId;
      if (!progId) {
        const listRes = await apiFetch('/api/ld/programs');
        if (listRes && listRes.ok) {
          const list = await listRes.json();
          if (Array.isArray(list) && list.length > 0) {
            progId = list[0].id;
          }
        }
      }

      if (progId) {
        const res = await apiFetch(`/api/ld/programs/${progId}`);
        if (res && res.status === 404) {
          setProgram(null);
          return;
        }
        if (!res || !res.ok) {
          throw new Error('Failed to fetch program details');
        }
        const p = await res.json();
        if (!p || !p.id) {
          setProgram(null);
          return;
        }
        setProgram(p);

        try {
          const eligRes = await apiFetch(`/api/ld/programs/${progId}/eligibility`);
          if (eligRes && eligRes.ok) {
            const eData = await eligRes.json();
            setEligibility(eData);
          }
        } catch (e) {
          console.warn('Eligibility check fetch warning:', e);
        }

        try {
          const testRes = await apiFetch(`/api/ld/programs/${progId}/my-test-status`);
          if (testRes && testRes.ok) {
            const tStatus = await testRes.json();
            setTestStatus(tStatus);
          }
        } catch (e) {
          console.warn('Test status fetch warning:', e);
        }
      } else {
        setProgram(null);
      }
    } catch (err) {
      console.error('Fetch program detail error:', err);
      setFetchError('Something went wrong loading this program');
    } finally {
      setLoading(false);
    }
  }, [id, location.state]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleApply = async () => {
    if (!program) return;
    setApplying(true);
    try {
      const res = await apiFetch(`/api/ld/programs/${program.id}/enroll`, { method: 'POST' });
      const data = await res.json().catch(() => ({ message: 'Application failed.' }));
      if (res.ok) {
        showToast('Application submitted successfully! Check your email for confirmation.');
        fetchDetail();
      } else {
        showToast(data.message || 'Application failed.');
      }
    } catch {
      showToast('Error connecting to backend.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#1B2A50]" />
        <p className="text-xs text-gray-500 font-bold">Loading program details…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-100 space-y-3">
        <AlertCircle size={28} className="mx-auto text-red-500" />
        <p className="font-bold text-sm text-[#1B2A50]">{fetchError}</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={fetchDetail} className="px-4 py-2 rounded-xl text-white font-bold bg-[#1B2A50] text-xs hover:opacity-90 transition-opacity">
            Try again
          </button>
          <button onClick={() => navigate('/ld-employee/browse-programs', { state: location.state })} className="text-xs text-blue-600 font-bold">
            ← Back to Browse Programs
          </button>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 space-y-2">
        <p className="font-bold text-sm text-[#1B2A50]">We couldn't find this program</p>
        <p className="text-xs text-gray-500">It may have been closed, removed, or the link is outdated.</p>
        <button onClick={() => navigate('/ld-employee/browse-programs', { state: location.state })} className="text-xs text-blue-600 font-bold">
          ← Back to Browse Programs
        </button>
      </div>
    );
  }

  let matrixSchedule = [];
  if (program.training_matrix) {
    try {
      matrixSchedule = typeof program.training_matrix === 'string' ? JSON.parse(program.training_matrix) : program.training_matrix;
    } catch (e) {}
  }

  const enrolledCount = program.enrolled_count || 0;
  const maxSlots = program.max_slots || program.participant_count || 80;
  const slotsAvailable = maxSlots - enrolledCount;
  const slotsFull = slotsAvailable <= 0;
  const alreadyIn = Boolean(eligibility?.alreadyEnrolled);
  const preTestNeeded = !testStatus?.pre_test?.completed;
  const canApply = !slotsFull && !alreadyIn;

  const infoGrid = [
    { label: 'Date',             value: program.start_date ? `${new Date(program.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'August 5–7, 2026' },
    { label: 'Duration',         value: program.duration_hours ? `${program.duration_hours} hours` : '3 days (24 hours)' },
    { label: 'Venue',            value: program.venue || 'SDO Conference Room' },
    { label: 'Mode',             value: program.methodology || 'Face-to-face' },
    { label: 'Resource Speaker', value: program.resource_person || 'Dr. Ma. Lim, PhD' },
    { label: 'Available Slots',  value: `${enrolledCount}/${maxSlots} filled` },
  ];

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <LDEmployeeTestModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        programId={program?.id}
        programTitle={program?.title}
        testType="pre_test"
        onSubmitted={() => {
          fetchDetail();
        }}
      />
      
      {/* Top back button */}
      <div>
        <button
          onClick={() => navigate('/ld-employee/browse-programs', { state: location.state })}
          className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-[#1B2A50] transition-colors"
          style={{ fontSize: 11 }}>
          <ArrowLeft size={14} /> Back to Browse Programs
        </button>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 270px' }}>

        {/* ── Left ────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex px-2 py-0.5 rounded-full font-bold" style={{ background: '#DBEAFE', color: '#2563EB', fontSize: 9 }}>
                {program.target_participants || 'Teaching'}
              </span>
              <span className="inline-flex px-2 py-0.5 rounded-full font-bold" style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 9 }}>
                {program.status === 'cancelled' ? 'Closed' : 'Open'}
              </span>
            </div>
            <p className="font-black mb-4" style={{ fontSize: 17, color: '#1B2A50' }}>
              {program.title}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {infoGrid.map(item => (
                <div key={item.label} className="rounded-xl p-3" style={{ background: '#F9FAFB' }}>
                  <p className="font-black uppercase mb-0.5" style={{ fontSize: 8, color: '#6B7280', letterSpacing: '0.14em' }}>{item.label}</p>
                  <p className="font-bold" style={{ fontSize: 11, color: '#1B2A50' }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
              <p className="font-black uppercase mb-2" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Program Description</p>
              <p className="leading-relaxed" style={{ fontSize: 11, color: '#4B5563' }}>
                {program.description || 'This professional development program equips personnel with evidence-based skills and standards-aligned strategies to enhance instructional quality and division performance.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Program Schedule</p>
            {matrixSchedule.length === 0 ? (
              <p style={{ fontSize: 11, color: '#9CA3AF' }}>No detailed matrix sessions listed yet.</p>
            ) : (
              <div className="space-y-3">
                {matrixSchedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#DE4E2A' }} />
                    <div className="flex-1">
                      <p className="font-bold" style={{ fontSize: 11, color: '#1B2A50' }}>{s.session}</p>
                      <p style={{ fontSize: 10, color: '#6B7280' }}>Speaker: {s.speaker || 'TBD'} • {s.duration || '2 hrs'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right ───────────────────────────────────── */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Eligibility Check</p>
            <div className="space-y-2.5">
              {eligibility?.checks?.map((e, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {e.status === 'passed' ? (
                    <CheckCircle size={16} className="shrink-0" style={{ color: '#16A34A' }} />
                  ) : (
                    <XCircle size={16} className="shrink-0" style={{ color: '#DC2626' }} />
                  )}
                  <p style={{ fontSize: 11, color: e.status === 'passed' ? '#374151' : '#DC2626' }}>{e.title}</p>
                </div>
              ))}
            </div>

            {eligibility?.eligible ? (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="font-bold text-[11px] text-emerald-700">✓ You are eligible to apply for this program.</p>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="font-bold text-[11px] text-red-600">✕ Please resolve failing criteria above before applying.</p>
              </div>
            )}
          </div>

          {/* Pre-Test Requirement Section — always visible for testing */}
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="font-black uppercase mb-2" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Pre-Test Requirement</p>
            {testStatus?.pre_test?.completed ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <CheckCircle size={15} /> Pre-Test Completed ✓
                </div>
                <p className="text-[11px] text-emerald-600 font-medium">
                  Score: {testStatus.pre_test.submission?.score}% ({testStatus.pre_test.submission?.correct_count} / {testStatus.pre_test.submission?.total_questions} correct)
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 leading-snug text-xs text-slate-500">
                  Complete the required Pre-Test before your application can be processed.
                </p>
                <button
                  onClick={() => setTestModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-white font-black py-3 rounded-xl transition-opacity hover:opacity-90 shadow-sm"
                  style={{ background: '#1B2A50', fontSize: 12, letterSpacing: '0.08em' }}
                >
                  <Play size={14} fill="white" /> Launch Pre-Test
                </button>
              </>
            )}
          </div>

          <div className="space-y-1">
            <button onClick={handleApply} disabled={!canApply || applying}
              className="w-full text-white font-black uppercase py-3.5 rounded-xl transition-opacity hover:opacity-90"
              style={{
                background: canApply ? '#DE4E2A' : '#E5E7EB',
                color: canApply ? '#fff' : '#9CA3AF',
                fontSize: 12,
                letterSpacing: '0.12em',
                cursor: canApply ? 'pointer' : 'not-allowed',
                opacity: applying ? 0.6 : 1,
              }}>
              {applying ? 'Submitting...' : alreadyIn ? 'ALREADY ENROLLED' : slotsFull ? 'NO AVAILABLE SLOTS' : 'APPLY FOR THIS PROGRAM'}
            </button>

            {preTestNeeded && !alreadyIn && (
              <p className="text-[10px] text-center text-amber-600 font-bold px-2 pt-1">
                ⚠️ Complete the Pre-Test above to unlock application.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDEmployeeProgramDetail;

