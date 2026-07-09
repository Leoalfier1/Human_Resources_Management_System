import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Trophy, FileText, CheckCircle2, XCircle, Bell,
    ChevronRight, Loader2
} from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE, SERVER_BASE } from '../../utils/api';

// Categorize a notification by sniffing its message text, since the
// notifications table only stores a plain message string (no type column).
const categorize = (message = '') => {
    const m = message.toLowerCase();
    if (m.includes('shortlisted') || m.includes('endorsed')) {
        return { icon: Trophy, accent: 'amber' };
    }
    if (m.includes('comparative assessment') || m.includes('total score')) {
        return { icon: FileText, accent: 'blue' };
    }
    if (m.includes('did not meet') || m.includes('disqualified')) {
        return { icon: XCircle, accent: 'red' };
    }
    if (m.includes('initial evaluation') || m.includes('qualification standards')) {
        return { icon: CheckCircle2, accent: 'green' };
    }
    if (m.includes('successfully received')) {
        return { icon: CheckCircle2, accent: 'slate' };
    }
    return { icon: Bell, accent: 'slate' };
};

// Derive a title line from the same message text (DB has no separate title column)
const titleFor = (message = '') => {
    const m = message.toLowerCase();
    if (m.includes('shortlisted') || m.includes('endorsed')) {
        const rankMatch = message.match(/Rank #(\d+)/i);
        return `You have been shortlisted${rankMatch ? ` – Rank #${rankMatch[1]}` : ''}`;
    }
    if (m.includes('comparative assessment')) return 'Comparative Assessment Results Now Available';
    if (m.includes('did not meet')) return 'Initial Evaluation Result';
    if (m.includes('qualification standards')) return 'You Have Passed Initial Evaluation';
    if (m.includes('successfully received')) return 'Application Received';
    return 'Update on Your Application';
};

const ACCENT_STYLES = {
    amber: { border: 'border-amber-300', iconBg: 'bg-amber-100 text-amber-600', badge: 'bg-amber-500 text-white' },
    blue:  { border: 'border-slate-100', iconBg: 'bg-blue-100 text-blue-600',  badge: 'bg-blue-500 text-white' },
    green: { border: 'border-slate-100', iconBg: 'bg-green-100 text-green-600', badge: 'bg-green-500 text-white' },
    red:   { border: 'border-slate-100', iconBg: 'bg-red-100 text-red-600',   badge: 'bg-red-500 text-white' },
    slate: { border: 'border-slate-100', iconBg: 'bg-slate-100 text-slate-500', badge: 'bg-slate-500 text-white' },
};

const NEXT_STEPS = {
    draft: "Finish and submit your application to begin the RSP evaluation process.",
    submitted: "Your application is under review by the HR Office. You'll be notified here once Initial Evaluation is complete.",
    under_review: "The HRMPSB Secretariat is validating your submitted documents and performance ratings.",
    qualified: "You've passed Initial Evaluation. Your Comparative Assessment (skills interview / demo teaching, BEI, and document evaluation) will be scheduled soon.",
    disqualified: "Unfortunately, your application did not proceed past Initial Evaluation. Thank you for your interest in DepEd SDO Dapitan City.",
    shortlisted: "The HRMPSB has endorsed the shortlist to the appointing authority. A Congratulatory Advice will be issued within 1–2 working days.",
    selected: "Congratulations! A Congratulatory Advice has been issued. Check Advice & Next Steps for required documents and deadlines.",
    appointed: "Your appointment has been issued. Check the Appointment tab for your official Notice of Appointment.",
};

const ResultsNotices = () => {
    const [appId, setAppId] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Resolve the applicant's current application id
    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/applications/my-latest`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('No active applications found.');
                const json = await res.json();
                setAppId(json.applicationId);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchLatest();
    }, []);

    // 2. Fetch status/results + wire up real-time updates
    useEffect(() => {
        if (!appId) return;
        let socket;

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/applications/${appId}/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Could not load your results.');
                const json = await res.json();
                setData(json);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Real-time: join this applicant's private room and refresh on any update
        socket = io(SERVER_BASE);
        socket.emit('join-application-room', `application-${appId}`);
        socket.on('application:notification', fetchData);
        socket.on('application:stage-update', fetchData);
        socket.on('application:score-update', fetchData);

        return () => { if (socket) socket.disconnect(); };
    }, [appId]);

    const sortedNotifications = useMemo(() => {
        if (!data?.notifications) return [];
        return [...data.notifications].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F1F3F6] flex justify-center pt-32">
                <Loader2 className="animate-spin text-[#1B3A6B] w-8 h-8" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#F1F3F6] flex justify-center pt-32 font-black text-slate-400 uppercase tracking-widest">
                {error || 'No data available yet.'}
            </div>
        );
    }

    const { application, score } = data;
    const isQualifiedFamily = ['qualified', 'shortlisted', 'selected', 'appointed'].includes(application?.status);
    const isDisqualified = application?.status === 'disqualified';

    return (
        <div className="min-h-screen bg-[#F1F3F6] pb-20 font-sans">
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* PAGE HEADER (plain — no card) */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-[#1B3A6B] tracking-tight">Results &amp; Notifications</h1>
                    <p className="text-sm font-semibold text-slate-400 mt-1">
                        Your application results and important announcements
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: Notification timeline */}
                    <div className="lg:col-span-2 space-y-4">
                        {sortedNotifications.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                                <Bell className="mx-auto text-slate-300 mb-3" size={32} />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    No notifications yet
                                </p>
                                <p className="text-[11px] font-semibold text-slate-400 mt-2">
                                    You'll see updates here as your application moves through each RSP stage.
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {sortedNotifications.map((notif, index) => {
                                    const { icon: Icon, accent } = categorize(notif.message);
                                    const style = ACCENT_STYLES[accent];
                                    const isNewest = index === 0;

                                    return (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4 border ${
                                                isNewest ? `${style.border} border-2` : 'border-slate-100'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="font-black text-sm text-[#1B3A6B]">{titleFor(notif.message)}</p>
                                                    {isNewest && (
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold text-slate-500 leading-relaxed mt-1">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-2">
                                                    {new Date(notif.created_at).toLocaleDateString('en-PH', {
                                                        month: 'long', day: 'numeric', year: 'numeric'
                                                    })} – {new Date(notif.created_at).toLocaleTimeString('en-PH', {
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* RIGHT: CA Result + What Happens Next */}
                    <div className="space-y-6">

                        {/* My CA Result */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="bg-[#1B3A6B] px-6 py-4">
                                <p className="text-sm font-black text-white">My CA Result</p>
                                <p className="text-[11px] font-semibold text-blue-200 mt-0.5">
                                    {application?.position_title} {application?.subject && `(${application.subject})`}
                                </p>
                            </div>

                            {score ? (
                                <div className="p-6 text-center">
                                    <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                                        <Trophy size={26} />
                                    </div>
                                    <p className="text-3xl font-black text-[#1B3A6B]">{Number(score.total_score).toFixed(2)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">out of 100.00</p>

                                    <div className="flex items-center justify-center gap-2 mb-6">
                                        {score.rank_position && score.rank_total && (
                                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                Rank #{score.rank_position} of {score.rank_total}
                                            </span>
                                        )}
                                        {isQualifiedFamily && (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                Qualified
                                            </span>
                                        )}
                                        {isDisqualified && (
                                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                Disqualified
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3 text-left">
                                        {[
                                            { label: 'A', score: score.classroom_score, max: score.classroom_max },
                                            { label: 'B', score: score.nonclassroom_score, max: score.nonclassroom_max },
                                            { label: 'C', score: score.document_score, max: score.document_max },
                                        ].map(row => (
                                            <div key={row.label}>
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                                    <span>{row.label}</span>
                                                    <span className="text-[#1B3A6B] font-black">
                                                        {Number(row.score).toFixed(1)}/{row.max}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-[#1B3A6B] h-full rounded-full"
                                                        style={{ width: `${Math.min(100, (row.score / row.max) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <Trophy size={28} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Assessment</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">
                                        Your CA result will appear here once posted.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* What Happens Next */}
                        <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
                            <p className="text-sm font-black text-[#1B3A6B] mb-2">What Happens Next?</p>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed mb-3">
                                {NEXT_STEPS[application?.status] || NEXT_STEPS.submitted}
                            </p>
                            <Link
                                to="/jobs/my-application"
                                className="flex items-center justify-between text-xs font-black text-[#1B3A6B] hover:underline"
                            >
                                View full process timeline <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsNotices;
