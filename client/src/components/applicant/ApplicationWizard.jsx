import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Upload, Trash2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const steps = ["Personal Info", "Documents Upload", "Review & Submit", "Confirmation"];

const ApplicationWizard = () => {
    const { id: vacancyId } = useParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [appId, setAppId] = useState(null);
    const [formData, setFormData] = useState({});
    const [requiredDocs, setRequiredDocs] = useState([]);
    const [uploadedDocs, setUploadedDocs] = useState([]);

    // Step 1 Logic: Get/Create Draft
    useEffect(() => {
        const init = async () => {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ vacancy_id: vacancyId })
            });
            const data = await res.json();
            setAppId(data.id);
            setFormData(data);

            // Get required docs for this vacancy
            const docRes = await fetch(`/api/vacancies/${vacancyId}`);
            const vacData = await docRes.json();
            setRequiredDocs(vacData.docs);
        };
        init();
    }, [vacancyId]);

    const handleUpload = async (docType, file) => {
        const data = new FormData();
        data.append('document_type', docType);
        data.append('file', file);

        const res = await fetch(`/api/applications/${appId}/documents`, {
            method: 'POST',
            body: data,
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            setUploadedDocs([...uploadedDocs, { document_type: docType, file_name: file.name }]);
        }
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            {/* Header & Step Tracker */}
            <div className="mb-12">
                <h1 className="text-3xl font-black text-[#1B3A6B] uppercase italic">Apply for Teaching Position</h1>
                <p className="text-slate-400 font-bold uppercase text-xs mt-1">Teacher III · V-2025-001 · DCNHS</p>
                
                <div className="flex justify-between items-center mt-10 relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10" />
                    {steps.map((label, i) => (
                        <div key={i} className="flex flex-col items-center bg-[#F1F3F6] px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                                currentStep > i + 1 ? 'bg-emerald-500 border-emerald-500 text-white' : 
                                currentStep === i + 1 ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white shadow-lg' : 
                                'bg-white border-slate-200 text-slate-300'
                            }`}>
                                {currentStep > i + 1 ? <Check size={20}/> : i + 1}
                            </div>
                            <span className="text-[10px] font-black uppercase mt-2 text-slate-400">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100"
                >
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-[#1B3A6B] uppercase mb-8 border-b pb-4">Personal Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Full Name" value={formData.full_name} disabled />
                                <Input label="Email Address" value={formData.email} />
                                <Input label="Contact Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
                                <Input label="Years of Experience" value={formData.years_experience} type="number" onChange={v => setFormData({...formData, years_experience: v})} />
                            </div>
                            <div className="flex justify-end mt-10">
                                <button onClick={nextStep} className="bg-[#1B3A6B] text-white px-10 py-3 rounded-2xl font-bold flex items-center gap-2">Continue <ChevronRight size={18}/></button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-8 border-b pb-4">
                                <h2 className="text-xl font-black text-[#1B3A6B] uppercase">Document Upload</h2>
                                <span className="text-sm font-bold text-slate-400">{uploadedDocs.length} / {requiredDocs.length} uploaded</span>
                            </div>
                            
                            {requiredDocs.map((doc, idx) => {
                                const isUploaded = uploadedDocs.find(u => u.document_type === doc.document_type);
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isUploaded ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${isUploaded ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}>
                                                <Upload size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#1B3A6B]">{doc.document_type} {doc.is_mandatory && '*'}</p>
                                                {isUploaded && <p className="text-xs text-emerald-600 font-medium">{isUploaded.file_name}</p>}
                                            </div>
                                        </div>
                                        {isUploaded ? (
                                            <button className="text-red-500 text-xs font-bold hover:underline">Remove</button>
                                        ) : (
                                            <input type="file" onChange={(e) => handleUpload(doc.document_type, e.target.files[0])} />
                                        )}
                                    </div>
                                );
                            })}
                            
                            <div className="flex justify-between mt-10">
                                <button onClick={prevStep} className="text-slate-400 font-bold flex items-center gap-2"><ChevronLeft size={18}/> Back</button>
                                <button onClick={nextStep} className="bg-[#1B3A6B] text-white px-10 py-3 rounded-2xl font-bold flex items-center gap-2">Continue <ChevronRight size={18}/></button>
                            </div>
                        </div>
                    )}

                    {/* Step 3 (Review) and Step 4 (Confirm) continue here... */}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const Input = ({ label, ...props }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label>
        <input {...props} className="bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#1B3A6B] transition-all" />
    </div>
);

export default ApplicationWizard;