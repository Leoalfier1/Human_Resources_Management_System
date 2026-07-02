import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import {
    Star, Download, Upload, CheckCircle2, Clock, AlertCircle, Loader2, FileText
} from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../utils/api';

const AdviceNextSteps = () => {
    const [applicationId, setApplicationId] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadingType, setUploadingType] = useState(null);
    const fileInputRef = useRef(null);
    const activeDocTypeRef = useRef(null);

    const token = () => localStorage.getItem('token');

    const fetchAdvice = async (id, isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/applications/${id}/advice`, {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.message || 'Could not load advice.');
                setData(null);
            } else {
                setData(json);
                setError(null);
            }
        } catch (e) {
            console.error('Failed to load advice:', e);
            setError('Could not reach the server.');
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    // 1. Resolve the applicant's latest application ID first
    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/applications/my-latest`, {
                    headers: { 'Authorization': `Bearer ${token()}` }
                });
                if (!res.ok) { setLoading(false); setError('No active application found.'); return; }
                const latest = await res.json();
                setApplicationId(latest.applicationId);
                await fetchAdvice(latest.applicationId);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        init();
    }, []);

    // 2. Real-time updates — listens for the events emitted by adviceController.js
    // (uploadAppointmentDocument) and appointmentController.js / verifyDocument on the admin side
    useEffect(() => {
        if (!applicationId) return;
        const socket = io(SERVER_BASE);

        socket.emit('join-application-room', `application-${applicationId}`);

        const silentRefresh = () => fetchAdvice(applicationId, true);

        socket.on('application:document-update', silentRefresh);
        socket.on('application:stage-update', silentRefresh);

        return () => socket.disconnect();
    }, [applicationId]);

    const triggerUpload = (docType) => {
        activeDocTypeRef.current = docType;
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        const docType = activeDocTypeRef.current;
        if (!file || !docType || !applicationId) return;

        setUploadingType(docType);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', docType);

        try {
            const res = await fetch(`${API_BASE}/api/applications/${applicationId}/appointment-documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token()}` },
                body: formData
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Upload failed.');
            await fetchAdvice(applicationId, true);
        } catch (err) {
            console.error('Upload error:', err);
            alert(err.message);
        } finally {
            setUploadingType(null);
            activeDocTypeRef.current = null;
            e.target.value = '';
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/applications/${applicationId}/advice/pdf`, {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (!res.ok) throw new Error('Could not generate PDF.');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Congratulatory_Advice.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert(e.message);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex justify-center pt-32"><div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin"/></div>;
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <p className="text-slate-400 font-black uppercase tracking-widest">
                    {error || 'Advice not yet available.'}
                </p>
                <p className="text-slate-300 text-sm mt-2">
                    This page unlocks once you've been selected for appointment.
                </p>
            </div>
        );
    }

    const { letter, documents, required_docs, deadline } = data;
    const uploadedCount = documents.filter(d => d.file_name || d.file_path).length;
    const totalCount = documents.length || required_docs?.length || 0;
    const allUploaded = uploadedCount === totalCount && totalCount > 0;

    return (
        <div className="min-h-screen bg-[#F1F3F6] pb-16">
            {/* HEADER */}
            <div className="bg-[#1B3A6B] text-white">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">
                        Congratulatory Advice &amp; Next Steps
                    </p>
                    <p className="text-xs font-bold text-blue-200">
                        You have been selected. Please review the letter and submit your required documents.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: LETTER */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest">
                            Congratulatory Advice Letter
                        </h3>
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50"
                        >
                            <Download size={14} /> Download Advice
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-6 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                            <Star size={20} className="text-amber-500 shrink-0" fill="currentColor" />
                            <div>
                                <p className="text-xs font-black text-amber-800 uppercase">You Have Been Selected</p>
                                <p className="text-[11px] font-bold text-amber-700">
                                    {letter.position_title}{letter.subject ? ` (${letter.subject})` : ''} · {letter.school_name}
                                </p>
                            </div>
                        </div>

                        <p className="text-right text-xs font-bold text-slate-400 mb-6">
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>

                        <p className="text-sm font-black text-[#1B3A6B] uppercase">{letter.full_name}</p>
                        <p className="text-xs font-bold text-slate-500 mb-6">{letter.school_name}</p>

                        <p className="text-sm text-slate-700 leading-relaxed">
                            Dear {letter.full_name?.split(' ').pop()},
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed mt-3">
                            <span className="font-black">Congratulations!</span> It is with great pleasure that I inform you of your
                            selection for appointment to the position of{' '}
                            <span className="font-bold underline">{letter.position_title}</span> at{' '}
                            {letter.assigned_school}, effective{' '}
                            <span className="font-bold underline">
                                {letter.effective_date
                                    ? new Date(letter.effective_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                    : 'a date to be determined'}
                            </span>.
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed mt-3">
                            Please submit the following documents to the Human Resource Management Division on or before{' '}
                            <span className="font-bold">
                                {deadline ? new Date(deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                            </span>.
                        </p>
                    </div>
                </div>

                {/* RIGHT: DOCUMENT CHECKLIST */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                    />

                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-black text-[#1B3A6B] uppercase tracking-widest">
                            Required Documents for Appointment
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                            <Clock size={12} />
                            {uploadedCount} / {totalCount} submitted
                        </div>
                    </div>

                    <div className="p-2 flex-1 divide-y divide-slate-50">
                        {documents.map((doc, idx) => {
                            const isUploaded = !!(doc.file_name || doc.file_path);
                            const isVerified = doc.is_verified || doc.verification_status === 'verified';
                            const isUploadingThis = uploadingType === doc.document_type;

                            return (
                                <div key={doc.id || idx} className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            isVerified ? 'bg-emerald-50 text-emerald-500'
                                            : isUploaded ? 'bg-blue-50 text-blue-500'
                                            : 'bg-slate-50 text-slate-300'
                                        }`}>
                                            <FileText size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate">
                                                {doc.document_type}
                                                {!isUploaded && <span className="text-[#D6402F] ml-1">*</span>}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400">
                                                {isVerified ? 'Verified by HR'
                                                    : isUploaded ? 'Uploaded — pending review'
                                                    : 'Not yet uploaded'}
                                            </p>
                                        </div>
                                    </div>

                                    {isUploadingThis ? (
                                        <Loader2 size={16} className="animate-spin text-slate-400 shrink-0" />
                                    ) : isVerified ? (
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                    ) : (
                                        <button
                                            onClick={() => triggerUpload(doc.document_type)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1B3A6B]/30 text-[#1B3A6B] rounded-full text-[10px] font-bold hover:bg-blue-50 transition-colors shrink-0"
                                        >
                                            <Upload size={12} /> {isUploaded ? 'Re-upload' : 'Upload'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className={`p-4 flex items-center gap-2 text-[11px] font-bold border-t ${
                        allUploaded ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                        {allUploaded ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {allUploaded
                            ? 'All documents submitted! HR will process your appointment shortly.'
                            : 'All documents must be uploaded before your appointment can proceed.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdviceNextSteps;