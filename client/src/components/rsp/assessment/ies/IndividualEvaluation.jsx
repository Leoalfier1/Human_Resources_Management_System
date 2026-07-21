import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, Save } from 'lucide-react';
import { useIndividualEvaluation } from '../../../../hooks/useIndividualEvaluation';
import CategoryTabs from './CategoryTabs';
import ApplicantQueueList from './ApplicantQueueList';
import StatusStepper from '../../../shared/StatusStepper';
import ApplicantInfoCard from './ApplicantInfoCard';
import ScoringCriteriaTable from './ScoringCriteriaTable';
import TotalScoreBar from './TotalScoreBar';
import AttestationCard from './AttestationCard';

const CATEGORY_MAP = {
    teaching: 'Teaching',
    teaching_related: 'Teaching-Related',
    non_teaching: 'Non-Teaching',
};

const IndividualEvaluation = () => {
    const {
        activeCategory, setActiveCategory,
        queue, selectedApplicantId, setSelectedApplicantId,
        evaluation, runningTotal, isLocked,
        loading, loadingEvaluation, saving, downloading, error, success,
        getCriterionValue, getActualScore,
        handleScoreChange, handleSaveNow,
        submitEvaluation, attestAsApplicant, attestAsChair, downloadPDF,
        fetchQueue, setError
    } = useIndividualEvaluation();

    const [searchQuery, setSearchQuery] = useState('');

    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        setSearchQuery('');
    };

    const handleApplicantSelect = (appId) => {
        setSelectedApplicantId(appId);
    };

    return (
        <div className="space-y-4">
            {/* ─── Breadcrumb + Title ─── */}
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    RSP Process / Individual Evaluation
                </p>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-[#1B3A6B] uppercase tracking-widest">
                            Individual Evaluation
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            Series D - CS-021 - 2025 - Individual Evaluation Sheet (IES)
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <CategoryTabs activeCategory={activeCategory} onSelect={handleCategoryChange} />
                    </div>
                </div>
            </div>

            {/* ─── Error / Success Banners ─── */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-2 rounded-2xl border border-[#D6402F]/20 bg-[#D6402F]/10 p-3 text-xs font-black text-[#D6402F]"
                    >
                        <AlertTriangle size={14} />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto text-[9px] font-bold uppercase opacity-60 hover:opacity-100">dismiss</button>
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-black text-emerald-700"
                    >
                        {success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Main Two-Column Layout ─── */}
            <div className="flex gap-5 min-h-[600px]">
                {/* ─── LEFT: Applicant Queue ─── */}
                <div className="w-[22%] min-w-[260px] max-w-[320px] rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden flex flex-col shrink-0">
                    <div className="px-4 pt-4 pb-2 border-b border-slate-100">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1B3A6B]">
                            {CATEGORY_MAP[activeCategory]} Applicants
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                            {queue.length} applicant{queue.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                            <Loader2 size={20} className="animate-spin text-slate-300" />
                        </div>
                    ) : (
                        <ApplicantQueueList
                            queue={queue}
                            selectedApplicantId={selectedApplicantId}
                            onSelect={handleApplicantSelect}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            downloadPDF={downloadPDF}
                        />
                    )}
                </div>

                {/* ─── RIGHT: Detail Panel ─── */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {loadingEvaluation ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center py-20"
                            >
                                <div className="flex items-center gap-3 text-sm font-black text-slate-400 animate-pulse">
                                    <Loader2 size={20} className="animate-spin" />
                                    Loading evaluation...
                                </div>
                            </motion.div>
                        ) : !evaluation ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-16 text-center"
                            >
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                                    Select an applicant from the queue to begin evaluation
                                </p>
                                <p className="text-[10px] font-bold text-slate-300 mt-2">
                                    {queue.length === 0 ? 'No applicants available for this category' : 'Click on any applicant card on the left'}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`eval-${evaluation.id}`}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {/* Status Stepper Header */}
                                <div className="flex items-center justify-between">
                                    <StatusStepper
                                        steps={[
                                            { key: 'draft', label: 'Draft', number: 1 },
                                            { key: 'submitted', label: 'Submitted', number: 2 },
                                            { key: 'attested', label: 'Attested', number: 3 },
                                        ]}
                                        currentStep={evaluation.status === 'attested' ? 2 : evaluation.status === 'submitted' ? 1 : 0}
                                    />
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-bold text-slate-400">
                                            Score Reference: {evaluation.position_category === 'teacher_i' ? 'Teacher I' : evaluation.bracket_key || evaluation.position_category}
                                        </span>
                                        {!isLocked && (
                                            <button
                                                onClick={handleSaveNow}
                                                disabled={saving}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                            >
                                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                Save
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Applicant Info Card */}
                                <ApplicantInfoCard evaluation={evaluation} />

                                {/* Scoring Criteria Table */}
                                <ScoringCriteriaTable
                                    evaluation={evaluation}
                                    getCriterionValue={getCriterionValue}
                                    getActualScore={getActualScore}
                                    onScoreChange={handleScoreChange}
                                    isLocked={isLocked}
                                />

                                {/* Total Score Bar */}
                                <TotalScoreBar runningTotal={runningTotal} />

                                {/* Attestation Card */}
                                <AttestationCard
                                    evaluation={evaluation}
                                    isLocked={isLocked}
                                    onSubmit={submitEvaluation}
                                    onAttestApplicant={attestAsApplicant}
                                    onAttestChair={attestAsChair}
                                    saving={saving}
                                    downloadPDF={downloadPDF}
                                    downloading={downloading}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default IndividualEvaluation;
