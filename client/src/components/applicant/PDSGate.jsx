import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE } from '../../utils/api';

/**
 * usePDSGate — lightweight hook to check PDS completion before allowing
 * an applicant to proceed to the Application Wizard.
 *
 * USAGE (inside JobDetail.jsx, wherever the "Apply" button currently lives):
 *
 *   import { usePDSGate } from '../../components/applicant/PDSGate';
 *   const { checking, isPdsComplete, requireCompletePDS } = usePDSGate();
 *
 *   const handleApplyClick = () => {
 *       if (!requireCompletePDS()) return;   // shows alert + redirects if incomplete
 *       navigate(`/jobs/${id}/apply`);
 *   };
 *
 *   <button onClick={handleApplyClick} disabled={checking}>Apply Now</button>
 */
export const usePDSGate = () => {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [isPdsComplete, setIsPdsComplete] = useState(false);

    const check = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsPdsComplete(false);
            setChecking(false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api/applicant/pds/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setIsPdsComplete(!!data.isComplete);
        } catch (e) {
            console.error('PDS status check failed:', e);
            setIsPdsComplete(false);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        check();

        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(API_BASE);
        socket.on('pds:completion-updated', () => {
            check();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Call this from the Apply button's onClick. Returns true if the
    // applicant may proceed; otherwise redirects to the PDS form.
    const requireCompletePDS = () => {
        if (isPdsComplete) return true;
        alert('Please complete and submit your Personal Data Sheet (PDS) before applying for a position.');
        navigate('/personnel/pds');
        return false;
    };

    return { checking, isPdsComplete, requireCompletePDS, refresh: check };
};

/**
 * PDSGateBanner — drop this near the top of JobDetail.jsx to show applicants
 * a persistent reminder if their PDS isn't done yet, instead of only
 * blocking them at click-time.
 */
export const PDSGateBanner = () => {
    const navigate = useNavigate();
    const { checking, isPdsComplete } = usePDSGate();

    if (checking) return null;

    if (isPdsComplete) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 mb-6">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <p className="flex-1 text-xs font-bold text-emerald-700">
                    Personal Data Sheet: Complete ✓
                </p>
            </div>
        );
    }

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-black text-[#1B3A6B] uppercase tracking-wide">
                        Personal Data Sheet (PDS) Required
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                        You must complete your Personal Data Sheet before you can apply.
                        <span className="block text-[10px] text-amber-700 font-bold mt-1">
                            Note: Your Personal Data Sheet (PDS) is a separate, more detailed form than your basic profile, required by CSC (Form 212) for all applications.
                        </span>
                    </p>
                </div>
            </div>
            <button
                onClick={() => navigate('/personnel/pds')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#162E55] transition-all shrink-0 self-start sm:self-center"
            >
                <FileText size={12} /> Complete PDS
            </button>
        </div>
    );
};
