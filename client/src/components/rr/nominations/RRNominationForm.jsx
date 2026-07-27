import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Users, Loader2 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const RRNominationForm = ({ searchId, onClose, onSaved }) => {
    const [search, setSearch] = useState(null);
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({
        search_id: searchId,
        category_id: '',
        nominee_id: '',
        position_type: 'teaching',
        justification: '',
        is_self_nomination: false,
    });
    const [files, setFiles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [nomineeSearch, setNomineeSearch] = useState('');

    useEffect(() => {
        if (!searchId) return;
        fetch(`${API_BASE}/api/rr/searches/${searchId}`, { headers: authHeaders() })
            .then(r => r.ok ? r.json() : null)
            .then(d => { setSearch(d); });
        fetch(`${API_BASE}/api/auth/list-applicants`, { headers: authHeaders() })
            .then(r => r.ok ? r.json() : [])
            .then(d => setUsers(Array.isArray(d) ? d : []));
    }, [searchId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/rr/nominations`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(form)
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.message || 'Failed to submit nomination');
                return;
            }
            const data = await res.json();
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
            onSaved();
        } catch (err) {
            alert('Network error');
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(nomineeSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-[2.5rem]">
                    <h3 className="font-black text-lg text-[#1B3A6B]">Add Nomination</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Search</label>
                        <p className="mt-1 text-sm font-bold text-[#1B3A6B]">{search?.title || 'Loading...'}</p>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Award Category</label>
                        <select name="category_id" value={form.category_id} onChange={handleChange} required
                            className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-amber-500">
                            <option value="">Select Category</option>
                            {search?.categories?.map(c => (
                                <option key={c.id} value={c.id}>{c.category_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Position Type</label>
                        <select name="position_type" value={form.position_type} onChange={handleChange} required
                            className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-amber-500">
                            <option value="teaching">Teaching</option>
                            <option value="non_teaching">Non-Teaching</option>
                            <option value="teaching_related">Teaching-Related</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Search Nominee</label>
                        <input value={nomineeSearch} onChange={e => setNomineeSearch(e.target.value)}
                            placeholder="Type to search personnel..."
                            className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                            {filteredUsers.slice(0, 10).map(u => (
                                <button key={u.id} type="button" onClick={() => { setForm({ ...form, nominee_id: u.id }); setNomineeSearch(u.full_name); }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${form.nominee_id === u.id ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-50 text-slate-600'}`}>
                                    {u.full_name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Justification</label>
                        <textarea name="justification" value={form.justification} onChange={handleChange} rows={3}
                            className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Supporting Documents</label>
                        <input type="file" multiple onChange={e => setFiles([...e.target.files])}
                            className="w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                        {files.length > 0 && (
                            <p className="text-[10px] text-slate-500 mt-1">{files.length} file(s) selected</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="selfNom" checked={form.is_self_nomination}
                            onChange={e => setForm({ ...form, is_self_nomination: e.target.checked })}
                            className="text-amber-500 rounded" />
                        <label htmlFor="selfNom" className="text-xs font-semibold text-slate-600">This is a self-nomination</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose}
                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                            Submit Nomination
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default RRNominationForm;
