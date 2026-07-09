import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Download, CheckCircle, Clock, MapPin, User, BookOpen, Star, FileText, Users, BarChart3 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const TABS = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'attendance', label: 'Attendance', icon: Users },
    { key: 'materials', label: 'Materials', icon: BookOpen },
    { key: 'evaluation', label: 'Evaluation', icon: BarChart3 },
];

const LDProgramDetail = ({ program, onClose }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [evalFormId, setEvalFormId] = useState(null);
    const [evalResults, setEvalResults] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/ld/programs/${program.id}`, { headers: authHeaders() });
                if (res.ok) setDetail(await res.json());
            } catch (e) { /* silent */ }
            finally { setLoading(false); }
        };
        fetchDetail();
    }, [program.id]);

    useEffect(() => {
        if (activeTab === 'evaluation' && detail?.evaluationForm?.id) {
            setEvalFormId(detail.evaluationForm.id);
            fetch(`${API_BASE}/api/ld/evaluation/forms/${detail.evaluationForm.id}/results`, { headers: authHeaders() })
                .then(r => r.json())
                .then(setEvalResults)
                .catch(() => {});
        }
    }, [activeTab, detail?.evaluationForm?.id]);

    const handleUpload = async (url, file) => {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }, body: formData });
        const res = await fetch(`${API_BASE}/api/ld/programs/${program.id}`, { headers: authHeaders() });
        if (res.ok) setDetail(await res.json());
    };

    const handleMarkAllPresent = async () => {
        await fetch(`${API_BASE}/api/ld/programs/${program.id}/seed-attendance`, { method: 'POST', headers: authHeaders() });
        const res = await fetch(`${API_BASE}/api/ld/programs/${program.id}`, { headers: authHeaders() });
        if (res.ok) setDetail(await res.json());
    };

    const handleCreateEvalForm = async () => {
        const payload = {
            program_id: program.id,
            title: `Evaluation - ${program.title}`,
            instructions: 'Please rate the training program based on the following criteria.',
            questions: [
                { question_text: 'How satisfied are you with the training overall?', question_type: 'rating', category: 'satisfaction' },
                { question_text: 'Rate the relevance of the training to your work', question_type: 'rating', category: 'relevance' },
                { question_text: 'Rate the effectiveness of the facilitator', question_type: 'rating', category: 'facilitator' },
                { question_text: 'Rate the venue and logistics', question_type: 'rating', category: 'venue' },
                { question_text: 'What did you learn from this training?', question_type: 'text', category: 'learning' },
                { question_text: 'How will you apply what you learned?', question_type: 'text', category: 'learning' },
            ]
        };
        await fetch(`${API_BASE}/api/ld/evaluation/forms`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
        const res = await fetch(`${API_BASE}/api/ld/programs/${program.id}`, { headers: authHeaders() });
        if (res.ok) setDetail(await res.json());
    };

    if (loading) return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-3xl p-8 m-4 shadow-2xl animate-pulse" onClick={e => e.stopPropagation()}>
                <div className="h-8 bg-slate-200 rounded-xl w-1/2 mb-6" />
                <div className="h-48 bg-slate-200 rounded-2xl" />
            </div>
        </div>
    );
    if (!detail) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] w-full max-w-4xl m-4 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-black text-[#1B3A6B]">{detail.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">{detail.description}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4 text-[10px] text-slate-500 font-semibold">
                        <span className={`px-2 py-1 rounded-full ${detail.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : detail.status === 'ongoing' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{detail.status}</span>
                        <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">{detail.methodology}</span>
                        <span className={`px-2 py-1 rounded-full ${detail.target_position_type === 'teaching' ? 'bg-amber-100 text-amber-700' : detail.target_position_type === 'non_teaching' ? 'bg-sky-100 text-sky-700' : detail.target_position_type === 'teaching_related' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>{detail.target_position_type}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-6 pt-4 border-b border-slate-100 bg-slate-50/50">
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                activeTab === tab.key ? 'bg-white text-emerald-700 border-t border-l border-r border-slate-200 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}>
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* TAB 1: Overview */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                                    <p className="text-sm font-bold text-[#1B3A6B] mt-1">{detail.duration_hours ? `${detail.duration_hours}h` : '—'}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Schedule</p>
                                    <p className="text-sm font-bold text-[#1B3A6B] mt-1">
                                        {detail.start_date ? new Date(detail.start_date).toLocaleDateString() : '—'}
                                        {detail.end_date ? ` - ${new Date(detail.end_date).toLocaleDateString()}` : ''}
                                    </p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Venue</p>
                                    <p className="text-sm font-bold text-[#1B3A6B] mt-1">{detail.venue || '—'}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Resource Person</p>
                                    <p className="text-sm font-bold text-[#1B3A6B] mt-1">{detail.resource_person || '—'}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Provider</p>
                                    <p className="text-sm font-bold text-[#1B3A6B] mt-1">{detail.provider || '—'}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Budget</p>
                                    <p className="text-sm font-bold text-[#1B3A6B] mt-1">{detail.budget_estimate ? `₱${Number(detail.budget_estimate).toLocaleString()}` : '—'}</p>
                                </div>
                            </div>
                            {detail.objective_title && (
                                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Linked Objective</p>
                                    <p className="text-sm font-semibold text-emerald-800 mt-1">{detail.objective_title}</p>
                                </div>
                            )}
                            <div className="flex gap-3 flex-wrap">
                                {detail.attendance_sheet_path && (
                                    <a href={`${API_BASE.replace('/api', '')}/${detail.attendance_sheet_path}`} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-200">
                                        <Download size={14} /> Download Attendance Sheet
                                    </a>
                                )}
                                {detail.status === 'ongoing' && (
                                    <label className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-bold cursor-pointer hover:bg-amber-200">
                                        <Upload size={14} /> Upload Attendance Sheet
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                            onChange={e => e.target.files[0] && handleUpload(`${API_BASE}/api/ld/programs/${detail.id}/attendance-sheet`, e.target.files[0])} />
                                    </label>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Attendance */}
                    {activeTab === 'attendance' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-4 text-xs font-bold text-slate-500">
                                    <span className="text-emerald-600">Present: {detail.attendance?.filter(a => a.status === 'present').length || 0}</span>
                                    <span className="text-red-500">Absent: {detail.attendance?.filter(a => a.status === 'absent').length || 0}</span>
                                    <span className="text-amber-600">Excused: {detail.attendance?.filter(a => a.status === 'excused').length || 0}</span>
                                </div>
                                <button onClick={handleMarkAllPresent}
                                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold hover:bg-emerald-200">Seed All Personnel</button>
                            </div>
                            {(!detail.attendance || detail.attendance.length === 0) ? (
                                <p className="text-xs text-slate-400 font-semibold text-center py-8">No attendance records yet. Click "Seed All Personnel" to populate.</p>
                            ) : (
                                <div className="space-y-2">
                                    {detail.attendance.map(a => (
                                        <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">{a.full_name}</p>
                                                <p className="text-[10px] text-slate-400">{a.applicant_type}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select value={a.status}
                                                    onChange={async (e) => {
                                                        await fetch(`${API_BASE}/api/ld/programs/attendance/${a.id}`, {
                                                            method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: e.target.value })
                                                        });
                                                        const res = await fetch(`${API_BASE}/api/ld/programs/${program.id}`, { headers: authHeaders() });
                                                        if (res.ok) setDetail(await res.json());
                                                    }}
                                                    className="px-2 py-1.5 rounded-xl border border-slate-200 text-[10px] font-bold">
                                                    <option value="absent">Absent</option>
                                                    <option value="present">Present</option>
                                                    <option value="excused">Excused</option>
                                                </select>
                                                <label className="px-2 py-1.5 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-500 cursor-pointer hover:bg-slate-200">
                                                    <Upload size={12} className="inline" /> Cert
                                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                                        onChange={e => e.target.files[0] && handleUpload(`${API_BASE}/api/ld/programs/attendance/${a.id}/certificate`, e.target.files[0])} />
                                                </label>
                                                {a.certificate_path && <Download size={14} className="text-emerald-500" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: Materials */}
                    {activeTab === 'materials' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-slate-500">{detail.materials?.length || 0} materials</p>
                                <label className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold cursor-pointer hover:bg-emerald-200">
                                    <Upload size={12} /> Upload Material
                                    <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                                        onChange={e => {
                                            if (!e.target.files[0]) return;
                                            const fd = new FormData();
                                            fd.append('file', e.target.files[0]);
                                            fd.append('program_id', detail.id);
                                            fd.append('title', e.target.files[0].name);
                                            fetch(`${API_BASE}/api/ld/programs/materials/upload`, {
                                                method: 'POST', headers: { 'Authorization': `Bearer ${token()}` }, body: fd
                                            }).then(() => {
                                                fetch(`${API_BASE}/api/ld/programs/${program.id}`, { headers: authHeaders() })
                                                    .then(r => r.json()).then(setDetail);
                                            });
                                        }} />
                                </label>
                            </div>
                            {(!detail.materials || detail.materials.length === 0) ? (
                                <p className="text-xs text-slate-400 font-semibold text-center py-8">No materials uploaded yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {detail.materials.map(m => (
                                        <div key={m.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">{m.title}</p>
                                                <p className="text-[10px] text-slate-400">{m.file_name} · {new Date(m.uploaded_at).toLocaleDateString()}</p>
                                            </div>
                                            <a href={`${API_BASE.replace('/api', '')}/${m.file_path}`} target="_blank" rel="noreferrer"
                                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50">
                                                <Download size={12} className="inline mr-1" /> Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: Evaluation */}
                    {activeTab === 'evaluation' && (
                        <div className="space-y-4">
                            {!detail.evaluationForm ? (
                                <div className="text-center py-8">
                                    <Star size={40} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-sm font-bold text-slate-400">No evaluation form yet</p>
                                    <p className="text-xs text-slate-300 mt-1">Create an evaluation form for this program</p>
                                    <button onClick={handleCreateEvalForm}
                                        className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700">
                                        Create Evaluation Form
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-bold text-[#1B3A6B]">{detail.evaluationForm.title}</p>
                                            <p className="text-[10px] text-slate-400">Status: {detail.evaluationForm.status} · {evalResults?.totalResponses || 0} responses</p>
                                        </div>
                                        {detail.evaluationForm.status === 'draft' && (
                                            <button onClick={async () => {
                                                await fetch(`${API_BASE}/api/ld/evaluation/forms/${detail.evaluationForm.id}/activate`, { method: 'POST', headers: authHeaders() });
                                                const res = await fetch(`${API_BASE}/api/ld/programs/${program.id}`, { headers: authHeaders() });
                                                if (res.ok) setDetail(await res.json());
                                            }}
                                                className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold">Activate</button>
                                        )}
                                    </div>
                                    {evalResults && (
                                        <div className="space-y-4">
                                            {evalResults.overallAvg && (
                                                <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                                                    <p className="text-3xl font-black text-emerald-600">{evalResults.overallAvg}</p>
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Overall Rating /5</p>
                                                    <p className="text-[10px] text-slate-500 mt-1">Response Rate: {evalResults.responseRate}%</p>
                                                </div>
                                            )}
                                            {evalResults.avgByCategory && Object.entries(evalResults.avgByCategory).filter(([, v]) => v).map(([cat, avg]) => (
                                                <div key={cat} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs font-bold text-slate-600 uppercase">{cat}</p>
                                                        <p className="text-sm font-black text-emerald-600">{avg}/5</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {evalResults.questions?.filter(q => q.question?.question_type === 'text' && q.textAnswers?.length > 0).map((q, i) => (
                                                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-600 mb-2">{q.question.question_text}</p>
                                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                                        {q.textAnswers.map((t, j) => (
                                                            <p key={j} className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-100">"{t}"</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LDProgramDetail;
