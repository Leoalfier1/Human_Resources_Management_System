import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiFetch } from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: '#16A34A' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

/* ── shared rating circles ─────────────────────────── */
const RatingRow = ({ label, max = 4, name, ratings, setRatings }) => {
  const selected = ratings[name] || 0;
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F9FAFB' }}>
      <p className="flex-1 pr-6 leading-snug" style={{ fontSize: 11, color: '#4B5563' }}>{label}</p>
      <div className="flex items-center gap-2 shrink-0">
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => setRatings(p => ({ ...p, [name]: n }))}
            className="w-7 h-7 rounded-full font-black transition-all flex items-center justify-center"
            style={{
              background:   selected === n ? '#1B2A50' : 'transparent',
              border:       selected === n ? 'none'    : '2px solid #E5E7EB',
              color:        selected === n ? '#fff'    : '#6B7280',
              fontSize:     11,
            }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};

const eSATDomains = [
  {
    domain: 'Domain 1: Content Knowledge & Pedagogy',
    items: ['Applies knowledge of content within and across curriculum areas', 'Uses a range of teaching strategies to develop critical thinking', 'Evaluates how learners respond to learning activities'],
  },
  {
    domain: 'Domain 2: Learning Environment',
    items: ['Manages classroom structure for effective learning', 'Promotes a safe and positive learning environment', 'Communicates clear learning expectations'],
  },
  {
    domain: 'Domain 3: Diversity of Learners',
    items: ['Responds to learners\' needs across various dimensions', 'Applies differentiated instruction strategies', 'Uses inclusive materials and practices'],
  },
];

