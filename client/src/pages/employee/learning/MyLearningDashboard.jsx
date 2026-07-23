import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { BookOpen, Award, CheckCircle, GraduationCap, ChevronRight, AlertCircle } from 'lucide-react';
import LDStepper from '../../../components/ld/LDStepper';

const MyLearningDashboard = () => {
    const { token, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [enrolled, setEnrolled] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/ld/employee/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEnrolled(data.enrolled || []);
                setRecommended(data.recommended || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchDashboard();
    }, [token]);

    const handleEnroll = async (progId) => {
        try {
            const res = await fetch('http://localhost:5000/api/ld/employee/enroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ld_program_id: progId })
            });
            if (res.ok) {
                alert("Successfully enrolled in training program!");
                fetchDashboard();
            } else {
                const errData = await res.json();
                alert(errData.message || "Failed to enroll");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (status === 'in_progress') return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-slate-100 text-slate-800 border-slate-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-xs font-black uppercase text-slate-600">
                Loading My Learning Profile...
            </div>
        );
    }

    return (
        <div className="space-y-8 select-none">
            {/* Top Quick Actions bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
                <div>
                    <h2 className="text-sm font-black text-black uppercase tracking-wider">Professional Learning Dashboard</h2>
                    <p className="text-[10px] text-slate-600 font-bold uppercase mt-0.5">PRIME-HRM Level II Trainee Portal</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {isAdmin && (
                        <button 
                            onClick={() => navigate('/ld/dashboard')}
                            className="px-5 py-2.5 bg-white border border-[#1B3A6B]/20 text-black hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                            Switch to Admin
                        </button>
                    )}
                    <button 
                        onClick={() => navigate('/employee/learning/tna')}
                        className="px-5 py-2.5 bg-white border border-[#1B3A6B]/20 text-black hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm cursor-pointer active:scale-95 transition-all"
                    >
                        TNA Survey Gaps
                    </button>
                    <button 
                        onClick={() => navigate('/employee/learning/catalog')}
                        className="px-5 py-2.5 bg-[#D6402F] text-white hover:bg-red-700 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg cursor-pointer active:scale-95 transition-all"
                    >
                        Browse Course Catalog
                    </button>
                    <button 
                        onClick={() => navigate('/pillars')}
                        className="px-5 py-2.5 bg-white border border-red-200 text-[#D6402F] hover:bg-red-50 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm cursor-pointer active:scale-95 transition-all"
                    >
                        Back to Pillars
                    </button>
                </div>
            </div>

            {/* Enrolled programs stepper progress */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-50 pb-3 flex items-center gap-2">
                    <GraduationCap size={16} className="text-black" /> My Current Training & Objectives Tracking
                </h3>

                <div className="space-y-6">
                    {enrolled.map((en) => (
                        <div key={en.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                            <div className="space-y-1.5 xl:max-w-[30%] shrink-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-black text-black uppercase tracking-tight">{en.title}</h4>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(en.enrollment_status)}`}>
                                        {en.enrollment_status}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Methodology: {en.methodology} &middot; Schedule: {en.schedule_date}</p>
                                
                                <button 
                                    onClick={() => navigate('/employee/learning/status', { state: { enrollment: en } })}
                                    className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1 pt-1 transition-colors cursor-pointer"
                                >
                                    Open Training Details <ChevronRight size={12} />
                                </button>
                            </div>

                            {/* Stepper progress indicator */}
                            <div className="w-full xl:max-w-[65%] shrink-0">
                                <LDStepper stepsStatus={[en.step_1_status, en.step_2_status, en.step_3_status, en.step_4_status, en.step_5_status]} />
                            </div>
                        </div>
                    ))}
                    {enrolled.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-600 font-bold uppercase flex flex-col items-center gap-2">
                            <AlertCircle size={22} className="text-slate-300" />
                            You are not enrolled in any training program.
                        </div>
                    )}
                </div>
            </div>

            {/* Recommended programs grid list */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-50 pb-3 flex items-center gap-2">
                    <BookOpen size={16} className="text-black" /> Recommended Development Programs
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommended.map((rec) => (
                        <div key={rec.id} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-start gap-4">
                                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                        {rec.methodology}
                                    </span>
                                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">{rec.schedule_date}</span>
                                </div>
                                <h4 className="text-xs font-black text-black uppercase tracking-tight">{rec.title}</h4>
                                <p className="text-[11px] text-slate-800 font-medium leading-relaxed italic">
                                    "{rec.description || 'No summary outlined for this module.'}"
                                </p>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                <span className="text-[9px] text-slate-600 font-bold uppercase">Facilitator: {rec.facilitator}</span>
                                <button 
                                    onClick={() => handleEnroll(rec.id)}
                                    className="px-4 py-2 bg-[#1B3A6B] hover:bg-blue-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer active:scale-95"
                                >
                                    Enroll Course
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyLearningDashboard;
