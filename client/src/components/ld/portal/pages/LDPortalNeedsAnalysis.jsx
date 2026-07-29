import React, { useState, useEffect, useCallback } from 'react';
import { Download, Printer, Plus, Pencil, Trash2, X, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { apiFetch } from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';
import DepEdPrintHeader from '../DepEdPrintHeader';
import DepEdPrintSignatures from '../DepEdPrintSignatures';
import PrintSignatureModal from '../PrintSignatureModal';

const Toast = ({ message, onClose, color = '#16A34A' }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: color }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const PriorityBadge = ({ p }) => {
  const styles = {
    High: 'bg-[#FEE2E2] text-[#DC2626]',
    Medium: 'bg-[#FEF3C7] text-[#B45309]',
    Low: 'bg-[#E0F2FE] text-[#0369A1]',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full font-bold ${styles[p] || styles.Medium}`} style={{ fontSize: 10 }}>
      {p}
    </span>
  );
};

const TH = ({ children }) => (
  <th className="text-left px-3 py-2.5 font-black uppercase"
    style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.12em', background: '#F9FAFB' }}>
    {children}
  </th>
);

const emptyForm = { title: '', budget: '', pax: '' };

const SourceDetailModal = ({ item, schoolYear, onClose }) => {
  if (!item) return null;
  const total = Number(item.teaching) + Number(item.rel) + Number(item.nt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm text-[#1B2A50]">Underlying Record Breakdown</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl space-y-1">
          <p className="font-black text-xs text-[#1B2A50]">{item.area}</p>
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>Data Source: <strong className="text-[#2563EB]">{item.source}</strong></span>
            <span>School Year: <strong>{schoolYear}</strong></span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-black text-[10px] uppercase text-gray-500 tracking-wider">Aggregated Response Counts</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl border border-slate-100 bg-blue-50/50">
              <p className="text-[10px] text-gray-500 font-bold">Teaching</p>
              <p className="text-sm font-black text-[#1B2A50]">{item.teaching}</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 bg-amber-50/50">
              <p className="text-[10px] text-gray-500 font-bold">Tchg-Related</p>
              <p className="text-sm font-black text-[#1B2A50]">{item.rel}</p>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 bg-emerald-50/50">
              <p className="text-[10px] text-gray-500 font-bold">Non-Teaching</p>
              <p className="text-sm font-black text-[#1B2A50]">{item.nt}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-3 border border-slate-100 rounded-xl">
          <span className="text-xs font-bold text-gray-600">Calculated Priority Status:</span>
          <div className="flex items-center gap-2">
            <PriorityBadge p={item.priority} />
            <span className="text-[10px] font-mono text-gray-400">({total} total needs)</span>
          </div>
        </div>

        <button onClick={onClose} className="w-full py-2 bg-[#1B2A50] text-white rounded-xl font-bold text-xs">
          Close Details
        </button>
      </div>
    </div>
  );
};

const LDPortalNeedsAnalysis = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('tna');
  const [tnaRows, setTnaRows] = useState([]);
  const [loadingTNA, setLoadingTNA] = useState(true);
  const [sourceDetail, setSourceDetail] = useState(null);

  // HRD Plan state
  const [planId, setPlanId] = useState(null);
  const [loadingHRD, setLoadingHRD] = useState(true);
  const [form, setForm] = useState({
    schoolYear: '',
    division: '',
    preparedBy: '',
    priorities: '',
  });

  const [programs, setPrograms] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [pf, setPf] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [signatureData, setSignatureData] = useState({
    preparedByName: "JUAN DELA CRUZ",
    reviewedByName: "JAY MONTEALTO, CESO V",
    approvedByName: "SUDI G. ALOLOD, CESO VI",
  });

  const handlePrintConfirm = (newSignatures) => {
    setSignatureData(newSignatures);
    setPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };
  const [toast, setToast] = useState(null);
  const [submittingWFP, setSubmittingWFP] = useState(false);

  const showToast = (msg, color = '#16A34A') => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };

  // Fetch TNA Summary
  const fetchTNASummary = useCallback((sy) => {
    setLoadingTNA(true);
    const query = sy ? `?school_year=${encodeURIComponent(sy)}` : '';
    apiFetch(`/api/ld/tna/summary${query}`)
      .then(r => r.json())
      .then(data => setTnaRows(Array.isArray(data) ? data : []))
      .catch(err => console.error('TNA Summary fetch error:', err))
      .finally(() => setLoadingTNA(false));
  }, []);

  // Fetch active HRD Plan
  const fetchHRDPlan = useCallback(() => {
    setLoadingHRD(true);
    apiFetch('/api/ld/plans/active')
      .then(r => r.json())
      .then(data => {
        if (data && data.id) {
          setPlanId(data.id);
          const sy = data.schoolYear || '2025–2026';
          setForm({
            schoolYear: sy,
            division: data.division || 'Dapitan City',
            preparedBy: data.preparedBy || (user?.full_name ? `${user.full_name}, HRMO` : ''),
            priorities: data.priorities || '',
          });
          setPrograms(Array.isArray(data.programs) ? data.programs : []);
          fetchTNASummary(sy);
        } else {
          fetchTNASummary('2025–2026');
        }
      })
      .catch(err => {
        console.error('HRD Plan fetch error:', err);
        fetchTNASummary('2025–2026');
      })
      .finally(() => setLoadingHRD(false));
  }, [user, fetchTNASummary]);

  useEffect(() => {
    fetchHRDPlan();
  }, [fetchHRDPlan]);

  // Auto-save plan details on blur/change
  const savePlanField = async (updatedFields) => {
    if (!planId) return;
    try {
      const res = await apiFetch(`/api/ld/plans/${planId}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error('Save failed');
      showToast('Plan details saved');
    } catch (err) {
      showToast('Failed to save plan details');
    }
  };

  const handleFieldChange = (key, val) => {
    setForm(p => {
      const updated = { ...p, [key]: val };
      savePlanField({ [key]: val });
      if (key === 'schoolYear') fetchTNASummary(val);
      return updated;
    });
  };

  const openAdd = () => { setEditIdx(null); setPf(emptyForm); setErrors({}); setFormOpen(true); };

  const openEdit = (i) => {
    setEditIdx(i);
    setPf({ title: programs[i].title, budget: String(programs[i].budget), pax: String(programs[i].pax) });
    setErrors({});
    setFormOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!pf.title.trim()) e.title = 'Program title is required';
    if (!pf.budget || Number(pf.budget) <= 0) e.budget = 'Budget must be a positive number';
    if (!pf.pax || Number(pf.pax) <= 0) e.pax = 'Pax must be a positive number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitWFP = async () => {
    if (!validate() || !planId) return;
    setSubmittingWFP(true);
    try {
      if (editIdx !== null) {
        const progId = programs[editIdx].id;
        const res = await apiFetch(`/api/ld/programs/${progId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: pf.title.trim(),
            budget_estimate: Number(pf.budget),
            target_participants: `${pf.pax} Teaching Personnel`,
          }),
        });
        if (res.ok) {
          showToast('WFP Program updated successfully');
          fetchHRDPlan();
        }
      } else {
        const res = await apiFetch(`/api/ld/plans/${planId}/wfp`, {
          method: 'POST',
          body: JSON.stringify({ title: pf.title.trim(), budget: Number(pf.budget), pax: Number(pf.pax) }),
        });
        if (res.ok) {
          showToast('WFP Program added successfully');
          fetchHRDPlan();
        }
      }
    } catch {
      showToast('Error saving program');
    } finally {
      setSubmittingWFP(false);
      setFormOpen(false);
      setPf(emptyForm);
      setEditIdx(null);
    }
  };

  const handleDelete = async (i) => {
    const prog = programs[i];
    if (!prog || !planId) return;
    try {
      const res = await apiFetch(`/api/ld/plans/${planId}/wfp/${prog.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Program removed from WFP');
        fetchHRDPlan();
      }
    } catch {
      showToast('Error deleting program');
    }
  };

  const activeSY = form.schoolYear || '2025–2026';
  const inputStyle = { border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg || toast} color={toast.color} onClose={() => setToast(null)} />}
      {sourceDetail && <SourceDetailModal item={sourceDetail} schoolYear={activeSY} onClose={() => setSourceDetail(null)} />}

      {/* Tab switcher */}
      <div className="flex gap-2">
        {[
          { key: 'tna', label: 'TNA / e-SAT / IPCRF Summary' },
          { key: 'hrd', label: 'Create Annual HRD Plan' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-full font-bold transition-all"
            style={{
              fontSize: 11,
              background: tab === t.key ? '#1B2A50' : '#fff',
              color:      tab === t.key ? '#fff'    : '#6B7280',
              border:     tab === t.key ? 'none'    : '1px solid #E5E7EB',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab A: TNA Summary ─────────────────────────── */}
      {tab === 'tna' && (
        <div className="rounded-2xl border border-slate-100 p-5 print:p-0 print:border-none" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          
          <DepEdPrintHeader
            reportTitle="TRAINING NEEDS ASSESSMENT & HRD PLAN SUMMARY"
            syPeriod={`SCHOOL YEAR ${activeSY}`}
            officeTitle="Human Resource Development (HRD) Division"
          />

          <div className="flex items-center justify-between mb-4 print:hidden">
            <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>
              Training Needs Summary — SY {activeSY}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                const rows = [['Competency Area', 'Teaching', 'Tchg-Related', 'Non-Teaching', 'Priority', 'Data Source']];
                tnaRows.forEach(r => rows.push([r.area, r.teaching, r.rel, r.nt, r.priority, r.source]));
                const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `tna-summary-${activeSY}.csv`; a.click();
                URL.revokeObjectURL(url);
                showToast('TNA summary exported successfully');
              }}
                className="flex items-center gap-1.5 text-white px-3 py-1.5 rounded-full font-bold transition-colors hover:opacity-90"
                style={{ background: '#1B2A50', fontSize: 10 }}>
                <Download size={12} /> Export
              </button>
              <button onClick={() => setPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold border border-slate-200 transition-colors hover:bg-slate-50"
                style={{ fontSize: 10, color: '#1B2A50' }}>
                <Printer size={12} /> Print
              </button>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr>
                {['Competency Area', 'Teaching', 'Tchg-Related', 'Non-Teaching', 'Priority', 'Data Source'].map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {loadingTNA ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td colSpan={6} className="py-3">
                      <div className="h-4 bg-slate-100 animate-pulse rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : tnaRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center" style={{ fontSize: 11, color: '#9CA3AF' }}>
                    No training needs summary data available for this school year
                  </td>
                </tr>
              ) : (
                tnaRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td className="px-3 py-3 font-semibold" style={{ fontSize: 11, color: '#1B2A50' }}>{r.area}</td>
                    <td className="px-3 py-3 font-mono"     style={{ fontSize: 11, color: '#4B5563' }}>{r.teaching}</td>
                    <td className="px-3 py-3 font-mono"     style={{ fontSize: 11, color: '#4B5563' }}>{r.rel}</td>
                    <td className="px-3 py-3 font-mono"     style={{ fontSize: 11, color: '#4B5563' }}>{r.nt}</td>
                    <td className="px-3 py-3"><PriorityBadge p={r.priority} /></td>
                    <td className="px-3 py-3">
                      {/* Screen: clickable button (hidden in print by global button rule) */}
                      <button onClick={() => setSourceDetail(r)}
                        className="inline-flex items-center gap-1 font-semibold hover:underline no-print"
                        style={{ fontSize: 11, color: '#2563EB' }}>
                        {r.source}
                        <ExternalLink size={10} />
                      </button>
                      {/* Print: plain span — .print-source-text forces display:inline in @media print */}
                      <span className="print-source-text" style={{ display: 'none' }}>
                        {r.source}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <DepEdPrintSignatures
            preparedByName={signatureData.preparedByName}
            reviewedByName={signatureData.reviewedByName}
            approvedByName={signatureData.approvedByName}
          />
        </div>
      )}

      {/* Print Signature Modal */}
      <PrintSignatureModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        onConfirm={handlePrintConfirm}
        initialData={signatureData}
        documentTitle={`Training Needs Summary — SY ${activeSY}`}
      />

      {/* ── Tab B: Create HRD Plan ─────────────────────── */}
      {tab === 'hrd' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            {/* Form */}
            <div className="rounded-2xl border border-slate-100 p-5 space-y-3" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="font-black uppercase mb-1" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Annual HRD Plan Details</p>
              {loadingHRD ? (
                <div className="space-y-3 py-4">
                  <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-slate-100 animate-pulse rounded w-1/2" />
                  <div className="h-16 bg-slate-100 animate-pulse rounded w-full" />
                </div>
              ) : (
                <>
                  {[
                    { label: 'School Year',  key: 'schoolYear' },
                    { label: 'Division',     key: 'division'   },
                    { label: 'Prepared By',  key: 'preparedBy' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>{f.label}</label>
                      <input value={form[f.key]} onChange={e => handleFieldChange(f.key, e.target.value)}
                        placeholder={`Enter ${f.label.toLowerCase()}…`}
                        className="w-full rounded-lg px-3 py-2 transition-colors focus:outline-none"
                        style={inputStyle} />
                    </div>
                  ))}
                  <div>
                    <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>Division Priorities</label>
                    <textarea value={form.priorities} onChange={e => handleFieldChange('priorities', e.target.value)}
                      placeholder="Enter division strategic priorities…"
                      rows={4} className="w-full rounded-lg px-3 py-2 resize-none transition-colors focus:outline-none"
                      style={inputStyle} />
                  </div>
                </>
              )}
            </div>

            {/* Programs list */}
            <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Prioritized Training Programs (WFP)</p>
                <button onClick={openAdd} className="flex items-center gap-1 font-bold text-white px-2.5 py-1 rounded-lg text-xs" style={{ background: '#DE4E2A' }}>
                  <Plus size={12} /> Add
                </button>
              </div>

              <div className="space-y-4">
                {loadingHRD ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="h-10 bg-slate-100 animate-pulse rounded w-full" />
                  ))
                ) : programs.length === 0 && !formOpen ? (
                  <p className="text-center py-6" style={{ fontSize: 11, color: '#9CA3AF' }}>No prioritized programs added yet</p>
                ) : (
                  programs.map((p, i) => (
                    <div key={p.id || i}
                      className="flex items-start gap-3 group"
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white font-black"
                        style={{ background: '#1B2A50', fontSize: 9 }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold leading-tight" style={{ fontSize: 11, color: '#DE4E2A' }}>{p.title}</p>
                        <p className="mt-0.5" style={{ fontSize: 10, color: '#6B7280' }}>
                          {'₱' + (p.budget ?? 0).toLocaleString()} • {p.pax ?? 0} pax
                        </p>
                      </div>
                      {hovered === i && (
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button onClick={() => openEdit(i)}
                            className="p-1 rounded-md transition-colors hover:bg-slate-100"
                            style={{ color: '#6B7280' }}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(i)}
                            className="p-1 rounded-md transition-colors hover:bg-red-50"
                            style={{ color: '#DC2626' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {formOpen && (
                  <div className="rounded-xl p-4 space-y-3" style={{ border: '1px solid #E5E7EB', background: '#FAFBFC' }}>
                    <p className="font-black uppercase mb-1" style={{ fontSize: 10, color: '#1B2A50', letterSpacing: '0.12em' }}>
                      {editIdx !== null ? 'Edit Program' : 'Add Program'}
                    </p>
                    <div>
                      <input placeholder="Program Title" value={pf.title} onChange={e => setPf(p => ({ ...p, title: e.target.value }))}
                        className="w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={{ border: '1px solid #E5E7EB' }} />
                      {errors.title && <p className="text-red-500 text-[9px] mt-0.5">{errors.title}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input type="number" placeholder="Budget (₱)" value={pf.budget} onChange={e => setPf(p => ({ ...p, budget: e.target.value }))}
                          className="w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={{ border: '1px solid #E5E7EB' }} />
                        {errors.budget && <p className="text-red-500 text-[9px] mt-0.5">{errors.budget}</p>}
                      </div>
                      <div>
                        <input type="number" placeholder="Pax" value={pf.pax} onChange={e => setPf(p => ({ ...p, pax: e.target.value }))}
                          className="w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none" style={{ border: '1px solid #E5E7EB' }} />
                        {errors.pax && <p className="text-red-500 text-[9px] mt-0.5">{errors.pax}</p>}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setFormOpen(false)} className="px-3 py-1 text-xs text-gray-500 font-bold">Cancel</button>
                      <button onClick={handleSubmitWFP} disabled={submittingWFP} className="px-3 py-1 text-xs text-white bg-[#1B2A50] rounded-lg font-bold">
                        {submittingWFP ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LDPortalNeedsAnalysis;
