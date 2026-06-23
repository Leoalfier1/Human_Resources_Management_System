import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Eye, Pencil, Info, Loader2, AlertCircle } from 'lucide-react';
import { FileDropzone, PublishToggles } from './FormExtras';

const RSPVacancyPosting = () => {
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // 1. Form State
    const [formData, setFormData] = useState({
        position_title: '', 
        item_number: '', 
        salary_grade: 'SG-1',
        assigned_school: '', 
        no_of_vacancies: 1, 
        posting_date: new Date().toISOString().split('T')[0],
        minimum_qualifications: '', 
        publish_division_website: false,
        publish_facebook: false, 
        publish_bulletin: false
    });
    
    const [memoFile, setMemoFile] = useState(null);
    const [errors, setErrors] = useState({});

    // 2. Fetch Vacancies from Backend
    const fetchVacancies = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/rsp/vacancies', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setVacancies(data);
        } catch (e) { 
            console.error("Fetch Error:", e); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchVacancies(); }, []);

    // 3. Handle Submit (Publish)
    const handlePublish = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    // 1. VALIDATION: Read directly from current state
    // We check for 'true' as a boolean here because React state holds booleans
    const hasChannel = formData.publish_division_website || 
                       formData.publish_facebook || 
                       formData.publish_bulletin;

    if (!hasChannel) {
        setErrors({ server: "Select at least one publishing channel." });
        setSubmitting(false);
        // Scroll to error if needed
        return;
    }

    // 2. PAYLOAD CONSTRUCTION
    const data = new FormData();
    
    // Append text fields
    data.append('position_title', formData.position_title);
    data.append('item_number', formData.item_number);
    data.append('salary_grade', formData.salary_grade);
    data.append('assigned_school', formData.assigned_school);
    data.append('no_of_vacancies', formData.no_of_vacancies);
    data.append('posting_date', formData.posting_date);
    data.append('minimum_qualifications', formData.minimum_qualifications);
    
    // 3. FIX: Explicitly send booleans as strings for Multer/Backend
    data.append('publish_division_website', formData.publish_division_website ? 'true' : 'false');
    data.append('publish_facebook', formData.publish_facebook ? 'true' : 'false');
    data.append('publish_bulletin', formData.publish_bulletin ? 'true' : 'false');

    if (memoFile) {
        data.append('division_memorandum', memoFile);
    }

    // --- LOG CHECK (Step 4 of your plan) ---
    // console.log("Final Payload Check:", Object.fromEntries(data.entries()));

    try {
        const res = await fetch('http://localhost:5000/api/rsp/vacancies', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: data
        });
        
        const result = await res.json();
        if (res.ok) {
            alert("Vacancy posted successfully!");
            setView('list');
            fetchVacancies();
        } else {
            setErrors({ server: result.message });
        }
    } catch (e) {
        setErrors({ server: "Connection error" });
    } finally {
        setSubmitting(false);
    }
};

    return (
        <div className="space-y-6 select-none">
            {/* PAGE HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-[#1B3A6B] uppercase tracking-tight italic">Vacancy Posting</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Stage 1 of RSP — 10 calendar day application window</p>
                </div>
                {view === 'list' && (
                    <button 
                        onClick={() => setView('form')}
                        className="bg-[#1B3A6B] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-[#D6402F] transition-all"
                    >
                        <Plus size={18} /> Post New Vacancy
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === 'form' ? (
                    <motion.div 
                        key="form"
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }} 
                        className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden"
                    >
                        <div className="bg-[#1B3A6B] p-8 text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight italic">Create New Vacant Position Notice</h3>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest opacity-80">Division Memorandum will be auto-generated upon publication</p>
                        </div>
                        
                        <form onSubmit={handlePublish} className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Left Column */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Position Title *</label>
                                    <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1B3A6B] outline-none" placeholder="e.g. Teacher III (Mathematics)" value={formData.position_title} onChange={e => setFormData({...formData, position_title: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Item Number *</label>
                                        <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="e.g. 12345" value={formData.item_number} onChange={e => setFormData({...formData, item_number: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Salary Grade</label>
                                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formData.salary_grade} onChange={e => setFormData({...formData, salary_grade: e.target.value})}>
                                            {[...Array(33)].map((_, i) => <option key={i} value={`SG-${i+1}`}>SG-{i+1}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Assigned School / Station *</label>
                                    <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="e.g. Dapitan City National High School" value={formData.assigned_school} onChange={e => setFormData({...formData, assigned_school: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">No. of Vacancies</label>
                                        <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formData.no_of_vacancies} onChange={e => setFormData({...formData, no_of_vacancies: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Posting Date *</label>
                                        <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formData.posting_date} onChange={e => setFormData({...formData, posting_date: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Minimum Qualifications *</label>
                                    <textarea required rows="4" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="List qualification standards..." value={formData.minimum_qualifications} onChange={e => setFormData({...formData, minimum_qualifications: e.target.value})} />
                                </div>
                                <FileDropzone file={memoFile} setFile={setMemoFile} />
                                <div>
                                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Publish To *</label>
                                    <PublishToggles 
    values={formData} 
    // FIX: Functional state update to prevent mutation
    onChange={(id, val) => setFormData(prev => ({ ...prev, [id]: val }))} 
/>
                                </div>
                            </div>

                            {/* Form Footer Actions */}
                            <div className="lg:col-span-2 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Info size={16} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Application window: 10 calendar days from posting date</p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setView('list')} 
                                        className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting} 
                                        className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-[#1B3A6B] text-white shadow-lg flex items-center gap-2 hover:bg-[#162E55] transition-all disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Eye size={18} /> Preview & Publish</>}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Error Message Display */}
                            {errors.server && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-red-50 p-3 rounded-xl border border-red-200">
                                    <p className="text-center text-red-600 text-xs font-bold flex items-center justify-center gap-2">
                                        <AlertCircle size={16}/> {errors.server}
                                    </p>
                                </motion.div>
                            )}
                        </form>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="list"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden"
                    >
                        {/* Table Header */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-[#1B3A6B] uppercase tracking-tight italic">Posted Vacancies</h3>
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">
                                {vacancies.length} total
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {vacancies.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
                                        <Clock size={32} />
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No vacancies posted yet</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <tr>
                                            <th className="px-8 py-4">Ref No.</th>
                                            <th className="px-4 py-4">Position Title</th>
                                            <th className="px-4 py-4">School</th>
                                            <th className="px-4 py-4">No. Vacan.</th>
                                            <th className="px-4 py-4">Deadline</th>
                                            <th className="px-4 py-4">Status</th>
                                            <th className="px-8 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {vacancies.map((v) => (
                                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-5 font-black text-[#1B3A6B] text-sm">{v.ref_no}</td>
                                                <td className="px-4 py-5 font-black text-[#1B3A6B] text-sm">{v.position_title}</td>
                                                <td className="px-4 py-5 text-[#1B3A6B] text-xs font-bold underline opacity-70 cursor-pointer">{v.assigned_school}</td>
                                                <td className="px-4 py-5 font-bold text-slate-500 text-sm">{v.no_of_vacancies}</td>
                                                <td className="px-4 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-600">{new Date(v.deadline_date).toLocaleDateString()}</span>
                                                        <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${v.days_left < 0 ? 'text-slate-400' : v.days_left <= 4 ? 'text-red-500' : 'text-slate-400'}`}>
                                                            <Clock size={10} /> {v.days_left < 0 ? 'Closed' : `${v.days_left}d left`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full tracking-widest ${v.computed_status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {v.computed_status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="p-2 text-slate-300 hover:bg-[#1B3A6B] hover:text-white rounded-lg transition-all shadow-sm"><Eye size={16} /></button>
                                                        <button className="p-2 text-slate-300 hover:bg-[#1B3A6B] hover:text-white rounded-lg transition-all shadow-sm"><Pencil size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RSPVacancyPosting;