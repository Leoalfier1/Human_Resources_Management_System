import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Info, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PerformanceEvaluationForm = () => {
    const { token } = useAuth();
    const { employeeId } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [period, setPeriod] = useState(null);
    const [criteria, setCriteria] = useState([]);
    const [scores, setScores] = useState({}); // { criteria_id: score }
    const [comments, setComments] = useState('');
    const [status, setStatus] = useState('draft');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const RATING_LABELS = {
        5: { title: "Outstanding", desc: "Performance exceeded expectations by 150% or more." },
        4: { title: "Very Satisfactory", desc: "Performance exceeded expectations by 115% - 149%." },
        3: { title: "Satisfactory", desc: "Performance met expectations fully by 100% - 114%." },
        2: { title: "Unsatisfactory", desc: "Performance met expectations by 51% - 99%." },
        1: { title: "Poor", desc: "Performance failed to meet expectations (50% or below)." }
    };

    useEffect(() => {
        fetchEvaluationData();
    }, [employeeId, token]);

    const fetchEvaluationData = async () => {
        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            // 1. Fetch active period criteria
            const activeRes = await fetch(`${apiUrl}/pm/performance/active-period`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!activeRes.ok) {
                throw new Error("No active performance period found.");
            }
            const activeData = await activeRes.json();
            setPeriod(activeData.period);
            setCriteria(activeData.criteria || []);

            // Initialize scores to 0
            const initialScores = {};
            activeData.criteria.forEach(c => {
                initialScores[c.id] = 0;
            });

            // 2. Fetch existing evaluation
            const evalRes = await fetch(`${apiUrl}/pm/performance/evaluation/${employeeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (evalRes.ok) {
                const evalData = await evalRes.json();
                setEmployee(evalData.employee);
                if (evalData.evaluation) {
                    setStatus(evalData.evaluation.status);
                    setComments(evalData.evaluation.comments || '');
                    
                    // Fill in existing scores
                    const loadedScores = { ...initialScores };
                    evalData.ratings.forEach(r => {
                        loadedScores[r.criteria_id] = Number(r.score);
                    });
                    setScores(loadedScores);
                } else {
                    setScores(initialScores);
                }
            } else {
                throw new Error("Failed to load employee details.");
            }
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (criteriaId, val) => {
        if (status === 'submitted' || status === 'acknowledged') return;
        const numericVal = parseFloat(val);
        setScores(prev => ({
            ...prev,
            [criteriaId]: numericVal
        }));
    };

    const calculateOverallScore = () => {
        let weightedSum = 0;
        let totalWeight = 0;
        criteria.forEach(c => {
            const score = scores[c.id] || 0;
            const weight = parseFloat(c.weight);
            weightedSum += score * weight;
            totalWeight += weight;
        });
        return totalWeight > 0 ? (weightedSum / totalWeight) : 0;
    };

    const getAdjectivalRating = (score) => {
        if (score >= 4.5) return "Outstanding";
        if (score >= 3.5) return "Very Satisfactory";
        if (score >= 2.5) return "Satisfactory";
        if (score >= 1.5) return "Unsatisfactory";
        if (score > 0) return "Poor";
        return "Not Rated";
    };

    const handleSubmit = async (submitStatus) => {
        setErrorMsg('');
        setSuccessMsg('');
        
        // Validation: If submitting, check if all criteria are scored
        if (submitStatus === 'submitted') {
            const unscored = criteria.some(c => !scores[c.id] || scores[c.id] <= 0);
            if (unscored) {
                setErrorMsg("Please provide scores (greater than 0) for all criteria before submitting.");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }

        try {
            setSubmitting(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            
            const ratingsPayload = Object.keys(scores).map(critId => ({
                criteria_id: Number(critId),
                score: scores[critId]
            }));

            const res = await fetch(`${apiUrl}/pm/performance/evaluation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    employee_id: Number(employeeId),
                    performance_period_id: period.id,
                    ratings: ratingsPayload,
                    comments,
                    status: submitStatus
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMsg(`Evaluation saved as ${submitStatus === 'submitted' ? 'Submitted' : 'Draft'} successfully!`);
                setStatus(submitStatus);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => navigate('/pm/evaluations'), 1500);
            } else {
                setErrorMsg(data.message || "Failed to save evaluation.");
            }
        } catch (err) {
            setErrorMsg("Server error saving evaluation. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const isReadOnly = status === 'submitted' || status === 'acknowledged';
    const overallScore = calculateOverallScore();
    const adjRating = getAdjectivalRating(overallScore);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] p-8 flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#1B3A6B] border-t-[#D6402F] rounded-full animate-spin" />
                    <p className="text-slate-800 text-xs font-bold uppercase tracking-wider">Loading Rating Sheet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            {/* Header section */}
            <div className="bg-[#1B3A6B] text-white py-8 px-8 md:px-16 border-b-4 border-[#D6402F] shadow-lg">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/pm/evaluations')}
                            className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl text-white transition-all cursor-pointer shadow"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#D6402F] tracking-widest mb-1">
                                <span>Core Performance Form</span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">Evaluate Employee</h1>
                        </div>
                    </div>

                    {isReadOnly && (
                        <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 size={14} />
                            <span>Evaluation Finalized ({status})</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-8">
                {/* Error / Success message */}
                {errorMsg && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6 flex items-start gap-3 text-red-700 text-xs font-bold">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl mb-6 flex items-start gap-3 text-emerald-700 text-xs font-bold">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Employee details card */}
                {employee && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#D6402F]" />
                        
                        <div>
                            <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Ratee Information</span>
                            <h2 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight leading-none mb-1">{employee.name}</h2>
                            <p className="text-[10px] text-slate-800 font-bold uppercase">{employee.position}</p>
                            <div className="flex gap-2 mt-3">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black text-slate-800 uppercase tracking-wider">
                                    {employee.unit}
                                </span>
                                <span className="bg-[#1B3A6B]/10 px-2 py-0.5 rounded text-[8px] font-black text-[#1B3A6B] uppercase tracking-wider">
                                    Non-Teaching
                                </span>
                            </div>
                        </div>

                        {/* Calculated score summary */}
                        <div className="bg-[#1B3A6B] text-white rounded-2xl p-5 flex items-center gap-6 shadow-md md:w-80 justify-between shrink-0">
                            <div>
                                <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Overall Score</span>
                                <span className="text-3xl font-black">{overallScore.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Rating</span>
                                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg block mt-1 tracking-wider ${
                                    overallScore >= 4.5 ? 'bg-emerald-500 text-white' :
                                    overallScore >= 3.5 ? 'bg-blue-500 text-white' :
                                    overallScore >= 2.5 ? 'bg-purple-500 text-white' :
                                    overallScore > 0 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-600'
                                }`}>
                                    {adjRating}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rating Guide / Key */}
                <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/60 mb-8">
                    <span className="block text-[9px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <span className="text-[#1B3A6B] font-bold">Standard Rating Scale</span>
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.keys(RATING_LABELS).reverse().map((num) => (
                            <div key={num} className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                                <span className="block text-xs font-black text-[#1B3A6B]">{num}.0</span>
                                <span className="block text-[9px] font-black uppercase text-slate-800 mt-0.5">{RATING_LABELS[num].title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Criteria sheet */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">
                        Evaluation Criteria
                    </h3>
                    
                    {criteria.map((c, index) => {
                        const score = scores[c.id] || 0;
                        const weightedScore = (score * parseFloat(c.weight)) / 100;
                        
                        return (
                            <div
                                key={c.id}
                                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 group-hover:bg-[#D6402F] transition-colors" />
                                
                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                                    <div className="max-w-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-[#1B3A6B] text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">
                                                {index + 1}
                                            </span>
                                            <h4 className="text-xs font-black text-[#1B3A6B] uppercase tracking-tight">
                                                {c.criteria_name}
                                            </h4>
                                        </div>
                                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">
                                            Weight: {Number(c.weight).toFixed(0)}% &bull; Max Score: {c.max_score}
                                        </p>
                                    </div>

                                    {/* Score display */}
                                    <div className="flex gap-4 shrink-0 bg-slate-50 p-3 rounded-2xl border border-slate-100 self-start md:self-auto">
                                        <div className="text-center px-2">
                                            <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Score</span>
                                            <span className="text-sm font-black text-[#1B3A6B]">{score.toFixed(1)}</span>
                                        </div>
                                        <div className="border-l border-slate-200" />
                                        <div className="text-center px-2">
                                            <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Weighted</span>
                                            <span className="text-sm font-black text-[#D6402F]">{weightedScore.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Slider Input */}
                                <div className="mt-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        step="0.5"
                                        disabled={isReadOnly}
                                        value={score || 1}
                                        onChange={(e) => handleScoreChange(c.id, e.target.value)}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1B3A6B] disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase mt-1 px-1">
                                        <span>1.0 (Poor)</span>
                                        <span>2.0</span>
                                        <span>3.0 (Satisfactory)</span>
                                        <span>4.0</span>
                                        <span>5.0 (Outstanding)</span>
                                    </div>
                                </div>

                                {/* Score label detail */}
                                {score > 0 && (
                                    <div className="mt-3 bg-slate-50 p-2.5 rounded-xl text-[10px] text-black flex items-start gap-1.5 border border-slate-100">
                                        <Star size={12} className="text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                                        <span>
                                            <strong>{RATING_LABELS[Math.round(score)]?.title}:</strong> {RATING_LABELS[Math.round(score)]?.desc}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Supervisor Comments */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mt-8">
                    <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-tight mb-3">Supervisor Remarks / Comments</h3>
                    <textarea
                        rows={4}
                        disabled={isReadOnly}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Provide qualitative feedback regarding this employee's accomplishments, areas of strength, and development recommendations..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] focus:bg-white transition-all disabled:opacity-70 shadow-inner"
                    />
                </div>

                {/* Form Action Controls */}
                {!isReadOnly && (
                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSubmit('draft')}
                            className="bg-slate-200 hover:bg-slate-300 text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                        >
                            <Save size={14} />
                            Save as Draft
                        </button>
                        
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSubmit('submitted')}
                            className="bg-[#1B3A6B] hover:bg-[#D6402F] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            <CheckCircle2 size={14} />
                            Submit Rating
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerformanceEvaluationForm;