const LDEmployeeSelfAssessment = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('esat');

  // e-SAT State
  const [ratings, setRatings] = useState({});
  const [loadingESAT, setLoadingESAT] = useState(true);
  const [savingESAT, setSavingESAT] = useState(false);

  // IPCRF State
  const [ipcrfData, setIpcrfData] = useState(null);
  const [loadingIPCRF, setLoadingIPCRF] = useState(true);

  // IDP State
  const [idp, setIdp] = useState({ goal: '', area: '', intervention: '', target: '' });
  const [loadingIDP, setLoadingIDP] = useState(true);
  const [savingIDP, setSavingIDP] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Fetch e-SAT
  const fetchESAT = useCallback(async () => {
    setLoadingESAT(true);
    try {
      const res = await apiFetch('/api/ld/tna/my-esat');
      const data = await res.json();
      if (data && data.ratings) {
        setRatings(data.ratings);
      }
    } catch (err) {
      console.error('Fetch e-SAT error:', err);
    } finally {
      setLoadingESAT(false);
    }
  }, []);

  // Fetch IPCRF
  const fetchIPCRF = useCallback(async () => {
    setLoadingIPCRF(true);
    try {
      const res = await apiFetch('/api/ld/tna/my-ipcrf');
      const data = await res.json();
      setIpcrfData(data);
    } catch (err) {
      console.error('Fetch IPCRF error:', err);
    } finally {
      setLoadingIPCRF(false);
    }
  }, []);

  // Fetch IDP
  const fetchIDP = useCallback(async () => {
    setLoadingIDP(true);
    try {
      const res = await apiFetch('/api/ld/tna/my-idp');
      const data = await res.json();
      if (data) {
        setIdp({
          goal: data.developmentGoal || '',
          area: data.learningPriority || '',
          intervention: data.preferredIntervention || '',
          target: data.targetDate || '',
        });
      }
    } catch (err) {
      console.error('Fetch IDP error:', err);
    } finally {
      setLoadingIDP(false);
    }
  }, []);

  useEffect(() => {
    fetchESAT();
    fetchIPCRF();
    fetchIDP();
  }, [fetchESAT, fetchIPCRF, fetchIDP]);

  const handleSaveSelfAssessment = async () => {
    const ratedCount = Object.values(ratings).filter(v => v > 0).length;
    if (ratedCount === 0) { showToast('Please rate at least one competency item'); return; }
    setSavingESAT(true);
    try {
      const res = await apiFetch('/api/ld/tna/my-esat', {
        method: 'POST',
        body: JSON.stringify({ ratings }),
      });
      if (res.ok) {
        showToast('Self-assessment saved successfully!');
      } else {
        showToast('Error saving self-assessment');
      }
    } catch {
      showToast('API Connection error');
    } finally {
      setSavingESAT(false);
    }
  };

  const handleSaveIDP = async () => {
    if (!idp.goal.trim()) { showToast('Please fill in the development goal'); return; }
    setSavingIDP(true);
    try {
      const res = await apiFetch('/api/ld/tna/my-idp', {
        method: 'POST',
        body: JSON.stringify({
          developmentGoal: idp.goal,
          learningPriority: idp.area,
          preferredIntervention: idp.intervention,
          targetDate: idp.target,
        }),
      });
      if (res.ok) {
        showToast('Individual Development Plan saved successfully!');
      } else {
        showToast('Error saving IDP');
      }
    } catch {
      showToast('API Connection error');
    } finally {
      setSavingIDP(false);
    }
  };

  const personnelTypeLabel = user?.applicant_type === 'teaching_related'
    ? 'Teaching-Related Strand'
    : user?.applicant_type === 'non_teaching'
    ? 'Non-Teaching Strand'
    : 'Teaching Strand';

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Tab switcher */}
      <div className="flex gap-2">
        {[
          { key: 'esat', label: 'e-SAT (PPST)'           },
          { key: 'kra',  label: 'IPCRF / KRAs'           },
          { key: 'idp',  label: 'Individual Development Plan' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-full font-bold transition-all"
            style={{ fontSize: 11, background: tab === t.key ? '#1B2A50' : '#fff', color: tab === t.key ? '#fff' : '#6B7280', border: tab === t.key ? 'none' : '1px solid #E5E7EB' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab A: e-SAT ─────────────────────────────── */}
      {tab === 'esat' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>
                PPST Competency Self-Assessment — {user?.full_name || 'Personnel'}
              </p>
              <span className="inline-flex px-2.5 py-0.5 rounded-full font-bold" style={{ background: '#DBEAFE', color: '#2563EB', fontSize: 10 }}>
                {personnelTypeLabel}
              </span>
            </div>
            <p className="mb-4" style={{ fontSize: 10, color: '#6B7280' }}>
              Rating scale: 1 – Beginning &nbsp;•&nbsp; 2 – Developing &nbsp;•&nbsp; 3 – Proficient &nbsp;•&nbsp; 4 – Highly Proficient
            </p>

            {loadingESAT ? (
              <div className="space-y-4 py-4">
                <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-slate-100 animate-pulse rounded w-full" />
                <div className="h-4 bg-slate-100 animate-pulse rounded w-2/3" />
              </div>
            ) : (
              eSATDomains.map((d, di) => (
                <div key={di} className="mb-5">
                  <p className="font-black uppercase mb-2" style={{ fontSize: 10, color: '#1B2A50', letterSpacing: '0.12em' }}>{d.domain}</p>
                  {d.items.map((item, ii) => (
                    <RatingRow key={ii} label={item} max={4} name={`${di}-${ii}`} ratings={ratings} setRatings={setRatings} />
                  ))}
                </div>
              ))
            )}
          </div>
          <button onClick={handleSaveSelfAssessment} disabled={savingESAT}
            className="w-full text-white font-black uppercase py-3.5 rounded-xl transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: '#DE4E2A', fontSize: 12, letterSpacing: '0.12em', opacity: savingESAT ? 0.7 : 1 }}>
            {savingESAT ? <RefreshCw size={14} className="animate-spin" /> : 'SAVE SELF-ASSESSMENT'}
          </button>
        </div>
      )}

      {/* ── Tab B: IPCRF ─────────────────────────────── */}
      {tab === 'kra' && (
        <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>
            IPCRF Key Result Areas — SY 2025–2026
          </p>

          {loadingIPCRF ? (
            <div className="space-y-3 py-4">
              <div className="h-10 bg-slate-100 animate-pulse rounded w-full" />
              <div className="h-10 bg-slate-100 animate-pulse rounded w-full" />
              <div className="h-10 bg-slate-100 animate-pulse rounded w-full" />
            </div>
          ) : !ipcrfData || !ipcrfData.kras || ipcrfData.kras.length === 0 ? (
            <p className="text-center py-8" style={{ fontSize: 11, color: '#9CA3AF' }}>No IPCRF rating on file yet</p>
          ) : (
            ipcrfData.kras.map((k, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl mb-2"
                style={{ background: i % 2 === 0 ? '#F9FAFB' : '#fff' }}>
                <div>
                  <p className="font-bold" style={{ fontSize: 12, color: '#1B2A50' }}>{k.kra || k.label}</p>
                  <p className="mt-0.5" style={{ fontSize: 10, color: '#6B7280' }}>Weight: {k.weight}</p>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em' }}>Rating</p>
                  <p className="font-black" style={{ fontSize: 22, color: Number(k.rating || k.score) >= 3.5 ? '#16A34A' : '#1B2A50' }}>
                    {k.rating || k.score}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab C: IDP ───────────────────────────────── */}
      {tab === 'idp' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Individual Development Plan</p>
            {loadingIDP ? (
              <div className="space-y-3 py-4">
                <div className="h-8 bg-slate-100 animate-pulse rounded w-full" />
                <div className="h-8 bg-slate-100 animate-pulse rounded w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Development Goal',                      key: 'goal'         },
                  { label: 'Learning Priority Area (PPST Domain)',  key: 'area'         },
                  { label: 'Preferred Intervention',               key: 'intervention' },
                  { label: 'Target Completion Date',               key: 'target'       },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>{f.label}</label>
                    <input value={idp[f.key]} onChange={e => setIdp(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={`Enter ${f.label.toLowerCase()}…`}
                      className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors"
                      style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSaveIDP} disabled={savingIDP}
            className="w-full text-white font-black uppercase py-3.5 rounded-xl transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: '#DE4E2A', fontSize: 12, letterSpacing: '0.12em', opacity: savingIDP ? 0.7 : 1 }}>
            {savingIDP ? <RefreshCw size={14} className="animate-spin" /> : 'SAVE IDP'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LDEmployeeSelfAssessment;
