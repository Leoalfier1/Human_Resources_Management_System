import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Send, Printer, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const ADJECTIVAL_MAP = [
    { min: 4.5, max: 5.0, label: 'Outstanding' },
    { min: 3.5, max: 4.49, label: 'Very Satisfactory' },
    { min: 2.5, max: 3.49, label: 'Satisfactory' },
    { min: 1.5, max: 2.49, label: 'Unsatisfactory' },
    { min: 1.0, max: 1.49, label: 'Poor' },
];

function computeAdjectival(num) {
    if (num == null) return '—';
    for (const r of ADJECTIVAL_MAP) {
        if (num >= r.min && num <= r.max) return r.label;
    }
    return '—';
}

const IPCRFForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [commitment, setCommitment] = useState(null);
    const [targets, setTargets] = useState([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const fetchCommitment = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/pm/commitments/${id}`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setCommitment(data);
                setTargets(data.targets || []);
            }
        } catch (e) { console.error(e); }
    }, [id]);

    useEffect(() => { if (id) fetchCommitment(); }, [id, fetchCommitment]);

    const updateTarget = (index, field, value) => {
        const updated = [...targets];
        updated[index] = { ...updated[index], [field]: value };
        if (['q1_rating', 'q2_rating', 'q3_rating', 'q4_rating'].includes(field)) {
            const q1 = parseFloat(updated[index].q1_rating) || 0;
            const q2 = parseFloat(updated[index].q2_rating) || 0;
            const q3 = parseFloat(updated[index].q3_rating) || 0;
            const q4 = parseFloat(updated[index].q4_rating) || 0;
            const nonZero = [q1, q2, q3, q4].filter(v => v > 0);
            updated[index].average_rating = nonZero.length > 0 ? Math.round((nonZero.reduce((a, b) => a + b, 0) / nonZero.length) * 100) / 100 : 0;
        }
        setTargets(updated);
    };

    const addTarget = () => {
        setTargets([...targets, { kra_label: '', mfo_label: '', success_indicator: '', weight: 0, q1_rating: null, q2_rating: null, q3_rating: null, q4_rating: null, average_rating: null, means_of_verification: '', remarks: '' }]);
    };

    const removeTarget = (index) => {
        setTargets(targets.filter((_, i) => i !== index));
    };

    const totalWeight = targets.reduce((s, t) => s + parseFloat(t.weight || 0), 0);
    const weightedAvg = totalWeight > 0
        ? Math.round((targets.reduce((s, t) => s + (parseFloat(t.weight || 0) * (parseFloat(t.average_rating || 0) / 100)), 0) / totalWeight) * 100 * 100) / 100
        : 0;

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/pm/commitments/${id}`, {
                method: 'PATCH', headers: headers(), body: JSON.stringify({ targets })
            });
            if (res.ok) setMessage('Saved successfully');
            else setMessage('Save failed');
        } catch (e) { setMessage('Error saving'); }
        finally { setSaving(false); setTimeout(() => setMessage(''), 3000); }
    };

    const handleSubmit = async () => {
        if (totalWeight !== 100 && window.confirm(`Total weight is ${totalWeight}%. Should be 100%. Continue?`)) return;
        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/pm/commitments/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ targets }) });
            const res = await fetch(`${API_BASE}/api/pm/commitments/${id}/submit`, { method: 'POST', headers: headers() });
            if (res.ok) { setMessage('Submitted for rating'); fetchCommitment(); }
        } catch (e) { setMessage('Submit failed'); }
        finally { setSaving(false); setTimeout(() => setMessage(''), 3000); }
    };

    if (!id) {
        return (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center">
                <p className="text-slate-500 font-bold">Select a commitment from Phase 1 — Planning to view/edit form.</p>
            </div>
        );
    }

    if (!commitment) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>;

    const isReadonly = commitment.status === 'rated' || commitment.status === 'finalized';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/pm/planning')} className="text-slate-400 hover:text-[#1B3A6B]"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">IPCRF/OPCRF Form</h2>
                        <p className="text-sm text-slate-500">{commitment.full_name} · {commitment.form_type?.toUpperCase()} · {commitment.position_type === 'non_teaching' ? 'Non-Teaching' : commitment.position_type === 'teaching_related' ? 'Teaching-Related' : 'Teaching'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full border
                        ${commitment.status === 'draft' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                          commitment.status === 'submitted' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                          commitment.status === 'rated' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                          'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>{commitment.status}</span>
                    {!isReadonly && (
                        <>
                            <button onClick={handleSave} disabled={saving} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2">
                                <Save size={14} /> Save
                            </button>
                            <button onClick={handleSubmit} disabled={saving || commitment.status === 'submitted'} className="bg-[#1B3A6B] text-white px-4 py-2 rounded-2xl font-bold text-xs hover:bg-blue-900 transition-all flex items-center gap-2">
                                <Send size={14} /> Submit
                            </button>
                        </>
                    )}
                </div>
            </div>

            {message && <div className="bg-emerald-100 text-emerald-700 px-5 py-3 rounded-2xl text-sm font-bold">{message}</div>}

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-200">
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">KRA</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">MFO</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Success Indicator</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Weight (%)</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Q1</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Q2</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Q3</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Q4</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Avg</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">MOV</th>
                            <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Remarks</th>
                            {!isReadonly && <th className="pb-3 w-10"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {targets.map((t, i) => (
                            <tr key={i} className="border-b border-slate-50">
                                <td className="py-2">
                                    <input value={t.kra_label || ''} onChange={e => updateTarget(i, 'kra_label', e.target.value)}
                                        className="w-40 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-[#1B3A6B]" disabled={isReadonly} />
                                </td>
                                <td className="py-2">
                                    <input value={t.mfo_label || ''} onChange={e => updateTarget(i, 'mfo_label', e.target.value)}
                                        className="w-32 px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#1B3A6B]" disabled={isReadonly} />
                                </td>
                                <td className="py-2">
                                    <input value={t.success_indicator || ''} onChange={e => updateTarget(i, 'success_indicator', e.target.value)}
                                        className="w-40 px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#1B3A6B]" disabled={isReadonly} />
                                </td>
                                <td className="py-2 text-center">
                                    <input type="number" step="0.01" min="0" max="100" value={t.weight || ''} onChange={e => updateTarget(i, 'weight', e.target.value)}
                                        className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-center outline-none focus:border-[#1B3A6B]" disabled={isReadonly} />
                                </td>
                                {['q1_rating', 'q2_rating', 'q3_rating', 'q4_rating'].map(q => (
                                    <td key={q} className="py-2 text-center">
                                        <input type="number" step="0.01" min="0" max="5" value={t[q] || ''} onChange={e => updateTarget(i, q, e.target.value)}
                                            className="w-14 px-1 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-center outline-none focus:border-[#1B3A6B]" disabled={isReadonly} />
                                    </td>
                                ))}
                                <td className="py-2 text-center font-bold text-[#1B3A6B]">{t.average_rating != null ? t.average_rating.toFixed(2) : '—'}</td>
                                <td className="py-2">
                                    <input value={t.means_of_verification || ''} onChange={e => updateTarget(i, 'means_of_verification', e.target.value)}
                                        className="w-32 px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#1B3A6B]" disabled={isReadonly} />
                                </td>
                                <td className="py-2">
                                    <input value={t.remarks || ''} onChange={e => updateTarget(i, 'remarks', e.target.value)}
                                        className="w-28 px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#1B3A6B]" disabled={isReadonly} />
                                </td>
                                {!isReadonly && (
                                    <td className="py-2 text-center">
                                        <button onClick={() => removeTarget(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!isReadonly && (
                    <button onClick={addTarget} className="mt-4 text-sm font-bold text-[#1B3A6B] hover:text-blue-800 flex items-center gap-2">
                        <Plus size={16} /> Add KRA
                    </button>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Weight</p>
                        <p className={`text-2xl font-black ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-600'}`}>{totalWeight.toFixed(2)}%</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weighted Avg Rating</p>
                        <p className="text-2xl font-black text-[#1B3A6B]">{weightedAvg.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjectival Rating</p>
                        <p className="text-2xl font-black text-[#1B3A6B]">{computeAdjectival(weightedAvg)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <p className="text-2xl font-black text-[#1B3A6B] uppercase">{commitment.status}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IPCRFForm;
