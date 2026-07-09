import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../../../utils/api';

// ── Teaching fallback document list ──────────────────────────────
// Used when the vacancy has no rows in vacancy_required_documents
// and position_type is 'teaching' (or unspecified).
const DEFAULT_REQUIRED_DOCS_TEACHING = [
    { document_type: 'Personal Data Sheet (CS Form 212, latest revision)', is_mandatory: true },
    { document_type: 'Service Record (duly signed by authorized official)', is_mandatory: true },
    { document_type: 'Performance Evaluation Reports (last 3 rating periods)', is_mandatory: true },
    { document_type: 'Transcript of Records (certified true copy)', is_mandatory: true },
    { document_type: 'LET Certificate / PRC ID (professional license)', is_mandatory: true },
    { document_type: 'NBI Clearance (issued within the last 6 months)', is_mandatory: true },
    { document_type: 'CSC MC 10 s. 2013 Omnibus Sworn Statement', is_mandatory: true },
    { document_type: 'Medical Certificate (from government hospital)', is_mandatory: false },
    { document_type: 'Certificates of Training / Seminars (relevant)', is_mandatory: false },
];

// ── Teaching-Related fallback document list ──────────────────────
// TODO(product-owner): confirm document list for teaching_related.
// Currently reuses non-teaching list as a starting point.
const DEFAULT_REQUIRED_DOCS_TEACHING_RELATED = [
    { document_type: 'Personal Data Sheet (CS Form 212, latest revision)', is_mandatory: true },
    { document_type: 'Service Record (duly signed by authorized official)', is_mandatory: true },
    { document_type: 'Performance Evaluation Reports (last 3 rating periods)', is_mandatory: true },
    { document_type: 'Transcript of Records (certified true copy)', is_mandatory: true },
    { document_type: 'Diploma (certified true copy)', is_mandatory: true },
    { document_type: 'CSC Eligibility Certificate (Career Service Professional/Sub-Professional)', is_mandatory: true },
    { document_type: 'NBI Clearance (issued within the last 6 months)', is_mandatory: true },
    { document_type: 'CSC MC 10 s. 2013 Omnibus Sworn Statement', is_mandatory: true },
    { document_type: 'Medical Certificate (from government hospital)', is_mandatory: false },
    { document_type: 'Certificates of Training / Seminars (relevant)', is_mandatory: false },
];

// ── Non-Teaching fallback document list ──────────────────────────
// Used when vacancy position_type is 'non_teaching' and no custom
// checklist has been configured in vacancy_required_documents.
const DEFAULT_REQUIRED_DOCS_NON_TEACHING = [
    { document_type: 'Personal Data Sheet (CS Form 212, latest revision)', is_mandatory: true },
    { document_type: 'Service Record (duly signed by authorized official)', is_mandatory: true },
    { document_type: 'Performance Evaluation Reports (last 3 rating periods)', is_mandatory: true },
    { document_type: 'Transcript of Records (certified true copy)', is_mandatory: true },
    { document_type: 'Diploma (certified true copy)', is_mandatory: true },
    { document_type: 'CSC Eligibility Certificate (Career Service Professional/Sub-Professional)', is_mandatory: true },
    { document_type: 'NBI Clearance (issued within the last 6 months)', is_mandatory: true },
    { document_type: 'CSC MC 10 s. 2013 Omnibus Sworn Statement', is_mandatory: true },
    { document_type: 'Medical Certificate (from government hospital)', is_mandatory: false },
    { document_type: 'Certificates of Training / Seminars (relevant)', is_mandatory: false },
];

