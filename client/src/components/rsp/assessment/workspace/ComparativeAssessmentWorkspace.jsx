import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Send, Loader2, AlertTriangle, Info } from 'lucide-react';
import { useCAWorkspace } from '../../../../hooks/useCAWorkspace';
import ApplicantSwitcherTabs from './ApplicantSwitcherTabs';
import RubricSectionTabs from './RubricSectionTabs';
import CriterionScoreRow from './CriterionScoreRow';
import RankingsSidebar from './RankingsSidebar';

const ComparativeAssessmentWorkspace = ({ vacancyId }) => {

  const {
    workspace, rankings, scoresMap,
    selectedApplicantId, setSelectedApplicantId,
    activeSection, setActiveSection,
    sectionScores, totalScore, isComplete,
    loading, saving, submitting, error,
    getScore, getRemarks, handleScoreChange, handleScoreBlur,
    handleRemarksChange, handleRemarksBlur,
    handleSaveDraft, handleSubmit, handleExport,
    currentTimestamp
  } = useCAWorkspace(vacancyId);

  const [submitResult, setSubmitResult] = useState(null);

  const sections = workspace?.sections || [];
  const applicants = workspace?.applicants || [];
  const criteria = workspace?.criteria || [];
  const layoutMode = workspace?.layoutMode || 'sectioned';
  const vacancy = workspace?.vacancy || {};
  const sectionsMeta = workspace?.sectionsMeta || [];
  const bracketLabel = workspace?.bracketLabel || null;
  const criteriaError = workspace?.criteriaError || null;
  const criteriaNotConfigured = workspace?.criteriaNotConfigured || false;

  const activeSectionData = useMemo(() => {
    if (layoutMode !== 'sectioned') return null;
    return sections.find(s => s.key === activeSection);
  }, [sections, activeSection, layoutMode]);

  const sectionCriteria = useMemo(() => {
    if (layoutMode === 'sectioned' && activeSectionData) {
      return activeSectionData.criteria || [];
    }
    return criteria;
  }, [layoutMode, activeSectionData, criteria]);

  const sectionSubScore = useMemo(() => {
    if (layoutMode !== 'sectioned') return { score: totalScore, max: 100 };
    const meta = sectionsMeta.find(s => s.key === activeSection);
    return {
      score: sectionScores[activeSection] ?? 0,
      max: meta?.weightPercent || 0
    };
  }, [layoutMode, activeSection, sectionScores, sectionsMeta, totalScore]);

  const selectedApplicant = applicants.find(a => a.id === selectedApplicantId);

  const handleSubmitClick = async () => {
    setSubmitResult(null);
    const result = await handleSubmit();
    setSubmitResult(result);
    if (result.success) {
      setTimeout(() => setSubmitResult(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="inline-flex items-center gap-3 text-sm font-black text-slate-400 animate-pulse">
          <Loader2 size={20} className="animate-spin" />
          Loading Comparative Assessment Workspace…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-20 text-center">
        <div className="inline-flex items-center gap-3 text-sm font-black text-red-400">
          <AlertTriangle size={20} />
          {error}
        </div>
      </div>
    );
  }

  if (!vacancyId) {
    return (
      <div className="p-20 text-center text-sm font-bold text-slate-400">
        Select a vacancy from the dashboard to begin the Comparative Assessment.
      </div>
    );
  }

  if (criteriaError || criteria.length === 0) {
    return (
      <div className="p-20 text-center">
        <div className="inline-flex flex-col items-center gap-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
            <Info size={28} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-700 uppercase">No Assessment Criteria Configured</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-2 leading-relaxed">
              {criteriaError
                ? `Unable to configure criteria: ${criteriaError}`
                : criteriaNotConfigured
                  ? `Comparative Assessment criteria for this position type (${vacancy.position_type || 'unknown'}) have not yet been configured. Contact the system administrator to set up the official DO 007 s. 2023 rubric for this vacancy.`
                  : `No criteria set has been defined for this position type (${vacancy.position_type || 'unknown'}). Contact the system administrator to set up the official DO 007 s. 2023 rubric for this vacancy.`
              }
            </p>
          </div>
          {bracketLabel && (
            <p className="text-[10px] font-black text-slate-300">
              Bracket: {bracketLabel}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 select-none">
      {/* === LEFT: MAIN WORKSPACE === */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">
              SDO Dapitan &middot; HRMPSB &middot; Schools Division Office of Dapitan City
            </p>
            <h2 className="text-xl font-black text-[#1B3A6B] uppercase tracking-tight">
              HRMPSB Comparative Assessment Workspace
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] font-bold text-slate-400">
                {vacancy.position_title || '—'} &middot; {vacancy.ref_no || '—'} &middot; {applicants.length} qualified applicant{applicants.length !== 1 ? 's' : ''}
              </p>
              <span className="text-[9px] font-black text-white bg-[#1B3A6B] px-2 py-0.5 rounded-full uppercase">
                {workspace?.positionCategory === 'teacher_i' ? 'Teacher I' :
                 workspace?.positionCategory === 'non_teaching' ? 'Non-Teaching' :
                 workspace?.positionCategory === 'teaching_related' ? 'Teaching-Related' :
                 workspace?.positionCategory || '—'}
              </span>
              {bracketLabel && (
                <span className="text-[9px] font-black text-[#1B3A6B] bg-[#1B3A6B]/5 px-2 py-0.5 rounded-full">
                  {bracketLabel}
                </span>
              )}
              {sectionsMeta && sectionsMeta.length > 0 && (
                <span className="text-[9px] font-black text-[#1B3A6B] bg-[#1B3A6B]/5 px-2 py-0.5 rounded-full">
                  {sectionsMeta.map(s => s.weightPercent).join(' / ')}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Draft
            </button>
            <div className="relative group">
              <button
                onClick={handleSubmitClick}
                disabled={submitting || !isComplete}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md transition-all ${
                  isComplete
                    ? 'bg-[#D6402F] text-white hover:bg-[#b53526]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit to HRMPSB
              </button>
              {!isComplete && (
                <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-slate-800 text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Complete all scores for every applicant before submitting.
                </div>
              )}
            </div>
          </div>
        </div>

        {submitResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-xs font-black ${submitResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
          >
            <p>{submitResult.message}</p>
            {submitResult.missing && submitResult.missing.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-bold text-red-500 uppercase">Incomplete scoring details:</p>
                {submitResult.missing.map(m => (
                  <div key={m.applicationId} className="flex items-center gap-2 text-[10px] font-bold text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span>{m.fullName}</span>
                    <span className="text-red-400">—</span>
                    <span>{m.missingCriteriaCount} criterion{m.missingCriteriaCount > 1 ? 'a' : ''} missing</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Applicant Switcher */}
        <ApplicantSwitcherTabs
          applicants={applicants}
          selectedId={selectedApplicantId}
          onSelect={setSelectedApplicantId}
          scoresMap={scoresMap}
          criteria={criteria}
        />

        {/* Section Tabs (only for sectioned layout) */}
        {layoutMode === 'sectioned' && sections.length > 0 && (
          <RubricSectionTabs
            sections={sections}
            activeSection={activeSection}
            onSelect={setActiveSection}
            sectionScores={sectionScores}
          />
        )}

        {/* Criteria List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#1B3A6B] uppercase tracking-tight">
                {layoutMode === 'sectioned'
                  ? `${activeSection}. ${activeSectionData?.label || 'Criteria'}`
                  : 'Comparative Assessment Criteria'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                {layoutMode === 'sectioned'
                  ? `${activeSectionData?.category || ''} \u2014 ${activeSectionData?.weightPercent || 0}% weight`
                  : `DO 007, s. 2023 \u2014 ${criteria.length} criteria`}
              </p>
            </div>
            {selectedApplicant && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400">Scoring:</span>
                <span className="text-[11px] font-black text-[#1B3A6B]">{selectedApplicant.full_name}</span>
              </div>
            )}
          </div>

          <div className="max-h-[560px] overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeSection}-${selectedApplicantId}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {sectionCriteria.map(c => (
                  <CriterionScoreRow
                    key={c.id}
                    criterion={c}
                    score={getScore(c.id)}
                    onChange={handleScoreChange}
                    onBlur={handleScoreBlur}
                    remarks={getRemarks(c.id)}
                    onRemarksChange={handleRemarksChange}
                    onRemarksBlur={handleRemarksBlur}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Section Sub-score Footer */}
          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                {layoutMode === 'sectioned'
                  ? `Sub-score for ${activeSection}. ${activeSectionData?.label || ''}`
                  : 'Total Score'}
              </span>
              {/* Mini progress bar in footer */}
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${sectionSubScore.max > 0 ? Math.min(100, (sectionSubScore.score / sectionSubScore.max) * 100) : 0}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="h-full rounded-full bg-[#1B3A6B]"
                />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#1B3A6B] tabular-nums">
                {sectionSubScore.score.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-400">
                / {sectionSubScore.max}
                <span className="ml-1 text-[9px] text-[#1B3A6B] bg-[#1B3A6B]/5 px-1.5 py-0.5 rounded-full font-black">
                  {sectionSubScore.max}%
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === RIGHT: RANKINGS SIDEBAR === */}
      <RankingsSidebar
        rankings={rankings}
        selectedApplicantId={selectedApplicantId}
        onSelectApplicant={setSelectedApplicantId}
        sectionScores={sectionScores}
        totalScore={totalScore}
        currentTimestamp={currentTimestamp}
        saving={saving}
        onExport={handleExport}
        layoutMode={layoutMode}
        criteria={criteria}
        sectionsMeta={sectionsMeta}
      />
    </div>
  );
};

export default ComparativeAssessmentWorkspace;
