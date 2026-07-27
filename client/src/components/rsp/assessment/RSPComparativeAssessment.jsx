import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Send, Star, Loader2 } from 'lucide-react';
import { useComparativeAssessment } from '../../../hooks/useComparativeAssessment';
import { API_BASE } from '../../../utils/api';

const API = API_BASE;

// TODO(product-owner): confirm category tabs for teaching_related.
// Currently reuses non_teaching tabs as a starting point.
const getCategoryTabs = (positionType) => {
    if (positionType === 'non_teaching' || positionType === 'teaching_related') {
        return [
            { key: 'classroom_observable', letter: 'A', label: 'Technical / Skills Interview', sub: 'Technical Questions', weight: 40 },
            { key: 'non_classroom_observable', letter: 'B', label: 'Non-Classroom Observable Indicators', sub: 'Interview / BEI', weight: 30 },
            { key: 'document_evaluation', letter: 'C', label: 'Document Evaluation', sub: 'Education / Training / Experience', weight: 30 },
        ];
    }
    return [
        { key: 'classroom_observable', letter: 'A', label: 'Classroom Observable Indicators', sub: 'Demonstration Teaching', weight: 60 },
        { key: 'non_classroom_observable', letter: 'B', label: 'Non-Classroom Observable Indicators', sub: 'Interview / BEI', weight: 20 },
        { key: 'document_evaluation', letter: 'C', label: 'Document Evaluation', sub: 'Education / Training / Experience', weight: 20 },
    ];
};

const RSPComparativeAssessment = () => {
    const {
        vacancyId, vacancy, criteria, applicants, rankings, scores,
        selectedAppId, setSelectedAppId, loading,
        refreshRankings, refreshScores, submitAssessment
    } = useComparativeAssessment();

    const [activeTab, setActiveTab] = useState('classroom_observable');
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [localScores, setLocalScores] = useState({});

    // BUG FIX: localScores was keyed only by criterion_id, with no link to which
    // applicant it belonged to. Switching applicants left old edits behind, so
    // getScore() below could silently return Applicant A's value while rendering
    // Applicant B — corrupting B's subscores/total. Clearing it on every
    // applicant switch forces getScore() back to the freshly-fetched `scores`.
    useEffect(() => {
        setLocalScores({});
    }, [selectedAppId]);

    // Merge backend scores with any in-progress local edits
    const getScore = (criterionId) =>
        localScores[criterionId] !== undefined ? localScores[criterionId] : (scores[criterionId] ?? 0);

    const handleScoreChange = (criterionId, value) => {
        setLocalScores(prev => ({ ...prev, [criterionId]: value }));
    };

    const handleScoreCommit = async (criterion, value) => {
        const score_given = Math.max(0, Math.min(criterion.max_score, Number(value) || 0));
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API}/api/rsp/comparative-assessment/score`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    applicant_id: selectedAppId,
                    criterion_id: criterion.id,
                    score_given,
                    vacancy_id: vacancyId
                })
            });
            await Promise.all([refreshScores(), refreshRankings()]);
        } catch (e) {
            console.error('Failed to save score:', e);
        } finally {
            setSaving(false);
        }
    };

    // Compute weighted subscore for a category, mirroring backend formula
    const computeSubscore = (categoryKey, categoryWeight) => {
        const catCriteria = criteria.filter(c => c.category === categoryKey);
        if (catCriteria.length === 0) return 0;
        const rawSum = catCriteria.reduce((acc, c) => {
            const s = getScore(c.id);
            return acc + ((s / c.max_score) * c.weight_percent);
        }, 0);
        return (rawSum / 100) * categoryWeight;
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await Promise.all([refreshScores(), refreshRankings()]);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!window.confirm(`Submit the Comparative Assessment for all ${applicants.length} qualified applicant(s)? This will lock scoring and advance the vacancy to Results Posting.`)) {
            return;
        }
        setSubmitting(true);
        try {
            const result = await submitAssessment();
            alert(result.message || (result.success ? 'Assessment submitted.' : 'Failed to submit assessment.'));
        } finally {
            setSubmitting(false);
        }
    };

    const posType = vacancy?.position_type || 'teaching';
    const CATEGORY_TABS = getCategoryTabs(posType);

    const weightA = CATEGORY_TABS[0].weight;
    const weightB = CATEGORY_TABS[1].weight;
    const weightC = CATEGORY_TABS[2].weight;

    const subA = computeSubscore('classroom_observable', weightA);
    const subB = computeSubscore('non_classroom_observable', weightB);
    const subC = computeSubscore('document_evaluation', weightC);
    const total = subA + subB + subC;

    if (loading) {
        return <div className="p-20 text-center animate-pulse font-black text-slate-400">Loading Comparative Assessment Workspace...</div>;
    }

    const activeCriteria = criteria.filter(c => c.category === activeTab);
    const activeTabDef = CATEGORY_TABS.find(t => t.key === activeTab);
    const subscoreMap = { classroom_observable: subA, non_classroom_observable: subB, document_evaluation: subC };
    const maxMap = { classroom_observable: weightA, non_classroom_observable: weightB, document_evaluation: weightC };

    return (
        <div className="flex gap-6 select-none">
            {/* LEFT: WORKSPACE */}
            <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">HRMPSB Comparative Assessment Workspace</h2>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            {vacancy?.position_title || 'Position'} · {vacancy?.ref_no || '—'} · {applicants.length} qualified applicant(s)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Draft
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || applicants.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-[#D6402F] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#b53526] shadow-md disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            Submit to HRMPSB
                        </button>
                    </div>
                </div>

                {/* APPLICANT SELECTOR */}
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Applicant to Rate</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {applicants.map(app => (
                            <button
                                key={app.id}
                                onClick={() => setSelectedAppId(app.id)}
                                className={`text-left p-4 rounded-xl border-2 transition-all ${
                                    selectedAppId === app.id
                                        ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white shadow-lg'
                                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                                }`}
                            >
                                <p className="text-xs font-black uppercase truncate">{app.full_name}</p>
                                <p className={`text-[10px] font-bold ${selectedAppId === app.id ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {app.ref_no || app.applicant_code}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* CATEGORY TABS */}
<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="grid grid-cols-3 border-b border-slate-100">
        {CATEGORY_TABS.map(tab => (
            <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-left p-4 border-r border-slate-100 last:border-r-0 transition-all min-h-[92px] flex flex-col justify-between ${
                    activeTab === tab.key ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                }`}
            >
                <div>
                    <p className="text-[10px] font-black text-[#1B3A6B] uppercase leading-tight">
                        {tab.letter}. {tab.label}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">{tab.sub}</p>
                </div>
                <span className="text-[10px] font-black text-[#D6402F] block">{tab.weight}%</span>
            </button>
                        ))}
                    </div>

                    {/* CRITERIA LIST */}
                    
                    <div className="p-6 space-y-5">
    <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-black text-[#1B3A6B] uppercase">
            {activeTabDef.letter}. {activeTabDef.label}
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase">
            Weight: {activeTabDef.weight}% of total score
        </span>
    </div>

                        {activeCriteria.map(c => {
        const val = getScore(c.id);
        const pct = Math.round((val / c.max_score) * 100);
        return (
            <div key={c.id} className="pb-1">
                <div className="flex justify-between items-start">
                    <div className="pt-1">
                        <p className="text-xs font-bold text-slate-700">{c.sub_criterion_label}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            Weight: {c.weight_percent}% &nbsp;·&nbsp; Max: {c.max_score}
                        </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 ml-4">
                        <input
    type="number"
    min="0"
    max={c.max_score}
    step="0.5"
    value={val.toFixed ? val.toFixed(2) : val}
                            onChange={e => handleScoreChange(c.id, e.target.value)}
                            onBlur={e => handleScoreCommit(c, e.target.value)}
                            className="w-16 text-center font-black text-[#1B3A6B] border border-slate-200 rounded-lg py-1 text-sm outline-none focus:border-[#1B3A6B]"
                        />
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">of {c.max_score}</p>
                    </div>
                </div>

                {/* Progress bar with percentage label sitting at the end, same row */}
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ width: `${pct}%` }}
                            className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-slate-300'}`}
                        />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 w-10 text-right shrink-0">{pct}%</span>
                </div>
            </div>
        );
    })}

    <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
        <span className="text-xs font-black text-slate-500 uppercase">
            Sub-score for {activeTabDef.letter}
        </span>
        <span className="text-lg font-black text-[#D6402F]">
            {subscoreMap[activeTab].toFixed(2)} <span className="text-xs text-slate-400">/ {maxMap[activeTab]}</span>
        </span>
    </div>
