import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Step4Confirmation = ({ applicationId, vacancy, refNo }) => {
    const navigate = useNavigate();
    const [docCount, setDocCount] = useState(0);

    useEffect(() => {
        // Fetch the document count just to show in the summary
        const fetchDocCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/applications/${applicationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setDocCount(data.documents?.length || 0);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchDocCount();
    }, [applicationId]);

    const handleCopy = () => {
        navigator.clipboard.writeText(refNo);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
        >
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 overflow-hidden relative">
                {/* Decorative background circle */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10" />

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <CheckCircle2 size={48} />
                </motion.div>

                <h2 className="text-3xl font-black text-[#1B3A6B] uppercase italic mb-3">
                    Application Submitted!
                </h2>
                <p className="text-sm font-bold text-slate-500 mb-10">
                    Your application has been received and is now under review.
                </p>

                <div className="bg-slate-50 rounded-2xl p-8 mb-10 text-left relative">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-12 justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reference Number</p>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-black text-[#D6402F]">{refNo}</p>
                                <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-[#1B3A6B] hover:bg-slate-200 rounded-lg transition-colors">
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Position Applied</p>
                            <p className="text-sm font-black text-[#1B3A6B] uppercase italic">
                                {vacancy?.position_title} {vacancy?.subject && <span className="text-[#D6402F]">({vacancy.subject})</span>}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">{vacancy?.school_name || vacancy?.assigned_school}</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 mt-6 pt-6 flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Submitted: {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <FileText size={12} /> {docCount} Documents
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/jobs/my-application`)}
                    className="bg-[#1B3A6B] hover:bg-[#162E55] text-white px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mx-auto"
                >
                    Track My Application <ChevronRight size={16} />
                </button>
            </div>
        </motion.div>
    );
};

export default Step4Confirmation;
