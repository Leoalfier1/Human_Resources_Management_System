import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Send } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const PostTrainingEvaluationPage = () => {
    const { token } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { enrollment } = location.state || {};

    const [satisfaction, setSatisfaction] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [competencyRating, setCompetencyRating] = useState(4);

    if (!enrollment) {
        return (
            <div className="text-center py-10 text-slate-600 font-bold uppercase select-none">
                No active course context loaded.
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/ld/programs/${enrollment.id}/evaluations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ld_enrollment_id: enrollment.enrollment_id,
                    satisfaction_score: satisfaction,
                    feedback_text: feedback,
                    competency_score_rating: competencyRating
                })
            });
            if (res.ok) {
                alert("Evaluation survey feedback logged! Certificate has been issued.");
                navigate('/employee/learning');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 select-none max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/employee/learning')}
                    className="p-2 bg-white border border-slate-100 rounded-full hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                    <ArrowLeft size={16} className="text-black" />
                </button>
                <div>
                    <h2 className="text-sm font-black text-black uppercase tracking-wider">Post-Training Impact Assessment</h2>
                    <p className="text-[10px] text-slate-600 font-bold uppercase">{enrollment.title}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
                
                {/* Satisfaction selection (1-5 stars) */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Trainee Course Satisfaction Rating</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button 
                                key={num}
                                type="button"
                                onClick={() => setSatisfaction(num)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border cursor-pointer transition-all
                                    ${satisfaction >= num 
                                        ? 'bg-amber-50 border-[#F59E0B] text-[#F59E0B] shadow-sm' 
                                        : 'bg-slate-50 border-slate-200 text-slate-300'}`}
                            >
                                <Star size={18} className={satisfaction >= num ? 'fill-current' : ''} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Self Competency improvement rating */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block font-bold">Self Competency Improvement Rating</label>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Rate your self-perceived capability growth after attending the training sessions</p>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button 
                                key={num}
                                type="button"
                                onClick={() => setCompetencyRating(num)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border cursor-pointer transition-all
                                    ${competencyRating >= num 
                                        ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' 
                                        : 'bg-slate-50 border-slate-200 text-slate-300'}`}
                            >
                                <span className="text-xs font-black">{num}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Text comment field */}
                <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Qualitative Feedback & Course Comments</label>
                    <textarea 
                        rows="4"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide details on how the course materials, facilitators, or logistics helped improve your operational workflow..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-[#1B3A6B] resize-none shadow-sm"
                        required
                    />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                    <button 
                        type="submit"
                        className="flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white hover:bg-blue-800 rounded-xl text-xs font-black uppercase shadow-lg transition-all cursor-pointer active:scale-95"
                    >
                        <Send size={14} /> Submit Evaluation
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostTrainingEvaluationPage;
