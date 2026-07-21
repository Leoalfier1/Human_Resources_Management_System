import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, X, Building2, GraduationCap } from 'lucide-react';
import { API_BASE } from '../../utils/api';

const inputClass = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none';
const labelClass = 'text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1';

const SchoolsOffices = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', type: 'school', district: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (typeFilter) params.set('type', typeFilter);
            const res = await fetch(`${API_BASE}/api/personnel/schools-offices?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setRows(await res.json());
        } catch (_) { /* silent */ }
        finally { setLoading(false); }
    }, [search, typeFilter]);

    useEffect(() => { fetchRows(); }, [fetchRows]);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', type: 'school', district: '' });
        setMsg(null);
        setModalOpen(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({ name: row.name, type: row.type, district: row.district || '' });
        setMsg(null);
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return setMsg({ type: 'error', text: 'Name is required.' });
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const url = editing
                ? `${API_BASE}/api/personnel/schools-offices/${editing.id}`
                : `${API_BASE}/api/personnel/schools-offices`;
            const res = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) return setMsg({ type: 'error', text: data.message });
            setModalOpen(false);
            fetchRows();
        } catch (_) {
            setMsg({ type: 'error', text: 'Cannot reach server.' });
        } finally { setSaving(false); }
    };

    const handleToggle = async (row) => {
        if (row.is_active && row.employee_count > 0) {
            setMsg({ type: 'error', text: `Cannot deactivate "${row.name}" — ${row.employee_count} employee(s) assigned. Reassign them first.` });
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/personnel/schools-offices/${row.id}/toggle-active`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) return setMsg({ type: 'error', text: data.message });
            fetchRows();
        } catch (_) {
            setMsg({ type: 'error', text: 'Cannot reach server.' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Schools & Offices</h2>
                    <p className="text-xs font-bold text-slate-400">Master reference table for employee locations</p>
                </div>
                <button onClick={openAdd} className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-[#162E55] flex items-center gap-2">
                    <Plus size={16} /> Add New
                </button>
            </div>

            {msg && (
                <div className={`px-4 py-3 rounded-xl text-xs font-bold ${msg.type === 'error' ? 'bg-red-50 text-[#D6402F] border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                    {msg.text}
                    <button onClick={() => setMsg(null)} className="float-right ml-4 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                </div>
            )}

            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or district..."
                        className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none" />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none">
                    <option value="">All Types</option>
                    <option value="school">Schools</option>
                    <option value="office">Offices</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-sm font-bold text-slate-400">No records found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">District</th>
                                    <th className="p-4 text-center">Employees</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => (
                                    <tr key={row.id} className="border-b border-slate-50 text-sm hover:bg-slate-50">
                                        <td className="p-4 font-bold text-slate-700 flex items-center gap-2">
                                            {row.type === 'school' ? <GraduationCap size={14} className="text-blue-500 shrink-0" /> : <Building2 size={14} className="text-violet-500 shrink-0" />}
                                            {row.name}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${row.type === 'school' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600">{row.district || '—'}</td>
                                        <td className="p-4 text-center font-bold text-slate-700">{row.employee_count}</td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${row.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {row.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEdit(row)} className="text-[#1B3A6B] hover:text-[#D6402F] transition-colors" title="Edit">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleToggle(row)}
                                                    className={`text-[10px] font-black uppercase px-3 py-1 rounded-xl transition-colors ${row.is_active ? 'text-[#D6402F] hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                    title={row.is_active ? 'Deactivate' : 'Reactivate'}>
                                                    {row.is_active ? 'Deactivate' : 'Reactivate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4" onClick={() => setModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">{editing ? 'Edit' : 'Add'} Record</h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <p className={labelClass}>Name</p>
                                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} autoFocus />
                            </div>
                            <div>
                                <p className={labelClass}>Type</p>
                                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, district: e.target.value === 'office' ? '' : f.district }))} className={inputClass}>
                                    <option value="school">School</option>
                                    <option value="office">Office</option>
                                </select>
                            </div>
                            {form.type === 'school' && (
                                <div>
                                    <p className={labelClass}>District</p>
                                    <input type="text" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className={inputClass} placeholder="e.g. Dapitan City Central" />
                                </div>
                            )}
                            {msg && msg.type === 'error' && (
                                <p className="text-xs font-bold text-[#D6402F]">{msg.text}</p>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={saving} className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-[#162E55] disabled:opacity-50">
                                    {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                                </button>
                                <button type="button" onClick={() => setModalOpen(false)} className="border border-slate-200 text-slate-500 rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-slate-50">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolsOffices;
