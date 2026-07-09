import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('form'); // 'form' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const isPasswordLongEnough = newPassword.length >= 8;
  const doPasswordsMatch = newPassword === confirmPassword;
  const isFormValid = isPasswordLongEnough && doPasswordsMatch && newPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Password updated successfully!');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to reset password.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Could not connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px] mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#1B3A6B]">Reset Password</h2>
          <p className="text-slate-500 text-sm italic">Enter your new password below.</p>
        </div>

        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle size={48} />
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#1B3A6B] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#254a85] transition-all"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && !isLoading && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={48} />
              </div>
            </div>
            <p className="text-red-600 text-sm mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#1B3A6B] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#254a85] transition-all"
            >
              Back to Login
            </button>
          </div>
        )}

        {status === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-700 mb-1 uppercase tracking-wider">New Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword && !isPasswordLongEnough && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Password must be at least 8 characters
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-700 mb-1 uppercase tracking-wider">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {confirmPassword && !doPasswordsMatch && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full bg-[#1B3A6B] hover:bg-[#254a85] text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
