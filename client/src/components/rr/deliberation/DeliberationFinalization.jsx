import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import io from 'socket.io-client';
import DelibStatCards from './DelibStatCards';
import CategoryFilterPills from '../../shared/CategoryFilterPills';
import RankingsConsensusList from './RankingsConsensusList';
import FinalizeResultsModal from './FinalizeResultsModal';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const DeliberationFinalization = () => {
    const [loading, setLoading] = useState(true);
    const [nominees, setNominees] = useState([]);
    const [stats, setStats] = useState({ total_nominees: 0, approved_count: 0, on_hold_count: 0, avg_score: 0 });
    const [totalCommitteeMembers, setTotalCommitteeMembers] = useState(0);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/deliberation2/nominees?category=${categoryFilter}`,
                { headers: headers() }
            );
            if (res.ok) {
                const data = await res.json();
                setNominees(data.nominees || []);
                setStats(data.stats || {});
                setTotalCommitteeMembers(data.totalCommitteeMembers || 0);
            }
        } catch (err) {
            console.error('Failed to fetch deliberation data:', err);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                setCurrentUserId(parsed.id || parsed.user?.id || null);
            }
        } catch {}
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const socket = io(SERVER_BASE);
        socket.on('rr:vote-cast', () => fetchData());
        socket.on('rr:deliberation-finalized', () => {
            fetchData();
            setToast('Deliberation has been finalized');
            setTimeout(() => setToast(null), 4000);
        });
        socket.on('rr:validation-saved', () => fetchData());
        socket.on('rr:dashboard:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    const handleCategoryFilter = (cat) => {
        setCategoryFilter(cat);
    };

    const handleVote = async (nominationId, vote) => {
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/deliberation2/${nominationId}/vote`,
                {
                    method: 'PUT',
                    headers: headers(),
                    body: JSON.stringify({ vote })
                }
            );
            if (res.ok) {
                const data = await res.json();

                setNominees(prev => prev.map(n => {
                    if (n.nomination_id !== nominationId) return n;
                    return {
                        ...n,
                        votes: data.votes || n.votes,
                        deliberation_status: data.consensus?.status || n.deliberation_status,
                        myVote: vote
                    };
                }));

                if (data.consensus) {
                    setStats(prev => {
                        const updated = [...nominees];
                        const nomIdx = updated.findIndex(n => n.nomination_id === nominationId);
                        if (nomIdx !== -1) updated[nomIdx] = { ...updated[nomIdx], deliberation_status: data.consensus.status };

                        const approved = updated.filter(n => n.deliberation_status === 'approved').length;
                        const onHold = updated.filter(n => n.deliberation_status === 'on_hold').length;
                        return { ...prev, approved_count: approved, on_hold_count: onHold };
                    });
                }
            } else {
                const data = await res.json();
                if (data.message) {
                    setToast(data.message);
                    setTimeout(() => setToast(null), 3000);
                }
            }
        } catch (err) {
            console.error('Failed to cast vote:', err);
        }
    };

    const handleFinalize = async () => {
        setIsFinalizing(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/deliberation2/finalize`,
                {
                    method: 'PATCH',
                    headers: headers()
                }
            );
            if (res.ok) {
                setShowFinalizeModal(false);
                setToast('Deliberation finalized successfully');
                setTimeout(() => setToast(null), 4000);
                fetchData();
            } else {
                const data = await res.json();
                setToast(data.message || 'Failed to finalize');
                setTimeout(() => setToast(null), 4000);
            }
        } catch (err) {
            console.error('Failed to finalize:', err);
        } finally {
            setIsFinalizing(false);
        }
    };

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
                            Deliberation & Finalization
                        </h1>
                        <p className="text-sm text-blue-200 mt-1">
                            Stage 5 &mdash; Committee ranking and consensus voting
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-[#D6402F]" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                    </div>
                </div>
            </motion.div>

            {/* STAT CARDS */}
            <DelibStatCards stats={stats} />

            {/* CATEGORY FILTER */}
            <div className="flex justify-end">
                <CategoryFilterPills
                    categoryFilter={categoryFilter}
                    onFilterChange={handleCategoryFilter}
                />
            </div>

            {/* RANKINGS & CONSENSUS */}
            <div className="relative">
                <RankingsConsensusList
                    nominees={nominees}
                    currentUserId={currentUserId}
                    onVote={handleVote}
                    totalCommitteeMembers={totalCommitteeMembers}
                />
                <div className="absolute top-6 right-6">
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowFinalizeModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#D6402F] hover:bg-[#c0352a] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md transition-colors"
                    >
                        <CheckCircle size={14} strokeWidth={2.5} />
                        Finalize Results
                    </motion.button>
                </div>
            </div>

            {/* FINALIZE MODAL */}
            <FinalizeResultsModal
                isOpen={showFinalizeModal}
                onClose={() => setShowFinalizeModal(false)}
                onConfirm={handleFinalize}
                nominees={nominees}
                stats={stats}
            />
        </div>
    );
};

export default DeliberationFinalization;
