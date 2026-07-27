import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Download, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Play, Award } from 'lucide-react';
import { io } from 'socket.io-client';
import { apiFetch, API_BASE, SERVER_BASE } from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';
import LDEmployeeTestModal from './LDEmployeeTestModal';

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: '#16A34A' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const LDEmployeeTrainingSession = () => {
  const { id } = useParams();
  const [slide, setSlide] = useState(0);
  const [slides, setSlides] = useState([
    { num: 1, title: 'Overview of Philippine Professional Standards for Teachers', sub: 'DepEd Order No. 42, s. 2017' },
  ]);
  const [materials, setMaterials] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programId, setProgramId] = useState(id || null);

  const [testStatus, setTestStatus] = useState(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  const [wap, setWap] = useState('');
  const [wapComp, setWapComp] = useState('');
  const [wapDate, setWapDate] = useState('');
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchSessionData = useCallback(async () => {
    setLoading(true);
    try {
      let progId = id;
      if (!progId) {
        const listRes = await apiFetch('/api/ld/programs');
        const list = await listRes.json();
        if (Array.isArray(list) && list.length > 0) progId = list[0].id;
      }

      if (progId) {
        setProgramId(progId);
        const matRes = await apiFetch(`/api/ld/programs/${progId}/session-materials`);
        const matData = await matRes.json();
        if (matData.slides && Array.isArray(matData.slides)) {
          setSlides(matData.slides.map((s, i) => ({ num: i + 1, title: s.title, sub: s.docRef })));
        }
        setMaterials(Array.isArray(matData.materials) ? matData.materials : []);

        const testRes = await apiFetch(`/api/ld/programs/${progId}/my-test-status`);
        if (testRes.ok) {
          const tStatus = await testRes.json();
          setTestStatus(tStatus);
        }
      }
    } catch (err) {
      console.error('Fetch session materials error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const handleSubmitWAP = async () => {
    if (!wapComp.trim() || !wap.trim()) { showToast('Please fill in the competency and plan details'); return; }
    setSubmitting(true);
    try {
      let progId = programId || 1;
      const res = await apiFetch(`/api/ld/programs/${progId}/submit-wap`, {
        method: 'POST',
        body: JSON.stringify({ wap_data: { competency: wapComp, targetDate: wapDate, plan: wap } }),
      });
      if (res.ok) {
        showToast('Workplace Application Plan (WAP) submitted successfully!');
        setWap(''); setWapComp(''); setWapDate('');
      } else {
        showToast('Error submitting WAP');
      }
    } catch {
      showToast('Error connecting to backend');
    } finally {
      setSubmitting(false);
    }
  };

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);

  const handleCheckIn = async (sessionName) => {
    setCheckingIn(true);
    try {
      let progId = programId || 1;
      const res = await apiFetch(`/api/ld/programs/${progId}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ session_name: sessionName || 'Day 2 Morning Session' }),
      });
      if (res.ok) {
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setCheckInTime(timeStr);
        showToast(`Checked in successfully at ${timeStr}`);
        setCheckins(p => [...p, sessionName || 'Day 2 Morning Session']);
      } else {
        showToast('Check-in failed');
      }
    } catch {
      showToast('Error connecting to backend');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (sessionName) => {
    setCheckingOut(true);
    try {
      let progId = programId || 1;
      const res = await apiFetch(`/api/ld/programs/${progId}/checkout`, {
        method: 'POST',
        body: JSON.stringify({ session_name: sessionName || 'Day 2 Morning Session' }),
      });
      if (res.ok) {
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setCheckOutTime(timeStr);
        showToast(`Checked out successfully at ${timeStr}`);
      } else {
        showToast('Check-out failed');
      }
    } catch {
      showToast('Error connecting to backend');
    } finally {
      setCheckingOut(false);
    }
  };

  const total = slides.length;
  const current = slides[slide] || slides[0];
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = io(API_BASE, { transports: ['polling', 'websocket'], upgrade: true });
    socket.on('connect', () => { if (user?.id) socket.emit('join-user-room', `ld-user-${user.id}`); });
    socket.on('ld:dashboard:update', () => fetchSessionData());
    return () => socket.disconnect();
  }, [isAuthenticated, user?.id, fetchSessionData]);

  const sessionSlots = [
    { label: 'Day 1 — Morning Session', status: 'Completed' },
    { label: 'Day 1 — Afternoon Session', status: 'Completed' },
    { label: 'Day 2 — Morning Session', status: checkInTime ? 'Present' : 'Pending' },
    { label: 'Day 2 — Afternoon Session', status: checkOutTime ? 'Completed' : 'Pending' },
    { label: 'Day 3 — Full Day', status: 'Pending' },
  ];

  // Post test unlocked if employee has checked in or checked out, or completed sessions
  const postTestUnlocked = !!checkInTime || !!checkOutTime || checkins.length > 0;

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <LDEmployeeTestModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        programId={programId}
        programTitle="Training Program"
        testType="post_test"
        onSubmitted={() => {
          fetchSessionData();
        }}
      />

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 280px' }}>

        {/* ── Left ────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Slide viewer */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex flex-col items-center justify-center px-10 py-12" style={{ background: '#1B2A50', minHeight: 230 }}>
              <p className="font-mono mb-3" style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                Slide {current.num} of {total}
              </p>
              <p className="font-black text-center leading-snug mb-2 text-white" style={{ fontSize: 18, maxWidth: 480 }}>
                {current.title}
              </p>
              <p className="text-center" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', maxWidth: 420 }}>
                {current.sub}
              </p>

              <div className="flex items-center gap-2 mt-6">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setSlide(i)}
                    className="rounded-full transition-all"
                    style={{ width: i === slide ? 20 : 8, height: 8, background: i === slide ? '#DE4E2A' : 'rgba(255,255,255,0.3)' }} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 bg-white" style={{ borderTop: '1px solid #E5E7EB' }}>
              <button onClick={() => setSlide(Math.max(0, slide - 1))}
                disabled={slide === 0}
                className="flex items-center gap-1.5 font-bold transition-colors"
                style={{ fontSize: 12, color: slide === 0 ? '#D1D5DB' : '#1B2A50', cursor: slide === 0 ? 'not-allowed' : 'pointer' }}>
                <ChevronLeft size={16} /> Prev
              </button>
              <span style={{ fontSize: 10, color: '#6B7280' }}>{slide + 1} / {total}</span>
              <button onClick={() => setSlide(Math.min(total - 1, slide + 1))}
                disabled={slide === total - 1}
                className="flex items-center gap-1.5 font-bold transition-colors"
                style={{ fontSize: 12, color: slide === total - 1 ? '#D1D5DB' : '#1B2A50', cursor: slide === total - 1 ? 'not-allowed' : 'pointer' }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Session materials */}
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Session Materials</p>
            {materials.length === 0 ? (
              <p style={{ fontSize: 11, color: '#9CA3AF' }}>No session materials uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {materials.map((m, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    style={{ border: '1px solid #E5E7EB' }}>
                    <FileText size={16} className="shrink-0 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ fontSize: 11, color: '#1B2A50' }}>{m.name}</p>
                      <p style={{ fontSize: 9, color: '#6B7280' }}>{m.size || 'PDF'}</p>
                    </div>
                    {m.path && (
                      <a href={`${SERVER_BASE}/${m.path}`} target="_blank" rel="noreferrer">
                        <Download size={13} style={{ color: '#6B7280' }} className="shrink-0 cursor-pointer hover:text-slate-900" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WAP Submission */}
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>
              Workplace Application Plan (WAP) Submission
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Competency to Develop</label>
                <input value={wapComp} onChange={e => setWapComp(e.target.value)} placeholder="e.g. Differentiated instruction"
                  className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors"
                  style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
              </div>
              <div>
                <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Target Implementation Date</label>
                <input value={wapDate} onChange={e => setWapDate(e.target.value)} placeholder="e.g. October 2026"
                  className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors"
                  style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
              </div>
            </div>
            <div className="mb-3">
              <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Workplace Application Plan</label>
              <textarea value={wap} onChange={e => setWap(e.target.value)} rows={4}
                placeholder="Describe how you will apply what you learned in your school/workplace…"
                className="w-full rounded-lg px-3 py-2 resize-none focus:outline-none transition-colors"
                style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
            </div>
            <button onClick={handleSubmitWAP} disabled={submitting}
              className="w-full text-white font-black uppercase py-3 rounded-xl transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: '#DE4E2A', fontSize: 12, letterSpacing: '0.12em', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? <RefreshCw size={14} className="animate-spin" /> : 'SUBMIT WAP'}
            </button>
          </div>
        </div>

        {/* ── Right ───────────────────────────────────── */}
        <div className="space-y-3">

          {/* Attendance check-in */}
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="font-black uppercase mb-3" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Attendance Check-In / Check-Out</p>
            <div className="rounded-xl p-3 mb-3 text-center" style={{ background: '#F9FAFB' }}>
              <p className="font-black" style={{ fontSize: 13, color: '#1B2A50' }}>Day 2 — Active Session</p>
              <p style={{ fontSize: 10, color: '#6B7280' }}>{todayStr} • Live Real-Time Tracking</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => handleCheckIn('Day 2 — Morning Session')} disabled={checkingIn}
                className="w-full text-white font-black uppercase py-2.5 rounded-xl transition-opacity hover:opacity-90 flex flex-col items-center justify-center gap-0.5"
                style={{ background: '#DE4E2A', fontSize: 10, letterSpacing: '0.08em', opacity: checkingIn ? 0.6 : 1 }}>
                {checkingIn ? <RefreshCw size={12} className="animate-spin" /> : <span>Check In Now</span>}
                {checkInTime && <span className="text-[9px] font-mono text-white/90">In: {checkInTime}</span>}
              </button>

              <button onClick={() => handleCheckOut('Day 2 — Afternoon Session')} disabled={checkingOut}
                className="w-full text-white font-black uppercase py-2.5 rounded-xl transition-opacity hover:opacity-90 flex flex-col items-center justify-center gap-0.5"
                style={{ background: '#1B2A50', fontSize: 10, letterSpacing: '0.08em', opacity: checkingOut ? 0.6 : 1 }}>
                {checkingOut ? <RefreshCw size={12} className="animate-spin" /> : <span>Check Out Now</span>}
                {checkOutTime && <span className="text-[9px] font-mono text-white/90">Out: {checkOutTime}</span>}
              </button>
            </div>

            <div className="space-y-2">
              {sessionSlots.map((slot, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p style={{ fontSize: 10, color: '#4B5563' }}>{slot.label}</p>
                  <span className={`font-bold rounded-full px-2 py-0.5 ${slot.status === 'Completed' || slot.status === 'Present' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF3C7] text-[#B45309]'}`}
                    style={{ fontSize: 9 }}>
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Post-Test Card — always visible for testing */}
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="font-black uppercase mb-2" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Post-Test Assessment</p>
            
            {testStatus?.post_test?.completed ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <CheckCircle size={15} /> Post-Test Completed ✓
                </div>
                <p className="text-[11px] text-emerald-600 font-medium">
                  Score: {testStatus.post_test.submission?.score}% ({testStatus.post_test.submission?.correct_count} / {testStatus.post_test.submission?.total_questions} correct)
                </p>
              </div>
            ) : postTestUnlocked ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-snug">
                  Session attendance recorded! Complete your final Post-Test assessment to conclude training.
                </p>
                <button
                  onClick={() => setTestModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-white font-black py-3 rounded-xl transition-opacity hover:opacity-90 shadow-sm"
                  style={{ background: '#DE4E2A', fontSize: 12, letterSpacing: '0.08em' }}
                >
                  <Play size={14} fill="white" /> Launch Post-Test
                </button>
              </div>
            ) : (
              <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: '#FEF3C7', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: 18 }}>⏰</span>
                <div>
                  <p className="font-bold" style={{ fontSize: 10, color: '#B45309' }}>Post-Test Locked</p>
                  <p style={{ fontSize: 9, color: '#d97706' }}>Check in for session above to unlock post-test</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LDEmployeeTrainingSession;

