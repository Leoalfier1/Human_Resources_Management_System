import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const DEFAULT_TEACHING_QUESTIONS = [
    { question_text: 'Rate your competency in Content Knowledge', question_type: 'rating', category: 'Teaching', is_required: true },
    { question_text: 'Rate your competency in Classroom Management', question_type: 'rating', category: 'Teaching', is_required: true },
    { question_text: 'Rate your competency in Assessment', question_type: 'rating', category: 'Teaching', is_required: true },
    { question_text: 'What training topics do you need most?', question_type: 'text', category: 'Teaching', is_required: true },
    { question_text: 'List challenges in your current teaching assignment', question_type: 'text', category: 'Teaching', is_required: false },
];

/**
 * TODO(product-owner): confirm DEFAULT_TEACHINGRELATED_QUESTIONS content.
 * Currently reuses non-teaching questions as a starting point.
 */
const DEFAULT_TEACHINGRELATED_QUESTIONS = [
    { question_text: 'Rate your proficiency in MS Office tools', question_type: 'rating', category: 'Teaching-Related', is_required: true },
    { question_text: 'Rate your competency in records management', question_type: 'rating', category: 'Teaching-Related', is_required: true },
    { question_text: 'Rate your communication skills', question_type: 'rating', category: 'Teaching-Related', is_required: true },
    { question_text: 'What skills do you need to develop for your role?', question_type: 'text', category: 'Teaching-Related', is_required: true },
    { question_text: 'What are your biggest work challenges?', question_type: 'text', category: 'Teaching-Related', is_required: false },
];

const DEFAULT_NONTEACHING_QUESTIONS = [
    { question_text: 'Rate your proficiency in MS Office tools', question_type: 'rating', category: 'Admin', is_required: true },
    { question_text: 'Rate your competency in records management', question_type: 'rating', category: 'Admin', is_required: true },
    { question_text: 'Rate your communication skills', question_type: 'rating', category: 'Admin', is_required: true },
    { question_text: 'What administrative skills do you need to develop?', question_type: 'text', category: 'Admin', is_required: true },
    { question_text: 'What are your biggest work challenges?', question_type: 'text', category: 'Admin', is_required: false },
];

const emptyQuestion = () => ({ question_text: '', question_type: 'text', options: '', category: '', is_required: true });

