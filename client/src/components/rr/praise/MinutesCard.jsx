import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, CheckCircle, Loader2, Lock } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const MinutesCard = ({ meeting, minutes, onMinutesChange, onFinalize, isFinalized }) => {
    const [localMinutes, setLocalMinutes] = useState(minutes || '');
    const [saving, setSaving] = useState(false);
    const debounceRef = useRef(null);

    const handleChange = (e) => {
        const val = e.target.value;
        setLocalMinutes(val);
        onMinutesChange(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSaving(true);
            try {
                await fetch(`${API_BASE}/api/rr/praise-meetings/${meeting.id}`, {
                    method: 'PUT',
                    headers: headers(),
                    body: JSON.stringify({ minutes: val })
                });
            } catch (err) {
                console.error(err);
            } finally {
                setSaving(false);
            }
        }, 800);
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/rr/praise-meetings/${meeting.id}`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({ minutes: localMinutes })
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const formatFinalizedDate = () => {
        if (!meeting.finalized_at) return '';
        const d = new Date(meeting.finalized_at);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B] mb-4">
                Minutes of the Meeting
            </h3>

            <textarea
                value={localMinutes}
                onChange={handleChange}
                disabled={isFinalized}
                placeholder="Record the minutes of this meeting here. Include key decisions, assigned responsibilities, and action items..."
                rows={10}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-[#1B3A6B] placeholder-slate-300 focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none"
            />

            {isFinalized ? (
                <div className="flex items-center gap-2 mt-4 text-emerald-600">
                    <Lock size={14} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                        Meeting Finalized on {formatFinalizedDate()}
                    </span>
                </div>
            ) : (
                <div className="flex items-center justify-end gap-3 mt-4">
                    {saving && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <Loader2 size={12} className="animate-spin" /> Saving...
                        </span>
                    )}
                    <button
                        onClick={handleSaveDraft}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#1B3A6B] text-[#1B3A6B] text-xs font-black uppercase tracking-widest hover:bg-[#1B3A6B] hover:text-white transition-all"
                    >
                        <Save size={14} />
                        Save Draft
                    </button>
                    <button
                        onClick={onFinalize}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D6402F] text-white text-xs font-black uppercase tracking-widest hover:bg-[#c03525] transition-all"
                    >
                        <CheckCircle size={14} />
                        Finalize Minutes
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default MinutesCard;