const Step2Documents = ({ applicationId, vacancyId, vacancyPositionType, onNext, onPrev }) => {
    const [requiredDocs, setRequiredDocs] = useState([]);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);
    const [activeDocType, setActiveDocType] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch the vacancy's required docs from the backend
                const resReq = await fetch(`${API_BASE}/api/vacancies/${vacancyId}`);
                const dataReq = await resReq.json();

                const backendDocs = dataReq.required_documents || [];

                if (backendDocs.length > 0) {
                    // Vacancy has a custom checklist — use it regardless of position type
                    setRequiredDocs(backendDocs);
                } else {
                    // No custom checklist — fall back to the correct default based on position_type
                    const posType = vacancyPositionType || dataReq.position_type || 'teaching';
                    setRequiredDocs(
                        posType === 'non_teaching'
                            ? DEFAULT_REQUIRED_DOCS_NON_TEACHING
                            : posType === 'teaching_related'
                                ? DEFAULT_REQUIRED_DOCS_TEACHING_RELATED
                                : DEFAULT_REQUIRED_DOCS_TEACHING
                    );
                }

                // 2. Fetch any documents already uploaded for this application draft
                const token = localStorage.getItem('token');
                const resApp = await fetch(`${API_BASE}/api/applications/${applicationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resApp.ok) {
                    const dataApp = await resApp.json();
                    setUploadedDocs(dataApp.documents || []);
                }
            } catch (error) {
                console.error("Error fetching docs data", error);
                // Fall back gracefully — use teaching list as safe default
                setRequiredDocs(
                    vacancyPositionType === 'non_teaching'
                        ? DEFAULT_REQUIRED_DOCS_NON_TEACHING
                        : vacancyPositionType === 'teaching_related'
                            ? DEFAULT_REQUIRED_DOCS_TEACHING_RELATED
                            : DEFAULT_REQUIRED_DOCS_TEACHING
                );
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [applicationId, vacancyId, vacancyPositionType]);

    const getUploadedDoc = (docType) => uploadedDocs.find(d => d.document_type === docType);

    const triggerUpload = (docType) => {
        setActiveDocType(docType);
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeDocType) return;

        const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExt.includes(ext)) {
            setErrorMsg('Only PDF, JPG, or PNG files are allowed.');
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMsg('File is too large. Max size is 5MB.');
            e.target.value = '';
            return;
        }

        setErrorMsg('');
        setUploadingId(activeDocType);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', activeDocType);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/applications/${applicationId}/documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');

            setUploadedDocs(prev => {
                const filtered = prev.filter(d => d.document_type !== activeDocType);
                return [...filtered, data.document];
            });
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setUploadingId(null);
            setActiveDocType(null);
            e.target.value = '';
        }
    };

    const handleRemove = async (docId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/applications/${applicationId}/documents/${docId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUploadedDocs(prev => prev.filter(d => d.id !== docId));
            }
        } catch (error) {
            console.error('Failed to remove document', error);
        }
    };

    if (loading) return <div className="text-center py-20 text-slate-400 font-bold">Loading documents...</div>;

    const mandatoryDocs = requiredDocs.filter(d => d.is_mandatory);
    const hasAllMandatory = mandatoryDocs.every(md => getUploadedDoc(md.document_type));
    const uploadedCount = uploadedDocs.length;
    const totalCount = requiredDocs.length;

    // Derive the label shown in the header
    const posTypeLabel = vacancyPositionType === 'non_teaching' ? 'Non-Teaching' : vacancyPositionType === 'teaching_related' ? 'Teaching-Related' : 'Teaching';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
        >
            {/* Hidden file input shared by every Upload button */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-base text-slate-700">
                            Document <span className="font-black text-[#1B3A6B]">Upload</span>
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {posTypeLabel} Position Requirements
                        </p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                        {uploadedCount} / {totalCount} <span className="text-[#1B3A6B]">uploaded</span>
                    </span>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 text-[#D6402F] px-6 py-3 flex items-center gap-2 text-xs font-bold border-b border-red-100">
                        <AlertCircle size={14} /> {errorMsg}
                    </div>
                )}

                {/* Position type badge */}
                <div className={`px-6 py-2 flex items-center gap-2 text-[10px] font-bold border-b ${
                    vacancyPositionType === 'non_teaching'
                        ? 'bg-sky-50 text-sky-700 border-sky-100'
                        : vacancyPositionType === 'teaching_related'
                            ? 'bg-violet-50 text-violet-700 border-violet-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        vacancyPositionType === 'non_teaching'
                            ? 'bg-sky-100 text-sky-700'
                            : vacancyPositionType === 'teaching_related'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-amber-100 text-amber-700'
                    }`}>
                        {posTypeLabel}
                    </span>
                    Documents required for this position type are listed below. Items marked * are mandatory.
                </div>

                {/* DOCUMENT LIST */}
                <div className="divide-y divide-slate-50">
                    {requiredDocs.map((doc, idx) => {
                        const uploaded = getUploadedDoc(doc.document_type);
                        const isUploading = uploadingId === doc.document_type;

                        return (
                            <div key={doc.id || idx} className="flex items-center justify-between px-6 py-3.5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileText size={16} className="text-slate-300 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-[#1B3A6B] truncate">
                                            {doc.document_type}
                                            {doc.is_mandatory && <span className="text-[#D6402F] ml-1">*</span>}
                                        </p>
                                        {uploaded && (
                                            <p className="text-[10px] font-bold text-emerald-600 truncate">{uploaded.file_name}</p>
                                        )}
                                    </div>
                                </div>

                                {isUploading ? (
                                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold px-4 py-1.5">
                                        <Loader2 size={13} className="animate-spin" /> Uploading
                                    </div>
                                ) : uploaded ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRemove(uploaded.id)}
                                            className="flex items-center gap-1.5 text-emerald-600 border border-emerald-200 bg-emerald-50 px-4 py-1.5 rounded-full text-[11px] font-bold hover:bg-red-50 hover:text-[#D6402F] hover:border-red-200 transition-colors"
                                        >
                                            <CheckCircle2 size={13} /> Uploaded
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => triggerUpload(doc.document_type)}
                                        className="flex items-center gap-1.5 text-[#1B3A6B] border border-[#1B3A6B]/30 px-4 py-1.5 rounded-full text-[11px] font-bold hover:bg-blue-50 transition-colors"
                                    >
                                        <Upload size={13} /> Upload
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* WARNING BANNER */}
                {!hasAllMandatory && (
                    <div className="bg-amber-50 text-amber-700 px-6 py-3 flex items-center gap-2 text-[11px] font-semibold italic border-t border-amber-100">
                        <AlertCircle size={14} /> All required documents (*) must be uploaded before proceeding.
                    </div>
                )}
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex justify-between items-center">
                <button
                    onClick={onPrev}
                    className="text-xs font-bold text-slate-400 hover:text-[#1B3A6B] transition-colors px-4 py-2"
                >
                    ← Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!hasAllMandatory}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all
                        ${hasAllMandatory
                            ? 'bg-[#1B3A6B] hover:bg-[#162E55] text-white shadow-md shadow-blue-900/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    Continue →
                </button>
            </div>
        </motion.div>
    );
};

export default Step2Documents;