</div>
                </div>
            </div>

            {/* RIGHT: LIVE RANKINGS PANEL */}
            <div className="w-[380px] space-y-4">
                <div className="bg-[#1B3A6B] rounded-2xl p-6 text-white shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-4">Comparative Assessment Rankings</h3>
                    <p className="text-[10px] font-bold text-blue-300 mb-4">Real-time ranked results</p>

                    <div className="space-y-4">
                        {rankings.map((r, i) => (
                            <div key={r.id} className={`${selectedAppId === r.id ? 'opacity-100' : 'opacity-80'}`}>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">
                                        {i === 0 ? <Star size={14} className="text-yellow-400" fill="currentColor" /> : r.rank_val}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black truncate">{r.full_name}</p>
                                        <p className="text-[9px] font-bold text-blue-300">{r.applicant_code}</p>
                                    </div>
                                    <span className="text-sm font-black text-yellow-400">
                                        {parseFloat(r.total_score || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ width: `${r.total_score || 0}%` }}
                                        className="h-full bg-gradient-to-r from-blue-400 to-yellow-400 rounded-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SELECTED APPLICANT BREAKDOWN */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Score Breakdown · {applicants.find(a => a.id === selectedAppId)?.ref_no || '—'}
                    </h4>
                    <div className="space-y-3 mb-4">
                        {[
                            { label: CATEGORY_TABS[0].label, val: subA, max: weightA },
                            { label: CATEGORY_TABS[1].label, val: subB, max: weightB },
                            { label: CATEGORY_TABS[2].label, val: subC, max: weightC },
                        ].map(row => (
                            <div key={row.label} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-500">{row.label}</span>
                                <span className="font-black text-[#1B3A6B]">{row.val.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700 uppercase">Total Score</span>
                        <span className="text-2xl font-black text-[#D6402F]">{total.toFixed(2)}</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 text-right mt-1">out of 100.00</p>
                </div>

                {saving && (
                    <p className="text-center text-[10px] font-bold text-slate-400">Saving score…</p>
                )}
            </div>
        </div>
    );
};

export default RSPComparativeAssessment;