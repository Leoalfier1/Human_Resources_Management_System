import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Star, Download, X, ChevronDown, ChevronUp, CheckCircle, Users, FileText, Target, PlayCircle } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const LDEvaluationManagement = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [evalResults, setEvalResults] = useState(null);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [impactReport, setImpactReport] = useState([]);
    const [showReport, setShowReport] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/ld/programs?status=completed,ongoing`, { headers: headers() });
            if (res.ok) setPrograms(await res.json());
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openResults = async (program) => {
        setSelectedProgram(program);
        setResultsLoading(true);
        try {
            const progDetail = await fetch(`${API_BASE}/api/ld/programs/${program.id}`, { headers: headers() }).then(r => r.json());
            if (progDetail.evaluationForm?.id) {
                const res = await fetch(`${API_BASE}/api/ld/evaluation/forms/${progDetail.evaluationForm.id}/results`, { headers: headers() });
                if (res.ok) setEvalResults(await res.json());
                else setEvalResults(null);
            } else {
                setEvalResults(null);
            }
        } catch (e) { setEvalResults(null); }
        finally { setResultsLoading(false); }
    };

    const loadImpactReport = async () => {
        setReportLoading(true);
        setShowReport(true);
        try {
            const res = await fetch(`${API_BASE}/api/ld/evaluation/impact-report`, { headers: headers() });
            if (res.ok) setImpactReport(await res.json());
        } catch (e) { /* silent */ }
        finally { setReportLoading(false); }
    };

    const exportCSV = () => {
        if (!impactReport.length) return;
        let csv = 'TNA Need,Objective,Program,Completion Rate,Eval Score\n';
        impactReport.forEach(r => {
            csv += `"${r.tna_title}","${r.objective_title}","${r.program_title}",${r.completion_rate}%,${r.avg_eval_score || 'N/A'}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ld-impact-report.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const getEvalStatusBadge = (program) => {
        if (!program.evaluationForm) return <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">No Form</span>;
        if (program.evaluationForm.status === 'active') return <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>;
        return <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">{program.evaluationForm.status}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black uppercase italic text-[#1B3A6B]">Evaluation</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step 5: Assessment of L&D Impact</p>
                </div>
                <button onClick={loadImpactReport}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700">
                    <BarChart3 size={16} /> View Impact Report
                </button>
            </div>

            {/* Programs List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 animate-pulse space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
                    </div>
                ) : programs.length === 0 ? (
                    <div className="p-12 text-center">
                        <BarChart3 size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-400">No completed or ongoing programs</p>
                        <p className="text-xs text-slate-300 mt-1">Evaluation results will appear here once programs are implemented</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {programs.map((p, i) => (
                            <motion.div key={p.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                onClick={() => openResults(p)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-bold text-[#1B3A6B]">{p.title}</p>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-semibold">
                                        <span>{p.methodology}</span>
                                        <span>{p.duration_hours ? `${p.duration_hours}h` : ''}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {p.present_count > 0 && (
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                <Users size={11} /> {p.present_count || 0}/{p.total_attendance || 0}
                                            </div>
                                        </div>
                                    )}
                                    <ChevronDown size={16} className="text-slate-300" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Evaluation Results Modal */}
            <AnimatePresence>
                {selectedProgram && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto" onClick={() => { setSelectedProgram(null); setEvalResults(null); }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 m-4 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-[#1B3A6B]">{selectedProgram.title}</h3>
                                    <p className="text-xs text-slate-400">Evaluation Results</p>
                                </div>
                                <button onClick={() => { setSelectedProgram(null); setEvalResults(null); }}><X size={20} className="text-slate-400" /></button>
                            </div>
                            {resultsLoading ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-24 bg-slate-200 rounded-2xl" />
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl" />)}
                                </div>
                            ) : !evalResults ? (
                                <div className="text-center py-8">
                                    <Star size={40} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-sm font-bold text-slate-400">No evaluation form created yet</p>
                                    <p className="text-xs text-slate-300 mt-1">Go to the program detail to create an evaluation form</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {evalResults.overallAvg && (
                                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white text-center">
                                            <p className="text-5xl font-black">{evalResults.overallAvg}</p>
                                            <p className="text-sm font-bold uppercase tracking-widest mt-1">Overall Rating /5</p>
                                            <div className="flex items-center justify-center gap-4 mt-3 text-xs font-semibold">
                                                <span>{evalResults.totalResponses} responses</span>
                                                <span>{evalResults.responseRate}% response rate</span>
                                            </div>
                                        </div>
                                    )}
                                    {evalResults.avgByCategory && Object.entries(evalResults.avgByCategory).filter(([, v]) => v).map(([cat, avg]) => (
                                        <div key={cat} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{cat}</p>
                                                <span className="text-lg font-black text-emerald-600">{avg}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(avg / 5) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    {evalResults.questions?.filter(q => q.question?.question_type === 'rating').map((qr, i) => (
                                        <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <p className="text-xs font-bold text-slate-600 mb-2">{qr.question.question_text}</p>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(v => {
                                                    const count = qr.distribution?.[v] || 0;
                                                    const maxCount = Math.max(...Object.values(qr.distribution || { 1: 0 }), 1);
                                                    return (
                                                        <div key={v} className="flex-1 text-center">
                                                            <div className="h-20 bg-white rounded-lg relative overflow-hidden border border-slate-200">
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: `${(count / maxCount) * 100}%` }}
                                                                    className="absolute bottom-0 w-full bg-emerald-500/60"
                                                                />
                                                            </div>
                                                            <p className="text-[9px] font-bold text-slate-500 mt-1">{v}: {count}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {qr.average && <p className="text-[10px] text-slate-400 mt-2 text-center font-semibold">Avg: {qr.average}/5</p>}
                                        </div>
                                    ))}
                                    {evalResults.questions?.filter(q => q.question?.question_type === 'text' && q.textAnswers?.length > 0).map((qr, i) => (
                                        <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <p className="text-xs font-bold text-slate-600 mb-2">{qr.question.question_text}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {qr.textAnswers.map((t, j) => (
                                                    <span key={j} className="bg-white px-3 py-1.5 rounded-full text-[10px] text-slate-600 border border-slate-200">"{t.substring(0, 40)}"</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Impact Report Modal */}
            <AnimatePresence>
                {showReport && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 overflow-y-auto" onClick={() => setShowReport(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 m-4 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-black uppercase italic text-[#1B3A6B]">L&D Impact Report</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">TNA → Objectives → Programs → Impact</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={exportCSV}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-200">
                                        <Download size={12} /> Export CSV
                                    </button>
                                    <button onClick={() => setShowReport(false)}><X size={20} className="text-slate-400" /></button>
                                </div>
                            </div>
                            {reportLoading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl" />)}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">TNA Need</th>
                                                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Objective</th>
                                                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Program</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Completion</th>
                                                <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Eval Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {impactReport.map((r, i) => (
                                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{r.tna_title}</td>
                                                    <td className="px-4 py-3 text-xs text-slate-600">{r.objective_title || '—'}</td>
                                                    <td className="px-4 py-3 text-xs text-slate-600">{r.program_title || '—'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`text-xs font-bold ${parseFloat(r.completion_rate) >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                            {r.completion_rate}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`text-xs font-bold ${r.avg_eval_score >= 4 ? 'text-emerald-600' : r.avg_eval_score >= 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                                                            {r.avg_eval_score || '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {impactReport.length === 0 && (
                                        <p className="text-center text-slate-400 py-8 text-sm font-semibold">No data available for the impact report</p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LDEvaluationManagement;
