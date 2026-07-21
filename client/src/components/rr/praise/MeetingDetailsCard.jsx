import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ChevronDown, Loader2 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const OTHER_VALUE = '__other__';

const MeetingDetailsCard = ({ meeting, committee, onUpdate, isFinalized }) => {
    const [venue, setVenue] = useState(meeting.venue || '');
    const [presidingOfficerId, setPresidingOfficerId] = useState(meeting.presiding_officer_id || '');
    const [presidingOfficerOther, setPresidingOfficerOther] = useState(meeting.presiding_officer_other || '');
    const [isOtherSelected, setIsOtherSelected] = useState(!meeting.presiding_officer_id && !!meeting.presiding_officer_other);
    const [meetingDate, setMeetingDate] = useState(meeting.meeting_date || '');
    const [saving, setSaving] = useState(false);
    const debounceRef = useRef(null);

    const persist = useCallback(async (field, value) => {
        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/rr/praise-meetings/${meeting.id}`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({ [field]: value })
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }, [meeting.id]);

    const debouncedPersist = useCallback((field, value) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => persist(field, value), 800);
    }, [persist]);

    const handleDateChange = (e) => {
        const val = e.target.value;
        setMeetingDate(val);
        debouncedPersist('meeting_date', val || null);
    };

    const handleVenueChange = (e) => {
        const val = e.target.value;
        setVenue(val);
        debouncedPersist('venue', val);
    };

    const handleVenueBlur = () => persist('venue', venue);

    const handleOfficerChange = async (e) => {
        const val = e.target.value;
        if (val === OTHER_VALUE) {
            setIsOtherSelected(true);
            setPresidingOfficerId('');
            setPresidingOfficerOther('');
        } else {
            setIsOtherSelected(false);
            const userId = val ? parseInt(val) : null;
            setPresidingOfficerId(userId);
            setPresidingOfficerOther('');
            await persist('presiding_officer_id', userId);
        }
    };

    const handleOtherNameChange = (e) => {
        const val = e.target.value;
        setPresidingOfficerOther(val);
        debouncedPersist('presiding_officer_other', val || null);
    };

    const handleOtherNameBlur = async () => {
        if (presidingOfficerOther.trim()) {
            await persist('presiding_officer_other', presidingOfficerOther.trim());
        }
    };

    const formatDateTimeLocal = (dt) => {
        if (!dt) return '';
        const d = new Date(dt);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const formatDisplayDate = (dt) => {
        if (!dt) return 'Not set';
        const d = new Date(dt);
        if (isNaN(d.getTime())) return dt;
        return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' +
               d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const selectValue = isOtherSelected ? OTHER_VALUE : (presidingOfficerId || '');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B]">
                    Meeting Details
                </h3>
                <div className="flex items-center gap-2">
                    {saving && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        meeting.status === 'finalized'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                        {meeting.status}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Meeting Date & Time
                    </label>
                    <div className="relative">
                        <input
                            type="datetime-local"
                            value={formatDateTimeLocal(meetingDate)}
                            onChange={handleDateChange}
                            disabled={isFinalized}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        />
                        <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {meetingDate && (
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{formatDisplayDate(meetingDate)}</p>
                    )}
                </div>

                <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Venue / Location
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={venue}
                            onChange={handleVenueChange}
                            onBlur={handleVenueBlur}
                            disabled={isFinalized}
                            placeholder="e.g. HRMPSB Conference Room, Admin Building"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] placeholder-slate-300 focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        />
                        <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Presiding Officer
                    </label>
                    <div className="relative">
                        <select
                            value={selectValue}
                            onChange={handleOfficerChange}
                            disabled={isFinalized}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] appearance-none focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
                        >
                            <option value="">Select presiding officer...</option>
                            {committee.map(m => (
                                <option key={m.id} value={m.user_id}>
                                    {m.full_name} — {m.role_label}
                                </option>
                            ))}
                            <option value={OTHER_VALUE}>Other Authorized Representative (specify)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {isOtherSelected && !isFinalized && (
                        <div className="mt-2">
                            <input
                                type="text"
                                value={presidingOfficerOther}
                                onChange={handleOtherNameChange}
                                onBlur={handleOtherNameBlur}
                                placeholder="Enter representative's full name"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] placeholder-slate-300 focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors"
                            />
                        </div>
                    )}

                    {isOtherSelected && isFinalized && presidingOfficerOther && (
                        <p className="mt-1 text-xs text-slate-500 font-medium">{presidingOfficerOther}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MeetingDetailsCard;
