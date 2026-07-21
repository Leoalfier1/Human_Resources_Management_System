import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import io from 'socket.io-client';
import RRStatCards from './RRStatCards';
import MeetingDetailsCard from './MeetingDetailsCard';
import AgendaItemsCard from './AgendaItemsCard';
import AttendeesCard from './AttendeesCard';
import MinutesCard from './MinutesCard';
import FinalizeConfirmModal from './FinalizeConfirmModal';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const PraiseCommitteeMeeting = () => {
    const [loading, setLoading] = useState(true);
    const [meeting, setMeeting] = useState(null);
    const [committee, setCommittee] = useState([]);
    const [agendaItems, setAgendaItems] = useState([]);
    const [stats, setStats] = useState({ committeeMemberCount: 0, presentTodayCount: 0, openAgendaCount: 0 });
    const [minutes, setMinutes] = useState('');
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/rr/praise-meetings/latest`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setMeeting(data.meeting);
                setCommittee(data.committee);
                setAgendaItems(data.agendaItems);
                setStats(data.stats);
                setMinutes(data.meeting.minutes || '');
            }
        } catch (err) {
            console.error('Failed to fetch meeting:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        const socket = io(SERVER_BASE);
        socket.on('rr:meeting-finalized', () => fetchData());
        socket.on('rr:dashboard:update', () => fetchData());

        return () => socket.disconnect();
    }, [fetchData]);

    const handleToggleAgenda = (itemId, isResolved) => {
        setAgendaItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, is_resolved: isResolved } : item
        ));
        setStats(prev => ({
            ...prev,
            openAgendaCount: agendaItems.filter(item => item.id !== itemId ? !item.is_resolved : !isResolved).length
        }));
    };

    const handleAddAgenda = (newItem) => {
        setAgendaItems(prev => [...prev, newItem]);
        setStats(prev => ({ ...prev, openAgendaCount: prev.openAgendaCount + 1 }));
    };

    const handleToggleAttendance = (memberId, isPresent) => {
        setCommittee(prev => prev.map(m =>
            m.id === memberId ? { ...m, is_present: isPresent } : m
        ));
        setStats(prev => ({
            ...prev,
            presentTodayCount: committee.filter(m => m.id !== memberId ? m.is_present : isPresent).length
        }));
    };

    const handleMinutesChange = (val) => setMinutes(val);

    const handleFinalize = async () => {
        if (!meeting.meeting_date || !meeting.venue || (!meeting.presiding_officer_id && !meeting.presiding_officer_other) || !minutes?.trim()) {
            const missing = [];
            if (!meeting.meeting_date) missing.push('meeting date');
            if (!meeting.venue) missing.push('venue');
            if (!meeting.presiding_officer_id && !meeting.presiding_officer_other) missing.push('presiding officer');
            if (!minutes?.trim()) missing.push('minutes');
            alert(`Please complete the following before finalizing: ${missing.join(', ')}`);
            setShowFinalizeModal(false);
            return;
        }
        setShowFinalizeModal(true);
    };

    const confirmFinalize = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/rr/praise-meetings/${meeting.id}/finalize`, {
                method: 'PATCH',
                headers: headers()
            });
            if (res.ok) {
                setMeeting(prev => ({ ...prev, status: 'finalized' }));
                setShowFinalizeModal(false);
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to finalize meeting');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to finalize meeting');
        }
    };

    const isFinalized = meeting?.status === 'finalized';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-[#1B3A6B]" />
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="text-center py-20 text-slate-400">
                <p className="text-sm font-bold uppercase tracking-widest">No meeting record found</p>
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
                            PRAISE Committee Meeting
                        </h1>
                        <p className="text-sm text-blue-200 mt-1">
                            Stage 1 — Program for Rewards and Incentives for Service Excellence
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                </div>
            </motion.div>

            <RRStatCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <MeetingDetailsCard
                        meeting={meeting}
                        committee={committee}
                        isFinalized={isFinalized}
                    />
                    <AgendaItemsCard
                        meetingId={meeting.id}
                        items={agendaItems}
                        onToggle={handleToggleAgenda}
                        onAdd={handleAddAgenda}
                        isFinalized={isFinalized}
                    />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <AttendeesCard
                        meetingId={meeting.id}
                        members={committee}
                        onToggleAttendance={handleToggleAttendance}
                        isFinalized={isFinalized}
                    />
                    <MinutesCard
                        meeting={meeting}
                        minutes={minutes}
                        onMinutesChange={handleMinutesChange}
                        onFinalize={handleFinalize}
                        isFinalized={isFinalized}
                    />
                </div>
            </div>

            <FinalizeConfirmModal
                isOpen={showFinalizeModal}
                onClose={() => setShowFinalizeModal(false)}
                onConfirm={confirmFinalize}
                meeting={meeting}
            />
        </div>
    );
};

export default PraiseCommitteeMeeting;
