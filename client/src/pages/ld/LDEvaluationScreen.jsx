import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Star, MessageSquare, TrendingUp, ShieldCheck, ChevronRight } from 'lucide-react';

const LDEvaluationScreen = () => {
    const { token } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [selectedProgId, setSelectedProgId] = useState('');
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPrograms = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ld/programs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPrograms(data || []);
                if (data.length > 0) setSelectedProgId(data[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEvaluations = async (progId) => {
        if (!progId) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/ld/programs/${progId}/evaluations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEvaluations(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchPrograms();
    }, [token]);

    useEffect(() => {
        if (selectedProgId) fetchEvaluations(selectedProgId);
    }, [selectedProgId]);

    // Compute average score indicators
    const completedEvals = evaluations.filter(e => e.satisfaction_score);
    const avgSatisfaction = completedEvals.length > 0 
        ? (completedEvals.reduce((acc, curr) => acc + curr.satisfaction_score, 0) / completedEvals.length).toFixed(1)
        : "0.0";
    const avgPostCompetency = completedEvals.length > 0 
        ? (completedEvals.reduce((acc, curr) => acc + curr.competency_score_rating, 0) / completedEvals.length).toFixed(1)
        : "0.0";

    return (
        <div className="space-y-6 select-none">
            {/* Selector */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest block">Select Training Program</h3>
                    <p className="text-[10px] text-slate-800 font-bold uppercase mt-1">Review post-training satisfaction metrics and impact scores</p>
                </div>
                <select 
                    value={selectedProgId}
                    onChange={(e) => setSelectedProgId(e.target.value)}
                    className="w-full md:max-w-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                >
                    {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Visual Summary KPIs */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                            <TrendingUp size={16} /> Training Impact Summary
                        </h3>
                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-wider">PRIME-HRM Level II evaluation metrics</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100/50 flex justify-between items-center">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Trainee Satisfaction</span>
                                <p className="text-2xl font-black text-black">{avgSatisfaction} <span className="text-xs text-slate-600 font-bold">/ 5.0</span></p>
                            </div>
                            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-500 shrink-0">
                                <Star size={18} className="fill-current" />
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100/50 flex justify-between items-center">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Post-Competency Rating</span>
                                <p className="text-2xl font-black text-emerald-600">{avgPostCompetency} <span className="text-xs text-slate-600 font-bold">/ 5.0</span></p>
                            </div>
                            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-500 shrink-0">
                                <ShieldCheck size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Trainee Qualitative Comments</span>
                        <div className="space-y-3">
                            {completedEvals.map((ev, i) => (
                                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2">
                                    <MessageSquare size={14} className="text-black shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-black leading-normal italic">"{ev.feedback_text}"</p>
                                        <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">&mdash; {ev.employee_name}</p>
                                    </div>
                                </div>
                            ))}
                            {completedEvals.length === 0 && (
                                <p className="text-center text-[10px] font-bold text-slate-600 uppercase py-2">No trainee comments submitted.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Trainee Competency Growth comparisons chart and details */}
                <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">
                        Trainee Competency Growth Profiles (Before vs After Training)
                    </h3>

                    {loading ? (
                        <div className="text-center py-6 text-xs text-slate-600 font-bold uppercase">
                            Loading Trainee Growth Data...
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {evaluations.map((en) => {
                                const preVal = Number(en.pre_score || 3.0).toFixed(1);
                                const postVal = en.post_score ? Number(en.post_score).toFixed(1) : 'Pending';

                                // Custom calculation widths
                                const preWidth = Math.round((parseFloat(preVal) / 5) * 100);
                                const postWidth = en.post_score ? Math.round((parseFloat(postVal) / 5) * 100) : 0;

                                return (
                                    <div key={en.id} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-xs font-black text-black uppercase tracking-tight">{en.employee_name}</h4>
                                                <p className="text-[9px] text-slate-600 font-bold uppercase">{en.employee_position}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border
                                                    ${en.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-slate-100 text-slate-600'}`}
                                                >
                                                    {en.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Chart indicators */}
                                        <div className="space-y-2">
                                            {/* Pre Score Bar */}
                                            <div className="space-y-0.5">
                                                <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-wider">
                                                    <span>Pre-Training Competency Score</span>
                                                    <span className="font-bold text-black">{preVal} / 5.0</span>
                                                </div>
                                                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                                    <div className="bg-[#1B3A6B]/50 h-full rounded-full" style={{ width: `${preWidth}%` }} />
                                                </div>
                                            </div>

                                            {/* Post Score Bar */}
                                            <div className="space-y-0.5">
                                                <div className="flex justify-between text-[8px] font-black text-[#16A34A] uppercase tracking-wider">
                                                    <span>Post-Training Assessment Impact Score</span>
                                                    <span className="font-bold">{postVal === 'Pending' ? 'Pending evaluation' : `${postVal} / 5.0`}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                                    {en.post_score ? (
                                                        <div className="bg-[#16A34A] h-full rounded-full" style={{ width: `${postWidth}%` }} />
                                                    ) : (
                                                        <div className="bg-slate-300 h-full rounded-full w-0" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {evaluations.length === 0 && (
                                <div className="text-center py-6 text-slate-600 font-bold uppercase">
                                    No trainee enrollment data found for evaluations.
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default LDEvaluationScreen;
