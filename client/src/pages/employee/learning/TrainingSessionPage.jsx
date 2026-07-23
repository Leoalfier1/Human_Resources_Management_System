import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, BookOpen, Clock, CheckSquare } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const TrainingSessionPage = () => {
    const { token } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { enrollment } = location.state || {};
    const [checkedIn, setCheckedIn] = useState(false);

    if (!enrollment) {
        return (
            <div className="text-center py-10 text-slate-600 font-bold uppercase">
                No active session context found.
            </div>
        );
    }

    const handleCheckIn = async () => {
        const today = new Date().toISOString().split('T')[0];
        try {
            const res = await fetch(`http://localhost:5000/api/ld/enrollments/${enrollment.enrollment_id}/attendance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ date: today })
            });
            if (res.ok) {
                setCheckedIn(true);
                alert("Self attendance check-in logged successfully!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const modulesList = [
        { id: 1, title: "PRIME-HRM Level II Compliance Standards Overview", time: "Day 1 (08:30 AM - 12:00 PM)", status: "Active" },
        { id: 2, title: "Validation Portfolios & Documentation Formats", time: "Day 2 (09:00 AM - 04:00 PM)", status: "Locked" },
        { id: 3, title: "Self Audit Simulation & Compliance Reviews", time: "Day 3 (10:00 AM - 02:00 PM)", status: "Locked" }
    ];

    return (
        <div className="space-y-6 select-none max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/employee/learning')}
                        className="p-2 bg-white border border-slate-100 rounded-full hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <ArrowLeft size={16} className="text-black" />
                    </button>
                    <div>
                        <h2 className="text-sm font-black text-black uppercase tracking-wider">{enrollment.title}</h2>
                        <p className="text-[10px] text-slate-600 font-bold uppercase"> TNA & Mapped Objectives Classroom</p>
                    </div>
                </div>

                <button 
                    onClick={handleCheckIn}
                    disabled={checkedIn}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1B3A6B] disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-100 hover:bg-blue-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer border active:scale-95"
                >
                    <CheckSquare size={13} /> {checkedIn ? "Checked In" : "Self Attendance Check-In"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Course outline schedule */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-50 pb-3 flex items-center gap-2">
                        <BookOpen size={16} className="text-black" /> Course Syllabus & Session Outline
                    </h3>

                    <div className="space-y-4">
                        {modulesList.map((m) => (
                            <div key={m.id} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 flex justify-between items-center gap-4">
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-black text-black uppercase tracking-tight">{m.title}</h4>
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> {m.time}</p>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border
                                    ${m.status === 'Active' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                                >
                                    {m.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Course specs info */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">
                        Trainee Overview & Speakers
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex gap-3 text-xs">
                            <User size={16} className="text-slate-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-wider">Instructor / Facilitator</p>
                                <p className="font-black text-slate-750">{enrollment.facilitator}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 text-xs">
                            <Calendar size={16} className="text-slate-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-wider">Schedule Period</p>
                                <p className="font-black text-slate-750">{enrollment.schedule_date}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TrainingSessionPage;
