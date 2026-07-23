import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Send, ArrowLeft, ClipboardList, AlertCircle } from 'lucide-react';

const TNASurveyPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [cycles, setCycles] = useState([]);
    const [selectedCycleId, setSelectedCycleId] = useState('');
    const [loading, setLoading] = useState(true);

    // Answers states
    const [q1, setQ1] = useState('');
    const [q2, setQ2] = useState('');
    const [selectedGaps, setSelectedGaps] = useState([]);

    const fetchCycles = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ld/tna', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCycles(data.cycles || []);
                if (data.cycles && data.cycles.length > 0) {
                    setSelectedCycleId(data.cycles[0].id);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchCycles();
    }, [token]);

    const handleGapToggle = (gap) => {
        if (selectedGaps.includes(gap)) {
            setSelectedGaps(selectedGaps.filter(g => g !== gap));
        } else {
            setSelectedGaps([...selectedGaps, gap]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCycleId || selectedGaps.length === 0) {
            alert("Please select at least one competency gap!");
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/ld/tna/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    tna_cycle_id: selectedCycleId,
                    qualitative_answers: { q1, q2 },
                    competency_gaps: selectedGaps
                })
            });
            if (res.ok) {
                alert("Survey responses submitted successfully to HR L&D department!");
                navigate('/employee/learning');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const competencyOptions = [
        "Advanced PRIME-HRM Documentation",
        "Compliance Auditing",
        "Leadership & Management",
        "Strategic Alignment",
        "Stakeholder Engagement",
        "Curriculum Delivery Improvement"
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-xs font-black uppercase text-slate-600">
                Loading Active Needs Assessments...
            </div>
        );
    }

    return (
        <div className="space-y-6 select-none max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/employee/learning')}
                    className="p-2 bg-white border border-slate-100 rounded-full hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                    <ArrowLeft size={16} className="text-black" />
                </button>
                <div>
                    <h2 className="text-sm font-black text-black uppercase tracking-wider">Training Needs Assessment Survey</h2>
                    <p className="text-[10px] text-slate-600 font-bold uppercase">PRIME-HRM competency gap audits</p>
                </div>
            </div>

            {cycles.length === 0 ? (
                <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center text-xs font-bold text-slate-600 uppercase flex flex-col items-center gap-2 shadow-sm">
                    <AlertCircle size={24} className="text-slate-300" />
                    No active Needs Assessment survey cycles running. Check back later!
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
                    {/* Survey selection */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Active Survey Cycle</label>
                        <select 
                            value={selectedCycleId}
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B]"
                        >
                            {cycles.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Competency Gap Checkboxes */}
                    <div className="space-y-3 pt-2">
                        <div>
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Competency Gaps Self-Assessment</label>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Select the professional skill areas where you feel you need training support</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {competencyOptions.map((gap, i) => {
                                const isChecked = selectedGaps.includes(gap);
                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => handleGapToggle(gap)}
                                        className={`p-4.5 rounded-2xl border cursor-pointer select-none transition-all flex items-center justify-between
                                            ${isChecked 
                                                ? 'bg-amber-50 border-[#F59E0B] shadow-sm text-black' 
                                                : 'bg-slate-50 border-slate-100 hover:border-slate-300 text-slate-800'}`}
                                    >
                                        <span className="text-xs font-bold">{gap}</span>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                                            ${isChecked ? 'border-[#F59E0B] bg-[#F59E0B]' : 'border-slate-300'}`}>
                                            {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Qualitative Questions */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Question 1: What is the most challenging task in your current workflow and why?</label>
                            <textarea 
                                rows="3"
                                value={q1}
                                onChange={(e) => setQ1(e.target.value)}
                                placeholder="Describe operational bottlenecks or documentation complexities..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B] resize-none shadow-sm"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Question 2: Suggest specific topics or training workshops that would improve your performance.</label>
                            <textarea 
                                rows="3"
                                value={q2}
                                onChange={(e) => setQ2(e.target.value)}
                                placeholder="e.g. Portfolio compilation seminars, mentoring on PRIME-HRM audit indicators..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B] resize-none shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex justify-end">
                        <button 
                            type="submit"
                            className="flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white hover:bg-blue-800 rounded-xl text-xs font-black uppercase shadow-lg transition-all cursor-pointer active:scale-95"
                        >
                            <Send size={14} /> Submit Needs Survey
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default TNASurveyPage;
