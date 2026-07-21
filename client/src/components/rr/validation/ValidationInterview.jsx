import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import io from 'socket.io-client';
import CategoryFilterPills from '../../shared/CategoryFilterPills';
import NomineeTabs from './NomineeTabs';
import NomineeScoreHeader from './NomineeScoreHeader';
import CriteriaScoringList from './CriteriaScoringList';
import ScoreSummaryCard from './ScoreSummaryCard';
import InterviewNotesCard from './InterviewNotesCard';
import SaveEvaluationBar from './SaveEvaluationBar';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const ValidationInterview = () => {
    const [loading, setLoading] = useState(true);
    const [nominees, setNominees] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedNomineeId, setSelectedNomineeId] = useState(null);

    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [scores, setScores] = useState({});
    const [weightedTotal, setWeightedTotal] = useState(0);
    const [interviewNotes, setInterviewNotes] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const scoreSaveTimer = useRef(null);
    const notesSaveTimer = useRef(null);

    const fetchNominees = useCallback(async () => {
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/validation/nominees?category=${categoryFilter}`,
                { headers: headers() }
            );
            if (res.ok) {
                const data = await res.json();
                setNominees(data);
                if (data.length > 0) {
                    if (!selectedNomineeId || !data.find(n => n.nomination_id === selectedNomineeId)) {
                        setSelectedNomineeId(data[0].nomination_id);
                    }
                } else {
                    setSelectedNomineeId(null);
                    setDetail(null);
                }
            }
        } catch (err) {
            console.error('Failed to fetch validation nominees:', err);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, selectedNomineeId]);

    const fetchDetail = useCallback(async (nominationId) => {
        if (!nominationId) {
            setDetail(null);
            setScores({});
            setWeightedTotal(0);
            setInterviewNotes('');
            return;
        }
        setDetailLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/validation/${nominationId}`,
                { headers: headers() }
            );
            if (res.ok) {
                const data = await res.json();
                setDetail(data);
                const scoreMap = {};
                for (const c of data.criteria) {
                    scoreMap[c.id] = c.raw_score;
                }
                setScores(scoreMap);
                setWeightedTotal(data.server_weighted_total || 0);
                setInterviewNotes(data.interview_notes || '');
            }
        } catch (err) {
            console.error('Failed to fetch validation detail:', err);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => { fetchNominees(); }, [fetchNominees]);

    useEffect(() => { fetchDetail(selectedNomineeId); }, [selectedNomineeId, fetchDetail]);

    useEffect(() => {
        const socket = io(SERVER_BASE);
        socket.on('rr:nomination-advanced', () => fetchNominees());
        socket.on('rr:validation-scored', (data) => {
            if (data.nominationId === selectedNomineeId) fetchDetail(selectedNomineeId);
        });
        socket.on('rr:validation-saved', () => fetchNominees());
        socket.on('rr:dashboard:update', () => fetchNominees());
        return () => socket.disconnect();
    }, [fetchNominees, fetchDetail, selectedNomineeId]);

    const handleCategoryFilter = (cat) => {
        setCategoryFilter(cat);
        setSelectedNomineeId(null);
        setDetail(null);
    };

    const computeClientTotal = useCallback((scoreMap, criteria) => {
        if (!criteria) return 0;
        let total = 0;
        for (const c of criteria) {
            const raw = scoreMap[c.id];
            if (raw !== null && raw !== undefined) {
                total += (raw / c.max_raw_score) * c.weight_percent;
            }
        }
        return Math.round(total * 100) / 100;
    }, []);

    const handleScoreChange = useCallback((criterionId, rawScore) => {
        setScores(prev => {
            const next = { ...prev, [criterionId]: rawScore };
            const clientTotal = computeClientTotal(next, detail?.criteria);
            setWeightedTotal(clientTotal);

            if (scoreSaveTimer.current) clearTimeout(scoreSaveTimer.current);
            scoreSaveTimer.current = setTimeout(async () => {
                try {
                    const payload = Object.entries(next)
                        .filter(([, v]) => v !== null && v !== undefined)
                        .map(([k, v]) => ({ criterionId: parseInt(k), rawScore: v }));
                    const res = await fetch(
                        `${API_BASE}/api/rr/validation/${selectedNomineeId}/scores`,
                        {
                            method: 'PUT',
                            headers: headers(),
                            body: JSON.stringify({ scores: payload })
                        }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        if (data.weighted_total !== undefined) {
                            setWeightedTotal(data.weighted_total);
                        }
                    }
                } catch (err) {
                    console.error('Failed to save scores:', err);
                }
            }, 800);

            return next;
        });
    }, [detail?.criteria, selectedNomineeId, computeClientTotal]);

    const handleNotesChange = useCallback((notes) => {
        setInterviewNotes(notes);
        if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
        notesSaveTimer.current = setTimeout(async () => {
            try {
                await fetch(
                    `${API_BASE}/api/rr/validation/${selectedNomineeId}/notes`,
                    {
                        method: 'PUT',
                        headers: headers(),
                        body: JSON.stringify({ interviewNotes: notes })
                    }
                );
            } catch (err) {
                console.error('Failed to save notes:', err);
            }
        }, 800);
    }, [selectedNomineeId]);

    const handleSaveEvaluation = async () => {
        if (!selectedNomineeId) return;
        setIsSaving(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/validation/${selectedNomineeId}/save`,
                {
                    method: 'PATCH',
                    headers: headers()
                }
            );
            if (res.ok) {
                const data = await res.json();
                if (data.weighted_total !== undefined) {
                    setWeightedTotal(data.weighted_total);
                }
                setToast('Evaluation saved successfully');
                setTimeout(() => setToast(null), 3000);
            }
        } catch (err) {
            console.error('Failed to save evaluation:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const isComplete = detail?.criteria?.every(c =>
        scores[c.id] !== null && scores[c.id] !== undefined
    ) ?? false;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-[#1B3A6B]" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 right-8 z-[999] bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOP HEADER BAR */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1B3A6B] rounded-[2.5rem] p-6 shadow-lg relative overflow-hidden"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-black uppercase text-white tracking-tight">
                            Validation & Interview
                        </h1>
                        <p className="text-sm text-blue-200 mt-1">
                            Stage 4 &mdash; Criteria scoring per nominee
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-[#D6402F]" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                    </div>
                </div>
            </motion.div>

            {/* FILTER + NOMINEE TABS ROW */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <CategoryFilterPills
                    categoryFilter={categoryFilter}
                    onFilterChange={handleCategoryFilter}
                />
                <NomineeTabs
                    nominees={nominees}
                    selectedNomineeId={selectedNomineeId}
                    onSelectNominee={setSelectedNomineeId}
                />
            </div>

            {/* SCORING CONTENT */}
            {selectedNomineeId && (
                detailLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 size={24} className="animate-spin text-[#1B3A6B]" />
                    </div>
                ) : detail ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedNomineeId}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-5"
                        >
                            {/* NOMINEE HEADER */}
                            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
                                <NomineeScoreHeader
                                    nomination={detail.nomination}
                                    weightedTotal={weightedTotal}
                                />
                            </div>

                            {/* CRITERIA SCORING */}
                            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
                                <CriteriaScoringList
                                    criteria={detail.criteria}
                                    onScoreChange={handleScoreChange}
                                />
                            </div>

                            {/* SCORE SUMMARY */}
                            <ScoreSummaryCard
                                criteria={detail.criteria}
                                weightedTotal={weightedTotal}
                            />

                            {/* INTERVIEW NOTES */}
                            <InterviewNotesCard
                                notes={interviewNotes}
                                onNotesChange={handleNotesChange}
                            />

                            {/* SAVE EVALUATION BAR */}
                            <SaveEvaluationBar
                                onSave={handleSaveEvaluation}
                                isSaving={isSaving}
                                isComplete={isComplete}
                            />
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-xs font-bold uppercase tracking-widest">No nominee selected</p>
                    </div>
                )
            )}

            {!selectedNomineeId && nominees.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">
                        No nominees have advanced to Validation & Interview yet
                    </p>
                </div>
            )}
        </div>
    );
};

export default ValidationInterview;
