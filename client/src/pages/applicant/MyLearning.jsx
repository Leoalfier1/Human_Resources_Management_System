import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ClipboardList, Calendar, CheckCircle, Star, Clock, Download, FileText, ArrowRight, BookOpen, Award, Target, Users, Bell, X } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
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

const MyLearning = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ldToasts, setLdToasts] = useState([]);

    // TNA form state
    const [selectedForm, setSelectedForm] = useState(null);
    const [formQuestions, setFormQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [existingResponse, setExistingResponse] = useState(null);
    const [submittingTna, setSubmittingTna] = useState(false);

    // Program detail state
    const [selectedProgram, setSelectedProgram] = useState(null);

    // Eval form state
    const [selectedEval, setSelectedEval] = useState(null);
    const [evalForm, setEvalForm] = useState({});
    const [evalQuestions, setEvalQuestions] = useState([]);
    const [evalAnswers, setEvalAnswers] = useState({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tnaRes, progRes, evalRes] = await Promise.all([
                fetch(`${API_BASE}/api/ld/tna/my/list`, { headers: headers() }),
                fetch(`${API_BASE}/api/ld/programs/my/list`, { headers: headers() }),
                fetch(`${API_BASE}/api/ld/evaluation/my`, { headers: headers() }),
            ]);
            const tnaForms = tnaRes.ok ? await tnaRes.json() : [];
            const programs = progRes.ok ? await progRes.json() : [];
            const evalForms = evalRes.ok ? await evalRes.json() : [];
            setData({ tnaForms, programs, evalForms });
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    }, []);

    const dismissLdToast = useCallback((id) => {
        setLdToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        fetchData();
        const socket = io(API_BASE);

        // Join the generic L&D broadcast room (silent data refetch)
        socket.on('ld:dashboard:update', () => fetchData());

        // Join user-specific room for targeted L&D notifications
        socket.on('connect', () => {
            if (user?.id) {
                socket.emit('join-user-room', `ld-user-${user.id}`);
            }
        });

        // Show toast when admin acts on this applicant's L&D data
        socket.on('ld:notification:applicant', (data) => {
            const id = Date.now() + Math.random();
            setLdToasts(prev => [...prev, { id, message: data.message, type: data.type || 'info' }]);
            setTimeout(() => dismissLdToast(id), 6000);
            // Also silently refresh data so the page is up-to-date
            fetchData();
        });

        return () => {
            if (user?.id) socket.emit('leave-user-room', `ld-user-${user.id}`);
            socket.disconnect();
        };
    }, [fetchData, user, dismissLdToast]);

    const openTnaForm = async (formId) => {
        const res = await fetch(`${API_BASE}/api/ld/tna/my/${formId}`, { headers: headers() });
        if (res.ok) {
            const form = await res.json();
            setSelectedForm(form);
            setFormQuestions(form.questions || []);
            setExistingResponse(form.myResponse || null);
            const ans = {};
            (form.myAnswers || []).forEach(a => {
                if (a.answer_rating) ans[`${a.question_id}_rating`] = a.answer_rating;
                if (a.answer_text) ans[`${a.question_id}_text`] = a.answer_text;
                if (a.answer_options) ans[`${a.question_id}_options`] = a.answer_options;
            });
            setAnswers(ans);
        }
    };

    const handleTnaAnswer = (questionId, type, value) => {
        setAnswers({ ...answers, [`${questionId}_${type}`]: value });
    };

    const handleSaveDraft = async () => {
        if (!selectedForm) return;
        setSubmittingTna(true);
        try {
            const ansArray = formQuestions.map(q => ({
                question_id: q.id,
                answer_text: answers[`${q.id}_text`] || null,
                answer_rating: answers[`${q.id}_rating`] || null,
                answer_options: answers[`${q.id}_options`] ? (typeof answers[`${q.id}_options`] === 'string' ? answers[`${q.id}_options`].split(',') : answers[`${q.id}_options`]) : null,
            }));
            await fetch(`${API_BASE}/api/ld/tna/my/save`, {
                method: 'PATCH', headers: headers(), body: JSON.stringify({ form_id: selectedForm.id, answers: ansArray })
            });
            alert('Draft saved!');
        } catch (err) { alert(err.message); }
        finally { setSubmittingTna(false); }
    };

    const handleSubmitTna = async () => {
        if (!selectedForm) return;
        setSubmittingTna(true);
        try {
            const ansArray = formQuestions.map(q => ({
                question_id: q.id,
                answer_text: answers[`${q.id}_text`] || null,
                answer_rating: answers[`${q.id}_rating`] || null,
                answer_options: answers[`${q.id}_options`] ? (typeof answers[`${q.id}_options`] === 'string' ? answers[`${q.id}_options`].split(',') : answers[`${q.id}_options`]) : null,
            }));
            await fetch(`${API_BASE}/api/ld/tna/my/submit`, {
                method: 'POST', headers: headers(), body: JSON.stringify({ form_id: selectedForm.id, answers: ansArray })
            });
            alert('TNA submitted successfully!');
            setSelectedForm(null);
            setActiveTab('dashboard');
            fetchData();
        } catch (err) { alert(err.message); }
        finally { setSubmittingTna(false); }
    };

    const openEvalForm = async (ef) => {
        setSelectedEval(ef);
        try {
            const res = await fetch(`${API_BASE}/api/ld/evaluation/forms/${ef.id}`, { headers: headers() });
            if (res.ok) {
                const form = await res.json();
                setEvalQuestions(form.questions || []);
                setEvalAnswers({});
            }
        } catch (e) { /* silent */ }
    };

    const handleSubmitEval = async () => {
        if (!selectedEval) return;
        try {
            const answers = evalQuestions.map(q => ({
                question_id: q.id,
                rating_value: evalAnswers[`${q.id}_rating`] || null,
                text_answer: evalAnswers[`${q.id}_text`] || null,
            }));
            await fetch(`${API_BASE}/api/ld/evaluation/submit`, {
                method: 'POST', headers: headers(), body: JSON.stringify({ eval_form_id: selectedEval.id, answers })
            });
            alert('Evaluation submitted!');
            setSelectedEval(null);
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const acknowledgeParticipation = async (attendanceId) => {
        await fetch(`${API_BASE}/api/ld/programs/my/${attendanceId}/acknowledge`, { method: 'POST', headers: headers() });
        fetchData();
    };

    const totalHoursCompleted = data?.programs?.filter(p => p.status === 'completed').reduce((s, p) => s + (parseFloat(p.duration_hours) || 0), 0) || 0;
    const TARGET_HOURS = 40;

    if (loading) return <Skeleton />;

    const tabs = [
        { key: 'dashboard', label: 'Dashboard', icon: GraduationCap },
        { key: 'tna', label: 'TNA Forms', icon: ClipboardList },
        { key: 'programs', label: 'My Programs', icon: Calendar },
        { key: 'history', label: 'History', icon: Clock },
    ];

    return (
        <div className="space-y-6 relative">
            {/* L&D Real-time Toast Notifications for Applicant */}
            <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 max-w-sm pointer-events-none">
                <AnimatePresence>
                    {ldToasts.map(toast => {
                        const toastColors = {
                            attendance: 'bg-blue-600',
                            certificate: 'bg-emerald-700',
                            material: 'bg-amber-600',
                            status: 'bg-indigo-600',
                            tna: 'bg-teal-600',
                            evaluation: 'bg-purple-600',
                            info: 'bg-slate-700',
                        };
                        const color = toastColors[toast.type] || 'bg-slate-700';
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, x: 300, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 300, scale: 0.9 }}
                                className={`${color} text-white px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 pointer-events-auto cursor-pointer`}
                                onClick={() => dismissLdToast(toast.id)}
                            >
                                <Bell size={16} className="shrink-0 mt-0.5" />
                                <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
                                <X size={14} className="shrink-0 mt-0.5 opacity-70 hover:opacity-100" />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-600 p-2 rounded-xl">
                    <GraduationCap size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic text-[#1B3A6B]">My Learning & Development</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Training Needs Assessment to Completion</p>
                </div>
            </div>

            {/* Training Hours Summary */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">My Training Hours</p>
                    <p className="text-xs font-bold text-[#1B3A6B]">{totalHoursCompleted}h / {TARGET_HOURS}h target</p>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((totalHoursCompleted / TARGET_HOURS) * 100, 100)}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                    />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-semibold">{Math.min((totalHoursCompleted / TARGET_HOURS) * 100, 100).toFixed(0)}% of annual target completed</p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-2 flex gap-1">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedForm(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === tab.key ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && !selectedForm && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-700 text-white rounded-[2.5rem] p-6">
                            <ClipboardList size={24} className="mb-2 opacity-80" />
                            <p className="text-3xl font-black">{data?.tnaForms?.filter(f => f.status !== 'submitted').length || 0}</p>
                            <p className="text-xs opacity-80 font-bold uppercase tracking-wider mt-1">Pending TNA Forms</p>
                        </div>
                        <div className="bg-amber-600 text-white rounded-[2.5rem] p-6">
                            <Calendar size={24} className="mb-2 opacity-80" />
                            <p className="text-3xl font-black">{data?.programs?.length || 0}</p>
                            <p className="text-xs opacity-80 font-bold uppercase tracking-wider mt-1">My Programs</p>
                        </div>
                        <div className="bg-emerald-600 text-white rounded-[2.5rem] p-6">
                            <Star size={24} className="mb-2 opacity-80" />
                            <p className="text-3xl font-black">{data?.evalForms?.filter(f => !f.has_submitted).length || 0}</p>
                            <p className="text-xs opacity-80 font-bold uppercase tracking-wider mt-1">Pending Evaluations</p>
                        </div>
                    </div>

                    {/* Pending TNA */}
                    {data?.tnaForms?.filter(f => f.status !== 'submitted').length > 0 && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">My TNA Forms</p>
                            <div className="space-y-2">
                                {data.tnaForms.filter(f => f.status !== 'submitted').map(f => (
                                    <button key={f.id} onClick={() => openTnaForm(f.form_id)}
                                        className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
                                        <div>
                                            <p className="text-sm font-bold text-[#1B3A6B]">{f.title}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{f.school_year} · {f.deadline_date ? `Due: ${new Date(f.deadline_date).toLocaleDateString()}` : ''}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-400" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Programs */}
                    {data?.programs?.filter(p => p.status === 'ongoing' || p.status === 'planned').length > 0 && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Upcoming Programs</p>
                            <div className="space-y-2">
                                {data.programs.filter(p => p.status === 'ongoing' || p.status === 'planned').map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-bold text-[#1B3A6B]">{p.title}</p>
                                            <p className="text-[10px] text-slate-500">{new Date(p.start_date).toLocaleDateString()} · {p.venue || ''}</p>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.status === 'ongoing' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TNA FORM FILLER */}
            {activeTab === 'tna' && selectedForm && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-black text-lg text-[#1B3A6B]">{selectedForm.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">{selectedForm.description}</p>
                        </div>
                        <button onClick={() => { setSelectedForm(null); setAnswers({}); }}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600">Back</button>
                    </div>
                    {existingResponse?.status === 'submitted' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
                            <p className="text-sm font-bold text-emerald-700">You submitted this form. You can save updates below.</p>
                        </div>
                    )}
                    <div className="space-y-6">
                        {formQuestions.map((q, i) => (
                            <div key={q.id || i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <p className="text-sm font-bold text-[#1B3A6B] mb-3">{i + 1}. {q.question_text} {q.is_required ? <span className="text-red-500">*</span> : ''}</p>
                                {q.question_type === 'text' && (
                                    <textarea value={answers[`${q.id}_text`] || ''}
                                        onChange={e => handleTnaAnswer(q.id, 'text', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" rows={3} />
                                )}
                                {q.question_type === 'rating' && (
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(r => (
                                            <button key={r} onClick={() => handleTnaAnswer(q.id, 'rating', r)}
                                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                                                    Number(answers[`${q.id}_rating`]) === r
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-white border border-slate-200 text-slate-500 hover:border-emerald-500'
                                                }`}>{r}</button>
                                        ))}
                                    </div>
                                )}
                                {q.question_type === 'multiple_choice' && (
                                    <div className="space-y-2">
                                        {(typeof q.options === 'string' ? q.options.split(',').map(s => s.trim()) : q.options || []).map(opt => (
                                            <label key={opt} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-emerald-500">
                                                <input type="radio" name={`q_${q.id}`} value={opt}
                                                    checked={answers[`${q.id}_text`] === opt}
                                                    onChange={e => handleTnaAnswer(q.id, 'text', e.target.value)}
                                                    className="text-emerald-600" />
                                                <span className="text-sm">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {q.question_type === 'checkbox' && (
                                    <div className="space-y-2">
                                        {(typeof q.options === 'string' ? q.options.split(',').map(s => s.trim()) : q.options || []).map(opt => {
                                            const current = (answers[`${q.id}_options`] || '').split(',').filter(Boolean);
                                            const checked = current.includes(opt);
                                            return (
                                                <label key={opt} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-emerald-500">
                                                    <input type="checkbox" checked={checked}
                                                        onChange={e => {
                                                            const updated = checked ? current.filter(v => v !== opt) : [...current, opt];
                                                            handleTnaAnswer(q.id, 'options', updated.join(','));
                                                        }}
                                                        className="text-emerald-600 rounded" />
                                                    <span className="text-sm">{opt}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={handleSaveDraft} disabled={submittingTna}
                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 disabled:opacity-50">
                            {submittingTna ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button onClick={handleSubmitTna} disabled={submittingTna}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50">
                            {submittingTna ? 'Submitting...' : 'Submit TNA'}
                        </button>
                    </div>
                </div>
            )}

            {/* TNA LIST (when tab is tna but no form selected) */}
            {activeTab === 'tna' && !selectedForm && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">My TNA Forms</p>
                    {(!data?.tnaForms || data.tnaForms.length === 0) ? (
                        <p className="text-center text-slate-400 py-8 text-sm font-semibold">No TNA forms assigned yet</p>
                    ) : (
                        <div className="space-y-2">
                            {data.tnaForms.map(f => (
                                <button key={f.id} onClick={() => openTnaForm(f.form_id)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left">
                                    <div>
                                        <p className="font-bold text-[#1B3A6B]">{f.title}</p>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-semibold">
                                            <span>SY {f.school_year}</span>
                                            <span>{f.question_count} questions</span>
                                            {f.deadline_date && <span>Due: {new Date(f.deadline_date).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                            f.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : f.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                        }`}>{f.status === 'submitted' ? 'Submitted' : f.status === 'draft' ? 'In Progress' : 'Not Started'}</span>
                                        <ArrowRight size={14} className="text-slate-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MY PROGRAMS TAB */}
            {activeTab === 'programs' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">My Training Programs</p>
                        {(!data?.programs || data.programs.length === 0) ? (
                            <p className="text-center text-slate-400 py-8 text-sm font-semibold">No programs assigned to you yet</p>
                        ) : (
                            <div className="space-y-3">
                                {data.programs.map(p => (
                                    <div key={p.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-bold text-[#1B3A6B]">{p.title}</p>
                                                <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-slate-500 font-semibold">
                                                    <span className={`px-2 py-0.5 rounded-full ${
                                                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        p.status === 'ongoing' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>{p.status}</span>
                                                    <span>{p.methodology}</span>
                                                    {p.start_date && <span>{new Date(p.start_date).toLocaleDateString()}</span>}
                                                    {p.duration_hours && <span>{p.duration_hours}h</span>}
                                                    <span className={`px-2 py-0.5 rounded-full ${
                                                        p.attendance_status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                        p.attendance_status === 'excused' ? 'bg-amber-100 text-amber-700' :
                                                        p.attendance_status === 'absent' ? 'bg-red-100 text-red-600' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>Attendance: {p.attendance_status || 'Pending'}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                {p.attendance_status === 'present' && !p.acknowledged_at && (
                                                    <button onClick={() => acknowledgeParticipation(p.attendance_id)}
                                                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold hover:bg-emerald-200">
                                                        <CheckCircle size={12} className="inline mr-1" /> Acknowledge
                                                    </button>
                                                )}
                                                {p.certificate_path && (
                                                    <a href={`${API_BASE.replace('/api', '')}/${p.certificate_path}`} target="_blank" rel="noreferrer"
                                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50">
                                                        <Download size={12} className="inline mr-1" /> Certificate
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        {p.material_count > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-200">
                                                <a href={`${API_BASE}/api/ld/programs/${p.id}`}
                                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800">
                                                    <FileText size={11} className="inline mr-1" /> {p.material_count} training materials available
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Evaluation Forms */}
                    {data?.evalForms?.filter(f => !f.has_submitted).length > 0 && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Pending Evaluations</p>
                            <div className="space-y-2">
                                {data.evalForms.filter(f => !f.has_submitted).map(ef => (
                                    <button key={ef.id} onClick={() => openEvalForm(ef)}
                                        className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-left">
                                        <div>
                                            <p className="text-sm font-bold text-[#1B3A6B]">{ef.program_title}</p>
                                            <p className="text-[10px] text-slate-500">Evaluation Form</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Star size={14} className="text-amber-400" />
                                            <ArrowRight size={14} className="text-slate-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TRAINING HISTORY TAB */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    {(!data?.programs || data.programs.length === 0) ? (
                        <div className="p-12 text-center">
                            <Clock size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-400">No training history yet</p>
                            <p className="text-xs text-slate-300 mt-1">Completed trainings will appear here</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Program</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Methodology</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Duration</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Attendance</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Certificate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.programs.filter(p => p.status === 'completed').map((p, i) => (
                                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{p.title}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{p.methodology}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{p.duration_hours ? `${p.duration_hours}h` : '—'}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                p.attendance_status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                p.attendance_status === 'excused' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-600'
                                            }`}>{p.attendance_status || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.certificate_path ? (
                                                <a href={`${API_BASE.replace('/api', '')}/${p.certificate_path}`} target="_blank" rel="noreferrer"
                                                    className="text-emerald-600 hover:text-emerald-800">
                                                    <Download size={14} />
                                                </a>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Evaluation Form Modal */}
            {selectedEval && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedEval(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 m-4 shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="font-black text-lg text-[#1B3A6B] mb-1">Training Evaluation</h3>
                        <p className="text-xs text-slate-500 mb-6">{selectedEval.program_title}</p>
                        <div className="space-y-5">
                            {evalQuestions.map((q, i) => (
                                <div key={q.id || i}>
                                    <p className="text-sm font-bold text-[#1B3A6B] mb-2">{i + 1}. {q.question_text}</p>
                                    {q.question_type === 'rating' && (
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(r => (
                                                <button key={r} onClick={() => setEvalAnswers({ ...evalAnswers, [`${q.id}_rating`]: r })}
                                                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                                                        evalAnswers[`${q.id}_rating`] === r
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    }`} title={['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][r]}>{r}</button>
                                            ))}
                                        </div>
                                    )}
                                    {q.question_type === 'text' && (
                                        <textarea value={evalAnswers[`${q.id}_text`] || ''}
                                            onChange={e => setEvalAnswers({ ...evalAnswers, [`${q.id}_text`]: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" rows={2} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={handleSubmitEval}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700">
                                Submit Evaluation
                            </button>
                            <button onClick={() => setSelectedEval(null)}
                                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold">Cancel</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default MyLearning;
