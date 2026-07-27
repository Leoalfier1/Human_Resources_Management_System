import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const ADJECTIVAL = [
    { min: 4.5, max: 10, label: 'Outstanding', color: 'bg-emerald-500' },
    { min: 3.5, max: 4.49, label: 'Very Satisfactory', color: 'bg-blue-500' },
    { min: 2.5, max: 3.49, label: 'Satisfactory', color: 'bg-amber-500' },
    { min: 1.5, max: 2.49, label: 'Unsatisfactory', color: 'bg-orange-500' },
    { min: 0, max: 1.49, label: 'Poor', color: 'bg-red-500' },
];

function computeAdj(num) {
    for (const r of ADJECTIVAL) {
        if (num >= r.min && num <= r.max) return r.label;
    }
    return '—';
}

const PMEvaluationPhase = () => {
    const [tab, setTab] = useState('midyear');
    const [commitments, setCommitments] = useState([]);
    const [distribution, setDistribution] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [loading, setLoading] = useState(true);
    const [rateModal, setRateModal] = useState(null);
    const [ratingValue, setRatingValue] = useState('');
    const [raterRemarks, setRaterRemarks] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = selectedPeriod ? `?period_id=${selectedPeriod}` : '';
            const [cRes, dRes, pRes] = await Promise.all([
                fetch(`${API_BASE}/api/pm/commitments/all${params}`, { headers: headers() }),
                fetch(`${API_BASE}/api/pm/ratings/distribution${params}`, { headers: headers() }),
                fetch(`${API_BASE}/api/pm/periods`, { headers: headers() }),
            ]);
            if (cRes.ok) setCommitments(await cRes.json());
            if (dRes.ok) setDistribution(await dRes.json());
            if (pRes.ok) setPeriods(await pRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selectedPeriod]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRate = async () => {
        if (!rateModal || !ratingValue) return;
        const num = parseFloat(ratingValue);
        if (num < 1 || num > 5) return alert('Rating must be between 1.000 and 5.000');
        await fetch(`${API_BASE}/api/pm/commitments/${rateModal.id}/rate`, {
            method: 'POST', headers: headers(), body: JSON.stringify({ numerical_rating: num, rater_remarks })
        });
        setRateModal(null);
        setRatingValue('');
        setRaterRemarks('');
        fetchData();
    };

    const handleFinalize = async (id) => {
        await fetch(`${API_BASE}/api/pm/commitments/${id}/finalize`, { method: 'POST', headers: headers() });
        fetchData();
    };

    const exportCSV = () => {
        const headers_row = 'Employee,Form,Type,Status,Rating,Adjectival\n';
        const csv = commitments.map(c =>
            `"${c.full_name}","${c.form_type}","${c.applicant_type}","${c.status}","${c.overall_rating || ''}","${c.adjectival_rating || ''}"`
        ).join('\n');
        const blob = new Blob([headers_row + csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'PM_Ratings.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const filtered = commitments.filter(c => {
        if (tab === 'midyear') return c.status !== 'finalized';
        return true;
    });

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" /></div>;

    const maxDist = Math.max(...distribution.map(d => d.count), 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">Phase 3 — Performance Review & Evaluation</h2>
                    <p className="text-sm text-slate-500">Rate commitments and view distribution</p>
                </div>
                <button onClick={exportCSV} className="bg-slate-100 text-slate-600 px-4 py-3 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2">
                    <Download size={14} /> Export CSV
                </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex bg-slate-100 rounded-2xl p-1">
                    {['midyear', 'year-end'].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${tab === t ? 'bg-white text-[#1B3A6B] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                    ))}
                </div>
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
                    className="bg-white px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 border border-slate-200 outline-none">
                    <option value="">All Periods</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.school_year} - {p.period_label || `Phase ${p.phase}`}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-black text-[#1B3A6B] uppercase tracking-tight mb-4">Commitments</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left">
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Form</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => (
                                    <tr key={c.id} className="border-b border-slate-50">
                                        <td className="py-3 font-bold text-[#1B3A6B]">{c.full_name}</td>
                                        <td className="py-3 text-xs uppercase font-bold">{c.form_type}</td>
                                        <td className="py-3">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border
                                                ${c.status === 'draft' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                                  c.status === 'submitted' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                                  c.status === 'rated' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                                  'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>{c.status}</span>
                                        </td>
                                        <td className="py-3 font-bold">{c.overall_rating || '—'} {c.adjectival_rating ? `(${c.adjectival_rating})` : ''}</td>
                                        <td className="py-3 flex gap-2">
                                            {c.status === 'submitted' && (
                                                <button onClick={() => setRateModal(c)}
                                                    className="bg-[#1B3A6B] text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-900 transition-all">Rate</button>
                                            )}
                                            {c.status === 'rated' && (
                                                <button onClick={() => handleFinalize(c.id)}
                                                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase hover:bg-emerald-700 transition-all">Finalize</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-black text-[#1B3A6B] uppercase tracking-tight mb-4">Distribution</h3>
                    <div className="space-y-4">
                        {distribution.map(d => (
                            <div key={d.label}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-slate-600">{d.label}</span>
                                    <span className="text-xs font-black text-[#1B3A6B]">{d.count}</span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${ADJECTIVAL.find(a => a.label === d.label)?.color || 'bg-slate-400'}`}
                                        style={{ width: `${(d.count / maxDist) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {rateModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setRateModal(null)}
                    >
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight">Rate Commitment</h3>
                                    <p className="text-sm text-slate-500">{rateModal.full_name} — {rateModal.form_type?.toUpperCase()}</p>
                                </div>
                                <button onClick={() => setRateModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Numerical Rating (1.000 - 5.000)</label>
                                    <input type="number" step="0.001" min="1" max="5" value={ratingValue} onChange={e => setRatingValue(e.target.value)}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-[#1B3A6B]" />
                                    {ratingValue && <p className="mt-2 text-sm font-bold text-[#1B3A6B]">Adjectival: {computeAdj(parseFloat(ratingValue))}</p>}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rater Remarks</label>
                                    <textarea value={raterRemarks} onChange={e => setRaterRemarks(e.target.value)} rows={3}
                                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-[#1B3A6B]" />
                                </div>
                                <button onClick={handleRate} className="w-full bg-[#1B3A6B] text-white py-3 rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all">
                                    Submit Rating
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PMEvaluationPhase;
