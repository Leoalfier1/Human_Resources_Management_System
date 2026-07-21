import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';
import RRStatCardsRow1 from './RRStatCardsRow1';
import RRStatCardsRow2 from './RRStatCardsRow2';
import NarrativeReportCard from './NarrativeReportCard';
import NomineesByCategoryCard from './NomineesByCategoryCard';
import PraiseCycleSummaryCard from './PraiseCycleSummaryCard';
import SubmitToRegionModal from './SubmitToRegionModal';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const RRImplementationReport = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [nomineesByCategory, setNomineesByCategory] = useState({ teaching: 0, non_teaching: 0, teaching_related: 0 });
    const [cycleSummary, setCycleSummary] = useState([]);
    const [report, setReport] = useState({ narrativeReport: '', status: 'draft' });
    const [selectedCycleId, setSelectedCycleId] = useState(null);
    const [calls, setCalls] = useState([]);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const debounceRef = useRef(null);

    const showToast = useCallback((msg) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(msg);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    }, []);

    const fetchData = useCallback(async () => {
        if (!selectedCycleId) {
            try {
                const callsRes = await fetch(`${API_BASE}/api/rr/announcement/settings`, { headers: headers() });
                if (callsRes.ok) {
                    const cData = await callsRes.json();
                    setCalls(cData.calls || []);
                    if (cData.calls?.length > 0) {
                        setSelectedCycleId(cData.calls[0].id);
                        return;
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch calls:', err);
                setLoading(false);
            }
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/rr/implementation-report/${selectedCycleId}`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats || {});
                setNomineesByCategory(data.nomineesByCategory || {});
                setCycleSummary(data.cycleSummary || []);
                setReport(data.report || { narrativeReport: '', status: 'draft' });
            }
        } catch (err) {
            console.error('Failed to fetch implementation report:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedCycleId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async (narrativeOverride, budgetAllocated, budgetUtilized) => {
        if (!selectedCycleId) return;
        try {
            const res = await fetch(`${API_BASE}/api/rr/implementation-report/${selectedCycleId}`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({
                    narrativeReport: narrativeOverride !== undefined ? narrativeOverride : report.narrativeReport,
                    budgetAllocated: budgetAllocated !== undefined ? budgetAllocated : stats.budgetAllocated,
                    budgetUtilized: budgetUtilized !== undefined ? budgetUtilized : stats.budgetUtilized
                })
            });
            if (res.ok) {
                showToast('Draft saved');
            }
        } catch (err) {
            console.error('Failed to save:', err);
        }
    };

    const handleNarrativeChange = (value) => {
        setReport(prev => ({ ...prev, narrativeReport: value }));
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            handleSave(value);
        }, 800);
    };

    const handleBudgetChange = (key, value) => {
        setStats(prev => ({ ...prev, [key]: value }));
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            handleSave(undefined, key === 'budgetAllocated' ? value : undefined, key === 'budgetUtilized' ? value : undefined);
        }, 800);
    };

    const handleGeneratePDF = async () => {
        if (!selectedCycleId) return;
        try {
            showToast('Generating PDF...');
            const res = await fetch(`${API_BASE}/api/rr/implementation-report/${selectedCycleId}/generate-pdf`, {
                method: 'POST',
                headers: headers()
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `RR_Report_Cycle${selectedCycleId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                showToast('PDF downloaded');
            } else {
                const data = await res.json();
                showToast(data.message || 'PDF generation failed');
            }
        } catch (err) {
            console.error('Failed to generate PDF:', err);
            showToast('PDF generation failed');
        }
    };

    const handleSubmit = async () => {
        if (!selectedCycleId) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/rr/implementation-report/${selectedCycleId}/submit`, {
                method: 'PATCH',
                headers: headers()
            });
            if (res.ok) {
                setShowSubmitModal(false);
                setReport(prev => ({ ...prev, status: 'submitted' }));
                showToast('Report submitted to Region');
                fetchData();
            } else {
                const data = await res.json();
                if (data.incomplete) {
                    showToast(`${data.message}: ${data.incomplete.join(', ')}`);
                } else {
                    showToast(data.message || 'Submission failed');
                }
            }
        } catch (err) {
            console.error('Failed to submit:', err);
            showToast('Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSubmitted = report.status === 'submitted';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-[#1B3A6B]" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 right-8 z-[999] bg-[#1B3A6B] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg"
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
                            R&R Implementation Report
                        </h1>
                        <p className="text-sm text-blue-200 mt-1">
                            Stage 8 &mdash; Summary statistics and final submission
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        {[1,2,3,4,5,6,7].map(i => (
                            <div key={i} className="w-2 h-2 rounded-full bg-white/30" />
                        ))}
                        <div className="w-2 h-2 rounded-full bg-[#D6402F]" />
                    </div>
                </div>
            </motion.div>

            {/* STAT CARDS ROW 1 */}
            <RRStatCardsRow1 stats={stats} />

            {/* STAT CARDS ROW 2 */}
            <RRStatCardsRow2 stats={stats} onBudgetChange={handleBudgetChange} isSubmitted={isSubmitted} />

            {/* LEFT + RIGHT COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-5">
                {/* LEFT COLUMN */}
                <NarrativeReportCard
                    narrative={report.narrativeReport}
                    isSubmitted={isSubmitted}
                    onChange={handleNarrativeChange}
                    onSave={() => handleSave()}
                    onGeneratePDF={handleGeneratePDF}
                    onSubmit={() => setShowSubmitModal(true)}
                />

                {/* RIGHT COLUMN */}
                <div className="space-y-5">
                    <NomineesByCategoryCard data={nomineesByCategory} />
                    <PraiseCycleSummaryCard summary={cycleSummary} />
                </div>
            </div>

            {/* SUBMIT MODAL */}
            <SubmitToRegionModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmit}
                isSubmitting={isSubmitting}
                cycleSummary={cycleSummary}
            />
        </div>
    );
};

export default RRImplementationReport;
