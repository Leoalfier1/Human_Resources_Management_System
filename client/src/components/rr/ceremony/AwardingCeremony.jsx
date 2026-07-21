import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, PartyPopper } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import io from 'socket.io-client';
import CeremonyStatCards from './CeremonyStatCards';
import EventDetailsCard from './EventDetailsCard';
import PhotoGalleryUploadCard from './PhotoGalleryUploadCard';
import AwardeeChecklistCard from './AwardeeChecklistCard';
import PhotoLightboxModal from './PhotoLightboxModal';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const AwardingCeremony = () => {
    const [loading, setLoading] = useState(true);
    const [ceremony, setCeremony] = useState(null);
    const [committeeMembers, setCommitteeMembers] = useState([]);
    const [awardees, setAwardees] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [stats, setStats] = useState({ totalAwardees: 0, attendanceConfirmed: 0, certsDistributed: 0 });
    const [selectedCycleId, setSelectedCycleId] = useState(null);
    const [calls, setCalls] = useState([]);
    const [lightboxPhoto, setLightboxPhoto] = useState(null);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const showToast = useCallback((msg) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(msg);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    }, []);

    const fetchData = useCallback(async () => {
        // Phase 1: resolve cycleId if not yet set
        if (!selectedCycleId) {
            try {
                const callsRes = await fetch(`${API_BASE}/api/rr/announcement/settings`, { headers: headers() });
                if (callsRes.ok) {
                    const cData = await callsRes.json();
                    setCalls(cData.calls || []);
                    if (cData.calls?.length > 0) {
                        setSelectedCycleId(cData.calls[0].id);
                        return; // phase 2 will set loading=false
                    }
                }
                // Settings failed or returned no calls — stop loading
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch calls:', err);
                setLoading(false);
            }
            return;
        }

        // Phase 2: fetch ceremony data (selectedCycleId is valid)
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/ceremony/${selectedCycleId}`,
                { headers: headers() }
            );
            if (res.ok) {
                const data = await res.json();
                setCeremony(data.ceremony || null);
                setCommitteeMembers(data.committeeMembers || []);
                setAwardees(data.awardees || []);
                setPhotos(data.photos || []);
                setStats(data.stats || { totalAwardees: 0, attendanceConfirmed: 0, certsDistributed: 0 });
            }
        } catch (err) {
            console.error('Failed to fetch ceremony data:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedCycleId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchDataRef = useRef(fetchData);
    useEffect(() => { fetchDataRef.current = fetchData; }, [fetchData]);

    useEffect(() => {
        if (!selectedCycleId) return;
        const socket = io(SERVER_BASE);
        socket.on('rr:ceremony-status-updated', (data) => {
            if (data?.stats) setStats(data.stats);
            if (!data?.stats) fetchDataRef.current();
            showToast('Ceremony data updated');
        });
        socket.on('rr:dashboard:update', () => fetchDataRef.current());
        return () => socket.disconnect();
    }, [selectedCycleId, showToast]);

    const handleUpdateEventDetails = async (fields) => {
        if (!selectedCycleId) return;
        try {
            const res = await fetch(`${API_BASE}/api/rr/ceremony/${selectedCycleId}`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify(fields)
            });
            if (res.ok) {
                const data = await res.json();
                setCeremony(data.ceremony);
            }
        } catch (err) {
            console.error('Failed to update ceremony:', err);
        }
    };

    const handleUploadPhotos = async (files) => {
        if (!selectedCycleId) return;
        try {
            const formData = new FormData();
            for (const f of files) formData.append('photos', f);
            const res = await fetch(`${API_BASE}/api/rr/ceremony/${selectedCycleId}/photos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token()}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setPhotos(data.photos || []);
                showToast(`${data.uploaded} photo(s) uploaded`);
            } else {
                const data = await res.json();
                showToast(data.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Failed to upload photos:', err);
        }
    };

    const handleDeletePhoto = async (photoId) => {
        try {
            const res = await fetch(`${API_BASE}/api/rr/ceremony/photos/${photoId}`, {
                method: 'DELETE',
                headers: headers()
            });
            if (res.ok) {
                setPhotos(prev => prev.filter(p => p.id !== photoId));
                showToast('Photo removed');
            }
        } catch (err) {
            console.error('Failed to delete photo:', err);
        }
    };

    const handleToggleAttendance = async (nominationId) => {
        const awardee = awardees.find(a => a.nomination_id === nominationId);
        if (!awardee) return;
        const newConfirmed = !awardee.attendance_confirmed;

        // Optimistic update
        setAwardees(prev => prev.map(a =>
            a.nomination_id === nominationId ? { ...a, attendance_confirmed: newConfirmed } : a
        ));
        setStats(prev => ({
            ...prev,
            attendanceConfirmed: prev.attendanceConfirmed + (newConfirmed ? 1 : -1)
        }));

        try {
            const res = await fetch(`${API_BASE}/api/rr/ceremony/awardee/${nominationId}/attendance`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify({ confirmed: newConfirmed })
            });
            if (!res.ok) {
                // Revert
                setAwardees(prev => prev.map(a =>
                    a.nomination_id === nominationId ? { ...a, attendance_confirmed: !newConfirmed } : a
                ));
                setStats(prev => ({
                    ...prev,
                    attendanceConfirmed: prev.attendanceConfirmed + (newConfirmed ? -1 : 1)
                }));
            } else {
                const data = await res.json();
                if (data.stats) setStats(data.stats);
            }
        } catch {
            setAwardees(prev => prev.map(a =>
                a.nomination_id === nominationId ? { ...a, attendance_confirmed: !newConfirmed } : a
            ));
            setStats(prev => ({
                ...prev,
                attendanceConfirmed: prev.attendanceConfirmed + (newConfirmed ? -1 : 1)
            }));
        }
    };

    const handleChangeCertStatus = async (nominationId, newStatus) => {
        const awardee = awardees.find(a => a.nomination_id === nominationId);
        if (!awardee) return;
        const oldStatus = awardee.certificate_status;

        // Optimistic update
        setAwardees(prev => prev.map(a =>
            a.nomination_id === nominationId ? { ...a, certificate_status: newStatus } : a
        ));
        if (newStatus === 'distributed' && oldStatus !== 'distributed') {
            setStats(prev => ({ ...prev, certsDistributed: prev.certsDistributed + 1 }));
        } else if (newStatus !== 'distributed' && oldStatus === 'distributed') {
            setStats(prev => ({ ...prev, certsDistributed: prev.certsDistributed - 1 }));
        }

        try {
            const res = await fetch(`${API_BASE}/api/rr/ceremony/awardee/${nominationId}/certificate`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) {
                setAwardees(prev => prev.map(a =>
                    a.nomination_id === nominationId ? { ...a, certificate_status: oldStatus } : a
                ));
            }
        } catch {
            setAwardees(prev => prev.map(a =>
                a.nomination_id === nominationId ? { ...a, certificate_status: oldStatus } : a
            ));
        }
    };

    const handleChangePlaqueStatus = async (nominationId, newStatus) => {
        setAwardees(prev => prev.map(a =>
            a.nomination_id === nominationId ? { ...a, plaque_status: newStatus } : a
        ));

        try {
            const res = await fetch(`${API_BASE}/api/rr/ceremony/awardee/${nominationId}/plaque`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) {
                // Revert on failure
                const old = awardees.find(a => a.nomination_id === nominationId);
                if (old) setAwardees(prev => prev.map(a =>
                    a.nomination_id === nominationId ? { ...a, plaque_status: old.plaque_status } : a
                ));
            }
        } catch {
            const old = awardees.find(a => a.nomination_id === nominationId);
            if (old) setAwardees(prev => prev.map(a =>
                a.nomination_id === nominationId ? { ...a, plaque_status: old.plaque_status } : a
            ));
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
                            Awarding Ceremony
                        </h1>
                        <p className="text-sm text-blue-200 mt-1">
                            Stage 7 &mdash; Event logistics and certificate management
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-[#D6402F]" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                    </div>
                </div>
            </motion.div>

            {/* STAT CARDS */}
            <CeremonyStatCards stats={stats} />

            {/* LEFT + RIGHT COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-5">
                {/* LEFT COLUMN */}
                <div className="space-y-5">
                    <EventDetailsCard
                        ceremony={ceremony}
                        committeeMembers={committeeMembers}
                        onUpdate={handleUpdateEventDetails}
                    />
                    <PhotoGalleryUploadCard
                        photos={photos}
                        onUpload={handleUploadPhotos}
                        onDelete={handleDeletePhoto}
                        onView={setLightboxPhoto}
                    />
                </div>

                {/* RIGHT COLUMN */}
                <AwardeeChecklistCard
                    awardees={awardees}
                    onToggleAttendance={handleToggleAttendance}
                    onChangeCertStatus={handleChangeCertStatus}
                    onChangePlaqueStatus={handleChangePlaqueStatus}
                />
            </div>

            {/* LIGHTBOX */}
            <PhotoLightboxModal
                photo={lightboxPhoto}
                onClose={() => setLightboxPhoto(null)}
            />
        </div>
    );
};

export default AwardingCeremony;
