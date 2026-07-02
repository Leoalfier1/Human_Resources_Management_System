import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import Step1PersonalInfo from '../../components/applicant/wizard/Step1PersonalInfo';
import Step2Documents from '../../components/applicant/wizard/Step2Documents';
import Step3Review from '../../components/applicant/wizard/Step3Review';
import { API_BASE } from '../../utils/api';
import Step4Confirmation from '../../components/applicant/wizard/Step4Confirmation';

const ApplicationWizard = () => {
    const { id } = useParams(); // vacancy_id
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [vacancy, setVacancy] = useState(null);
    const [applicationId, setApplicationId] = useState(null);
    const [refNo, setRefNo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch vacancy info for the persistent header
    useEffect(() => {
        const fetchVacancy = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/vacancies/${id}`);
                if (!res.ok) throw new Error('Vacancy not found');
                const data = await res.json();
                setVacancy(data);

                if (data.computed_status === 'closed') {
                    navigate(`/jobs/${id}`);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchVacancy();
    }, [id, navigate]);

    // Check if user already submitted an application
    useEffect(() => {
        const checkExisting = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/vacancies/${id}/has-applied`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.hasApplied) {
                        navigate(`/jobs/${id}`);
                    }
                }
            } catch (err) {
                console.error('Error checking existing app status');
            }
        };
        checkExisting();
    }, [id, navigate]);

    const steps = [
        { num: 1, label: 'Personal Info' },
        { num: 2, label: 'Documents Upload' },
        { num: 3, label: 'Review & Submit' },
        { num: 4, label: 'Confirmation' }
    ];

    if (loading) return (
        <div className="min-h-screen bg-[#F1F3F6] flex justify-center pt-32">
            <div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin"/>
        </div>
    );
    if (error || !vacancy) return (
        <div className="min-h-screen bg-[#F1F3F6] flex justify-center pt-32 font-black text-slate-400 uppercase tracking-widest">
            {error || 'Vacancy not found'}
        </div>
    );

    // Position type label for the header badge
    const posTypeLabel = vacancy.position_type === 'non_teaching' ? 'Non-Teaching' : 'Teaching';
    const posTypeBadgeClass = vacancy.position_type === 'non_teaching'
        ? 'bg-sky-100 text-sky-700'
        : 'bg-amber-100 text-amber-700';

    return (
        <div className="min-h-screen bg-[#F1F3F6] pb-24 font-sans selection:bg-blue-100">
            {/* ── PERSISTENT HEADER ───────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        {currentStep < 4 && (
                            <Link
                                to={`/jobs/${id}`}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1B3A6B] flex items-center gap-1 mb-2 transition-colors"
                            >
                                <ArrowLeft size={12} /> Cancel & Return
                            </Link>
                        )}
                        <h1 className="text-xl font-black text-[#1B3A6B] uppercase italic leading-none mb-1">
                            Apply for Position
                        </h1>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2 flex-wrap">
                            <span className="text-[#D6402F] uppercase tracking-tight">{vacancy.position_title}</span>
                            <span className="text-slate-300">•</span>
                            <span>Ref: {vacancy.ref_no}</span>
                            <span className="text-slate-300">•</span>
                            <span className="truncate max-w-[200px] sm:max-w-sm">{vacancy.school_name || vacancy.assigned_school}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${posTypeBadgeClass}`}>
                                {posTypeLabel}
                            </span>
                        </p>
                    </div>

                    {/* Step Tracker */}
                    <div className="flex items-center">
                        {steps.map((step, index) => {
                            const isActive = step.num === currentStep;
                            const isCompleted = step.num < currentStep;
                            const isLast = index === steps.length - 1;

                            return (
                                <div key={step.num} className="flex items-center">
                                    <div className="relative flex flex-col items-center">
                                        <motion.div
                                            animate={{
                                                backgroundColor: isCompleted ? '#22c55e' : isActive ? '#1B3A6B' : '#f1f5f9',
                                                borderColor: isCompleted ? '#22c55e' : isActive ? '#1B3A6B' : '#e2e8f0',
                                                color: (isCompleted || isActive) ? '#ffffff' : '#94a3b8'
                                            }}
                                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black z-10"
                                        >
                                            {isCompleted ? <Check size={14} strokeWidth={3} /> : step.num}
                                        </motion.div>
                                        <span className={`absolute top-10 text-[8px] font-black uppercase tracking-widest whitespace-nowrap
                                            ${isActive ? 'text-[#1B3A6B]' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                                            {step.label}
                                        </span>
                                    </div>

                                    {!isLast && (
                                        <div className="w-8 sm:w-16 h-1 mx-2 bg-slate-100 rounded-full overflow-hidden relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: isCompleted ? '100%' : '0%' }}
                                                className="absolute inset-0 bg-green-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── STEP CONTENT ─────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-6 mt-12">
                {currentStep === 1 && (
                    <Step1PersonalInfo
                        applicationId={applicationId}
                        setApplicationId={setApplicationId}
                        vacancy={vacancy}
                        onNext={() => setCurrentStep(2)}
                    />
                )}
                {currentStep === 2 && (
                    <Step2Documents
                        applicationId={applicationId}
                        vacancyId={vacancy.id}
                        vacancyPositionType={vacancy.position_type}   // ← NEW PROP
                        onPrev={() => setCurrentStep(1)}
                        onNext={() => setCurrentStep(3)}
                    />
                )}
                {currentStep === 3 && (
                    <Step3Review
                        applicationId={applicationId}
                        onPrev={() => setCurrentStep(2)}
                        onNext={(generatedRef) => {
                            setRefNo(generatedRef);
                            setCurrentStep(4);
                        }}
                    />
                )}
                {currentStep === 4 && (
                    <Step4Confirmation
                        applicationId={applicationId}
                        vacancy={vacancy}
                        refNo={refNo}
                    />
                )}
            </div>
        </div>
    );
};

export default ApplicationWizard;