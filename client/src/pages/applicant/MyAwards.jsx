import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Download, CheckCircle, Clock, AlertCircle, Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/api';
import io from 'socket.io-client';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const Skeleton = () => (
    <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-200 rounded-[2.5rem]" />)}
        </div>
        <div className="h-64 bg-slate-200 rounded-[2.5rem]" />
        <div className="h-48 bg-slate-200 rounded-[2.5rem]" />
    </div>
);

const STATUS_COLORS = {
    pending: 'bg-slate-100 text-slate-600',
    eligible: 'bg-emerald-100 text-emerald-700',
    ineligible: 'bg-red-100 text-red-600',
};

const MyAwards = () => {
    const { user } = useAuth();
    const [activeSearch, setActiveSearch] = useState(null);
    const [nominations, setNominations] = useState([]);
    const [awards, setAwards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [nomForm, setNomForm] = useState({
        category_id: '', justification: '', position_type: 'teaching'
    });
    const [categories, setCategories] = useState([]);
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [searchRes, nomRes, awardRes] = await Promise.all([
                fetch(`${API_BASE}/api/rr/searches`, { headers: headers() }),
                fetch(`${API_BASE}/api/rr/nominations/my`, { headers: headers() }),
                fetch(`${API_BASE}/api/rr/awards/my`, { headers: headers() })
            ]);
            if (searchRes.ok) {
                const searches = await searchRes.json();
                const userType = user?.applicant_type || 'teaching';
                const active = searches.find(s =>
                    s.status === 'open' && (s.target_position_type === 'all' || s.target_position_type === userType)
                );
                if (active) {
                    setActiveSearch(active);
                    const detailRes = await fetch(`${API_BASE}/api/rr/searches/${active.id}`, { headers: headers() });
                    if (detailRes.ok) {
                        const detail = await detailRes.json();
                        setCategories(detail.categories || []);
                    }
                }
            }
            if (nomRes.ok) setNominations(await nomRes.json());
            if (awardRes.ok) setAwards(await awardRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);
        socket.on('rr:award:announced', () => fetchData());
        socket.on('rr:certificate:ready', () => fetchData());
        socket.on('rr:eligibility:update', () => fetchData());
        return () => socket.disconnect();
    }, [fetchData]);

    const handleSubmitNomination = async () => {
        if (!activeSearch) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/rr/nominations`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({
                    search_id: activeSearch.id,
                    category_id: parseInt(nomForm.category_id),
                    nominee_id: JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id,
                    position_type: nomForm.position_type,
                    justification: nomForm.justification,
                    is_self_nomination: true
                })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message); return; }

            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(f => formData.append('documents', f));
                formData.append('document_type', 'supporting_document');
                await fetch(`${API_BASE}/api/rr/nominations/${data.id}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token()}` },
                    body: formData
                });
            }
            setShowForm(false);
            setNomForm({ category_id: '', justification: '', position_type: 'teaching' });
            setFiles([]);
            fetchData();
        } catch (e) { alert('Network error'); }
        finally { setSubmitting(false); }
    };

    const handleDownloadCert = (awardId) => {
        window.open(`${API_BASE}/api/rr/awards/${awardId}/certificate/download`, '_blank');
    };

    if (loading) return <Skeleton />;

    const getStatusBadge = (nom) => {
        if (nom.is_awarded > 0) return { label: 'Awarded', color: 'bg-amber-100 text-amber-700' };
        if (nom.eligibility_status === 'eligible') return { label: 'Eligible', color: 'bg-emerald-100 text-emerald-700' };
        if (nom.eligibility_status === 'ineligible') return { label: 'Ineligible', color: 'bg-red-100 text-red-600' };
        return { label: 'Pending', color: 'bg-slate-100 text-slate-600' };
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-amber-500 p-2 rounded-xl">
                    <Trophy size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">My Awards & Recognition</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">R&R Module</p>
                </div>
            </div>

            {activeSearch && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-[2.5rem] p-6 text-white shadow-lg"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <AlertCircle size={16} />
                                <span className="text-xs font-bold uppercase">Nominations Open</span>
                            </div>
                            <h3 className="text-lg font-black uppercase italic">{activeSearch.title}</h3>
                            <p className="text-amber-100 text-xs mt-1">
                                {activeSearch.nomination_end ? `Deadline: ${new Date(activeSearch.nomination_end).toLocaleDateString()}` : ''}
                            </p>
                        </div>
                        <button onClick={() => setShowForm(!showForm)}
                            className="px-5 py-2.5 bg-white text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 shadow-md">
                            {showForm ? 'Cancel' : 'Nominate Yourself'}
                        </button>
                    </div>
                </motion.div>
            )}

            {showForm && activeSearch && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 overflow-hidden"
                >
                    <h3 className="font-black text-[#1B3A6B] mb-4">Self-Nomination Form</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Award Category</label>
                            <select value={nomForm.category_id} onChange={e => setNomForm({ ...nomForm, category_id: e.target.value })}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-amber-500">
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Position Type</label>
                            <select value={nomForm.position_type} onChange={e => setNomForm({ ...nomForm, position_type: e.target.value })}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-amber-500">
                                <option value="teaching">Teaching</option>
                                <option value="non_teaching">Non-Teaching</option>
                                <option value="teaching_related">Teaching-Related</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Justification</label>
                            <textarea value={nomForm.justification} onChange={e => setNomForm({ ...nomForm, justification: e.target.value })}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" rows={3} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Supporting Documents</label>
                            <input type="file" multiple onChange={e => setFiles([...e.target.files])}
                                className="w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-amber-50 file:text-amber-700" />
                        </div>
                        <button onClick={handleSubmitNomination} disabled={submitting || !nomForm.category_id}
                            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 shadow-md">
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
                            Submit Nomination
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">My Nominations</h3>
                {nominations.length === 0 ? (
                    <p className="text-center text-slate-400 py-8 text-sm font-semibold">You have no nominations yet</p>
                ) : (
                    <div className="space-y-3">
                        {nominations.map(nom => {
                            const badge = getStatusBadge(nom);
                            return (
                                <div key={nom.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-bold text-[#1B3A6B]">{nom.category_name}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{nom.search_title}</p>
                                            {nom.ineligibility_reason && (
                                                <p className="text-[10px] text-red-500 mt-1">Reason: {nom.ineligibility_reason}</p>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">My Awards</h3>
                {awards.length === 0 ? (
                    <p className="text-center text-slate-400 py-8 text-sm font-semibold">No awards yet</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {awards.map(award => (
                            <motion.div key={award.id} layout
                                className="bg-gradient-to-br from-amber-50 to-white rounded-[2.5rem] border border-amber-200 p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-500 p-2 rounded-xl">
                                            <Award size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-amber-700">{award.award_title}</h4>
                                            <p className="text-[10px] text-slate-500 font-semibold">{award.search_title} · SY {award.school_year}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${award.is_awarded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {award.is_awarded ? 'Awarded' : 'Pending'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{award.award_level}</span>
                                    {award.announced_at && (
                                        <span className="text-[9px] text-slate-400">
                                            Announced: {new Date(award.announced_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                {award.certificate_path ? (
                                    <button onClick={() => handleDownloadCert(award.id)}
                                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 shadow-sm">
                                        <Download size={14} /> Download Certificate
                                    </button>
                                ) : (
                                    <p className="mt-3 text-[10px] text-slate-400 italic">Certificate pending generation</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Award History</h3>
                </div>
                {awards.length === 0 ? (
                    <div className="p-12 text-center">
                        <Clock size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-400">No award history yet</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Year</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Award Title</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Level</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {awards.map(a => (
                                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{a.school_year}</td>
                                    <td className="px-6 py-4 text-sm text-[#1B3A6B] font-bold">{a.award_title}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{a.category_name}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{a.award_level}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold ${a.is_awarded ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {a.is_awarded ? 'Awarded' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MyAwards;
