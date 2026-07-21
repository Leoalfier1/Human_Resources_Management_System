import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Megaphone } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import io from 'socket.io-client';
import CategoryFilterPills from '../../shared/CategoryFilterPills';
import AwardWinnersPreview from './AwardWinnersPreview';
import PublicationSettingsCard from './PublicationSettingsCard';
import PublishConfirmModal from './PublishConfirmModal';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const AnnouncementOfResults = () => {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [calls, setCalls] = useState([]);
    const [announcements, setAnnouncements] = useState({});
    const [selectedCallId, setSelectedCallId] = useState(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [winnersRes, settingsRes] = await Promise.all([
                fetch(`${API_BASE}/api/rr/announcement/winners`, { headers: headers() }),
                fetch(`${API_BASE}/api/rr/announcement/settings`, { headers: headers() })
            ]);

            if (winnersRes.ok) {
                const wData = await winnersRes.json();
                setGroups(wData.groups || []);
            }

            if (settingsRes.ok) {
                const sData = await settingsRes.json();
                setCalls(sData.calls || []);
                setAnnouncements(sData.announcements || {});
                if (!selectedCallId && sData.calls?.length > 0) {
                    setSelectedCallId(sData.calls[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch announcement data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const socket = io(SERVER_BASE);
        socket.on('rr:announcement-published', () => {
            fetchData();
            setToast('Results have been published');
            setTimeout(() => setToast(null), 4000);
        });
        socket.on('rr:deliberation-finalized', () => fetchData());
        socket.on('rr:dashboard:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    const handleSaveSettings = async (callId, settings) => {
        try {
            const res = await fetch(`${API_BASE}/api/rr/announcement/${callId}/settings`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(prev => ({ ...prev, [callId]: data.announcement }));
                setToast('Settings saved');
                setTimeout(() => setToast(null), 3000);
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
        }
    };

    const handleUploadMemo = async (callId, file) => {
        try {
            const formData = new FormData();
            formData.append('memo', file);
            const res = await fetch(`${API_BASE}/api/rr/announcement/${callId}/memo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token()}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(prev => ({ ...prev, [callId]: data.announcement }));
                setToast('Memo uploaded');
                setTimeout(() => setToast(null), 3000);
            } else {
                const data = await res.json();
                setToast(data.message || 'Upload failed');
                setTimeout(() => setToast(null), 3000);
            }
        } catch (err) {
            console.error('Failed to upload memo:', err);
        }
    };

    const handlePublish = async () => {
        if (!selectedCallId) return;
        setIsPublishing(true);
        try {
            const res = await fetch(`${API_BASE}/api/rr/announcement/${selectedCallId}/publish`, {
                method: 'PATCH',
                headers: headers()
            });
            if (res.ok) {
                setShowPublishModal(false);
                setToast('Results published successfully');
                setTimeout(() => setToast(null), 4000);
                fetchData();
            } else {
                const data = await res.json();
                setToast(data.message || 'Failed to publish');
                setTimeout(() => setToast(null), 4000);
            }
        } catch (err) {
            console.error('Failed to publish:', err);
        } finally {
            setIsPublishing(false);
        }
    };

    const filteredGroups = categoryFilter === 'all'
        ? groups
        : groups.filter(g =>
            g.winners.some(w => w.nominee_category === categoryFilter)
        ).map(g => ({
            ...g,
            winners: g.winners.filter(w => w.nominee_category === categoryFilter)
        }));

    const selectedAnnouncement = selectedCallId ? announcements[selectedCallId] : null;
    const isPublished = selectedAnnouncement?.status === 'published';

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
                            Announcement of Results
                        </h1>
                        <p className="text-sm text-blue-200 mt-1">
                            Stage 6 &mdash; Publish final results and notify recipients
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-[#D6402F]" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                    </div>
                </div>
            </motion.div>

            {/* PUBLICATION SETTINGS */}
            {selectedCallId && (
                <PublicationSettingsCard
                    callId={selectedCallId}
                    calls={calls}
                    announcement={selectedAnnouncement}
                    isPublished={isPublished}
                    onSelectCall={setSelectedCallId}
                    onSaveSettings={handleSaveSettings}
                    onUploadMemo={handleUploadMemo}
                />
            )}

            {/* CATEGORY FILTER + PUBLISH BUTTON */}
            <div className="flex items-center justify-between">
                <div />
                <div className="flex items-center gap-3">
                    <CategoryFilterPills
                        categoryFilter={categoryFilter}
                        onFilterChange={setCategoryFilter}
                    />
                    {!isPublished && (
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowPublishModal(true)}
                            disabled={groups.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#D6402F] hover:bg-[#c0352a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md transition-colors"
                        >
                            <Megaphone size={14} strokeWidth={2.5} />
                            Publish Results
                        </motion.button>
                    )}
                    {isPublished && (
                        <span className="px-4 py-2.5 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                            Published {selectedAnnouncement.published_at ? new Date(selectedAnnouncement.published_at).toLocaleDateString() : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* WINNERS PREVIEW */}
            <AwardWinnersPreview groups={filteredGroups} />

            {/* PUBLISH CONFIRM MODAL */}
            <PublishConfirmModal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onConfirm={handlePublish}
                isPublishing={isPublishing}
                announcement={selectedAnnouncement}
                totalWinners={groups.reduce((sum, g) => sum + g.winners.length, 0)}
            />
        </div>
    );
};

export default AnnouncementOfResults;
