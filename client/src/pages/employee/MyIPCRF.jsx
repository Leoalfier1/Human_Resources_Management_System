import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle, FileText, Eye, Download, Upload, LayoutList, Table, RotateCcw, Award } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, SOCKET_URL } from '../../utils/api';
import RateeCertification from '../../components/employee/RateeCertification';
import OfficialDepEdIPCRFTable from '../../components/employee/OfficialDepEdIPCRFTable';
import OfficialDepEdIPCRFPart2Table from '../../components/pm/OfficialDepEdIPCRFPart2Table';
import SignaturePadModal from '../../components/employee/SignaturePadModal';
import DirectIPCRFFormShowcase from '../../components/pm/DirectIPCRFFormShowcase';
import useEmployeeSocket from '../../hooks/useEmployeeSocket';

const formatSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const LEVEL_LABELS = { 5: 'Outstanding', 4: 'Very Satisfactory', 3: 'Satisfactory', 2: 'Unsatisfactory', 1: 'Poor' };
const DIMENSIONS = [
  { key: 'quality_effectiveness', label: 'Quality / Effectiveness' },
  { key: 'efficiency', label: 'Efficiency' },
  { key: 'timeliness', label: 'Timeliness' },
];

const getAdjectival = (val) => {
  if (val >= 4.5) return 'Outstanding';
  if (val >= 3.5) return 'Very Satisfactory';
  if (val >= 2.5) return 'Satisfactory';
  if (val >= 1.5) return 'Unsatisfactory';
  return 'Poor';
};