const LDTNAFormBuilder = ({ editForm, onClose }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [schoolYear, setSchoolYear] = useState(new Date().getFullYear() + '-' + (new Date().getFullYear() + 1));
    const [targetType, setTargetType] = useState('all');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [questions, setQuestions] = useState([emptyQuestion()]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editForm) {
            setTitle(editForm.title || '');
            setDescription(editForm.description || '');
            setSchoolYear(editForm.school_year || '');
            setTargetType(editForm.target_position_type || 'all');
            setDeadlineDate(editForm.deadline_date ? editForm.deadline_date.substring(0, 10) : '');
            if (editForm.questions?.length > 0) {
                setQuestions(editForm.questions.map(q => ({
                    question_text: q.question_text,
                    question_type: q.question_type || 'text',
                    options: q.options ? (typeof q.options === 'string' ? q.options : Array.isArray(q.options) ? q.options.join(', ') : '') : '',
                    category: q.category || '',
                    is_required: q.is_required !== false,
                })));
            }
        }
    }, [editForm]);

    const handleTargetChange = (val) => {
        setTargetType(val);
        if (!editForm) {
            if (val === 'teaching') setQuestions(DEFAULT_TEACHING_QUESTIONS.map(q => ({ ...q })));
            else if (val === 'non_teaching') setQuestions(DEFAULT_NONTEACHING_QUESTIONS.map(q => ({ ...q })));
            else if (val === 'teaching_related') setQuestions(DEFAULT_TEACHINGRELATED_QUESTIONS.map(q => ({ ...q })));
        }
    };

    const addQuestion = () => setQuestions([...questions, emptyQuestion()]);
    const removeQuestion = (i) => { if (questions.length > 1) setQuestions(questions.filter((_, idx) => idx !== i)); };
    const updateQuestion = (i, field, value) => {
        const qs = [...questions];
        qs[i] = { ...qs[i], [field]: value };
        setQuestions(qs);
    };

    const handleSave = async (status) => {
        setSaving(true);
        try {
            const payload = {
                title, description, school_year: schoolYear,
                target_position_type: targetType,
                deadline_date: deadlineDate || null,
                status,
                questions: questions.map((q, idx) => ({
                    question_text: q.question_text,
                    question_type: q.question_type,
                    options: ['multiple_choice', 'checkbox'].includes(q.question_type) && q.options
                        ? q.options.split(',').map(s => s.trim()) : null,
                    category: q.category || null,
                    is_required: q.is_required,
                    sort_order: idx + 1,
                }))
            };
            if (editForm?.id) {
                await fetch(`${API_BASE}/api/ld/tna/${editForm.id}`, {
                    method: 'PATCH', headers: headers(), body: JSON.stringify(payload)
                });
            } else {
                await fetch(`${API_BASE}/api/ld/tna`, {
                    method: 'POST', headers: headers(), body: JSON.stringify(payload)
                });
            }
            onClose();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto"
            onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] w-full max-w-3xl p-8 m-4 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-black uppercase italic text-[#1B3A6B]">
                            {editForm ? 'Edit' : 'New'} TNA Form
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Training Needs Assessment</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold mt-1" required />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">School Year</label>
                            <input value={schoolYear} onChange={e => setSchoolYear(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold mt-1" required />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" rows={2} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Position Type</label>
                            <select value={targetType} onChange={e => handleTargetChange(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1">
                                <option value="all">All Personnel</option>
                                <option value="teaching">Teaching Only</option>
                                <option value="non_teaching">Non-Teaching Only</option>
                                <option value="teaching_related">Teaching-Related Only</option>
                            </select>
                            {!editForm && (
                                <p className="text-[9px] text-amber-600 font-bold mt-1">Selecting type pre-fills default questions</p>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deadline Date</label>
                            <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mt-1" />
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div className="border-t border-slate-200 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Questions ({questions.length})
                            </label>
                            <button type="button" onClick={addQuestion}
                                className="flex items-center gap-1 text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-wider">
                                <Plus size={14} /> Add Question
                            </button>
                        </div>
                        <div className="space-y-3">
                            {questions.map((q, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <GripVertical size={14} className="text-slate-300 cursor-move" />
                                            <span className="text-[10px] font-bold text-slate-400">Q{i + 1}</span>
                                        </div>
                                        <button onClick={() => removeQuestion(i)}
                                            className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                                    </div>
                                    <input value={q.question_text} onChange={e => updateQuestion(i, 'question_text', e.target.value)}
                                        placeholder="Enter question text"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm mb-2" required />
                                    <div className="flex gap-2 flex-wrap">
                                        <select value={q.question_type} onChange={e => updateQuestion(i, 'question_type', e.target.value)}
                                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                                            <option value="text">Text</option>
                                            <option value="rating">Rating (1-5)</option>
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="checkbox">Checkbox</option>
                                        </select>
                                        <input value={q.category} onChange={e => updateQuestion(i, 'category', e.target.value)}
                                            placeholder="Category (optional)"
                                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs" />
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                            <input type="checkbox" checked={q.is_required}
                                                onChange={e => updateQuestion(i, 'is_required', e.target.checked)} />
                                            Required
                                        </label>
                                    </div>
                                    {(q.question_type === 'multiple_choice' || q.question_type === 'checkbox') && (
                                        <input value={q.options} onChange={e => updateQuestion(i, 'options', e.target.value)}
                                            placeholder="Options (comma-separated)"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-slate-200 mt-6">
                    <button onClick={() => handleSave('draft')} disabled={saving}
                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button onClick={() => handleSave('active')} disabled={saving}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save & Activate'}
                    </button>
                    <button onClick={onClose}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold hover:bg-slate-50">
                        Cancel
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default LDTNAFormBuilder;
