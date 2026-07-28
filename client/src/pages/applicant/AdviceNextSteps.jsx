import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Star, Download, 
    AlertCircle, Clock, Lock, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/api';

const AdviceNextSteps = () => {
    const { user } = useAuth();
    const [appId, setAppId] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);          // { message, type: 'access'|'error' }
    const [retryCount, setRetryCount] = useState(0);  // increment to re-trigger fetch

    // 1. Resolve application ID
    useEffect(() => {
        const resolveId = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/applications/my-latest`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setAppId(json.applicationId);
                } else {
                    setError('No active applications found.');
                    setLoading(false);
                }
            } catch (err) {
                setError('Could not connect to the server.');
                setLoading(false);
            }
        };
        resolveId();
    }, []);

    // 2. Fetch advice data + setup socket
    useEffect(() => {
        if (!appId) return;

        const fetchAdvice = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/applications/${appId}/advice`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                    setError(null);
                } else if (res.status === 403) {
                    setError({ message: 'Congratulatory advice is only available once you reach Stage 9 of the RSP process.', type: 'access' });
                } else {
                    const json = await res.json().catch(() => ({}));
                    setError({ message: json.message || 'Something went wrong. Please try again later.', type: 'error' });
                }
            } catch (err) {
                setError({ message: 'Could not connect to the server.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchAdvice();
    }, [appId, retryCount]);

    // 4. Handle PDF download
    const handleDownloadPDF = async () => {
        if (!appId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/applications/${appId}/advice/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Congratulatory_Advice.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Could not download PDF.');
            }
        } catch (err) {
            alert('Download error.');
        }
    };

    // --- RENDER STATES ---

    if (loading) return (
        <div className="p-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="text-slate-300" size={40} />
            </motion.div>
            <p className="mt-4 text-slate-400 font-black uppercase tracking-widest text-xs">Preparing your official advice...</p>
        </div>
    );

    // 403 STAGE GATE — Locked / Not yet issued
    if (error?.type === 'access') return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-10 select-none">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 max-w-lg"
            >
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-[#1B3A6B] uppercase italic tracking-tight">Access Restricted</h2>
                <p className="text-slate-500 mt-4 font-medium leading-relaxed">{error.message}</p>
                <div className="mt-8 pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Stage 9: Selection &amp; Issuance Required</p>
                </div>
            </motion.div>
        </div>
    );

    // 500 SERVER ERROR — Neutral error state with retry
    if (error?.type === 'error') return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-10 select-none">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 max-w-lg"
            >
                <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-400">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-700 uppercase italic tracking-tight">Something Went Wrong</h2>
                <p className="text-slate-500 mt-4 font-medium leading-relaxed">{error.message}</p>
                <button
                    onClick={() => { setLoading(true); setError(null); setRetryCount(c => c + 1); }}
                    className="mt-8 px-8 py-3 bg-[#1B3A6B] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#15305a] transition-all active:scale-95"
                >
                    Try Again
                </button>
            </motion.div>
        </div>
    );

    const { letter, settings } = data;

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto px-6 pb-20 space-y-8 select-none"
        >
            {/* PAGE HEADER */}
            <div className="pt-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Phase 4 · Post-Selection</p>
                <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic tracking-tight">Congratulatory Advice & Next Steps</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">You have been selected! Please review the advice below.</p>
            </div>

            {/* TOP HERO BANNER */}
            <div className="bg-gradient-to-br from-[#1B3A6B] via-[#1B3A6B] to-[#D6402F] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12">
                    <Star size={200} fill="currentColor" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-white/20 p-1.5 rounded-lg border border-white/20">
                                <Star size={14} fill="currentColor" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Official Selection Notice</span>
                        </div>
                        <h1 className="text-5xl font-black uppercase italic leading-none tracking-tighter">You Have Been Selected</h1>
                        <p className="text-sm opacity-90 mt-4 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                            {letter.position_title}{letter.subject ? ` (${letter.subject})` : ''} <ChevronRight size={14}/> {letter.school_name}
                        </p>
                        {letter.effective_date && (
                            <p className="text-xs opacity-70 mt-2 font-bold uppercase tracking-widest">
                                Effective Date: {new Date(letter.effective_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                    <button 
                        onClick={handleDownloadPDF}
                        className="bg-white text-[#1B3A6B] px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all shadow-2xl active:scale-95"
                    >
                        <Download size={18} /> Download PDF Advice
                    </button>
                </div>
            </div>

            {/* THE FORMAL LETTER CARD */}
            <div>
                <div className="bg-white p-12 md:p-20 rounded-[3rem] shadow-sm border border-slate-100 font-serif text-slate-800 leading-relaxed shadow-inner max-w-4xl mx-auto">
                    {/* Letterhead */}
                    <div className="text-center mb-8 border-b-2 border-[#1B3A6B] pb-6">
                        {/* DepEd Seal */}
                        <div className="relative w-[96px] h-[96px] mx-auto mb-3">
                            <img
                                src="/assets/deped-seal.png"
                                alt="DepEd Seal"
                                className="w-full h-full object-contain"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                            <div className="hidden w-full h-full rounded-full border-2 border-[#1B3A6B] items-center justify-center bg-white">
                                <span className="text-[7px] font-bold text-[#1B3A6B] text-center leading-tight">DEPED<br />SEAL</span>
                            </div>
                        </div>
                        <p style={{ fontFamily: '"Times New Roman", Georgia, serif', fontStyle: 'italic', fontSize: '12pt', color: '#1a1a1a', marginBottom: '1px', lineHeight: '1.4' }}>
                            Republic of the Philippines
                        </p>
                        <p style={{ fontFamily: '"Old English Text MT", "UnifrakturMaguntia", "Times New Roman", serif', fontSize: '17pt', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '1px', lineHeight: '1.3', letterSpacing: '0.5px' }}>
                            Department of Education
                        </p>
                        <p style={{ fontFamily: '"Times New Roman", Georgia, serif', fontVariant: 'small-caps', fontSize: '10pt', color: '#1a1a1a', marginBottom: '1px', letterSpacing: '0.5px', lineHeight: '1.4' }}>
                            Region IX, Zamboanga Peninsula
                        </p>
                        <p style={{ fontFamily: '"Times New Roman", Georgia, serif', fontVariant: 'small-caps', fontSize: '10.5pt', fontWeight: 'bold', color: '#1B3A6B', letterSpacing: '0.5px', lineHeight: '1.4' }}>
                            {settings?.office_name || 'Schools Division of Dapitan City'}
                        </p>
                    </div>

                    {/* Date & Addressee */}
                    <div className="mb-12 space-y-1">
                        <p className="font-bold text-sm mb-8">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p className="font-black text-xl uppercase tracking-tighter text-[#1B3A6B]">{letter.full_name}</p>
                        <p className="text-sm uppercase font-bold text-slate-500">{letter.assigned_school}</p>
                        <p className="text-sm uppercase font-bold text-slate-500">Dapitan City, Zamboanga Peninsula</p>
                    </div>

                    <p className="font-bold text-lg mb-6">
                        Dear {letter.salutation || 'Mr./Ms.'} {(() => {
                            const rawLast = letter.full_name?.trim().split(/\s+/).pop() || '';
                            return rawLast.charAt(0).toUpperCase() + rawLast.slice(1).toLowerCase();
                        })()},
                    </p>
                    
                    <div className="space-y-6 text-justify text-base">
                        <p>
                            Congratulations! It is with great pleasure that I inform you of your selection for appointment to the position of 
                            <strong className="mx-1 uppercase underline text-[#1B3A6B] tracking-tight">{letter.position_title}{letter.subject ? ` (${letter.subject})` : ''}</strong> 
                            under Item Number <strong>{letter.item_number}</strong> at <strong>{letter.school_name}</strong>, 
                            effective <strong>{letter.effective_date ? new Date(letter.effective_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '[To Be Determined]'}</strong>.
                        </p>

                        <p>
                            You are hereby required to report to your assigned station on the said date.
                        </p>

                        <p className="italic text-sm text-slate-500">
                            This appointment is made pursuant to Section 9, Article X of the Civil Service Rules on Personnel Actions, 
                            and in accordance with DepEd Order No. 007, s. 2023 and relevant PRIME-HRM guidelines.
                        </p>

                        <p className="font-bold">
                            Congratulations once again!
                        </p>
                    </div>

                    {/* Signatories */}
                    <div className="mt-24 flex justify-between items-end">
                        <div>
                            <p className="font-black text-sm uppercase">{letter.superintendent_name}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">{letter.superintendent_title}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b border-slate-400 mb-1"></div>
                            <p className="text-[10px] font-bold uppercase opacity-40">Appointee's Signature over Printed Name</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdviceNextSteps;