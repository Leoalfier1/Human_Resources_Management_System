import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Award, Trophy, Bell, Camera, CheckCircle, Download, Loader2, Upload } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const authHeader = () => ({ 'Authorization': `Bearer ${token()}` });

const RRAwardsManagement = () => {
    const [activeTab, setActiveTab] = useState('announcement');
    const [searches, setSearches] = useState([]);
    const [searchId, setSearchId] = useState(null);
    const [awards, setAwards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ceremony, setCeremony] = useState({
        ceremony_date: '', venue: '', program_of_activities: '', guest_of_honor: ''
    });
    const [photos, setPhotos] = useState([]);
    const [generating, setGenerating] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/rr/searches`, { headers: authHeader() })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const filtered = data.filter(s => ['announced', 'completed'].includes(s.status));
                setSearches(filtered);
                if (filtered.length > 0) setSearchId(filtered[0].id);
            });
    }, []);

    const fetchAwards = useCallback(async () => {
        if (!searchId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/rr/awards?search_id=${searchId}`, { headers: authHeader() });
            if (res.ok) setAwards(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [searchId]);

    useEffect(() => { fetchAwards(); }, [fetchAwards]);

    const handleAnnounce = async () => {
        if (!window.confirm('Announce results? This will notify all awardees and change search status.')) return;
        try {
            const res = await fetch(`${API_BASE}/api/rr/awards/announce`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ search_id: searchId })
            });
            const data = await res.json();
            if (res.ok) { alert(`Announced ${data.count} awardee(s)!`); fetchAwards(); }
            else alert(data.message);
        } catch (e) { alert('Failed'); }
    };

    const handleMarkAwarded = async (awardId) => {
        try {
            await fetch(`${API_BASE}/api/rr/awards/${awardId}/mark-awarded`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ awarded_at: new Date().toISOString().split('T')[0] })
            });
            fetchAwards();
        } catch (e) { alert('Failed'); }
    };

    const handleGenerateCert = async (awardId) => {
        setGenerating(awardId);
        try {
            const res = await fetch(`${API_BASE}/api/rr/awards/${awardId}/generate-certificate`, {
                method: 'POST', headers: authHeader()
            });
            if (res.ok) { alert('Certificate generated!'); fetchAwards(); }
            else { const err = await res.json(); alert(err.message); }
        } catch (e) { alert('Failed'); }
        finally { setGenerating(null); }
    };

    const handleSaveCeremony = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/rr/ceremony`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ search_id: searchId, ...ceremony })
            });
            if (res.ok) alert('Ceremony details saved!');
            else { const err = await res.json(); alert(err.message); }
        } catch (e) { alert('Failed'); }
    };

    const handleUploadPhotos = async () => {
        if (photos.length === 0) return;
        const formData = new FormData();
        photos.forEach(p => formData.append('photos', p));
        formData.append('search_id', searchId);
        try {
            const res = await fetch(`${API_BASE}/api/rr/ceremony/upload-photos`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }, body: formData
            });
            if (res.ok) alert('Photos uploaded!');
            else { const err = await res.json(); alert(err.message); }
        } catch (e) { alert('Failed'); }
    };

    if (loading) {
        return <div className="p-20 text-center animate-pulse font-black text-slate-400">Loading Awards...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-rose-500 p-2 rounded-xl">
                    <Award size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">Awards & Ceremony</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Steps 6 & 7</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <select value={searchId || ''} onChange={e => setSearchId(parseInt(e.target.value))}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-rose-500">
                    <option value="">Select Search</option>
                    {searches.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-2 flex gap-1">
                <button onClick={() => setActiveTab('announcement')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'announcement' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'}`}>
                    <Bell size={16} /> Announcement
                </button>
                <button onClick={() => setActiveTab('ceremony')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'ceremony' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'}`}>
                    <Camera size={16} /> Ceremony
                </button>
            </div>

            {activeTab === 'announcement' && (
                <div className="space-y-4">
                    <button onClick={handleAnnounce} disabled={awards.some(a => !a.announced_at)}
                        className="flex items-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 disabled:opacity-50 shadow-md">
                        <Bell size={14} /> {awards.some(a => a.announced_at) ? 'Re-Announce Results' : 'Announce Results'}
                    </button>

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Awardee</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Award Title</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Announced</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Awarded</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Certificate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {awards.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No awards yet</td></tr>
                                ) : (
                                    awards.map(a => (
                                        <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-sm font-bold text-[#1B3A6B]">{a.user_name}</td>
                                            <td className="px-6 py-4 text-xs text-slate-700">{a.award_title}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500">{a.category_name}</td>
                                            <td className="px-6 py-4">
                                                {a.announced_at ? (
                                                    <span className="text-emerald-600 text-[10px] font-bold">
                                                        <CheckCircle size={12} className="inline mr-1" /> {new Date(a.announced_at).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[10px]">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {a.is_awarded ? (
                                                    <span className="text-emerald-600 text-[10px] font-bold"><CheckCircle size={12} className="inline mr-1" /> Awarded</span>
                                                ) : (
                                                    <button onClick={() => handleMarkAwarded(a.id)}
                                                        className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-[10px] font-bold hover:bg-rose-200">
                                                        Mark Awarded
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {a.certificate_path ? (
                                                    <a href={`${API_BASE.replace('/api', '')}/${a.certificate_path}`} target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-[10px] font-bold">
                                                        <Download size={12} /> View
                                                    </a>
                                                ) : (
                                                    <button onClick={() => handleGenerateCert(a.id)} disabled={generating === a.id}
                                                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-xl text-[10px] font-bold hover:bg-purple-200 disabled:opacity-50">
                                                        {generating === a.id ? <Loader2 size={12} className="animate-spin" /> : 'Generate PDF'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'ceremony' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Ceremony Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</label>
                                <input type="date" value={ceremony.ceremony_date} onChange={e => setCeremony({ ...ceremony, ceremony_date: e.target.value })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Venue</label>
                                <input value={ceremony.venue} onChange={e => setCeremony({ ...ceremony, venue: e.target.value })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Program of Activities</label>
                                <textarea value={ceremony.program_of_activities} onChange={e => setCeremony({ ...ceremony, program_of_activities: e.target.value })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-500" rows={4} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Guest of Honor</label>
                                <input value={ceremony.guest_of_honor} onChange={e => setCeremony({ ...ceremony, guest_of_honor: e.target.value })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-500" />
                            </div>
                            <button onClick={handleSaveCeremony}
                                className="px-4 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 shadow-md">
                                Save Ceremony Details
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Upload Ceremony Photos</h3>
                        <input type="file" multiple accept="image/*" onChange={e => setPhotos([...e.target.files])}
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100" />
                        {photos.length > 0 && (
                            <p className="text-[10px] text-slate-500 mt-2">{photos.length} photo(s) selected</p>
                        )}
                        <button onClick={handleUploadPhotos} disabled={photos.length === 0}
                            className="mt-4 flex items-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 disabled:opacity-50 shadow-md">
                            <Upload size={14} /> Upload Photos
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RRAwardsManagement;
