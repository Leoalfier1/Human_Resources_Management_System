import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const METHODOLOGIES = [
    'Seminar', 'Workshop', 'Coaching', 'Online', 'LAC Session',
    'Benchmarking', 'Job Rotation', 'Mentoring', 'Others'
];

const LDProgramForm = ({ planId, editData, onClose }) => {
    const [objectives, setObjectives] = useState([]);
    const [form, setForm] = useState({
        plan_id: planId || '',
        objective_id: '',
        title: '',
        description: '',
        methodology: 'Seminar',
        target_position_type: 'all',
        duration_hours: '',
        start_date: '',
        end_date: '',
        venue: '',
        resource_person: '',
        provider: '',
        budget_estimate: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/api/ld/objectives`, { headers: headers() })
            .then(r => r.json())
            .then(setObjectives)
            .catch(() => {});
        if (editData) {
            setForm({
                plan_id: editData.plan_id || planId,
                objective_id: editData.objective_id || '',
                title: editData.title || '',
                description: editData.description || '',
                methodology: editData.methodology || 'Seminar',
                target_position_type: editData.target_position_type || 'all',
                duration_hours: editData.duration_hours || '',
                start_date: editData.start_date ? editData.start_date.substring(0, 10) : '',
                end_date: editData.end_date ? editData.end_date.substring(0, 10) : '',
                venue: editData.venue || '',
                resource_person: editData.resource_person || '',
                provider: editData.provider || '',
                budget_estimate: editData.budget_estimate || '',
            });
        }
    }, [planId, editData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                plan_id: parseInt(form.plan_id),
                objective_id: form.objective_id ? parseInt(form.objective_id) : null,
                duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
                budget_estimate: form.budget_estimate ? parseFloat(form.budget_estimate) : null,
                start_date: form.start_date || null,
                end_date: form.end_date || null,
            };
            if (editData?.id) {
                await fetch(`${API_BASE}/api/ld/programs/${editData.id}`, {
                    method: 'PATCH', headers: headers(), body: JSON.stringify(payload)
                });
            } else {
                await fetch(`${API_BASE}/api/ld/programs`, {
                    method: 'POST', headers: headers(), body: JSON.stringify(payload)
                });
            }
            onClose();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const update = (field, value) => setForm({ ...form, [field]: value });

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 m-4 shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black uppercase italic text-[#1B3A6B]">
                        {editData ? 'Edit' : 'New'} Training Program
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Program Title</label>
                        <input value={form.title} onChange={e => update('title', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" required />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
                        <textarea value={form.description} onChange={e => update('description', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" rows={2} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">L&D Objective</label>
                            <select value={form.objective_id} onChange={e => update('objective_id', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1">
                                <option value="">Select Objective</option>
                                {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Methodology</label>
                            <select value={form.methodology} onChange={e => update('methodology', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1">
                                {METHODOLOGIES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Participants</label>
                        <div className="flex gap-3 mt-1">
                            {[
                                { value: 'all', label: 'All', color: 'bg-slate-100 text-slate-700 border-slate-300' },
                                { value: 'teaching', label: 'Teaching', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                                { value: 'non_teaching', label: 'Non-Teaching', color: 'bg-sky-100 text-sky-700 border-sky-300' },
                                { value: 'teaching_related', label: 'Tch-Related', color: 'bg-violet-100 text-violet-700 border-violet-300' },
                            ].map(opt => (
                                <label key={opt.value}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                                        form.target_position_type === opt.value
                                            ? `${opt.color} ring-2 ring-offset-1 ring-emerald-500`
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}>
                                    <input type="radio" name="target_type" value={opt.value}
                                        checked={form.target_position_type === opt.value}
                                        onChange={e => update('target_position_type', e.target.value)} className="sr-only" />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration (hours)</label>
                            <input type="number" step="0.5" value={form.duration_hours} onChange={e => update('duration_hours', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Budget Estimate (₱)</label>
                            <input type="number" step="0.01" value={form.budget_estimate} onChange={e => update('budget_estimate', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start Date</label>
                            <input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Date</label>
                            <input type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Venue</label>
                            <input value={form.venue} onChange={e => update('venue', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resource Person</label>
                            <input value={form.resource_person} onChange={e => update('resource_person', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Provider</label>
                        <input value={form.provider} onChange={e => update('provider', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button type="submit" disabled={saving}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50">
                            {saving ? 'Saving...' : editData ? 'Update Program' : 'Add Program'}
                        </button>
                        <button type="button" onClick={onClose}
                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold">Cancel</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default LDProgramForm;