// ==========================================
// RUBRIC GRID SUB-COMPONENT
// ==========================================
function RubricGrid({ indicators, onChange, disabled }) {
  const getVal = (dim, level) => {
    const ind = indicators.find(i => i.dimension === dim);
    return ind ? ind[`level_${level}_text`] || '' : '';
  };

  const handleCellChange = (dim, level, val) => {
    const existing = indicators.find(i => i.dimension === dim) || { dimension: dim, level_5_text: '', level_4_text: '', level_3_text: '', level_2_text: '', level_1_text: '' };
    const updated = { ...existing, [`level_${level}_text`]: val };
    const newIndicators = indicators.filter(i => i.dimension !== dim).concat([updated]);
    onChange(newIndicators);
  };

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-[10px] border-collapse min-w-[480px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="px-2 py-1.5 text-left font-black text-slate-700 uppercase tracking-wider border border-slate-200 w-16">Level</th>
            {DIMENSIONS.map(d => (
              <th key={d.key} className="px-2 py-1.5 text-left font-black text-slate-700 uppercase tracking-wider border border-slate-200">{d.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[5, 4, 3, 2, 1].map(level => (
            <tr key={level} className={level % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              <td className="px-2 py-1 font-black text-slate-700 border border-slate-200 whitespace-nowrap">
                {level} — {LEVEL_LABELS[level]}
              </td>
              {DIMENSIONS.map(d => (
                <td key={d.key} className="border border-slate-200">
                  <input
                    type="text"
                    disabled={disabled}
                    value={getVal(d.key, level)}
                    onChange={(e) => handleCellChange(d.key, level, e.target.value)}
                    placeholder={`${LEVEL_LABELS[level]}...`}
                    className="w-full px-2 py-1.5 text-[10px] font-semibold outline-none focus:ring-1 focus:ring-[#D6402F]/30 disabled:opacity-50 disabled:bg-slate-50"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// PLANNED MOV LIST SUB-COMPONENT
// ==========================================
function PlannedMovList({ items, onAdd, onRemove, disabled }) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (!newItem.trim()) return;
    onAdd(newItem.trim());
    setNewItem('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          disabled={disabled}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. Financial Statement Checklist, Trial Balances..."
          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:border-[#D6402F] disabled:opacity-50"
        />
        {!disabled && (
          <button onClick={handleAdd} className="px-3 py-2 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-slate-800 transition-colors shrink-0">
            <Plus size={12} />
          </button>
        )}
      </div>
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-slate-400 mr-1 shrink-0">•</span>
              <span className="text-[10px] font-bold text-black flex-1 truncate">{item.description}</span>
              {!disabled && (
                <button onClick={() => onRemove(item.id)} className="text-slate-400 hover:text-red-500 cursor-pointer transition-colors shrink-0">
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// SELF-RATING INPUT SUB-COMPONENT
// ==========================================
function SelfRatingInputs({ selfRating, indicators, objectiveWeight, onChange, disabled }) {
  const handleChange = (field, val) => {
    const num = val === '' ? null : parseFloat(val);
    if (num !== null && (num < 0.5 || num > 5)) return;
    const updated = { ...selfRating, [field]: num };
    if (updated.quality_rating !== null && updated.efficiency_rating !== null && updated.timeliness_rating !== null) {
      updated.average_rating = ((updated.quality_rating + updated.efficiency_rating + updated.timeliness_rating) / 3).toFixed(2);
      updated.score = (updated.average_rating * (objectiveWeight / 100)).toFixed(2);
    } else {
      updated.average_rating = null;
      updated.score = null;
    }
    onChange(updated);
  };

  const getRubricText = (dim, rating) => {
    if (!rating) return '';
    const level = Math.round(rating);
    const ind = indicators.find(i => i.dimension === dim);
    return ind ? ind[`level_${level}_text`] || '' : '';
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DIMENSIONS.map(d => (
          <div key={d.key} className="space-y-1">
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{d.label}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="5"
                disabled={disabled}
                value={selfRating?.[`${d.key.split('_')[0]}_rating`] || ''}
                onChange={(e) => {
                  const fieldMap = { quality: 'quality_rating', efficiency: 'efficiency_rating', timeliness: 'timeliness_rating' };
                  handleChange(fieldMap[d.key.split('_')[0]], e.target.value);
                }}
                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold text-center outline-none focus:border-[#D6402F] disabled:opacity-50"
              />
              {selfRating?.[`${d.key.split('_')[0]}_rating`] && (
                <span className="text-[9px] font-bold text-[#1B3A6B] uppercase">
                  {getAdjectival(selfRating[`${d.key.split('_')[0]}_rating`])}
                </span>
              )}
            </div>
            {selfRating?.[`${d.key.split('_')[0]}_rating`] && getRubricText(d.key, selfRating[`${d.key.split('_')[0]}_rating`]) && (
              <p className="text-[8px] text-slate-500 italic leading-tight bg-slate-50 p-1.5 rounded">
                "{getRubricText(d.key, selfRating[`${d.key.split('_')[0]}_rating`])}"
              </p>
            )}
          </div>
        ))}
      </div>
      {selfRating?.average_rating && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-[#1B3A6B]/5 border border-[#1B3A6B]/10 rounded-xl px-4 py-2">
          <span className="text-[10px] font-black text-[#1B3A6B] uppercase">Average: {selfRating.average_rating}</span>
          <span className="text-[10px] font-black text-[#D6402F] uppercase">Score: {selfRating.score}</span>
          <span className="text-[10px] font-bold text-slate-600 uppercase">({getAdjectival(parseFloat(selfRating.average_rating))})</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
const MyIPCRF = () => {
  const { token } = useAuth();
  const [ipcrf, setIpcrf] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [period, setPeriod] = useState(null);
  const [kraOptions, setKraOptions] = useState([]);
  const [raterInfo, setRaterInfo] = useState({ name: '', title: '' });
  const [approverInfo, setApproverInfo] = useState({ name: '', title: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteFileConfirm, setDeleteFileConfirm] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showUnsubmitConfirm, setShowUnsubmitConfirm] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [sigDate, setSigDate] = useState(null);
  const [expandedObjective, setExpandedObjective] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [activePart, setActivePart] = useState('part1'); // 'part1' or 'part2a'
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);

  const isEditable = ['not_submitted', 'draft', 'needs_revision'].includes(ipcrf?.status || 'not_submitted');

  const fetchData = useCallback(async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      const [ipcrfRes, krasRes] = await Promise.all([
        apiGet('/pm/employee/ipcrf'),
        apiGet('/pm/form-config/kra-templates')
      ]);

      if (ipcrfRes.ok) {
        const data = await ipcrfRes.json();
        setIpcrf(data.ipcrf || null);
        setEmployee(data.employee || null);
        setPeriod(data.period || null);
        const objs = data.objectives || [];
        setObjectives(objs);
        if (objs.length > 0 && objs[0].perf_objectives?.length > 0) {
          setExpandedObjective(prev => prev || objs[0].perf_objectives[0].id);
        }
        if (data.raterInfo) setRaterInfo(data.raterInfo);
        if (data.approverInfo) setApproverInfo(data.approverInfo);
        const empId = data.employee?.id;
        const storedRateeSig = empId ? localStorage.getItem(`ipcrf_ratee_signature_${empId}`) : null;
        if (data.ipcrf?.ratee_signed) {
          setIsSigned(true);
          if (storedRateeSig) setSignatureDataUrl(storedRateeSig);
        } else {
          setIsSigned(false);
          setSignatureDataUrl(null);
        }
        if (data.ipcrf?.signed_at) setSigDate(data.ipcrf.signed_at);

        // Update rater signature directly from DB
        if (data.ipcrf?.rater_signature) {
          setRaterSig(data.ipcrf.rater_signature);
        } else {
          setRaterSig(null);
        }
      } else {
        setError('Failed to fetch IPCRF data');
      }

      if (krasRes.ok) {
        const krasData = await krasRes.json();
        setKraOptions(krasData.kras || krasData || []);
      }
    } catch (err) {
      console.error('Failed to load IPCRF:', err);
      setError('Failed to load IPCRF details');
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, [token]);

  const [raterSig, setRaterSig] = useState(null);

  const syncSignature = useCallback(() => {
    if (ipcrf?.rater_signature) {
      setRaterSig(ipcrf.rater_signature);
    } else {
      setRaterSig(null);
    }
  }, [ipcrf]);

  useEffect(() => {
    window.addEventListener('storage', syncSignature);
    return () => window.removeEventListener('storage', syncSignature);
  }, [syncSignature]);

  useEffect(() => { if (token) fetchData(true); }, [token, fetchData]);

  useEmployeeSocket({
    'review:rating_updated': () => { fetchData(); syncSignature(); },
    'commitment:returned': () => { fetchData(); syncSignature(); },
    'commitment:approved': () => { fetchData(); syncSignature(); },
    'ipcrf:status_changed': () => { fetchData(); syncSignature(); },
    'performance_update': () => { fetchData(); syncSignature(); },
    'rating:finalized': () => { fetchData(); syncSignature(); },
    'review:finalized': () => { fetchData(); syncSignature(); },
  });

  // --- KRA-level handlers ---
  const handleUpdateKra = async (id, fields) => {
    try {
      await apiPut(`/pm/employee/ipcrf/objective/${id}`, fields);
      setObjectives(prev => prev.map(o => o.id === id ? { ...o, ...fields } : o));
    } catch (err) { console.error(err); }
  };

  const handleAddKra = async () => {
    if (!ipcrf) return;
    const defaultKra = kraOptions.length > 0 ? kraOptions[0] : null;
    const payload = {
      ipcrf_id: ipcrf.id,
      kra_template_id: defaultKra ? defaultKra.id : null,
      sequence_no: objectives.length + 1,
      objective_description: '',
      success_indicator: '',
      target_statement: ''
    };
    try {
      const res = await apiPost('/pm/employee/ipcrf/objective', payload);
      if (res.ok) {
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteKra = async (id) => {
    try {
      await apiDelete(`/pm/employee/ipcrf/objective/${id}`);
      setObjectives(prev => prev.filter(o => o.id !== id));
      setDeleteConfirmId(null);
    } catch (err) { console.error(err); }
  };

  // --- Performance Objective handlers ---
  const handleAddPerfObjective = async (ipcrfObjectiveId) => {
    try {
      const res = await apiPost(`/pm/employee/ipcrf/objective/${ipcrfObjectiveId}/perf-objective`, {
        objective_description: '', mfo_category: '', objective_weight: 0
      });
      if (res.ok) {
        const data = await res.json();
        if (data.objective?.id) {
          setExpandedObjective(data.objective.id);
        }
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdatePerfObjective = async (perfObjId, fields) => {
    try {
      await apiPut(`/pm/employee/ipcrf/perf-objective/${perfObjId}`, fields);
      setObjectives(prev => prev.map(o => {
        if (!o.perf_objectives) return o;
        return { ...o, perf_objectives: o.perf_objectives.map(po => po.id === perfObjId ? { ...po, ...fields } : po) };
      }));
    } catch (err) { console.error(err); }
  };

  const handleDeletePerfObjective = async (perfObjId) => {
    try {
      await apiDelete(`/pm/employee/ipcrf/perf-objective/${perfObjId}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  // --- Indicators handler ---
  const handleSaveIndicators = async (perfObjId, indicators) => {
    try {
      await apiPut(`/pm/employee/ipcrf/perf-objective/${perfObjId}/indicators`, { indicators });
      setObjectives(prev => prev.map(o => {
        if (!o.perf_objectives) return o;
        return { ...o, perf_objectives: o.perf_objectives.map(po => po.id === perfObjId ? { ...po, indicators } : po) };
      }));
    } catch (err) { console.error(err); }
  };

  // --- Planned MOV handlers ---
  const handleAddPlannedMov = async (perfObjId, description) => {
    try {
      await apiPost(`/pm/employee/ipcrf/perf-objective/${perfObjId}/planned-mov`, { description });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleRemovePlannedMov = async (movId) => {
    try {
      await apiDelete(`/pm/employee/ipcrf/planned-mov/${movId}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  // --- Self-rating handler ---
  const handleSaveSelfRating = async (perfObjId, ratingData, ipcrfObjId) => {
    try {
      let targetPoId = perfObjId;
      if (!targetPoId && ipcrfObjId) {
        const objItem = objectives.find(o => o.id === ipcrfObjId);
        const kraName = objItem?.kra_name || 'KRA Objective';
        const weight = objItem?.weight_percent || 0;
        const res = await apiPost(`/pm/employee/ipcrf/objective/${ipcrfObjId}/perf-objective`, {
          objective_description: kraName, mfo_category: '', objective_weight: weight
        });
        if (res.ok) {
          const resData = await res.json();
          targetPoId = resData.objective?.id;
        }
      }
      if (!targetPoId) return;

      // Local state update prevents re-rendering scroll jump
      setObjectives(prev => prev.map(o => {
        if (o.id !== ipcrfObjId) return o;
        const existingPos = o.perf_objectives || [];
        if (existingPos.length > 0) {
          return {
            ...o,
            perf_objectives: existingPos.map(po => po.id === targetPoId ? { ...po, self_rating: ratingData } : po)
          };
        } else {
          return {
            ...o,
            perf_objectives: [{ id: targetPoId, self_rating: ratingData, planned_mov: [] }]
          };
        }
      }));

      await apiPut(`/pm/employee/ipcrf/perf-objective/${targetPoId}/self-rating`, {
        quality_rating: ratingData.quality_rating,
        efficiency_rating: ratingData.efficiency_rating,
        timeliness_rating: ratingData.timeliness_rating
      });
    } catch (err) { console.error(err); }
  };

  // --- MOV file handlers ---
  const handleFileUpload = async (objId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ipcrf_objective_id', objId);
    try {
      const res = await apiPost('/pm/employee/ipcrf/mov/upload', formData);
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteFile = async (objId, fileId) => {
    try {
      await apiDelete(`/pm/employee/ipcrf/mov/${fileId}`);
      fetchData();
      setDeleteFileConfirm(null);
    } catch (err) { console.error(err); }
  };

  const [showSigModal, setShowSigModal] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState(() => {
    return employee?.id ? (localStorage.getItem(`ipcrf_ratee_signature_${employee.id}`) || null) : null;
  });

  // --- Electronic Signature & Submit ---
  const handleToggleSign = () => {
    if (['submitted', 'under_review', 'reviewed', 'finalized', 'approved'].includes(ipcrf?.status)) {
      return; // Locked when submitted or beyond
    }
    setShowSigModal(true);
  };

  const handleSaveDrawnSignature = (dataUrl) => {
    setSignatureDataUrl(dataUrl);
    setIsSigned(true);
    const now = new Date().toISOString();
    setSigDate(now);
    try {
      if (employee?.id) {
        localStorage.setItem(`ipcrf_ratee_signature_${employee.id}`, dataUrl);
        localStorage.setItem(`ipcrf_ratee_sig_date_${employee.id}`, now);
      }
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  };

  const handleSubmitIPCRF = async () => {
    if (!ipcrf) return;
    if (!isSigned) {
      alert("⚠️ Please sign the Ratee Electronic Signature box at the bottom of the page first before submitting your IPCRF to the Rater!");
      const sigSection = document.getElementById('ratee-signature-section');
      if (sigSection) {
        sigSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    if (totalWeight < 94.9 || totalWeight > 100.1) {
      alert(`KRA weights sum to ${totalWeight}%. They must equal 100% (or 95%-100%) before submitting.`);
      return;
    }
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmitIPCRF = async () => {
    setShowSubmitConfirm(false);
    try {
      const res = await apiPut('/pm/employee/ipcrf/submit', { ipcrf_id: ipcrf.id });
      if (res.ok) {
        setIpcrf(prev => ({ ...prev, status: 'submitted', ratee_signed: true, signed_at: new Date().toISOString() }));
        setIsSigned(true);
        setSigDate(new Date().toISOString());
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Submission failed.');
      }
    } catch (err) { console.error(err); }
  };

  const handleUnsubmitIPCRF = () => {
    if (!ipcrf) return;
    setShowUnsubmitConfirm(true);
  };

  const confirmUnsubmitAction = async () => {
    setShowUnsubmitConfirm(false);
    try {
      const res = await apiPut('/pm/employee/ipcrf/unsubmit', { ipcrf_id: ipcrf.id });
      if (res.ok) {
        setIpcrf(prev => ({ ...prev, status: 'not_submitted', ratee_signed: false, signed_at: null }));
        setIsSigned(false);
        setSigDate(null);
        if (employee?.id) {
          localStorage.removeItem(`ipcrf_ratee_signature_${employee.id}`);
          localStorage.removeItem(`ipcrf_ratee_sig_date_${employee.id}`);
          localStorage.removeItem(`part2a_ratings_${employee.id}`);
        }
        await fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to unsubmit IPCRF.");
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred. Please check your connection and try again.");
    }
  };

  // --- Weights ---
  const totalWeight = objectives.reduce((acc, obj) => acc + (Number(obj.weight_percent ?? obj.template_weight ?? 0) || 0), 0);

  const getObjWeightSum = (obj) => {
    if (!obj.perf_objectives || obj.perf_objectives.length === 0) return 0;
    return obj.perf_objectives.reduce((acc, po) => acc + (Number(po.objective_weight) || 0), 0);
  };

  const isPhase3Editable = isEditable;

  const statusColors = {
    not_submitted: 'bg-amber-100 text-amber-800 border-amber-200',
    draft: 'bg-amber-100 text-amber-800 border-amber-200',
    submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    under_review: 'bg-purple-100 text-purple-800 border-purple-200',
    reviewed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    finalized: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#F3F4F6]">
        <div className="text-xs font-bold text-slate-600 tracking-widest uppercase animate-pulse">Loading My IPCRF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#F3F4F6] text-xs font-bold text-red-500">{error}</div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6 max-w-7xl mx-auto overflow-x-hidden">

      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">My IPCRF</h1>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusColors[ipcrf?.status || 'not_submitted']}`}>
              {(ipcrf?.status || 'not_submitted').replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-slate-800 font-bold uppercase tracking-widest mt-1 truncate">
            Individual Performance Commitment and Review Form · {employee?.full_name || employee?.name || ''}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Submit / Unsubmit Action Button */}
          {['not_submitted', 'draft', 'needs_revision'].includes(ipcrf?.status || 'not_submitted') && (
            <button onClick={handleSubmitIPCRF} className="flex items-center gap-2 px-5 py-2.5 bg-[#D6402F] text-white rounded-xl text-xs font-bold uppercase shadow-lg hover:bg-red-700 transition-all cursor-pointer active:scale-95">
              <Send size={15} /> Submit to Rater
            </button>
          )}

          {ipcrf?.status === 'submitted' && (
            <button onClick={handleUnsubmitIPCRF} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase shadow-lg transition-all cursor-pointer active:scale-95">
              <RotateCcw size={15} /> Unsubmit IPCRF
            </button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[
          { label: 'Rating Period', value: `January 1 – December 31, ${period?.year || new Date().getFullYear()}` },
          { label: 'Position / Item No.', value: `${employee?.position || ''}${employee?.plantilla_item_number ? ` · Plantilla Item No. ${employee.plantilla_item_number}` : ''}` },
          { label: 'Unit / Division', value: employee?.unit || '' },
          { label: 'Rater', value: raterInfo?.name ? `${raterInfo.name} · ${raterInfo.title}` : '' },
          { label: 'Approving Authority', value: approverInfo?.name ? `${approverInfo.name} · ${approverInfo.title}` : '' },
          { label: 'Form Type', value: employee?.form_type || 'IPCRF (Individual)' },
        ].map((item, i) => (
          <div key={i}>
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-0.5">{item.label}</label>
            <span className="text-xs font-bold text-black">{item.value || '—'}</span>
          </div>
        ))}
      </div>

      {/* Weight Validation */}
      <div className={`p-4 rounded-2xl flex items-center gap-3 border ${totalWeight === 100 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        {totalWeight === 100 ? (
          <><CheckCircle size={18} className="text-emerald-600 shrink-0" /><span className="text-xs font-bold uppercase tracking-wide">Total KRA weight: 100% — All KRAs properly weighted</span></>
        ) : (
          <><AlertCircle size={18} className="text-amber-600 shrink-0" /><span className="text-xs font-bold uppercase tracking-wide">Total KRA weight: {totalWeight}% — must equal 100% before submitting</span></>
        )}
      </div>

      {/* Part 1 vs Part 2-A Section Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300 gap-2">
        <button
          onClick={() => setActivePart('part1')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activePart === 'part1'
              ? 'bg-[#1B3A6B] text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <FileText size={14} /> Part 1: Performance Objectives (95%)
        </button>
        <button
          onClick={() => setActivePart('part2a')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activePart === 'part2a'
              ? 'bg-[#D6402F] text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <Award size={14} /> Part 2 - A: Core Competencies (5%)
        </button>
      </div>

      {activePart === 'part2a' ? (
        <OfficialDepEdIPCRFPart2Table
          employee={employee}
          period={period}
          raterInfo={raterInfo}
          approverInfo={approverInfo}
          isSigned={isSigned}
          signatureDataUrl={signatureDataUrl}
          raterSignatureDataUrl={['finalized', 'committed', 'approved'].includes(ipcrf?.status) ? raterSig : null}
          readOnly={!isEditable}
          onSavePart2={(ratings, score) => {
            alert(`Core Competencies Part 2-A Self-Rating saved successfully! Overall Part 2-A Score: ${score}`);
          }}
        />
      ) : (
        <OfficialDepEdIPCRFTable
          employee={employee}
          period={period}
          raterInfo={raterInfo}
          approverInfo={approverInfo}
          objectives={objectives}
          kraOptions={kraOptions}
          isSigned={isSigned}
          signatureDataUrl={signatureDataUrl}
          raterSignatureDataUrl={['finalized', 'committed', 'approved'].includes(ipcrf?.status) ? raterSig : null}
          sigDate={sigDate}
          onSaveRating={handleSaveSelfRating}
          onUpdateObjective={handleUpdateKra}
          onAddKra={handleAddKra}
          onDeleteKra={handleDeleteKra}
          onFileUpload={handleFileUpload}
          onDeleteFile={handleDeleteFile}
          onSubmitIPCRF={handleSubmitIPCRF}
          isEditable={isEditable}
        />
      )}

      {/* Add KRA Button */}
      <button onClick={handleAddKra}
        className="w-full py-3 md:py-4 border-2 border-dashed border-slate-300 hover:border-[#D6402F] rounded-2xl text-[10px] sm:text-xs font-bold text-slate-800 hover:text-[#D6402F] transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white shadow-sm active:scale-[0.98]"
      >
        <Plus size={16} /> Add KRA
      </button>

      {/* Ratee Certification */}
      <div id="ratee-signature-section">
        <RateeCertification
          isSigned={isSigned}
          signatureDataUrl={signatureDataUrl}
          name={employee?.full_name || employee?.name || ''}
          position={employee?.position || ''}
          date={sigDate ? new Date(sigDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          onSignClick={handleToggleSign}
        />
      </div>

      {/* Signature Pad Touch Canvas Modal */}
      <SignaturePadModal
        isOpen={showSigModal}
        onClose={() => setShowSigModal(false)}
        onSave={handleSaveDrawnSignature}
        title="Ratee (Employee) Signature Pad"
      />

      {/* Delete KRA Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Delete KRA</h3>
            <p className="text-xs text-black">Are you sure? This will delete the KRA and all its objectives, indicators, and ratings.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-black hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteKra(deleteConfirmId)} className="flex-1 py-2.5 bg-[#D6402F] text-white text-xs font-bold rounded-xl hover:bg-red-700 cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Modal */}
      {deleteFileConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={() => setDeleteFileConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Delete MOV File</h3>
            <p className="text-xs text-black">Delete <span className="font-bold">{deleteFileConfirm.fileName}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteFileConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-black hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteFile(deleteFileConfirm.objId, deleteFileConfirm.fileId)} className="flex-1 py-2.5 bg-[#D6402F] text-white text-xs font-bold rounded-xl hover:bg-red-700 cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={() => setShowSubmitConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight text-center">Submit IPCRF to Rater</h3>
            <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-800 border border-amber-200">
              <strong>Warning:</strong> Once submitted, you cannot edit your IPCRF unless your rater requests a revision.
            </div>
            <p className="text-xs text-black text-center">Are you sure you want to submit your IPCRF?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-black hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleConfirmSubmitIPCRF} className="flex-1 py-2.5 bg-[#1B3A6B] text-white text-xs font-bold rounded-xl hover:bg-blue-800 cursor-pointer">Confirm Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Unsubmit Confirm Modal */}
      {showUnsubmitConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={() => setShowUnsubmitConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight text-center">Recall IPCRF Submission</h3>
            <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-800 border border-amber-200">
              <strong>Warning:</strong> Recalling your IPCRF will unlock it, allowing you to edit ratings, indicators, and signatures before re-submitting.
            </div>
            <p className="text-xs text-black text-center">Are you sure you want to unsubmit your IPCRF?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowUnsubmitConfirm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-black hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={confirmUnsubmitAction} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all active:scale-95">Unsubmit / Recall</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyIPCRF;
