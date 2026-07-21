import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Clock, Eye, Pencil, Info, Loader2, AlertCircle,
    X, Download, CheckCircle2, Globe, Share2, ClipboardList,
    Trash2, FileText, Building2, Hash, Calendar, Users
} from 'lucide-react';
import { FileDropzone, PublishToggles } from './FormExtras';
import { API_BASE, SERVER_BASE } from '../../../utils/api';
import DeleteVacancyModal from './DeleteVacancyModal';
import RecentlyDeletedTable from './RecentlyDeletedTable';

const API = `${API_BASE}/api/rsp/vacancies`;
const SERVER = SERVER_BASE;

const DEFAULT_SALARY_GRADE = {
    teaching: 'SG-11',
    teaching_related: 'SG-11',
    non_teaching: 'SG-1',
};

const EMPTY_FORM = {
    position_title: '', item_number: '', salary_grade: DEFAULT_SALARY_GRADE.teaching,
    assigned_school: '', no_of_vacancies: 1,
    position_type: 'teaching',
    posting_date: new Date().toISOString().split('T')[0],
    minimum_qualifications: '',
    publish_division_website: false,
    publish_facebook: false, publish_bulletin: false
};

// ─── VIEW MODAL ────────────────────────────────────────────────────────────────
const VacancyViewModal = ({ vacancy, onClose, onEdit }) => {
    if (!vacancy) return null;

    const channels = [
        { key: 'publish_division_website', label: 'Division Website', icon: Globe },
        { key: 'publish_facebook',         label: 'Facebook Page',    icon: Share2 },
        { key: 'publish_bulletin',         label: 'Bulletin Board',   icon: ClipboardList },
    ];

    const publishedChannels = channels.filter(c => vacancy[c.key]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between rounded-t-[2.5rem] z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vacancy.ref_no}</p>
                        <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic leading-tight">{vacancy.position_title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { onClose(); onEdit(vacancy); }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#162E55] transition-all"
                        >
                            <Pencil size={14} /> Edit
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Status badge */}
                    <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest ${
                            vacancy.computed_status === 'active' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-400'
                        }`}>
                            {vacancy.computed_status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                            Stage {vacancy.current_stage || 1} of 11
                        </span>
                        {vacancy.days_left >= 0 ? (
                            <span className={`text-[10px] font-black ${vacancy.days_left <= 4 ? 'text-red-500' : 'text-slate-400'}`}>
                                <Clock size={10} className="inline mr-1" />{vacancy.days_left}d left
                            </span>
                        ) : (
                            <span className="text-[10px] font-black text-slate-400">Closed</span>
                        )}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: Hash,      label: 'Item Number',    value: vacancy.item_number },
                            { icon: Building2, label: 'Salary Grade',   value: vacancy.salary_grade },
                            { icon: Building2, label: 'Position Type',  value: vacancy.position_type === 'non_teaching' ? 'Non-Teaching' : vacancy.position_type === 'teaching_related' ? 'Teaching-Related' : 'Teaching' },
                            { icon: Building2, label: vacancy.position_type === 'non_teaching' ? 'Office/Unit' : 'School', value: vacancy.assigned_school },
                            { icon: Users,     label: 'No. of Vacancies', value: vacancy.no_of_vacancies },
                            { icon: Calendar,  label: 'Posting Date',   value: new Date(vacancy.posting_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) },
                            { icon: Calendar,  label: 'Deadline',       value: new Date(vacancy.deadline_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) },
                        ].map(row => (
                            <div key={row.label} className="bg-slate-50 rounded-2xl p-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{row.label}</p>
                                <p className="text-sm font-black text-[#1B3A6B]">{row.value || '—'}</p>
                            </div>
                        ))}
                    </div>

                    {/* Minimum Qualifications */}
                    {vacancy.minimum_qualifications && (
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Minimum Qualifications</p>
                            <p className="text-sm font-semibold text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl whitespace-pre-line">
                                {vacancy.minimum_qualifications}
                            </p>
                        </div>
                    )}

                    {/* Published Channels */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Published On</p>
                        <div className="flex flex-wrap gap-2">
                            {publishedChannels.length > 0 ? publishedChannels.map(ch => (
                                <span key={ch.key} className="flex items-center gap-1.5 bg-blue-50 text-[#1B3A6B] border border-blue-100 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                                    <CheckCircle2 size={12} className="text-emerald-500" /> {ch.label}
                                </span>
                            )) : (
                                <span className="text-[10px] font-bold text-slate-400">No channels selected</span>
                            )}
                        </div>
                    </div>

                    {/* Division Memo Download */}
                    {vacancy.division_memo_file_path && (
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Division Memorandum</p>
                            <a
                                href={`${SERVER}/${vacancy.division_memo_file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                            >
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-[#1B3A6B] truncate">
                                        {vacancy.division_memo_file_path.split('/').pop()}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400">Click to view PDF</p>
                                </div>
                                <Download size={16} className="text-slate-400 group-hover:text-[#1B3A6B] transition-colors" />
                            </a>
                        </div>
                    )}

                    {/* Applicant count */}
                    <div className="bg-[#1B3A6B] rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Total Applicants</p>
                            <p className="text-2xl font-black text-white">{vacancy.applicant_count || 0}</p>
                        </div>
                        <Users size={28} className="text-white opacity-20" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const RSPVacancyPosting = () => {
    const [view, setView] = useState('list');         // 'list' | 'form' | 'edit'
    const [activeTab, setActiveTab] = useState('posted'); // 'posted' | 'deleted'
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [viewingVacancy, setViewingVacancy] = useState(null); // modal
    const [editingVacancy, setEditingVacancy] = useState(null); // which vacancy to edit

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [memoFile, setMemoFile] = useState(null);
    const [errors, setErrors] = useState({});

    // Delete state
    const [deletingVacancy, setDeletingVacancy] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deletedCount, setDeletedCount] = useState(0);

    // ── Fetch list ──────────────────────────────────────────────────────────────
    const fetchVacancies = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setVacancies(data);
            else { console.error("Server error:", data.message); setVacancies([]); }
        } catch (e) { console.error("Fetch Error:", e); setVacancies([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchVacancies(); }, []);
    useEffect(() => { if (activeTab === 'posted' && view === 'list') fetchVacancies(); }, [activeTab]);

    // ── Open Edit ────────────────────────────────────────────────────────────────
    const openEdit = (v) => {
        setEditingVacancy(v);
        setFormData({
            position_title:           v.position_title || '',
            item_number:              v.item_number || '',
            salary_grade:             v.salary_grade || 'SG-1',
            assigned_school:          v.assigned_school || '',
            no_of_vacancies:          v.no_of_vacancies || 1,
            position_type:            v.position_type || 'teaching',
            posting_date:             v.posting_date?.split('T')[0] || new Date().toISOString().split('T')[0],
            minimum_qualifications:   v.minimum_qualifications || '',
            publish_division_website: !!v.publish_division_website,
            publish_facebook:         !!v.publish_facebook,
            publish_bulletin:         !!v.publish_bulletin,
        });
        setMemoFile(null);
        setErrors({});
        setView('edit');
    };

    // ── Open New Form ────────────────────────────────────────────────────────────
    const openNew = () => {
        setEditingVacancy(null);
        setFormData(EMPTY_FORM);
        setMemoFile(null);
        setErrors({});
        setView('form');
    };

    const handlePositionTypeChange = (position_type) => {
        setFormData(prev => ({
            ...prev,
            position_type,
            salary_grade: DEFAULT_SALARY_GRADE[position_type] || prev.salary_grade,
        }));
    };

    // ── Publish (POST) ───────────────────────────────────────────────────────────
    const handlePublish = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const hasChannel = formData.publish_division_website || formData.publish_facebook || formData.publish_bulletin;
        if (!hasChannel) { setErrors({ server: "Select at least one publishing channel." }); setSubmitting(false); return; }

        const data = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
            if (typeof v === 'boolean') data.append(k, v ? 'true' : 'false');
            else data.append(k, v);
        });
        if (memoFile) data.append('division_memorandum', memoFile);

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: data
            });
            const result = await res.json();
            if (res.ok) {
                alert(`Vacancy posted successfully! Ref: ${result.ref_no}`);
                setView('list');
                fetchVacancies();
            } else {
                setErrors({ server: result.message });
            }
        } catch (e) { setErrors({ server: "Connection error" }); }
        finally { setSubmitting(false); }
    };

    // ── Save Edit (PATCH) ────────────────────────────────────────────────────────
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/${editingVacancy.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (res.ok) {
                alert("Vacancy updated successfully.");
                setView('list');
                setEditingVacancy(null);
                fetchVacancies();
            } else {
                setErrors({ server: result.message });
            }
        } catch (e) { setErrors({ server: "Connection error" }); }
        finally { setSubmitting(false); }
    };

    // ── Soft Delete Vacancy ──────────────────────────────────────────────────────
    const handleSoftDelete = async () => {
        if (!deletingVacancy) return;
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/${deletingVacancy.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok) {
                setDeletingVacancy(null);
                fetchVacancies();
            } else {
                alert(result.message || 'Failed to delete vacancy.');
            }
        } catch (e) {
            alert('Connection error.');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ── Shared form fields ───────────────────────────────────────────────────────
    const renderForm = (onSubmit, isEdit = false) => (
        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-black text-[#1B3A6B] uppercase italic">
                            {isEdit ? `Edit Vacancy — ${editingVacancy?.ref_no}` : 'Post New Vacancy'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {isEdit ? 'Update vacancy details below' : 'Stage 1 of RSP — 10 calendar day application window'}
                        </p>
                    </div>
                </div>

                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Position Type *</label>
                                <div className="flex gap-2">
                                    {['teaching', 'non_teaching', 'teaching_related'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => handlePositionTypeChange(type)}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                                                formData.position_type === type
                                                    ? type === 'teaching'
                                                        ? 'bg-blue-50 border-[#1B3A6B] text-[#1B3A6B]'
                                                        : type === 'non_teaching'
                                                            ? 'bg-amber-50 border-amber-600 text-amber-700'
                                                            : 'bg-violet-50 border-violet-600 text-violet-700'
                                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}
                                        >
                                            {type === 'teaching' ? 'Teaching' : type === 'non_teaching' ? 'Non-Teaching' : 'Tch-Related'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {[
                                { label: 'Position Title *', key: 'position_title', type: 'text', placeholder: 'e.g. Teacher III' },
                                { label: 'Item Number *', key: 'item_number', type: 'text', placeholder: 'e.g. ITEM-001' },
                                { label: formData.position_type === 'non_teaching' ? 'Office / Unit *' : 'Assigned School / Station *', key: 'assigned_school', type: 'text', placeholder: formData.position_type === 'non_teaching' ? 'e.g. Division Office - HR Section' : 'e.g. Dapitan City National High School' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">{field.label}</label>
                                    <input
                                        type={field.type} required
                                        placeholder={field.placeholder}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-all"
                                        value={formData[field.key]}
                                        onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                                    />
                                </div>
                            ))}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Salary Grade *</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                                        value={formData.salary_grade}
                                        onChange={e => setFormData({...formData, salary_grade: e.target.value})}
                                    >
                                        {Array.from({length: 33}, (_, i) => i + 1).map(n => (
                                            <option key={n} value={`SG-${n}`}>SG-{n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">No. of Vacancies</label>
                                    <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" value={formData.no_of_vacancies} onChange={e => setFormData({...formData, no_of_vacancies: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Posting Date *</label>
                                <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none" value={formData.posting_date} onChange={e => setFormData({...formData, posting_date: e.target.value})} />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Minimum Qualifications *</label>
                                <textarea required rows="5" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]" placeholder="List qualification standards..." value={formData.minimum_qualifications} onChange={e => setFormData({...formData, minimum_qualifications: e.target.value})} />
                            </div>

                            {/* Only show memo upload on new vacancy — editing doesn't replace the file */}
                            {!isEdit && <FileDropzone file={memoFile} setFile={setMemoFile} />}
                            {isEdit && editingVacancy?.division_memo_file_path && (
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Attached Memo</p>
                                    <a
                                        href={`${SERVER}/${editingVacancy.division_memo_file_path}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-xs font-bold text-[#1B3A6B] underline truncate block"
                                    >
                                        {editingVacancy.division_memo_file_path.split('/').pop()}
                                    </a>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Publish To *</label>
                                <PublishToggles
                                    values={formData}
                                    onChange={(id, val) => setFormData(prev => ({ ...prev, [id]: val }))}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="lg:col-span-2 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Info size={16} />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Application window: 10 calendar days from posting date</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setView('list'); setEditingVacancy(null); }}
                                    className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-[#1B3A6B] text-white shadow-lg flex items-center gap-2 hover:bg-[#162E55] transition-all disabled:opacity-50"
                                >
                                    {submitting
                                        ? <Loader2 className="animate-spin" size={18} />
                                        : isEdit
                                            ? <><CheckCircle2 size={18} /> Save Changes</>
                                            : <><Eye size={18} /> Preview & Publish</>
                                    }
                                </button>
                            </div>
                        </div>

                        {errors.server && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-red-50 p-3 rounded-xl border border-red-200">
                                <p className="text-center text-red-600 text-xs font-bold flex items-center justify-center gap-2">
                                    <AlertCircle size={16}/> {errors.server}
                                </p>
                            </motion.div>
                        )}
                    </div>
                </form>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-6 select-none">
            {/* View Modal */}
            <AnimatePresence>
                {viewingVacancy && (
                    <VacancyViewModal
                        vacancy={viewingVacancy}
                        onClose={() => setViewingVacancy(null)}
                        onEdit={(v) => { setViewingVacancy(null); openEdit(v); }}
                    />
                )}
            </AnimatePresence>

            {/* Delete Vacancy Modal */}
            <AnimatePresence>
                {deletingVacancy && (
                    <DeleteVacancyModal
                        isOpen={!!deletingVacancy}
                        onClose={() => setDeletingVacancy(null)}
                        onConfirm={handleSoftDelete}
                        vacancy={deletingVacancy}
                        loading={deleteLoading}
                    />
                )}
            </AnimatePresence>

            {/* Page Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-[#1B3A6B] uppercase tracking-tight italic">Vacancy Posting</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Stage 1 of RSP — 10 calendar day application window</p>
                </div>
                {view === 'list' && activeTab === 'posted' && (
                    <button
                        onClick={openNew}
                        className="bg-[#1B3A6B] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-[#D6402F] transition-all"
                    >
                        <Plus size={18} /> Post New Vacancy
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === 'form' && renderForm(handlePublish, false)}
                {view === 'edit' && renderForm(handleSaveEdit, true)}

                {view === 'list' && (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden"
                    >
                        {/* Tab Toggle */}
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActiveTab('posted')}
                                        className={`text-[10px] font-black uppercase px-6 py-3 rounded-xl transition-all ${
                                            activeTab === 'posted'
                                                ? 'bg-[#D6402F] text-white'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        Posted Vacancies
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('deleted')}
                                        className={`text-[10px] font-black uppercase px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                                            activeTab === 'deleted'
                                                ? 'bg-[#D6402F] text-white'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        Recently Deleted
                                        {deletedCount > 0 && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                                activeTab === 'deleted' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {deletedCount}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {activeTab === 'posted' && (
                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">
                                        {vacancies.length} total
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'posted' ? (
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="p-20 text-center">
                                        <Loader2 className="animate-spin text-slate-300 mx-auto" size={32} />
                                    </div>
                                ) : vacancies.length === 0 ? (
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
                                                <th className="px-4 py-4">Type</th>
                                                <th className="px-4 py-4">School / Office</th>
                                                <th className="px-4 py-4">No. Vacan.</th>
                                                <th className="px-4 py-4">Deadline</th>
                                                <th className="px-4 py-4">Status</th>
                                                <th className="px-8 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {vacancies.map((v) => (
                                                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5 font-black text-[#1B3A6B] text-sm">{v.ref_no}</td>
                                                    <td className="px-4 py-5 font-black text-[#1B3A6B] text-sm">{v.position_title}</td>
                                                    <td className="px-4 py-5">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full tracking-widest ${
                                                            v.position_type === 'non_teaching'
                                                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                                                : v.position_type === 'teaching_related'
                                                                    ? 'bg-violet-50 text-violet-600 border border-violet-200'
                                                                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                                                        }`}>
                                                            {v.position_type === 'non_teaching' ? 'Non-Tch' : v.position_type === 'teaching_related' ? 'Tch-Rel' : 'Teaching'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-5 text-[#1B3A6B] text-xs font-bold">{v.assigned_school}</td>
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
                                                            <button
                                                                onClick={() => setViewingVacancy(v)}
                                                                title="View details"
                                                                className="p-2 text-slate-300 hover:bg-[#1B3A6B] hover:text-white rounded-lg transition-all shadow-sm"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => openEdit(v)}
                                                                title="Edit vacancy"
                                                                className="p-2 text-slate-300 hover:bg-amber-500 hover:text-white rounded-lg transition-all shadow-sm"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingVacancy(v)}
                                                                title="Delete vacancy"
                                                                className="p-2 text-slate-300 hover:bg-[#D6402F] hover:text-white rounded-lg transition-all shadow-sm"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ) : (
                            <RecentlyDeletedTable onCountChange={setDeletedCount} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RSPVacancyPosting;
