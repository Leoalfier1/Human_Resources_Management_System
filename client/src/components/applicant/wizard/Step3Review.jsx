import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, User, Phone, Mail, MapPin, Briefcase, FileText, Loader2 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

const Step3Review = ({ applicationId, onNext, onPrev }) => {
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/applications/${applicationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setApplication(data);
                }
            } catch (error) {
                console.error("Error fetching application details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApplication();
    }, [applicationId]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/applications/${applicationId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'submitted' })
            });

            const data = await res.json();
            if (res.ok) {
                // Pass the generated ref_no to the next step
                onNext(data.ref_no);
            } else {
                throw new Error(data.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to submit application. Please try again.');
            setSubmitting(false);
        }
    };

    if (loading || !application) return <div className="text-center py-20 text-slate-400 font-bold">Loading review data...</div>;

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
        >
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6">
                <h3 className="font-black text-xl text-[#1B3A6B] uppercase italic mb-8 pb-4 border-b border-slate-100">
                    Review Your Application
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Personal Info Summary */}
                    <div>
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                            <User size={14} className="text-[#1B3A6B]" /> Personal Information
                        </h4>
                        
                        <div className="space-y-5">
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 mt-1 text-slate-400"><User size={14}/></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                    <p className="text-sm font-bold text-[#1B3A6B]">{application.full_name}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 mt-1 text-slate-400"><Mail size={14}/></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                    <p className="text-sm font-bold text-[#1B3A6B]">{application.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 mt-1 text-slate-400"><Phone size={14}/></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Number</p>
                                    <p className="text-sm font-bold text-[#1B3A6B]">{application.phone}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 mt-1 text-slate-400"><MapPin size={14}/></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current School / Station</p>
                                    <p className="text-sm font-bold text-[#1B3A6B]">{application.current_school}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 mt-1 text-slate-400"><Briefcase size={14}/></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Years of Experience</p>
                                    <p className="text-sm font-bold text-[#1B3A6B]">{application.years_experience} years</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents Summary */}
                    <div>
                        <h4 className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                            <span className="flex items-center gap-2"><FileText size={14} className="text-[#1B3A6B]" /> Documents Uploaded ({application.documents?.length || 0})</span>
                        </h4>

                        <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
                            {application.documents?.map(doc => (
                                <div key={doc.id} className="flex items-center gap-3">
                                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-[#1B3A6B] uppercase truncate">{doc.document_type}</p>
                                        <p className="text-[10px] font-bold text-slate-500 truncate">{doc.file_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Certification Box */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8 text-center">
                <p className="text-xs font-bold text-[#1B3A6B] leading-relaxed max-w-2xl mx-auto">
                    By submitting, you certify that all information and documents provided are true and correct. 
                    Any misrepresentation shall be ground for disqualification.
                </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <button
                    onClick={onPrev}
                    disabled={submitting}
                    className="text-xs font-black text-slate-400 hover:text-[#1B3A6B] uppercase tracking-widest transition-colors px-4 py-2"
                >
                    ← Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`flex items-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg
                        ${submitting 
                            ? 'bg-slate-300 text-white cursor-not-allowed'
                            : 'bg-[#D6402F] hover:bg-[#b53526] text-white shadow-red-900/20'}`}
                >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Submit Application →
                </button>
            </div>
        </motion.div>
    );
};

export default Step3Review;
