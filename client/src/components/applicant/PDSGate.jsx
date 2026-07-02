import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';

const API = 'http://localhost:5000';

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

    useEffect(() => {
        const check = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API}/api/applicant/pds/status`, {
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
        check();
    }, []);

    // Call this from the Apply button's onClick. Returns true if the
    // applicant may proceed; otherwise redirects to the PDS form.
    const requireCompletePDS = () => {
        if (isPdsComplete) return true;
        alert('Please complete and submit your Personal Data Sheet (PDS) before applying for a position.');
        navigate('/personnel/pds');
        return false;
    };

    return { checking, isPdsComplete, requireCompletePDS };
};

/**
 * PDSGateBanner — drop this near the top of JobDetail.jsx to show applicants
 * a persistent reminder if their PDS isn't done yet, instead of only
 * blocking them at click-time.
 */
export const PDSGateBanner = () => {
    const navigate = useNavigate();
    const { checking, isPdsComplete } = usePDSGate();

    if (checking || isPdsComplete) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="flex-1 text-xs font-bold text-amber-700">
                You must complete your Personal Data Sheet before you can apply for any position.
            </p>
            <button
                onClick={() => navigate('/personnel/pds')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#162E55] transition-all shrink-0"
            >
                <FileText size={12} /> Complete PDS
            </button>
        </div>
    );
};
