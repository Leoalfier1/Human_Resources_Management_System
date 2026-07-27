import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Trophy, Loader2 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const DEFAULT_CATEGORIES = [
    { category_name: 'Outstanding Teacher (Elementary/Secondary)', category_level: 'division', position_type: 'teaching', max_awardees: 1 },
    { category_name: 'Outstanding Administrative Personnel', category_level: 'division', position_type: 'non_teaching', max_awardees: 1 },
    { category_name: 'Outstanding Teaching-Related Personnel', category_level: 'division', position_type: 'teaching_related', max_awardees: 1 },
];

const RRSearchForm = ({ onClose, onSaved }) => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        school_year: new Date().getFullYear().toString(),
        search_type: '',
        target_position_type: 'all',
        nomination_start: '',
        nomination_end: '',
        evaluation_start: '',
        evaluation_end: '',
        ceremony_date: '',
    });
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES.map(c => ({ ...c })));
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCategoryChange = (i, field, value) => {
        const updated = [...categories];
        updated[i] = { ...updated[i], [field]: value };
        setCategories(updated);
    };

    const addCategory = () => {
        setCategories([...categories, { category_name: '', category_level: 'division', position_type: 'all', max_awardees: 1 }]);
    };

    const removeCategory = (i) => {
        setCategories(categories.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/rr/searches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ ...form, categories })
            });
            if (res.ok) {
                onSaved();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to create search');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-[2.5rem] z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500 p-2 rounded-xl">
                            <Trophy size={18} className="text-white" />
                        </div>
                        <h3 className="font-black text-lg text-[#1B3A6B] uppercase">Create R&R Search</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Search Title</label>
                            <input name="title" value={form.title} onChange={handleChange} required
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
                            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">School Year</label>
                            <input name="school_year" value={form.school_year} onChange={handleChange} required
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Search Type</label>
                            <input name="search_type" value={form.search_type} onChange={handleChange} required placeholder="e.g. Search for Outstanding Teachers"
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Position Type</label>
                            <select name="target_position_type" value={form.target_position_type} onChange={handleChange}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500 bg-white">
                                <option value="all">All</option>
                                <option value="teaching">Teaching</option>
                                <option value="non_teaching">Non-Teaching</option>
                                <option value="teaching_related">Teaching-Related</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ceremony Date</label>
                            <input type="date" name="ceremony_date" value={form.ceremony_date} onChange={handleChange}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nomination Start</label>
                            <input type="date" name="nomination_start" value={form.nomination_start} onChange={handleChange}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nomination End</label>
                            <input type="date" name="nomination_end" value={form.nomination_end} onChange={handleChange}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Evaluation Start</label>
                            <input type="date" name="evaluation_start" value={form.evaluation_start} onChange={handleChange}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Evaluation End</label>
                            <input type="date" name="evaluation_end" value={form.evaluation_end} onChange={handleChange}
                                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-500" />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-5">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Award Categories</label>
                            <button type="button" onClick={addCategory}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-bold hover:bg-amber-100">
                                <Plus size={12} /> Add
                            </button>
                        </div>
                        <div className="space-y-3">
                            {categories.map((cat, i) => (
                                <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <input placeholder="Category name" value={cat.category_name}
                                            onChange={e => handleCategoryChange(i, 'category_name', e.target.value)}
                                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 bg-white" />
                                        <div className="flex gap-2">
                                            <select value={cat.category_level}
                                                onChange={e => handleCategoryChange(i, 'category_level', e.target.value)}
                                                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-amber-500">
                                                <option value="school">School</option>
                                                <option value="division">Division</option>
                                                <option value="regional">Regional</option>
                                                <option value="national">National</option>
                                            </select>
                                            <select value={cat.position_type}
                                                onChange={e => handleCategoryChange(i, 'position_type', e.target.value)}
                                                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-amber-500">
                                                <option value="all">All</option>
                                                <option value="teaching">Teaching</option>
                                                <option value="non_teaching">Non-Teaching</option>
                                                <option value="teaching_related">Teaching-Related</option>
                                            </select>
                                            <input type="number" min="1" value={cat.max_awardees}
                                                onChange={e => handleCategoryChange(i, 'max_awardees', parseInt(e.target.value) || 1)}
                                                className="w-16 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 bg-white" title="Max awardees" />
                                        </div>
                                    </div>
                                    {categories.length > 1 && (
                                        <button type="button" onClick={() => removeCategory(i)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose}
                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-200 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 shadow-md transition-all">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
                            Create Search
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default RRSearchForm;
