import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import io from 'socket.io-client';
import NominationWindowConfigCard from './NominationWindowConfigCard';
import ActiveCallsCard from './ActiveCallsCard';
import IncomingNomineesTable from './IncomingNomineesTable';
import PublishConfirmModal from './PublishConfirmModal';
import NomineeDetailModal from './NomineeDetailModal';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const CallForNominees = () => {
    const [loading, setLoading] = useState(true);
    const [awardTypes, setAwardTypes] = useState([]);
    const [calls, setCalls] = useState([]);
    const [nominations, setNominations] = useState([]);
    const [selectedCallId, setSelectedCallId] = useState(null);
    const [selectedCall, setSelectedCall] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedNomination, setSelectedNomination] = useState(null);
    const [publishPayload, setPublishPayload] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [awardRes, callsRes, nominationsRes] = await Promise.all([
                fetch(`${API_BASE}/api/rr/call-for-nominees/award-types`, { headers: headers() }),
                fetch(`${API_BASE}/api/rr/call-for-nominees/nomination-calls`, { headers: headers() }),
                fetch(`${API_BASE}/api/rr/call-for-nominees/nominations?category=${categoryFilter}`, { headers: headers() })
            ]);
            if (awardRes.ok) setAwardTypes(await awardRes.json());
            if (callsRes.ok) setCalls(await callsRes.json());
            if (nominationsRes.ok) setNominations(await nominationsRes.json());
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const socket = io(SERVER_BASE);
        socket.on('rr:call-published', () => fetchData());
        socket.on('rr:nomination-received', () => fetchData());
        socket.on('rr:dashboard:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    useEffect(() => {
        if (!selectedCallId) {
            setSelectedCall(null);
            return;
        }
        const call = calls.find(c => c.id === selectedCallId);
        setSelectedCall(call || null);
    }, [selectedCallId, calls]);

    const handleSelectCall = (call) => {
        setSelectedCallId(call.id);
    };

    const handleNewCall = () => {
        setSelectedCallId(null);
        setSelectedCall(null);
    };

    const handlePublishRequest = (payload) => {
        setPublishPayload(payload);
        setShowPublishModal(true);
    };

    const handleConfirmPublish = async () => {
        if (!publishPayload) return;
        try {
            const res = await fetch(`${API_BASE}/api/rr/call-for-nominees/nomination-calls`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(publishPayload)
            });
            if (res.ok) {
                const { id } = await res.json();
                await fetch(`${API_BASE}/api/rr/call-for-nominees/nomination-calls/${id}/publish`, {
                    method: 'PATCH',
                    headers: headers()
                });
                setShowPublishModal(false);
                setPublishPayload(null);
                setSelectedCallId(null);
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to create call');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to publish call');
        }
    };

    const handleUpdateAndPublish = async (callId, updates) => {
        try {
            if (Object.keys(updates).length > 0) {
                await fetch(`${API_BASE}/api/rr/call-for-nominees/nomination-calls/${callId}`, {
                    method: 'PUT',
                    headers: headers(),
                    body: JSON.stringify(updates)
                });
            }
            await fetch(`${API_BASE}/api/rr/call-for-nominees/nomination-calls/${callId}/publish`, {
                method: 'PATCH',
                headers: headers()
            });
            setShowPublishModal(false);
            setPublishPayload(null);
            setSelectedCallId(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to publish call');
        }
    };

    const handleNomineeClick = (nomination) => {
        setSelectedNomination(nomination);
        setShowDetailModal(true);
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
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1B3A6B] rounded-[2.5rem] p-6 shadow-lg relative overflow-hidden"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-black uppercase text-white tracking-tight">
                            Call for Nominees
                        </h1>
                        <p className="text-sm text-blue-200 mt-1">
                            Stage 2 — Configures and publish the nomination window
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-[#D6402F]" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <NominationWindowConfigCard
                        awardTypes={awardTypes}
                        selectedCall={selectedCall}
                        onNewCall={handleNewCall}
                        onPublishRequest={handlePublishRequest}
                    />
                </div>
                <div className="lg:col-span-2">
                    <ActiveCallsCard
                        calls={calls}
                        selectedCallId={selectedCallId}
                        onSelectCall={handleSelectCall}
                    />
                </div>
            </div>

            <IncomingNomineesTable
                nominations={nominations}
                categoryFilter={categoryFilter}
                onFilterChange={setCategoryFilter}
                onNomineeClick={handleNomineeClick}
            />

            <PublishConfirmModal
                isOpen={showPublishModal}
                onClose={() => { setShowPublishModal(false); setPublishPayload(null); }}
                onConfirm={handleConfirmPublish}
                payload={publishPayload}
                awardTypes={awardTypes}
                isEditing={!!selectedCallId}
                existingCallId={selectedCallId}
                onUpdateAndPublish={handleUpdateAndPublish}
            />

            <NomineeDetailModal
                isOpen={showDetailModal}
                onClose={() => { setShowDetailModal(false); setSelectedNomination(null); }}
                nomination={selectedNomination}
            />
        </div>
    );
};

export default CallForNominees;
