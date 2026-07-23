import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Loader2, ArrowLeft } from 'lucide-react';

const VerifyEmailForm = ({ onSwitchTab }) => {
  const [resendStatus, setResendStatus] = useState('idle'); // idle, loading, sent

  // Auto-revert from "Sent" back to "Idle" after 4 seconds
  useEffect(() => {
    if (resendStatus === 'sent') {
      const timer = setTimeout(() => setResendStatus('idle'), 4000);
      return () => clearTimeout(timer);
    }
  }, [resendStatus]);

  const handleResend = () => {
    setResendStatus('loading');
    setTimeout(() => {
      setResendStatus('sent');
    }, 1200);
  };

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold text-[#1B3A6B] mb-2">Verify Your Email</h2>
      <p className="text-slate-500 text-sm mb-8">Account created — one more step.</p>

      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-[#1B3A6B]">
          <Mail size={40} />
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center text-white">
          <RefreshCw size={14} />
        </div>
      </div>

      <h3 className="font-bold text-lg mb-2">Check your inbox</h3>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed">
        A verification link has been sent to your email address. Click the link to activate your account and start applying for teaching and non-teaching positions.
      </p>

      <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-800 text-left mb-8">
        <strong>Tip:</strong> Check your spam or junk folder if you don't see the email within a few minutes. The link expires in <strong>24 hours</strong>.
      </div>

      {resendStatus === 'sent' ? (
        <div className="w-full bg-green-50 text-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-200">
          <RefreshCw size={18} className="animate-pulse" /> Email Resent!
        </div>
      ) : (
        <button
          onClick={handleResend}
          disabled={resendStatus === 'loading'}
          className="w-full bg-white border-2 border-slate-200 text-[#1B3A6B] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          {resendStatus === 'loading' ? <Loader2 className="animate-spin" size={20} /> : <><RefreshCw size={18} /> Resend Verification Email</>}
        </button>
      )}

      <button
        onClick={() => onSwitchTab('login')}
        className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold hover:text-[#1B3A6B] transition-colors mx-auto"
      >
        <ArrowLeft size={14} /> Return to Sign In
      </button>
    </div>
  );
};

export default VerifyEmailForm;
