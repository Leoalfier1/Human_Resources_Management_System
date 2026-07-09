import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, MapPin, Users, Calendar, Clock,
    CheckCircle2, Dot, FileText, AlertCircle,
    BookOpen, Briefcase
} from 'lucide-react';
import { PDSGateBanner } from '../../components/applicant/PDSGate';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ─── CALENDAR COUNTDOWN WIDGET (Detail version) ───────────────────────────────
const CalendarWidget = ({ daysLeft, daysElapsed, deadlineDate }) => {
    const TOTAL = 10;
    const elapsed = Math.min(TOTAL, Math.max(0, daysElapsed));
    const pct = (elapsed / TOTAL) * 100;
    const isUrgent = daysLeft <= 3 && daysLeft >= 0;
    const isClosed = daysLeft < 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-right min-w-[180px]">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calendar Days</span>
                <span className={`text-xl font-black ${isClosed ? 'text-slate-400' : isUrgent ? 'text-[#D6402F]' : 'text-[#1B3A6B]'}`}>
                    {isClosed ? '—' : `${elapsed}`}
                    <span className="text-sm font-bold text-slate-300">/10</span>
                </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${isClosed ? 100 : pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isClosed ? 'bg-slate-300' : isUrgent ? 'bg-[#D6402F]' : 'bg-[#1B3A6B]'}`}
                />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                Deadline: {new Date(deadlineDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
        </div>
    );
};

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────
const Skeleton = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-48 bg-slate-200 rounded-2xl" />
        <div className="h-6 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-100 rounded w-1/3" />
    </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isApplicant } = useAuth();

    const [vacancy, setVacancy] = useState(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationRef, setApplicationRef] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch vacancy detail (public)
                const res = await fetch(`${API_BASE}/api/vacancies/${id}`);
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Vacancy not found.');
                }
                const data = await res.json();
                setVacancy(data);

                // Check has-applied (only if logged-in applicant)
                if (isAuthenticated && isApplicant) {
                    const token = localStorage.getItem('token');
                    const appRes = await fetch(`${API_BASE}/api/vacancies/${id}/has-applied`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (appRes.ok) {
                        const appData = await appRes.json();
                        setHasApplied(appData.hasApplied);
                        setApplicationRef(appData.application?.applicant_code || null);
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [id, isAuthenticated, isApplicant]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F1F3F6] pb-24">
                <div className="bg-[#1B3A6B] h-52" />
                <div className="max-w-6xl mx-auto px-6 -mt-16">
                    <Skeleton />
                </div>
            </div>
        );
    }

    if (error || !vacancy) {
        return (
            <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-300 mx-auto mb-4" />
                    <p className="font-black text-slate-500 uppercase tracking-widest">{error || 'Vacancy not found.'}</p>
                    <Link to="/jobs" className="mt-6 inline-block text-[#1B3A6B] font-black text-sm underline">
                        ← Back to Job Openings
                    </Link>
                </div>
            </div>
        );
    }

    const isClosed = vacancy.computed_status === 'closed';

    return (
        <div className="min-h-screen bg-[#F1F3F6] pb-24">

            {/* ── HERO HEADER ───────────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-[#0d2347] via-[#1B3A6B] to-[#1e4a8a] text-white relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
                <div className="max-w-6xl mx-auto px-6 pt-8 pb-12">

                    {/* Back link */}
                    <Link
                        to="/jobs"
                        className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-xs font-black uppercase tracking-widest mb-8 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to Job Openings
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1">
                            <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-2">
                                {vacancy.ref_no}
                            </p>
                            <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight leading-tight mb-3">
                                {vacancy.position_title}
                                {vacancy.subject && (
                                    <span className="text-[#D6402F]"> ({vacancy.subject})</span>
                                )}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-sm font-bold text-blue-200">
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={14} />
                                    {vacancy.school_name || vacancy.assigned_school}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users size={14} />
                                    {vacancy.no_of_vacancies || 1} {vacancy.no_of_vacancies === 1 ? 'vacancy' : 'vacancies'}
                                </span>
                                <span className="bg-white/10 px-3 py-1 rounded-lg text-white text-xs font-black">
                                    {vacancy.salary_grade || 'SG N/A'}
                                </span>
                                {vacancy.monthly_salary && (
                                    <span className="font-black text-white">
                                        ₱{Number(vacancy.monthly_salary).toLocaleString('en-PH')}/month
                                    </span>
                                )}
                            </div>
                        </div>

                        <CalendarWidget
                            daysLeft={vacancy.days_left}
                            daysElapsed={vacancy.days_elapsed}
                            deadlineDate={vacancy.deadline_date}
                        />
                    </div>
                </div>
            </div>

            {/* ── STAT STRIP ────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm grid grid-cols-3 divide-x divide-slate-100 -mt-6 mb-8">
                    {[
                        {
                            icon: <Calendar size={18} />,
                            label: 'Posted',
                            value: new Date(vacancy.posting_date).toLocaleDateString('en-PH', {
                                month: 'long', day: 'numeric', year: 'numeric'
                            })
                        },
                        {
                            icon: <Users size={18} />,
                            label: 'Applicants',
                            value: `${vacancy.applicant_count} applied`
                        },
                        {
                            icon: <Clock size={18} />,
                            label: 'Closes in',
                            value: isClosed
                                ? 'Closed'
                                : `${Math.max(0, vacancy.days_left)} calendar ${vacancy.days_left === 1 ? 'day' : 'days'}`
                        },
                    ].map((s, i) => (
                        <div key={i} className="p-5 flex items-center gap-3">
                            <span className="text-[#1B3A6B] hidden sm:block">{s.icon}</span>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                                <p className="text-sm font-black text-[#1B3A6B]">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PDS Pre-flight Banner */}
            {isAuthenticated && isApplicant && (
                <div className="max-w-6xl mx-auto px-6">
                    <PDSGateBanner />
                </div>
            )}

            {/* ── CONTENT COLUMNS ───────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: Qual Standards + Duties */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Minimum Qualification Standards */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1B3A6B] flex items-center justify-center">
                                <CheckCircle2 size={16} />
                            </div>
                            <h2 className="font-black text-[#1B3A6B] uppercase tracking-tight text-sm">
                                Minimum Qualification Standards
                            </h2>
                        </div>

                        {vacancy.qualification_standards && vacancy.qualification_standards.length > 0 ? (
                            <ul className="space-y-3">
                                {vacancy.qualification_standards.map(q => (
                                    <li key={q.id} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                        <CheckCircle2 size={16} className="text-[#1B3A6B] flex-shrink-0 mt-0.5" />
                                        {q.label}
                                    </li>
                                ))}
                            </ul>
                        ) : vacancy.minimum_qualifications ? (
                            // Fallback: render the text blob as a list
                            <ul className="space-y-3">
                                {vacancy.minimum_qualifications
                                    .split(/[;\n]/)
                                    .map(s => s.trim())
                                    .filter(Boolean)
                                    .map((q, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                            <CheckCircle2 size={16} className="text-[#1B3A6B] flex-shrink-0 mt-0.5" />
                                            {q}
                                        </li>
                                    ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No qualification standards listed.</p>
                        )}
                    </motion.div>

                    {/* Duties & Responsibilities */}
                    {vacancy.duties_responsibilities && vacancy.duties_responsibilities.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
                        >
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1B3A6B] flex items-center justify-center">
                                    <BookOpen size={16} />
                                </div>
                                <h2 className="font-black text-[#1B3A6B] uppercase tracking-tight text-sm">
                                    Duties and Responsibilities
                                </h2>
                            </div>
                            <ul className="space-y-3">
                                {vacancy.duties_responsibilities.map(d => (
                                    <li key={d.id} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                        <Dot size={20} className="text-[#D6402F] flex-shrink-0 -mt-0.5" />
                                        {d.label}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </div>

                {/* RIGHT: Apply + Required Docs */}
                <div className="space-y-5">

                    {/* Ready to Apply card */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-gradient-to-br from-[#0d2347] via-[#1B3A6B] to-[#1e4a8a] text-white rounded-2xl p-6 shadow-lg"
                    >
                        {isClosed ? (
                            <>
                                <h3 className="font-black text-lg uppercase italic mb-2">Application Closed</h3>
                                <p className="text-blue-200 text-sm font-medium mb-4">
                                    The application window for this vacancy has ended.
                                </p>
                            </>
                        ) : hasApplied ? (
                            <>
                                <h3 className="font-black text-lg uppercase italic mb-2">Application Submitted</h3>
                                <p className="text-blue-200 text-sm font-medium mb-4">
                                    You have already applied for this position.
                                    {applicationRef && <><br /><span className="font-black text-white">Ref: {applicationRef}</span></>}
                                </p>
                                <Link
                                    to="/jobs/my-application"
                                    className="block w-full text-center bg-white text-[#1B3A6B] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all"
                                >
                                    View My Application →
                                </Link>
                            </>
                        ) : (
                            <>
                                <h3 className="font-black text-lg uppercase italic mb-2">Ready to Apply?</h3>
                                <p className="text-blue-200 text-sm font-medium mb-4">
                                    Prepare your documents before applying.
                                    {vacancy.days_left <= 3 && (
                                        <span className="block text-[#D6402F] font-black mt-1">
                                            ⚠ Application window closes in {vacancy.days_left} {vacancy.days_left === 1 ? 'day' : 'days'}.
                                        </span>
                                    )}
                                </p>
                                {!isAuthenticated ? (
                                    <Link
                                        to="/"
                                        className="block w-full text-center bg-[#D6402F] hover:bg-[#b53526] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg"
                                    >
                                        Log In to Apply
                                    </Link>
                                ) : !isApplicant ? (
                                    <div className="flex items-center gap-2 bg-white/10 rounded-xl p-3 text-xs font-bold text-blue-200">
                                        <AlertCircle size={14} />
                                        Admin accounts cannot apply.
                                    </div>
                                ) : (
                                    <Link
                                        to={`/jobs/${id}/apply`}
                                        className="block w-full text-center bg-[#D6402F] hover:bg-[#b53526] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/30"
                                    >
                                        Apply Now →
                                    </Link>
                                )}
                            </>
                        )}
                    </motion.div>

                    {/* Required Documents card */}
                    {vacancy.required_documents && vacancy.required_documents.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 text-[#1B3A6B] flex items-center justify-center">
                                    <FileText size={16} />
                                </div>
                                <h3 className="font-black text-[#1B3A6B] uppercase tracking-tight text-sm">
                                    Required Documents
                                </h3>
                            </div>
                            <ul className="space-y-2">
                                {vacancy.required_documents.map(doc => (
                                    <li key={doc.id} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                                        <span className="mt-0.5 text-[#1B3A6B] flex-shrink-0">•</span>
                                        {doc.document_type}
                                        {!doc.is_mandatory && (
                                            <span className="text-[9px] text-slate-400 font-black">(optional)</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default JobDetail;
