import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star, BookOpen, AlertCircle } from 'lucide-react';
import LDStepper from '../../../components/ld/LDStepper';

const MyProgramStatusPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { enrollment } = location.state || {};

    if (!enrollment) {
        return (
            <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center text-xs font-bold text-slate-600 uppercase flex flex-col items-center gap-2 shadow-sm">
                <AlertCircle size={24} className="text-slate-300" />
                No training enrollment details context was loaded. 
                <button onClick={() => navigate('/employee/learning')} className="mt-4 px-4 py-2 bg-[#1B3A6B] text-white rounded-xl">Go Back</button>
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
                    <h2 className="text-sm font-black text-black uppercase tracking-wider">{enrollment.title}</h2>
                    <p className="text-[10px] text-slate-600 font-bold uppercase">PRIME-HRM Level II Course Timeline</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Vertical Stepper Stage Progress */}
                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-50 pb-3">
                        Training Program Workflow Stages
                    </h3>

                    {/* Vertical LDStepper */}
                    <LDStepper 
                        stepsStatus={[enrollment.step_1_status, enrollment.step_2_status, enrollment.step_3_status, enrollment.step_4_status, enrollment.step_5_status]} 
                        orientation="vertical" 
                    />
                </div>

                {/* Status action block card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
                    <div>
                        <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">
                            Classroom Action Center
                        </h3>
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Actions matching the current course stage</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        {/* Attendance / Join sessions */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Active Session Classroom</span>
                            <p className="text-xs font-semibold text-black leading-relaxed">Attendance logs and lecture sheets are accessible during the implementation phase.</p>
                            
                            <button 
                                onClick={() => navigate('/employee/learning/session', { state: { enrollment } })}
                                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1B3A6B] hover:bg-blue-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                                <Play size={12} fill="currentColor" /> Open Classroom
                            </button>
                        </div>

                        {/* Evaluate feedback surveys */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block font-bold">Outcome & Impact Survey</span>
                            <p className="text-xs font-semibold text-black leading-relaxed">Submit post-training feedback audits to measure competency improvement scores.</p>
                            
                            <button 
                                onClick={() => navigate('/employee/learning/evaluate', { state: { enrollment } })}
                                disabled={enrollment.enrollment_status === 'completed'}
                                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#F59E0B] hover:bg-[#d97706] disabled:bg-slate-200 disabled:text-slate-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                                <Star size={12} /> Submit Evaluation
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MyProgramStatusPage;
