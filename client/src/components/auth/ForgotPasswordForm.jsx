import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPasswordForm = ({ onSwitchTab }) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false); // Controls State A vs State B
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSent(true); // Switches to the "Check your inbox" screen
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button 
        onClick={() => onSwitchTab('login')}
        className="flex items-center gap-2 text-[#1B3A6B] text-xs font-bold mb-6 hover:underline"
      >
        <ArrowLeft size={14} /> Back to Sign In
      </button>

      <AnimatePresence mode="wait">
        {!isSent ? (
          /* STATE A: Initial Form */
          <motion.div
            key="state-a"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-2xl font-bold text-[#1B3A6B] mb-2">Forgot Password</h2>
            <p className="text-slate-500 text-sm mb-6">
              Enter your registered email address to receive a password reset link.
            </p>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1B3A6B] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Send Reset Link"}
              </button>
            </form>
          </motion.div>
        ) : (
          /* STATE B: Success Confirmation */
          <motion.div
            key="state-b"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-[#1B3A6B] mb-6">Forgot Password</h2>
            
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle size={48} />
              </div>
            </div>

            <p className="text-slate-600 text-sm mb-1">Reset link sent to:</p>
            <p className="font-bold text-[#1B3A6B] mb-6">{email}</p>

            <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 text-left mb-6 leading-relaxed">
              Check your spam or junk folder if you don't see the email. The link expires in <strong>30 minutes</strong>.
            </div>

            <button 
              onClick={() => { setIsSent(false); setEmail(''); }}
              className="text-orange-600 text-sm font-bold hover:underline"
            >
              Try a different email address
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPasswordForm;