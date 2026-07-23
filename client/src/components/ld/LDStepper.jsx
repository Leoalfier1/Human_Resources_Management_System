import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';

const LDStepper = ({ currentStep = 1, stepsStatus = [], orientation = 'horizontal' }) => {
    // 5 sequential steps of PRIME-HRM L&D module
    const steps = [
        { label: "Needs Assessment (TNA)", desc: "Conducting survey & gap audits" },
        { label: "L&D Objectives", desc: "Setting competency targets" },
        { label: "Planning & Design", desc: "Selecting methodologies & resources" },
        { label: "Implementation", desc: "Tracking sessions & attendance" },
        { label: "Impact Evaluation", desc: "Assessing competence growth" }
    ];

    const getStatusIcon = (status, isActive) => {
        if (status === 'completed') {
            return <CheckCircle2 className="text-[#16A34A] fill-[#16A34A]/10" size={18} />;
        }
        if (status === 'in_progress' || isActive) {
            return <PlayCircle className="text-[#F59E0B] fill-[#F59E0B]/10 animate-pulse" size={18} />;
        }
        return <Circle className="text-slate-300" size={18} />;
    };

    const getStatusColor = (status, isActive) => {
        if (status === 'completed') return 'border-[#16A34A] text-slate-700';
        if (status === 'in_progress' || isActive) return 'border-[#F59E0B] text-slate-800 font-bold';
        return 'border-slate-200 text-slate-400';
    };

    if (orientation === 'vertical') {
        return (
            <div className="flex flex-col gap-6 relative pl-3 select-none">
                {/* Connecting Line */}
                <div className="absolute left-[21px] top-3 bottom-3 w-0.5 bg-slate-200" />

                {steps.map((step, idx) => {
                    const stepNum = idx + 1;
                    const status = stepsStatus[idx] || (stepNum < currentStep ? 'completed' : stepNum === currentStep ? 'in_progress' : 'not_started');
                    const isActive = stepNum === currentStep;

                    return (
                        <div key={idx} className="flex gap-4 relative z-10">
                            <div className="flex flex-col items-center shrink-0">
                                <div className={`w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center shadow-sm ${getStatusColor(status, isActive)}`}>
                                    {getStatusIcon(status, isActive)}
                                </div>
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <h4 className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-[#1B3A6B]' : 'text-slate-700'}`}>
                                    {step.label}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{step.desc}</p>
                                <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full border mt-1
                                    ${status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                      'bg-slate-50 text-slate-400 border-slate-100'}`}
                                >
                                    {status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Horizontal layout (Admin view row)
    return (
        <div className="w-full flex items-center select-none">
            {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const status = stepsStatus[idx] || (stepNum < currentStep ? 'completed' : stepNum === currentStep ? 'in_progress' : 'not_started');
                const isActive = stepNum === currentStep;
                const isLast = idx === steps.length - 1;

                return (
                    <React.Fragment key={idx}>
                        {/* Circle and details */}
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center shadow-sm shrink-0 ${getStatusColor(status, isActive)}`}>
                                {getStatusIcon(status, isActive)}
                            </div>
                            <div className="hidden xl:block text-left pr-2 shrink-0">
                                <p className={`text-[10px] font-black uppercase tracking-tight leading-none ${isActive ? 'text-[#1B3A6B]' : 'text-slate-600'}`}>
                                    {step.label.split(' ')[0]}...
                                </p>
                                <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">
                                    {status === 'completed' ? 'Done' : status === 'in_progress' ? 'Active' : 'Muted'}
                                </span>
                            </div>
                        </div>

                        {/* Line connector */}
                        {!isLast && (
                            <div className="flex-1 h-0.5 mx-2 bg-slate-100 relative min-w-[20px]">
                                <motion.div 
                                    className={`absolute left-0 top-0 h-full rounded ${status === 'completed' ? 'bg-[#16A34A]' : status === 'in_progress' ? 'bg-[#F59E0B]' : 'bg-slate-200'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 0.6 }}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default LDStepper;
