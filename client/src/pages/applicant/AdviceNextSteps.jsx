import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Download, AlertCircle, Clock, FileText
} from 'lucide-react';
import { API_BASE } from '../../utils/api';
import { QualifiedLetter, DisqualifiedLetter } from '../../components/shared/AnnexELetter';

const AdviceNextSteps = () => {
    const [appId, setAppId] = useState(null);
    const [annexEData, setAnnexEData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [annexEError, setAnnexEError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

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

    // 2. Fetch Annex E (Initial Evaluation Advice)
    useEffect(() => {
        if (!appId) return;

        const fetchAnnexE = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/applications/${appId}/annex-e`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const json = await res.json();
                    setAnnexEData(json);
                    setAnnexEError(null);
                } else if (res.status === 404) {
                    setAnnexEData(null);
                } else {
                    const json = await res.json().catch(() => ({}));
                    setAnnexEError(json.message || 'Could not load initial evaluation result.');
                }
            } catch (err) {
                setAnnexEError('Could not connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnnexE();
    }, [appId, retryCount]);

    // 3. Handle Annex E PDF download
    const handleAnnexEPDF = async () => {
        if (!appId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/applications/${appId}/annex-e/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                const name = annexEData?.letter?.last_name || 'Applicant';
                a.href = url;
                a.download = `AnnexE_${name.replace(/[^A-Za-z]/g, '')}.pdf`;
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

    // Error from initial app ID resolution
    if (error) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-10 select-none">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 max-w-lg"
            >
                <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-400">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-700 uppercase italic tracking-tight">Something Went Wrong</h2>
                <p className="text-slate-500 mt-4 font-medium leading-relaxed">{error}</p>
                <button
                    onClick={() => { setLoading(true); setError(null); setRetryCount(c => c + 1); }}
                    className="mt-8 px-8 py-3 bg-[#1B3A6B] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#15305a] transition-all active:scale-95"
                >
                    Try Again
                </button>
            </motion.div>
        </div>
    );

    const hasAnnexE = annexEData && annexEData.advice_sent_at;

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto px-6 pb-20 space-y-8 select-none"
        >
            {/* PAGE HEADER */}
            <div className="pt-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Initial Evaluation</p>
                <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic tracking-tight">Advice & Next Steps</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Review your initial evaluation result below.</p>
            </div>

            {/* ─── ANNEX E — INITIAL EVALUATION RESULT ─── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-black text-[#1B3A6B] uppercase tracking-tight italic flex items-center gap-2">
                            <FileText size={18} /> Initial Evaluation Result
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            Annex E · Initial Evaluation Advice Letter
                        </p>
                    </div>
                    {hasAnnexE && (
                        <button
                            onClick={handleAnnexEPDF}
                            className="px-5 py-2.5 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#162E55] transition-all shadow-lg active:scale-95"
                        >
                            <Download size={14} /> Download PDF
                        </button>
                    )}
                </div>

                {annexEError ? (
                    <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 max-w-lg mx-auto text-center">
                        <AlertCircle size={40} className="text-amber-400 mx-auto mb-4" />
                        <p className="text-slate-500 text-sm mb-4">{annexEError}</p>
                        <button onClick={() => setRetryCount(c => c + 1)} className="px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200">
                            Retry
                        </button>
                    </div>
                ) : !hasAnnexE ? (
                    <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 max-w-lg mx-auto text-center">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Clock size={40} />
                        </div>
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight">Not Yet Available</h3>
                        <p className="text-slate-400 text-sm mt-2 font-medium leading-relaxed">
                            Your Initial Evaluation (Annex E) advice letter has not been sent yet. 
                            Please wait for the evaluation committee to complete the initial evaluation process.
                        </p>
                    </div>
                ) : (
                    <div>
                        {annexEData.variant === 'qualified' ? (
                            <QualifiedLetter data={annexEData} />
                        ) : (
                            <DisqualifiedLetter data={annexEData} />
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AdviceNextSteps;
