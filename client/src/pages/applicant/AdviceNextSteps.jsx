import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, Download, CheckCircle2, Upload, 
    AlertCircle, Clock, FileText, Lock, ChevronRight, Loader2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { API_BASE, SERVER_BASE } from '../../utils/api';

const AdviceNextSteps = () => {
    const { user } = useAuth();
    const [appId, setAppId] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);          // { message, type: 'access'|'error' }
    const [retryCount, setRetryCount] = useState(0);  // increment to re-trigger fetch
    const [uploading, setUploading] = useState(null); // tracks which doc_type is uploading
    const fileInputRef = useRef(null);
    const [pendingDocType, setPendingDocType] = useState(null);

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

        let socket;

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

        // Socket for real-time doc verification updates
        socket = io(SERVER_BASE);
        socket.emit('join-application-room', `application-${appId}`);
        socket.on('application:document-update', fetchAdvice);
        socket.on('application:stage-update', fetchAdvice);

        return () => { if (socket) socket.disconnect(); };
    }, [appId, retryCount]);

    // 3. Handle file upload
    const handleUpload = (documentType) => {
        setPendingDocType(documentType);
        fileInputRef.current?.click();
    };

    const onFileSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !pendingDocType || !appId) return;

        setUploading(pendingDocType);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('document_type', pendingDocType);

            const res = await fetch(`${API_BASE}/api/applications/${appId}/appointment-documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                // Re-fetch to get updated doc list
                const token2 = localStorage.getItem('token');
                const res2 = await fetch(`${API_BASE}/api/applications/${appId}/advice`, {
                    headers: { 'Authorization': `Bearer ${token2}` }
                });
                if (res2.ok) setData(await res2.json());
            } else {
                const json = await res.json();
                alert(json.message || 'Upload failed.');
            }
        } catch (err) {
            alert('Upload error. Please try again.');
        } finally {
            setUploading(null);
            setPendingDocType(null);
            e.target.value = '';
        }
    };

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

    const { documents, letter, deadline, required_docs, settings } = data;
    const uploadedCount = documents.filter(d => d.file_path).length;
    const verifiedCount = documents.filter(d => d.verification_status === 'verified').length;
    const isComplete = uploadedCount === documents.length;

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto px-6 pb-20 space-y-8 select-none"
        >
            {/* Hidden file input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={onFileSelected} 
            />

            {/* PAGE HEADER */}
            <div className="pt-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Phase 4 · Post-Selection</p>
                <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic tracking-tight">Congratulatory Advice & Next Steps</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">You have been selected! Please review the advice and submit required documents.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* LEFT: THE FORMAL LETTER CARD */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-12 md:p-20 rounded-[3rem] shadow-sm border border-slate-100 font-serif text-slate-800 leading-relaxed shadow-inner">
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
                                You are hereby required to report to your assigned station on the said date. Please submit the following documents to the Human Resource Management Division{deadline ? ` on or before ` : ''}
                                {deadline && <strong className="underline text-[#D6402F]">{new Date(deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>}:
                            </p>

                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-[11px] font-bold uppercase tracking-tight list-disc list-inside bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                {required_docs.map((doc, idx) => (
                                    <li key={idx} className="text-slate-600">{doc}</li>
                                ))}
                            </ul>

                            <p className="italic text-sm text-slate-500">
                                This appointment is made pursuant to Section 9, Article B of the Civil Service Rules on Personnel Actions, 
                                and in accordance with DepEd Order No. 007, s. 2015 and relevant PRIME-HRM guidelines.
                            </p>
                        </div>

                        {/* Signatories */}
                        <div className="mt-24 flex justify-between items-end">
                            <div>
                                <p className="font-black text-sm uppercase border-b-2 border-slate-900 pb-1">{letter.superintendent_name}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">{letter.superintendent_title}</p>
                            </div>
                            <div className="text-center">
                                <div className="w-48 border-b-2 border-slate-200 mb-1"></div>
                                <p className="text-[10px] font-bold uppercase opacity-40">Appointee's Signature</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: SUBMISSION CHECKLIST */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-28">
                        {/* Status Header */}
                        <div className={`p-8 text-white transition-colors duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-[#1B3A6B]'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Stage 10 Requirements</p>
                                {isComplete && <CheckCircle2 size={24} />}
                            </div>
                            <h3 className="text-3xl font-black tracking-tighter">
                                {uploadedCount} <span className="text-lg opacity-60 font-bold uppercase">/ {documents.length}</span>
                            </h3>
                            <p className="text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">
                                {verifiedCount} verified by HR Division
                            </p>
                            {deadline && (
                                <p className="text-[10px] font-bold uppercase mt-3 tracking-widest opacity-60">
                                    Submit by {new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            )}
                        </div>

                        <div className="p-8 space-y-6">
                            {!isComplete && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-700 shadow-inner">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <p className="text-[10px] font-black leading-tight uppercase tracking-tighter">
                                        All required documents must be uploaded for appointment processing.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {documents.map((doc, i) => {
                                    const hasFile = !!doc.file_path;
                                    const isVerified = doc.verification_status === 'verified';
                                    const isPending = doc.verification_status === 'uploaded_pending_review';
                                    const isNeedsRevision = doc.verification_status === 'needs_revision';
                                    const isUploadingThis = uploading === doc.document_type;

                                    return (
                                        <div key={i} className={`p-4 rounded-2xl border transition-all ${
                                            isNeedsRevision 
                                                ? 'bg-amber-50/70 border-amber-300 shadow-sm' 
                                                : hasFile 
                                                    ? 'bg-slate-50 border-slate-200' 
                                                    : 'bg-white border-dashed border-slate-200 opacity-60'
                                        }`}>
                                            <div className="flex justify-between items-start gap-4">
                                                <p className="text-[11px] font-black text-[#1B3A6B] leading-tight uppercase flex-1">{doc.document_type}</p>
                                                {isVerified ? (
                                                    <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg shadow-emerald-500/20">
                                                        <CheckCircle2 size={14}/>
                                                    </div>
                                                ) : isNeedsRevision ? (
                                                    <div className="bg-amber-500 text-white p-1 rounded-full shadow-lg shadow-amber-500/20">
                                                        <AlertCircle size={14}/>
                                                    </div>
                                                ) : isPending ? (
                                                    <div className="bg-blue-500 text-white p-1 rounded-full animate-pulse">
                                                        <FileText size={14}/>
                                                    </div>
                                                ) : null}
                                            </div>
                                            
                                            {hasFile && doc.file_name && (
                                                <a 
                                                    href={`${SERVER_BASE}${doc.file_path.startsWith('/') ? doc.file_path : `/${doc.file_path}`}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-[9px] font-bold text-blue-500 hover:underline mt-2 block truncate max-w-[200px]"
                                                >
                                                    {doc.file_name}
                                                </a>
                                            )}

                                            {isNeedsRevision && doc.revision_note && (
                                                <div className="mt-2.5 bg-amber-100/80 border border-amber-300/60 p-2.5 rounded-xl text-[10px] text-amber-900 font-bold">
                                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-900 tracking-wider mb-0.5">
                                                        <AlertCircle size={12} className="text-amber-600"/> Revision Requested by HR:
                                                    </div>
                                                    <p className="font-semibold text-slate-800 leading-relaxed">{doc.revision_note}</p>
                                                </div>
                                            )}
                                            
                                            <div className="mt-4 flex justify-between items-center">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                                    isVerified ? 'text-emerald-600' : isNeedsRevision ? 'text-amber-700' : isPending ? 'text-blue-600' : 'text-slate-300'
                                                }`}>
                                                    {isVerified ? 'Verified' : isNeedsRevision ? 'Action Required · Revision Requested' : isPending ? 'Uploaded – pending review' : 'Not yet uploaded'}
                                                </span>
                                                <button 
                                                    onClick={() => handleUpload(doc.document_type)}
                                                    disabled={isUploadingThis}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                                                        isUploadingThis 
                                                            ? 'bg-slate-100 text-slate-400 cursor-wait' 
                                                            : isNeedsRevision
                                                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600'
                                                                : hasFile 
                                                                    ? 'text-slate-400 hover:text-[#D6402F] hover:bg-red-50' 
                                                                    : 'bg-[#1B3A6B] text-white shadow-lg shadow-blue-900/10 hover:bg-[#15305a]'
                                                    }`}
                                                >
                                                    {isUploadingThis ? (
                                                        <><Loader2 size={12} className="animate-spin"/> Uploading...</>
                                                    ) : isNeedsRevision ? (
                                                        <><Upload size={12}/> Re-upload</>
                                                    ) : hasFile ? (
                                                        'Replace'
                                                    ) : (
                                                        <><Upload size={12}/> Upload</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default AdviceNextSteps;