import React, { useState } from 'react';
import { FileText, Eye, Download, Upload, Trash2, Printer, Plus } from 'lucide-react';
import { SOCKET_URL } from '../../utils/api';

const LEVEL_LABELS = { 5: 'Outstanding', 4: 'Very Satisfactory', 3: 'Satisfactory', 2: 'Unsatisfactory', 1: 'Poor' };

const getAdjectival = (val) => {
  if (val >= 4.5) return 'Outstanding';
  if (val >= 3.5) return 'Very Satisfactory';
  if (val >= 2.5) return 'Satisfactory';
  if (val >= 1.5) return 'Unsatisfactory';
  return 'Poor';
};

const formatSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function OfficialDepEdIPCRFTable({
  employee,
  period,
  raterInfo,
  approverInfo,
  objectives = [],
  kraOptions = [],
  isSigned,
  signatureDataUrl,
  raterSignatureDataUrl,
  sigDate,
  onSaveRating,
  onUpdateObjective,
  onAddKra,
  onDeleteKra,
  onFileUpload,
  onDeleteFile,
  onSubmitIPCRF,
  isEditable = true
}) {
  const [rateeName, setRateeName] = useState(employee?.full_name || employee?.name || 'Raul M. Colot Jr.');
  const [rateePos, setRateePos] = useState(employee?.position || 'Education Program Specialist II');
  const [raterName, setRaterName] = useState(raterInfo?.name || 'Dr. Jay Montealto, CESO V');
  const [raterPos, setRaterPos] = useState(raterInfo?.title || raterInfo?.position || 'Schools Division Superintendent');
  const [approverName, setApproverName] = useState(approverInfo?.name || 'Aurelio A. Santisas, CESO VI');
  const [divisionName, setDivisionName] = useState(employee?.unit || 'Dapitan City');

  // Group objectives by Domain / KRA
  const groupedKRAs = objectives.reduce((acc, obj) => {
    const kra = kraOptions.find(k => k.id === obj.kra_template_id);
    const domainName = obj.kra_name || kra?.kra_name || kra?.name || kra?.category_name || 'Key Result Area';
    if (!acc[domainName]) {
      acc[domainName] = [];
    }
    acc[domainName].push({ ...obj, kraName: domainName });
    return acc;
  }, {});

  // Helper to extract ratings and compute objective average score accurately
  const getObjRatings = (obj) => {
    const firstPo = (obj.perf_objectives && obj.perf_objectives.length > 0) ? obj.perf_objectives[0] : null;
    const extractRating = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return (!isNaN(num) && num >= 1 && num <= 5) ? num : null;
    };

    const q = extractRating(firstPo?.quality_score ?? firstPo?.quality_rating ?? firstPo?.self_rating_q ?? (typeof firstPo?.self_rating === 'object' ? firstPo?.self_rating?.quality_rating : null) ?? (typeof obj?.self_rating === 'object' ? obj?.self_rating?.quality_rating : null) ?? obj?.self_rating_q);
    const e = extractRating(firstPo?.efficiency_score ?? firstPo?.efficiency_rating ?? firstPo?.self_rating_e ?? (typeof firstPo?.self_rating === 'object' ? firstPo?.self_rating?.efficiency_rating : null) ?? (typeof obj?.self_rating === 'object' ? obj?.self_rating?.efficiency_rating : null) ?? obj?.self_rating_e);
    const t = extractRating(firstPo?.timeliness_score ?? firstPo?.timeliness_rating ?? firstPo?.self_rating_t ?? (typeof firstPo?.self_rating === 'object' ? firstPo?.self_rating?.timeliness_rating : null) ?? (typeof obj?.self_rating === 'object' ? obj?.self_rating?.timeliness_rating : null) ?? obj?.self_rating_t);

    const validVals = [q, e, t].filter(v => v !== null && !isNaN(v));
    const ave = validVals.length > 0 ? (validVals.reduce((sum, val) => sum + Number(val), 0) / validVals.length) : null;

    return {
      quality_rating: q,
      efficiency_rating: e,
      timeliness_rating: t,
      average_rating: ave !== null ? ave.toFixed(2) : null,
      aveNum: ave
    };
  };

  // Calculate overall weighted score across all objectives with weight normalization
  let rawWeightedSum = 0;
  let totalWeight = 0;
  let ratedCount = 0;
  objectives.forEach(obj => {
    const w = Number(obj.weight_percent) || (100 / (objectives.length || 1));
    totalWeight += w;
    const ratings = getObjRatings(obj);
    if (ratings.aveNum !== null && !isNaN(ratings.aveNum)) {
      rawWeightedSum += (ratings.aveNum * w);
      ratedCount++;
    }
  });

  const totalScore = ratedCount > 0 ? (rawWeightedSum / totalWeight) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#D6402F] rounded-full animate-pulse"></span>
          <h3 className="text-xs font-black uppercase text-[#1B3A6B] tracking-wider">
            Official DepEd RPMS / IPCRF Form View (Editable Names & Signatures)
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAddKra}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] hover:bg-blue-900 text-white rounded-xl text-xs font-bold uppercase transition-all cursor-pointer shadow-sm"
          >
            <Plus size={14} /> Add KRA / Objective
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer shadow-sm"
          >
            <Printer size={14} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* DepEd IPCRF Document Sheet */}
      <div className="bg-white border-2 border-slate-800 rounded-lg shadow-xl p-4 md:p-8 font-sans text-slate-900 print:shadow-none print:border-none print:p-0 select-none overflow-x-auto">

        {/* Official DepEd Header Block */}
        <div className="text-center space-y-1 pb-4 mb-5 border-b-2 border-slate-900">
          <div className="flex justify-center mb-2">
            <img
              src="/deped_seal.png"
              alt="DepEd Seal"
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="text-xs md:text-sm font-serif font-bold tracking-widest text-slate-900 uppercase">
            Republic of the Philippines
          </div>
          <div className="text-base md:text-xl font-serif font-black tracking-wide text-slate-900 uppercase">
            Department of Education
          </div>
          <div className="text-xs font-serif font-bold text-slate-800 uppercase">
            REGION IX
          </div>
          <div className="text-xs font-serif font-bold text-slate-800 uppercase">
            CITY SCHOOLS DIVISION OF DAPITAN
          </div>
        </div>

        {/* Header Title Banner */}
        <div className="bg-[#8DAE62] border-2 border-slate-800 p-2.5 text-center mb-4">
          <h2 className="text-xs md:text-sm font-black uppercase tracking-tight text-slate-900">
            PART 1: INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW FORM (IPCRF)
          </h2>
        </div>

        {/* Info Grid Header Table */}
        <div className="border-2 border-slate-800 grid grid-cols-1 md:grid-cols-2 text-[11px] font-bold mb-6">
          <div className="border-b md:border-b-0 md:border-r border-slate-800 p-3 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-300 pb-1 gap-2">
              <span className="text-slate-600 shrink-0">Name of Employee:</span>
              <input
                type="text"
                value={rateeName}
                onChange={(e) => setRateeName(e.target.value)}
                readOnly={!isEditable}
                disabled={!isEditable}
                className="font-black uppercase text-slate-900 text-right bg-slate-50/50 hover:bg-amber-50 focus:bg-white border border-transparent hover:border-slate-300 rounded px-1.5 py-0.5 outline-none text-[11px] w-full disabled:opacity-80 disabled:cursor-not-allowed disabled:bg-transparent"
                title="Ratee Name"
              />
            </div>
            <div className="flex justify-between items-center border-b border-slate-300 pb-1 gap-2">
              <span className="text-slate-600 shrink-0">Position:</span>
              <input
                type="text"
                value={rateePos}
                onChange={(e) => setRateePos(e.target.value)}
                readOnly={!isEditable}
                disabled={!isEditable}
                className="font-black uppercase text-slate-900 text-right bg-slate-50/50 hover:bg-amber-50 focus:bg-white border border-transparent hover:border-slate-300 rounded px-1.5 py-0.5 outline-none text-[11px] w-full disabled:opacity-80 disabled:cursor-not-allowed disabled:bg-transparent"
                title="Position"
              />
            </div>
            <div className="flex justify-between items-center border-b border-slate-300 pb-1 gap-2">
              <span className="text-slate-600 shrink-0">Bureau/Center/Service/Division:</span>
              <input
                type="text"
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                className="font-black uppercase text-slate-900 text-right bg-slate-50/50 hover:bg-amber-50 focus:bg-white border border-transparent hover:border-slate-300 rounded px-1.5 py-0.5 outline-none text-[11px] w-full"
                title="Click to edit Division / Unit"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Rating Period:</span>
              <span className="font-black uppercase text-slate-900">SY {period?.year || 2025}-{period?.year ? Number(period.year) + 1 : 2026}</span>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-300 pb-1 gap-2">
              <span className="text-slate-600 shrink-0">Name of Rater:</span>
              <input
                type="text"
                value={raterName}
                onChange={(e) => setRaterName(e.target.value)}
                className="font-black uppercase text-slate-900 text-right bg-slate-50/50 hover:bg-amber-50 focus:bg-white border border-transparent hover:border-slate-300 rounded px-1.5 py-0.5 outline-none text-[11px] w-full"
                title="Click to edit Rater Name"
              />
            </div>
            <div className="flex justify-between items-center border-b border-slate-300 pb-1 gap-2">
              <span className="text-slate-600 shrink-0">Position:</span>
              <input
                type="text"
                value={raterPos}
                onChange={(e) => setRaterPos(e.target.value)}
                className="font-black uppercase text-slate-900 text-right bg-slate-50/50 hover:bg-amber-50 focus:bg-white border border-transparent hover:border-slate-300 rounded px-1.5 py-0.5 outline-none text-[11px] w-full"
                title="Click to edit Rater Position"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Date of Review:</span>
              <span className="font-black uppercase text-slate-900">
                {sigDate ? new Date(sigDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'March 06, 2026'}
              </span>
            </div>
          </div>
        </div>

        {/* DepEd IPCRF Main Table */}
        <div className="overflow-x-auto border-2 border-slate-800">
          <table className="w-full text-[10px] border-collapse min-w-[1000px]">
            <thead>
              {/* Top Section Headers */}
              <tr className="bg-[#8DAE62] border-b-2 border-slate-800 text-center font-black uppercase text-slate-900">
                <th className="border-r border-slate-800 p-2 w-28" rowSpan="2">Domains</th>
                <th className="border-r border-slate-800 p-2 w-48" rowSpan="2">Objectives</th>
                <th className="border-r border-slate-800 p-2 w-20" rowSpan="2">Timeline</th>
                <th className="border-r border-slate-800 p-2 w-16" rowSpan="2">Weight per KRA</th>
                <th className="border-r border-slate-800 p-2 w-10" rowSpan="2">QET</th>
                <th className="border-r border-slate-800 p-2" colSpan="5">Performance Indicators (Rubric)</th>
                <th className="p-2" colSpan="3">TO BE FILLED OUT DURING EVALUATION</th>
              </tr>

              <tr className="bg-[#8DAE62] border-b-2 border-slate-800 text-center font-black uppercase text-slate-900">
                <th className="border-r border-slate-800 p-1.5 w-24">Outstanding<br />5</th>
                <th className="border-r border-slate-800 p-1.5 w-24">Very Satisfactory<br />4</th>
                <th className="border-r border-slate-800 p-1.5 w-24">Satisfactory<br />3</th>
                <th className="border-r border-slate-800 p-1.5 w-24">Unsatisfactory<br />2</th>
                <th className="border-r border-slate-800 p-1.5 w-24">Poor<br />1</th>
                <th className="border-r border-slate-800 p-1.5 w-48">Actual Results</th>
                <th className="border-r border-slate-800 p-1.5 w-24">Rating (Q / E / T / Ave)</th>
                <th className="p-1.5 w-16">Score</th>
              </tr>
            </thead>

            <tbody>
              {Object.keys(groupedKRAs).map((domainName, domainIdx) => {
                const domainObjs = groupedKRAs[domainName];

                return domainObjs.map((obj, objIdx) => {
                  const firstPo = (obj.perf_objectives && obj.perf_objectives.length > 0) ? obj.perf_objectives[0] : null;
                  const poId = firstPo ? firstPo.id : null;
                  const sr = getObjRatings(obj);
                  const weightVal = Number(obj.weight_percent) || (100 / (objectives.length || 1));
                  const weightedScore = sr.aveNum !== null && !isNaN(sr.aveNum) ? (sr.aveNum * (weightVal / 100)).toFixed(3) : '—';

                  return (
                    <tr key={obj.id} className="border-b border-slate-800 align-top hover:bg-slate-50/50 transition-colors">

                      {/* Domain Column (RowSpan for first objective in group) */}
                      {objIdx === 0 && (
                        <td
                          rowSpan={domainObjs.length}
                          className="border-r border-slate-800 p-2 font-black uppercase text-slate-900 bg-slate-50/80 text-[10px] text-center"
                        >
                          {domainName}
                        </td>
                      )}

                      {/* Objective Description */}
                      <td className="border-r border-slate-800 p-2.5 font-bold text-slate-900 leading-snug">
                        <div className="font-black text-[#1B3A6B] mb-1">Obj {domainIdx + 1}.{objIdx + 1}</div>
                        <div>{obj.objective_description || domainName}</div>
                      </td>

                      {/* Timeline */}
                      <td className="border-r border-slate-800 p-2 text-center font-bold whitespace-nowrap text-slate-700">
                        SY {period?.year || 2025}-{period?.year ? Number(period.year) + 1 : 2026}
                      </td>

                      {/* Weight per KRA */}
                      <td className="border-r border-slate-800 p-2 text-center font-black text-slate-900">
                        {weightVal.toFixed(3)}%
                      </td>

                      {/* QET Labels */}
                      <td className="border-r border-slate-800 p-2 text-center font-bold text-slate-700 space-y-3">
                        <div className="h-5 flex items-center justify-center">Quality</div>
                        <div className="h-5 flex items-center justify-center border-t border-slate-200">Efficiency</div>
                        <div className="h-5 flex items-center justify-center border-t border-slate-200">Timeliness</div>
                      </td>

                      {/* Rubrics (5 to 1) */}
                      <td className="border-r border-slate-800 p-2 text-[9px] text-slate-800 font-semibold leading-snug">
                        Demonstrated Level 6/7 in the PPST Indicator as shown in the COT rating sheet / interobserver agreement form presented
                      </td>
                      <td className="border-r border-slate-800 p-2 text-[9px] text-slate-800 font-semibold leading-snug">
                        Demonstrated Level 5 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented
                      </td>
                      <td className="border-r border-slate-800 p-2 text-[9px] text-slate-800 font-semibold leading-snug">
                        Demonstrated Level 4 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented
                      </td>
                      <td className="border-r border-slate-800 p-2 text-[9px] text-slate-800 font-semibold leading-snug">
                        Demonstrated Level 3 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented
                      </td>
                      <td className="border-r border-slate-800 p-2 text-[9px] text-slate-800 font-semibold leading-snug">
                        Demonstrated Level 2 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented
                      </td>

                      {/* Actual Results & MOV File attachments */}
                      <td className="border-r border-slate-800 p-2 text-[9px] font-bold leading-relaxed space-y-2">
                        <div>
                          {obj.actual_accomplishment || 'Demonstrated level as shown in COT / MOV attachments presented.'}
                        </div>

                        {/* File attachments pill list */}
                        <div className="space-y-1 pt-1 border-t border-slate-200">
                          {(obj.mov_uploads || []).map(file => (
                            <div key={file.id} className="flex items-center justify-between gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-[8px]">
                              <span className="truncate max-w-[110px] font-bold text-slate-800">{file.original_filename}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <a href={`${SOCKET_URL}/uploads/pm_movs/${file.stored_filename}`} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-black p-0.5"><Eye size={10} /></a>
                                <button onClick={() => onDeleteFile(obj.id, file.id)} className="text-slate-400 hover:text-red-600 p-0.5"><Trash2 size={10} /></button>
                              </div>
                            </div>
                          ))}
                          <label className="inline-flex items-center gap-1 text-[8px] font-black text-[#D6402F] hover:underline cursor-pointer">
                            <Upload size={10} /> Attach MOV
                            <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onFileUpload(obj.id, e.target.files[0]); }} />
                          </label>
                        </div>
                      </td>

                      {/* Rating (Q, E, T, Ave inputs) */}
                      <td className="border-r border-slate-800 p-2 text-center align-middle">
                        <div className="space-y-1.5 font-bold text-[10px]">
                          {/* Quality Input */}
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-slate-500 font-black text-[9px]">Q:</span>
                            <input
                              type="number" step="0.5" min="1" max="5"
                              value={sr.quality_rating ?? ''}
                              readOnly={!isEditable}
                              disabled={!isEditable}
                              onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                              onChange={(e) => {
                                if (!isEditable) return;
                                const val = e.target.value;
                                if (val === '') {
                                  const updated = { ...sr, quality_rating: null };
                                  const vals = [updated.quality_rating, updated.efficiency_rating, updated.timeliness_rating].filter(v => v !== null && v !== undefined && !isNaN(v));
                                  updated.average_rating = vals.length > 0 ? (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(2) : null;
                                  onSaveRating(poId, updated, obj.id);
                                  return;
                                }
                                const q = parseFloat(val);
                                if (isNaN(q) || q < 1 || q > 5) return; // REJECT 6+ or < 1
                                const updated = { ...sr, quality_rating: q };
                                const vals = [updated.quality_rating, updated.efficiency_rating, updated.timeliness_rating].filter(v => v !== null && v !== undefined && !isNaN(v));
                                updated.average_rating = vals.length > 0 ? (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(2) : null;
                                onSaveRating(poId, updated, obj.id);
                              }}
                              className="w-10 bg-slate-50 border border-slate-300 rounded text-center py-0.5 font-black outline-none focus:border-[#D6402F] disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />
                          </div>

                          {/* Efficiency Input */}
                          <div className="flex items-center justify-center gap-1 border-t border-slate-200 pt-1">
                            <span className="text-slate-500 font-black text-[9px]">E:</span>
                            <input
                              type="number" step="0.5" min="1" max="5"
                              value={sr.efficiency_rating ?? ''}
                              readOnly={!isEditable}
                              disabled={!isEditable}
                              onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                              onChange={(e) => {
                                if (!isEditable) return;
                                const val = e.target.value;
                                if (val === '') {
                                  const updated = { ...sr, efficiency_rating: null };
                                  const vals = [updated.quality_rating, updated.efficiency_rating, updated.timeliness_rating].filter(v => v !== null && v !== undefined && !isNaN(v));
                                  updated.average_rating = vals.length > 0 ? (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(2) : null;
                                  onSaveRating(poId, updated, obj.id);
                                  return;
                                }
                                const eff = parseFloat(val);
                                if (isNaN(eff) || eff < 1 || eff > 5) return; // REJECT 6+ or < 1
                                const updated = { ...sr, efficiency_rating: eff };
                                const vals = [updated.quality_rating, updated.efficiency_rating, updated.timeliness_rating].filter(v => v !== null && v !== undefined && !isNaN(v));
                                updated.average_rating = vals.length > 0 ? (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(2) : null;
                                onSaveRating(poId, updated, obj.id);
                              }}
                              className="w-10 bg-slate-50 border border-slate-300 rounded text-center py-0.5 font-black outline-none focus:border-[#D6402F] disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />
                          </div>

                          {/* Timeliness Input */}
                          <div className="flex items-center justify-center gap-1 border-t border-slate-200 pt-1">
                            <span className="text-slate-500 font-black text-[9px]">T:</span>
                            <input
                              type="number" step="0.5" min="1" max="5"
                              value={sr.timeliness_rating ?? ''}
                              readOnly={!isEditable}
                              disabled={!isEditable}
                              onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                              onChange={(e) => {
                                if (!isEditable) return;
                                const val = e.target.value;
                                if (val === '') {
                                  const updated = { ...sr, timeliness_rating: null };
                                  const vals = [updated.quality_rating, updated.efficiency_rating, updated.timeliness_rating].filter(v => v !== null && v !== undefined && !isNaN(v));
                                  updated.average_rating = vals.length > 0 ? (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(2) : null;
                                  onSaveRating(poId, updated, obj.id);
                                  return;
                                }
                                const t = parseFloat(val);
                                if (isNaN(t) || t < 1 || t > 5) return; // REJECT 6+ or < 1
                                const updated = { ...sr, timeliness_rating: t };
                                const vals = [updated.quality_rating, updated.efficiency_rating, updated.timeliness_rating].filter(v => v !== null && v !== undefined && !isNaN(v));
                                updated.average_rating = vals.length > 0 ? (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(2) : null;
                                onSaveRating(poId, updated, obj.id);
                              }}
                              className="w-10 bg-slate-50 border border-slate-300 rounded text-center py-0.5 font-black outline-none focus:border-[#D6402F] disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100"
                            />
                          </div>

                          <div className="border-t-2 border-slate-800 pt-1 font-black text-slate-900 bg-amber-50 rounded py-0.5">
                            Ave: {sr.average_rating || '—'}
                          </div>
                        </div>
                      </td>

                      {/* Weighted Score Column */}
                      <td className="p-2 text-center font-black text-xs text-[#D6402F] align-middle bg-slate-50/50">
                        {weightedScore}
                      </td>

                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Rating Equivalences Table */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-2 border-slate-800 p-4 bg-slate-50/60">

          {/* Adjectival Rating Equivalences */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-2">
              ADJECTIVAL RATING EQUIVALENCES
            </h4>
            <table className="w-full text-[10px] border border-slate-800 border-collapse">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-800 font-black text-left">
                  <th className="p-1.5 border-r border-slate-800">RANGE</th>
                  <th className="p-1.5">ADJECTIVAL RATING</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-800">
                <tr className="border-b border-slate-300 bg-emerald-50/60">
                  <td className="p-1.5 border-r border-slate-800">4.500 – 5.000</td>
                  <td className="p-1.5 font-black text-emerald-800">Outstanding</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 border-r border-slate-800">3.500 – 4.499</td>
                  <td className="p-1.5 font-black text-blue-800">Very Satisfactory</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 border-r border-slate-800">2.500 – 3.499</td>
                  <td className="p-1.5 font-black text-slate-800">Satisfactory</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 border-r border-slate-800">1.500 – 2.499</td>
                  <td className="p-1.5 font-black text-amber-800">Unsatisfactory</td>
                </tr>
                <tr>
                  <td className="p-1.5 border-r border-slate-800">Below 1.499</td>
                  <td className="p-1.5 font-black text-red-800">Poor</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Final Overall Rating Box */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="bg-white border-2 border-slate-800 p-4 rounded-xl shadow-inner text-center space-y-1">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">
                RATING FOR PART 1: PROFESSIONAL STANDARDS
              </span>
              <div className="text-2xl md:text-3xl font-black text-[#D6402F]">
                {totalScore !== null && !isNaN(totalScore) ? totalScore.toFixed(3) : '—'}
              </div>
              <span className="text-xs font-black uppercase text-[#1B3A6B] block">
                {totalScore !== null && !isNaN(totalScore) ? getAdjectival(totalScore) : 'Pending'}
              </span>
            </div>

            {/* Official Signatures Line */}
            <div className="grid grid-cols-3 gap-3 text-center text-[9px] font-bold pt-4 border-t border-slate-400">
              <div className="flex flex-col items-center justify-end relative min-h-[50px]">
                {signatureDataUrl ? (
                  <img src={signatureDataUrl} alt="Ratee Digital Signature" className="h-12 w-auto object-contain max-h-12 -mb-2 z-10 filter drop-shadow-sm" />
                ) : isSigned ? (
                  <div className="font-serif italic font-black text-slate-900 text-xs tracking-wider border-b border-emerald-500 text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded shadow-xs mb-1">
                    ✍️ {rateeName || 'Raul M. Colot Jr.'}
                  </div>
                ) : null}
                <input
                  type="text"
                  value={rateeName}
                  onChange={(e) => setRateeName(e.target.value)}
                  className="font-black text-slate-900 text-center border-b border-slate-800 pb-1 mb-1 w-full bg-transparent outline-none uppercase text-[10px]"
                  title="Click to edit Ratee Name"
                />
                <span className="text-slate-600 block uppercase font-bold text-[8px]">Ratee (Employee Signature)</span>
              </div>
              <div className="flex flex-col items-center justify-end relative min-h-[50px]">
                {raterSignatureDataUrl && raterSignatureDataUrl !== 'signed_default' ? (
                  <img src={raterSignatureDataUrl} alt="Rater Digital Signature" className="h-12 w-auto object-contain max-h-12 -mb-2 z-10 filter drop-shadow-sm" />
                ) : (!isEditable || raterSignatureDataUrl === 'signed_default') ? (
                  <div className="font-serif italic font-black text-slate-900 text-xs tracking-wider border-b border-emerald-500 text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded shadow-xs mb-1">
                    ✍️ {raterName || 'Jay Montealto, CESO V'}
                  </div>
                ) : null}
                <input
                  type="text"
                  value={raterName}
                  onChange={(e) => setRaterName(e.target.value)}
                  className="font-black text-slate-900 text-center border-b border-slate-800 pb-1 mb-1 w-full bg-transparent outline-none uppercase text-[10px]"
                  title="Click to edit Rater Name"
                />
                <span className="text-slate-600 block uppercase font-bold text-[8px]">Rater (Supervisor Signature)</span>
              </div>
              <div>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="font-black text-slate-900 text-center border-b border-slate-800 pb-1 mb-1 w-full bg-transparent outline-none uppercase text-[10px]"
                  title="Click to edit Approving Authority Name"
                />
                <span className="text-slate-600 block">Approving Authority</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
