import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, FileText, AlertCircle, ChevronRight, Loader2, ChevronDown } from 'lucide-react';
import { useInitialEvaluation } from '../../../hooks/useInitialEvaluation';

const RSPInitialEvaluation = () => {
    // 1. Manage Vacancy Selection
    const [vacancies, setVacancies] = useState([]);
    const [selectedVacId, setSelectedVacId] = useState(null);
    const [isVacDropdownOpen, setIsVacDropdownOpen] = useState(false);

    // 2. Load the list of vacancies on mount
    useEffect(() => {
        const fetchVacList = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/rsp/vacancies', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.length > 0) {
                    setVacancies(data);
                    setSelectedVacId(data[0].id); // Auto-select the first vacancy
                }
            } catch (e) {
                console.error("Failed to load vacancies", e);
            }
        };
        fetchVacList();
    }, []);

    // 3. Connect to our Evaluation Hook
    const { 
        queueData, 
        selectedApplicant, 
        setSelectedApplicant, 
        details, 
        fetchQueue, 
        fetchDetails 
    } = useInitialEvaluation(selectedVacId);

    const [decisionLoading, setDecisionLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    // --- HANDLERS ---
    const handleCriteriaToggle = async (criterionId, passed) => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/rsp/evaluation/applicant/${selectedApplicant.id}/criterion/${criterionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ passed })
        });
        fetchDetails(selectedApplicant.id);
    };

    const handleVerifyDoc = async (docId) => {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/rsp/evaluation/document/${docId}/verify`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchDetails(selectedApplicant.id);
    };

    const handleDecision = async (decision) => {
        if (decision === 'disqualified' && !window.confirm("Disqualify this applicant? This action is difficult to reverse.")) return;
        
        setDecisionLoading(true);
        setServerError("");
        const token = localStorage.getItem('token');
        
        const res = await fetch(`http://localhost:5000/api/rsp/evaluation/applicant/${selectedApplicant.id}/decision`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ decision })
        });

        const data = await res.json();
        if (res.ok) {
            alert(`Applicant successfully marked as ${decision}.`);
            fetchQueue(); // Refresh the list
        } else {
            setServerError(data.message);
        }
        setDecisionLoading(false);
    };

    // --- RENDER HELPERS ---
    if (!selectedVacId) return (
        <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Loader2 className="animate-spin mx-auto text-slate-300 mb-4" size={40} />
            <p className="text-slate-600 font-black uppercase tracking-widest">Searching for active vacancies...</p>
        </div>
    );

    if (!queueData) return (
        <div className="p-20 text-center">
            <Loader2 className="animate-spin mx-auto text-black mb-4" size={40} />
            <p className="text-black font-bold">Loading Applicant Queue...</p>
        </div>
    );

    return (
        <div className="space-y-6 select-none pb-20">
            
            {/* 1. HEADER SECTION WITH VACANCY PICKER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                <div className="relative">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Currently Evaluating:</p>
                    <button 
                        onClick={() => setIsVacDropdownOpen(!isVacDropdownOpen)}
                        className="flex items-center gap-3 text-lg font-black text-black uppercase italic hover:opacity-70 transition-opacity"
                    >
                        {queueData.vacancy?.position_title} ({queueData.vacancy?.ref_no})
                        <ChevronDown size={20} className={`transition-transform ${isVacDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isVacDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute left-0 mt-2 w-full min-w-[300px] bg-white border border-slate-200 shadow-2xl rounded-2xl z-[100] overflow-hidden"
                            >
                                {vacancies.map(v => (
                                    <button 
                                        key={v.id}
                                        onClick={() => { setSelectedVacId(v.id); setIsVacDropdownOpen(false); }}
                                        className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors border-b last:border-0"
                                    >
                                        <p className="text-xs font-black text-black uppercase">{v.position_title}</p>
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{v.ref_no} · {v.assigned_school}</p>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-black"><Clock size={20} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-600 uppercase leading-none">Processing Time</p>
                        <p className="text-sm font-black text-black mt-0.5">{queueData.processing_time_label}</p>
                    </div>
                </div>
            </div>

            {/* 2. TWO PANEL EVALUATION AREA */}
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
                
                {/* LEFT: APPLICANT QUEUE */}
                <div className="w-full lg:w-[350px] shrink-0">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xs font-black text-black uppercase tracking-widest">Applicant Queue</h3>
                            <p className="text-[10px] text-slate-600 font-bold uppercase">{queueData.queue.length} Total Applicants</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 sidebar-scroll">
                            {queueData.queue.length === 0 ? (
                                <div className="p-10 text-center text-slate-300 text-xs font-bold uppercase">No pending applicants</div>
                            ) : (
                                queueData.queue.map(app => {
                                    const isSelected = selectedApplicant?.id === app.id;
                                    const dotColor = app.status === 'qualified' ? 'bg-emerald-500' : (app.status === 'disqualified' ? 'bg-red-500' : 'bg-amber-500');
                                    
                                    return (
                                        <button 
                                            key={app.id} 
                                            onClick={() => { setSelectedApplicant(app); setServerError(""); }}
                                            className={`w-full text-left p-4 rounded-2xl transition-all mb-1 flex items-center justify-between ${isSelected ? 'bg-[#1B3A6B] text-white shadow-lg' : 'hover:bg-slate-50 text-black'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ${app.status === 'submitted' ? 'animate-pulse' : ''}`} />
                                                <div>
                                                    <p className="text-sm font-black uppercase leading-tight">{app.full_name}</p>
                                                    <p className={`text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-600'}`}>{app.applicant_code}</p>
                                                </div>
                                            </div>
                                            {['qualified', 'disqualified'].includes(app.status) && (
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                    {app.status}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: EVALUATION CONTENT */}
                {selectedApplicant ? (
                    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-24 sidebar-scroll relative">
                        
                        {/* A. STANDARDS CARD */}
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-lg font-black text-black uppercase italic">Minimum Qualification Standards</h3>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">DepEd-CSC Standards</span>
                            </div>
                            <div className="p-8 space-y-4">
                                {details.criteria.map(c => (
                                    <div key={c.criterion_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-sm font-black text-black uppercase leading-tight">{c.criterion_label}</p>
                                            {c.is_required && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">Required</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleCriteriaToggle(c.criterion_id, true)}
                                                className={`p-2 rounded-full transition-all border-2 ${c.passed === 1 ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-200 hover:border-emerald-200 hover:text-emerald-200'}`}
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>
                                            <button 
                                                onClick={() => handleCriteriaToggle(c.criterion_id, false)}
                                                className={`p-2 rounded-full transition-all border-2 ${c.passed === 0 ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-200 hover:border-red-200 hover:text-red-200'}`}
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* B. DOCUMENTS CARD */}
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-lg font-black text-black uppercase italic">Required Documents</h3>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {details.documents.filter(d => d.verification_status === 'verified').length}/{details.documents.length} Verified
                                </span>
                            </div>
                            <div className="p-8 space-y-3">
                                {details.documents.map(doc => {
                                    const isVerified = doc.verification_status === 'verified';
                                    const isPending = doc.verification_status === 'uploaded_pending_review';
                                    
                                    return (
                                        <div 
                                            key={doc.id} 
                                            onClick={() => isPending && handleVerifyDoc(doc.id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isVerified ? 'bg-emerald-50 border-emerald-100' : (isPending ? 'bg-blue-50 border-blue-100 cursor-pointer hover:shadow-md' : 'bg-white border-slate-100 opacity-60')}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${isVerified ? 'bg-emerald-500 text-white' : (isPending ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-100 text-slate-300')}`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-black uppercase ${isVerified ? 'text-emerald-700' : (isPending ? 'text-blue-700' : 'text-slate-600')}`}>{doc.document_type}</p>
                                                    <p className="text-[10px] font-bold opacity-50 tracking-tighter">Click to View File</p>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${isVerified ? 'text-emerald-600' : (isPending ? 'text-blue-600 underline' : 'text-slate-300')}`}>
                                                {isVerified ? 'Verified ✓' : (isPending ? 'Click to Verify' : 'Not Uploaded')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* C. FIXED STICKY ACTION BAR */}
                        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50">
                            <AnimatePresence>
                                {serverError && (
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl mb-4 flex items-center gap-3">
                                        <AlertCircle size={24} />
                                        <p className="text-xs font-bold leading-tight">{serverError}</p>
                                        <button onClick={() => setServerError("")} className="ml-auto text-white/50 hover:text-white uppercase text-[10px] font-black">Dismiss</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <div className="bg-[#1B3A6B] p-4 rounded-[2rem] shadow-2xl border border-white/10 flex items-center justify-between text-white">
                                <p className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-70">Evaluated: {queueData.queue.filter(a => a.status !== 'submitted').length} / {queueData.queue.length}</p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleDecision('disqualified')}
                                        disabled={decisionLoading}
                                        className="px-6 py-3 border border-white/20 hover:bg-red-500 hover:border-red-500 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                        ✕ Disqualify
                                    </button>
                                    <button 
                                        onClick={() => handleDecision('qualified')}
                                        disabled={decisionLoading}
                                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                                    >
                                        {decisionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                        Mark as Qualified
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-white rounded-[2rem] flex items-center justify-center border border-dashed border-slate-200">
                        <p className="text-slate-600 font-bold uppercase tracking-widest text-sm italic">Select an applicant from the queue to start screening</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RSPInitialEvaluation;
