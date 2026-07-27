import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Award, Download, Briefcase, Tag, MapPin, DollarSign, Calendar, FileCheck, CheckCircle2 } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../utils/api';

const AppointmentNotice = () => {
    const [applicationId, setApplicationId] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const token = () => localStorage.getItem('token');

    const fetchAppointment = async (id, isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/applications/${id}/appointment`, {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            const json = await res.json();
            if (!res.ok) { setError(json.message); setData(null); }
            else { setData(json); setError(null); }
        } catch (e) {
            setError('Could not reach the server.');
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const handleDownload = async () => {
    if (!applicationId) return;
    setDownloading(true);
    try {
        const res = await fetch(
            `${API_BASE}/api/applications/${applicationId}/appointment/pdf`,
            { headers: { 'Authorization': `Bearer ${token()}` } }
        );
        if (!res.ok) throw new Error('Could not generate PDF.');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Appointment_Notice_${data?.appointee_first_name || applicationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        alert(e.message);
    } finally {
        setDownloading(false);
    }
};

    useEffect(() => {
        const init = async () => {
            const res = await fetch(`${API_BASE}/api/applications/my-latest`, {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (!res.ok) { setLoading(false); setError('No active application found.'); return; }
            const latest = await res.json();
            setApplicationId(latest.applicationId);
            await fetchAppointment(latest.applicationId);
        };
        init();
    }, []);

    // Real-time: appointmentController.js's issueAppointment emits this exact event
    useEffect(() => {
        if (!applicationId) return;
        const socket = io(SERVER_BASE);
        socket.emit('join-application-room', `application-${applicationId}`);
        socket.on('application:stage-update', () => fetchAppointment(applicationId, true));
        return () => socket.disconnect();
    }, [applicationId]);

    if (loading) return <div className="min-h-screen flex justify-center pt-32"><div className="w-8 h-8 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin"/></div>;

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <p className="text-slate-400 font-black uppercase tracking-widest">{error || 'No appointment yet.'}</p>
                <p className="text-slate-300 text-sm mt-2">This page unlocks once HR issues your appointment.</p>
            </div>
        );
    }

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

    return (
        <div className="min-h-screen bg-[#F1F3F6] pb-16">
            <div className="max-w-3xl mx-auto px-6 pt-10 space-y-6">
                <div>
                    <h2 className="text-xl font-black text-[#1B3A6B]">Appointment Confirmation</h2>
                    <p className="text-xs font-bold text-emerald-600">Your appointment has been officially issued and recorded.</p>
                </div>

                {/* GREEN BANNER */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-10 text-center text-white shadow-xl">
                    <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award size={28} />
                    </div>
                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Official Appointment Issued</p>
                    <h3 className="text-2xl font-black mb-2">Congratulations, {data.appointee_first_name}!</h3>
                    <p className="text-sm text-emerald-50 mb-6">You are now officially a permanent government employee of DepEd.</p>
                    <button
    onClick={handleDownload}
    disabled={downloading}
    className="bg-white text-emerald-700 px-6 py-3 rounded-full text-xs font-black flex items-center gap-2 mx-auto hover:bg-emerald-50 transition-colors disabled:opacity-50"
>
    {downloading
        ? <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
        : <Download size={14} />
    }
    {downloading ? 'Generating PDF...' : 'Download Appointment Notice'}
</button>
                </div>

                {/* DETAILS GRID */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h4 className="text-xs font-black text-[#1B3A6B] uppercase mb-4">Appointment Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: Briefcase, label: 'Position', val: data.position_title + (data.subject ? ` (${data.subject})` : ''), color: 'text-[#D6402F]' },
                            { icon: Tag, label: 'Nature', val: data.nature, color: 'text-[#1B3A6B]' },
                            { icon: MapPin, label: 'Station', val: data.station, color: 'text-[#1B3A6B]' },
                            { icon: DollarSign, label: 'Salary', val: `SG-${data.salary_grade} · ₱${Number(data.monthly_salary).toLocaleString('en-PH')}/month`, color: 'text-[#1B3A6B]' },
                            { icon: Calendar, label: 'Effectivity Date', val: fmt(data.effectivity_date), color: 'text-amber-600' },
                            { icon: FileCheck, label: 'Notice Posted', val: fmt(data.notice_posted), color: 'text-[#1B3A6B]' },
                        ].map(row => (
                            <div key={row.label} className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                                <row.icon size={16} className="text-slate-300 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{row.label}</p>
                                    <p className={`text-xs font-black ${row.color}`}>{row.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TIMELINE */}
                <div className="bg-[#1B3A6B] rounded-2xl p-6 text-white">
                    <p className="text-xs font-black uppercase flex items-center gap-2 mb-4">
                        <CheckCircle2 size={16} className="text-emerald-400" /> RSP Process Completed Successfully
                    </p>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-8 mb-4">
                        {data.timeline.map((t, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                <span className="text-[11px] font-bold text-blue-100">{t.label}</span>
                                <span className="text-[10px] font-bold text-blue-300 ml-auto">{fmt(t.date)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-300 uppercase">Total Turnaround Time</span>
                        <span className="text-lg font-black text-emerald-400">
                            {data.total_tat} Working Days
                            <span className="text-[10px] text-blue-300 font-bold ml-2">Target: {data.target_tat} WD</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentNotice;