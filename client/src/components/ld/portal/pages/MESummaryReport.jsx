import React, { useState, useEffect, useCallback } from 'react';
import { X, BarChart3, Download, Printer, Save, Star, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../../utils/api';

const StarRating = ({ rating }) => {
  const val = parseFloat(rating) || 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={14}
          fill={n <= Math.round(val) ? '#FFCF40' : 'none'}
          stroke={n <= Math.round(val) ? '#FFCF40' : '#D1D5DB'} />
      ))}
      <span className="ml-1 font-bold" style={{ fontSize: 12, color: '#1B2A50' }}>
        {rating != null ? parseFloat(rating).toFixed(2) : 'N/A'}
      </span>
    </div>
  );
};

const BarMeter = ({ value, max = 5, color = '#1B2A50' }) => {
  const pct = max > 0 ? (parseFloat(value || 0) / max) * 100 : 0;
  return (
    <div className="w-full h-3 rounded-full" style={{ background: '#F3F4F6' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
};

const MESummaryReport = ({ programId, onClose }) => {
  const [programs, setPrograms] = useState([]);
  const [selectedId, setSelectedId] = useState(programId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [strengths, setStrengths] = useState([]);
  const [areas, setAreas] = useState([]);
  const [recommendations, setRecommendations] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [newArea, setNewArea] = useState('');

  useEffect(() => {
    apiFetch('/api/ld/reports/completed-programs')
      .then(r => r.json()).then(d => {
        const list = Array.isArray(d) ? d : [];
        setPrograms(list);
        if (programId) {
          setSelectedId(String(programId));
        } else if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      }).catch(() => {});
  }, [programId]);

  const fetchData = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/ld/reports/programs/${selectedId}/me-summary`);
      const d = await res.json();
      setData(d);
      setStrengths(Array.isArray(d.strengths) ? d.strengths : []);
      setAreas(Array.isArray(d.areas_for_improvement) ? d.areas_for_improvement : []);
      setRecommendations(d.recommendations || '');
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [selectedId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/ld/reports/programs/${selectedId}/me-summary`, {
        method: 'PUT', body: JSON.stringify({ strengths, areas_for_improvement: areas, recommendations })
      });
      if (res.ok) alert('M&E Summary saved successfully');
      else alert('Failed to save M&E Summary');
    } catch (e) { alert('Error saving M&E Summary'); }
    setSaving(false);
  };

  const handleExportPDF = () => {
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const url = `${baseUrl.replace(/\/api$/, '')}/api/ld/reports/programs/${selectedId}/me-summary/export?token=${token}`;
    window.open(url, '_blank');
  };

  const addStrength = () => { if (newStrength.trim()) { setStrengths(p => [...p, newStrength.trim()]); setNewStrength(''); } };
  const addArea = () => { if (newArea.trim()) { setAreas(p => [...p, newArea.trim()]); setNewArea(''); } };
  const removeStrength = (i) => setStrengths(p => p.filter((_, idx) => idx !== i));
  const removeArea = (i) => setAreas(p => p.filter((_, idx) => idx !== i));

  const evalData = data?.evaluation || {};
  const learning = data?.learning || {};
  const program = data?.program || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 sticky top-0 z-10" style={{ borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DCFCE7' }}>
              <BarChart3 size={20} style={{ color: '#16A34A' }} />
            </div>
            <div>
              <p className="font-black uppercase" style={{ fontSize: 13, color: '#1B2A50', letterSpacing: '0.1em' }}>M&E Summary Report</p>
              <p style={{ fontSize: 10, color: '#6B7280' }}>Step 10 — Continuous Improvement</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <X size={16} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="p-5">

          {/* Program selector */}
          <div className="mb-5">
            <label className="font-bold block mb-1" style={{ fontSize: 11, color: '#1B2A50' }}>Select Completed Program</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 focus:outline-none"
              style={{ border: '1px solid #E5E7EB', fontSize: 11 }}>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.title} ({p.start_date || 'No date'})</option>
              ))}
            </select>
          </div>

          {loading && <p className="text-center py-8" style={{ color: '#6B7280', fontSize: 12 }}>Loading...</p>}

          {data && !loading && (
            <div className="space-y-5">

              {/* Header info */}
              <div className="rounded-xl p-4" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <p className="font-black" style={{ fontSize: 14, color: '#1B2A50' }}>{program.title}</p>
                <div className="grid grid-cols-4 gap-3 mt-2" style={{ fontSize: 11 }}>
                  <div><span style={{ color: '#6B7280' }}>Dates:</span><br /><span className="font-semibold">{program.start_date || 'N/A'} – {program.end_date || 'N/A'}</span></div>
                  <div><span style={{ color: '#6B7280' }}>Venue:</span><br /><span className="font-semibold">{program.venue || 'N/A'}</span></div>
                  <div><span style={{ color: '#6B7280' }}>Duration:</span><br /><span className="font-semibold">{program.duration_hours || 0} hrs</span></div>
                  <div><span style={{ color: '#6B7280' }}>Participants:</span><br /><span className="font-semibold">{program.total_participants || 0}</span></div>
                </div>
              </div>

              {/* Evaluation Results Summary */}
              <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                <p className="font-black uppercase mb-3" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.1em' }}>Evaluation Results Summary</p>
                <div className="space-y-3">
                  {[
                    { label: 'Content Relevance', val: evalData.avg_content_relevance, color: '#2563EB' },
                    { label: 'Facilitator Effectiveness', val: evalData.avg_facilitator_effectiveness, color: '#7C3AED' },
                    { label: 'Venue & Logistics', val: evalData.avg_venue_logistics, color: '#16A34A' }
                  ].map(c => (
                    <div key={c.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 11, color: '#4B5563' }}>{c.label}</span>
                        <StarRating rating={c.val} />
                      </div>
                      <BarMeter value={c.val} color={c.color} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: '#6B7280' }}>Overall Average: </span>
                    <span className="font-black" style={{ color: '#1B2A50' }}>{evalData.overall_avg || 'N/A'} / 5</span>
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: '#6B7280' }}>Response Rate: </span>
                    <span className="font-black" style={{ color: '#1B2A50' }}>{evalData.total_evaluations} / {program.total_participants} ({evalData.response_rate}%)</span>
                  </div>
                </div>
              </div>

              {/* Learning Results Summary */}
              <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                <p className="font-black uppercase mb-3" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.1em' }}>Learning Results Summary</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg" style={{ background: '#FEF3C7' }}>
                    <p style={{ fontSize: 10, color: '#92400E' }}>Avg Pre-test</p>
                    <p className="font-black" style={{ fontSize: 20, color: '#92400E' }}>{learning.pretest_avg != null ? learning.pretest_avg : '—'}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: '#DCFCE7' }}>
                    <p style={{ fontSize: 10, color: '#166534' }}>Avg Post-test</p>
                    <p className="font-black" style={{ fontSize: 20, color: '#166534' }}>{learning.posttest_avg != null ? learning.posttest_avg : '—'}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: '#DBEAFE' }}>
                    <p style={{ fontSize: 10, color: '#1E40AF' }}>Improvement</p>
                    <p className="font-black" style={{ fontSize: 20, color: learning.improvement_delta > 0 ? '#16A34A' : '#1E40AF' }}>
                      {learning.improvement_delta != null ? `${learning.improvement_delta > 0 ? '+' : ''}${learning.improvement_delta}` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Strengths & Areas for Improvement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                  <p className="font-black uppercase mb-3" style={{ fontSize: 11, color: '#16A34A', letterSpacing: '0.1em' }}>Strengths</p>
                  <div className="space-y-1.5">
                    {strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5" style={{ borderBottom: '1px solid #F9FAFB' }}>
                        <span className="mt-0.5" style={{ fontSize: 11, color: '#4B5563' }}>• {s}</span>
                        <button onClick={() => removeStrength(i)} className="ml-auto shrink-0 hover:opacity-70">
                          <Trash2 size={12} style={{ color: '#DC2626' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <input value={newStrength} onChange={e => setNewStrength(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addStrength()}
                      placeholder="Add strength..."
                      className="flex-1 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      style={{ border: '1px solid #E5E7EB', fontSize: 10 }} />
                    <button onClick={addStrength}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
                      style={{ border: '1px solid #E5E7EB' }}>
                      <Plus size={12} style={{ color: '#6B7280' }} />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                  <p className="font-black uppercase mb-3" style={{ fontSize: 11, color: '#DC2626', letterSpacing: '0.1em' }}>Areas for Improvement</p>
                  <div className="space-y-1.5">
                    {areas.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5" style={{ borderBottom: '1px solid #F9FAFB' }}>
                        <span className="mt-0.5" style={{ fontSize: 11, color: '#4B5563' }}>• {a}</span>
                        <button onClick={() => removeArea(i)} className="ml-auto shrink-0 hover:opacity-70">
                          <Trash2 size={12} style={{ color: '#DC2626' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <input value={newArea} onChange={e => setNewArea(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addArea()}
                      placeholder="Add area..."
                      className="flex-1 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      style={{ border: '1px solid #E5E7EB', fontSize: 10 }} />
                    <button onClick={addArea}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
                      style={{ border: '1px solid #E5E7EB' }}>
                      <Plus size={12} style={{ color: '#6B7280' }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                <p className="font-black uppercase mb-2" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.1em' }}>Recommendations for Succeeding Programs</p>
                <textarea value={recommendations} onChange={e => setRecommendations(e.target.value)}
                  rows={4} placeholder="Synthesize takeaways for the next cycle of similar programs..."
                  className="w-full rounded-lg px-3 py-2 focus:outline-none"
                  style={{ border: '1px solid #E5E7EB', fontSize: 11, resize: 'vertical' }} />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={handleExportPDF}
                  className="flex-1 flex items-center justify-center gap-2 text-white font-black uppercase py-3 rounded-xl transition-opacity hover:opacity-90"
                  style={{ background: '#16A34A', fontSize: 11, letterSpacing: '0.1em' }}>
                  <Download size={14} /> Export Summary (PDF)
                </button>
                <button onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-opacity"
                  style={{ fontSize: 11, letterSpacing: '0.1em', color: '#1B2A50' }}>
                  <Printer size={14} /> Print
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 text-white font-black uppercase py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#1B2A50', fontSize: 11, letterSpacing: '0.1em' }}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Edits'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MESummaryReport;
