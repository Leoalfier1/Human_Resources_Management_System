import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import io from 'socket.io-client';
import CategoryFilterPills from '../../shared/CategoryFilterPills';
import NomineesQueueList from './NomineesQueueList';
import NomineeDocumentChecklist from './NomineeDocumentChecklist';
import RequestMissingDocsModal from './RequestMissingDocsModal';
import FlagForReviewModal from './FlagForReviewModal';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const PreliminaryEvaluation = () => {
    const [loading, setLoading] = useState(true);
    const [queue, setQueue] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedNominationId, setSelectedNominationId] = useState(null);
    const [checklistData, setChecklistData] = useState(null);
    const [checklistLoading, setChecklistLoading] = useState(false);

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestTarget, setRequestTarget] = useState(null);

    const [showFlagModal, setShowFlagModal] = useState(false);
    const [flagTarget, setFlagTarget] = useState(null);

    const fetchQueue = useCallback(async () => {
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/preliminary-evaluation/queue?category=${categoryFilter}`,
                { headers: headers() }
            );
            if (res.ok) {
                const data = await res.json();
                setQueue(data);
                if (data.length > 0 && !selectedNominationId) {
                    setSelectedNominationId(data[0].nomination_id);
                } else if (data.length > 0 && !data.find(n => n.nomination_id === selectedNominationId)) {
                    setSelectedNominationId(data[0].nomination_id);
                } else if (data.length === 0) {
                    setSelectedNominationId(null);
                }
            }
        } catch (err) {
            console.error('Failed to fetch queue:', err);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter]);

    const fetchChecklist = useCallback(async (nominationId) => {
        if (!nominationId) {
            setChecklistData(null);
            return;
        }
        setChecklistLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/preliminary-evaluation/${nominationId}`,
                { headers: headers() }
            );
            if (res.ok) {
                const data = await res.json();
                setChecklistData(data);
            }
        } catch (err) {
            console.error('Failed to fetch checklist:', err);
        } finally {
            setChecklistLoading(false);
        }
    }, []);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    useEffect(() => { fetchChecklist(selectedNominationId); }, [selectedNominationId, fetchChecklist]);

    useEffect(() => {
        const socket = io(SERVER_BASE);
        socket.on('rr:nomination-received', () => fetchQueue());
        socket.on('rr:nomination-flagged', () => {
            fetchQueue();
            if (selectedNominationId) fetchChecklist(selectedNominationId);
        });
        socket.on('rr:dashboard:update', () => fetchQueue());
        return () => socket.disconnect();
    }, [fetchQueue, selectedNominationId, fetchChecklist]);

    const handleCategoryFilter = (cat) => {
        setCategoryFilter(cat);
        setSelectedNominationId(null);
        setChecklistData(null);
    };

    const handleSelectNominee = (nominationId) => {
        setSelectedNominationId(nominationId);
    };

    const handleRequestMissingDocs = (nom) => {
        const missing = checklistData
            ? checklistData.checklist.filter(c => !c.is_submitted && c.is_required).map(c => c.document_label)
            : [];
        setRequestTarget({ ...nom, missingDocs: missing });
        setShowRequestModal(true);
    };

    const handleConfirmRequestDocs = async () => {
        if (!requestTarget) return;
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/preliminary-evaluation/${requestTarget.nomination_id || requestTarget.id}/request-missing-docs`,
                { method: 'PATCH', headers: headers() }
            );
            if (res.ok) {
                setShowRequestModal(false);
                setRequestTarget(null);
                fetchQueue();
                if (selectedNominationId) fetchChecklist(selectedNominationId);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to send request');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to send request');
        }
    };

    const handleFlagForReview = (nom) => {
        setFlagTarget(nom);
        setShowFlagModal(true);
    };

    const handleConfirmFlag = async (note) => {
        if (!flagTarget) return;
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/preliminary-evaluation/${flagTarget.nomination_id || flagTarget.id}/flag`,
                {
                    method: 'PATCH',
                    headers: headers(),
                    body: JSON.stringify({ note })
                }
            );
            if (res.ok) {
                setShowFlagModal(false);
                setFlagTarget(null);
                fetchQueue();
                if (selectedNominationId) fetchChecklist(selectedNominationId);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to flag nomination');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to flag nomination');
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
        <div className="space-y-6">
            {/* Top header bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1B3A6B] rounded-[2.5rem] p-6 shadow-lg relative overflow-hidden"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-black uppercase text-white tracking-tight">
                            Preliminary Evaluation
                        </h1>
                        <p className="text-sm text-blue-200 mt-1">
                            Stage 3 &mdash; Document completeness screening
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-[#D6402F]" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                    </div>
                </div>
            </motion.div>

            {/* Category filter pills */}
            <div className="flex justify-end">
                <CategoryFilterPills
                    categoryFilter={categoryFilter}
                    onFilterChange={handleCategoryFilter}
                />
            </div>

            {/* Nominees queue */}
            <NomineesQueueList
                nominees={queue}
                selectedNominationId={selectedNominationId}
                onSelectNominee={handleSelectNominee}
            />

            {/* Document checklist detail */}
            {checklistLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 size={24} className="animate-spin text-[#1B3A6B]" />
                </div>
            ) : (
                <NomineeDocumentChecklist
                    checklistData={checklistData}
                    onRequestMissingDocs={handleRequestMissingDocs}
                    onFlagForReview={handleFlagForReview}
                />
            )}

            {/* Modals */}
            <RequestMissingDocsModal
                isOpen={showRequestModal}
                onClose={() => { setShowRequestModal(false); setRequestTarget(null); }}
                onConfirm={handleConfirmRequestDocs}
                nomination={requestTarget}
                missingDocs={requestTarget?.missingDocs}
            />

            <FlagForReviewModal
                isOpen={showFlagModal}
                onClose={() => { setShowFlagModal(false); setFlagTarget(null); }}
                onConfirm={handleConfirmFlag}
                nomination={flagTarget}
            />
        </div>
    );
};

export default PreliminaryEvaluation;
