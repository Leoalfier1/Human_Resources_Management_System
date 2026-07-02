import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE } from '../../utils/api';

const SignUpForm = ({ onSwitchTab }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 1. Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  // 2. Validation Logic
  const isPasswordMatch = formData.password === formData.confirmPassword;
  const isPasswordLongEnough = formData.password.length >= 8;
  const isFormValid = 
    formData.fullName && 
    formData.email && 
    formData.mobile && 
    isPasswordLongEnough && 
    isPasswordMatch && 
    formData.agreeToTerms;

const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Success: " + data.message);
        onSwitchTab('verify'); // Move to verify tab
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Could not connect to the server. Is it running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-[#1B3A6B]">Create an Applicant Account</h2>
      </div>

      {/* Warning/Info Box */}
      <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl mb-6 text-[11px] text-amber-800 leading-relaxed">
        <p>
          Sign-up is available for <strong>job applicants</strong> applying to posted teaching positions. 
          Staff, HRMPSB, and Appointing Authority accounts are created by the System Administrator.
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-3">
        {/* Full Name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
              placeholder="Juan Dela Cruz"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
        </div>

        {/* Email & Mobile Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
                placeholder="juan@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Mobile Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="tel"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
                placeholder="09XXXXXXXXX"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Password Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
                placeholder="Min. 8 chars"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Confirm *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Validation Error Messages */}
        {formData.password && !isPasswordLongEnough && (
          <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Password must be at least 8 characters</p>
        )}
        {formData.confirmPassword && !isPasswordMatch && (
          <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Passwords do not match</p>
        )}

        {/* Privacy Checkbox */}
        <label className="flex items-start gap-2 cursor-pointer mt-4">
          <input 
            type="checkbox" 
            className="mt-1 rounded border-slate-300 text-[#1B3A6B]" 
            checked={formData.agreeToTerms}
            onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
          />
          <span className="text-[10px] text-slate-600 leading-tight">
            I agree to the <span className="text-[#1B3A6B] font-bold">Terms of Service</span> and <span className="text-[#1B3A6B] font-bold">Data Privacy Policy (RA 10173)</span> of the DepEd SDO Dapitan City.
          </span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full bg-[#1B3A6B] hover:bg-[#254a85] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account? {' '}
        <button onClick={() => onSwitchTab('login')} className="text-orange-600 font-bold hover:underline">Log In</button>
      </p>
    </div>
  );
};

export default SignUpForm;