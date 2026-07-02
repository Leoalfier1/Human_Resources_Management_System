import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/api';

const LoginForm = ({ onSwitchTab }) => {
  const { login } = useAuth(); // Get the login function from our context

  // 1. Local States
  const [loginType, setLoginType] = useState('staff'); // 'staff' or 'applicant'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ERROR STATES
  const [roleError, setRoleError] = useState(""); // For 403 (Role Mismatch)
  const [generalError, setGeneralError] = useState(""); // For 401 (Wrong PW)

  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setRoleError("");
    setGeneralError("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          loginType: loginType // Send 'staff' or 'applicant'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // SUCCESS: Save token/user to Context and LocalStorage
        login(data.user, data.token);
      } else if (response.status === 403) {
        // ROLE MISMATCH: User is in the wrong portal
        setRoleError(data.message); 
      } else {
        // UNAUTHORIZED: Wrong email or password
        setGeneralError(data.message || "Invalid credentials.");
      }
    } catch (error) {
      setGeneralError("Could not connect to the server. Is it running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#1B3A6B]">Sign In</h2>
        <p className="text-slate-500 text-sm italic">Access your HRMIS account to continue.</p>
      </div>

      {/* PORTAL TOGGLE (STAFF VS APPLICANT) */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
        <button
          type="button"
          onClick={() => { setLoginType('staff'); setRoleError(""); }}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
            loginType === 'staff' ? 'bg-[#1B3A6B] text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Staff / Admin Login
        </button>
        <button
          type="button"
          onClick={() => { setLoginType('applicant'); setRoleError(""); }}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
            loginType === 'applicant' ? 'bg-[#1B3A6B] text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Applicant Login
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        
        {/* ROLE MISMATCH ERROR BANNER (PART 2 REQUIREMENT) */}
        <AnimatePresence>
          {roleError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-red-50 border border-red-200 p-3 rounded-xl"
            >
              <AlertCircle className="text-red-600 shrink-0" size={18} />
              <p className="text-[11px] font-bold text-red-600 leading-tight">
                {roleError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GENERAL ERROR (Wrong Password) */}
        {generalError && !roleError && (
          <div className="text-center p-2 bg-slate-100 rounded-lg">
             <p className="text-xs text-red-500 font-bold">{generalError}</p>
          </div>
        )}

        {/* IDENTIFIER FIELD */}
        <div>
          <label className="block text-[10px] font-black text-slate-700 mb-1 uppercase tracking-wider">
            {loginType === 'staff' ? 'Email / Employee ID *' : 'Email Address *'}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
              placeholder={loginType === 'staff' ? "employee@deped.gov.ph" : "your@email.com"}
              value={formData.identifier}
              onChange={(e) => setFormData({...formData, identifier: e.target.value})}
            />
          </div>
        </div>

        {/* PASSWORD FIELD */}
        <div>
          <label className="block text-[10px] font-black text-slate-700 mb-1 uppercase tracking-wider">Password *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              required
              className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] outline-none transition-all text-sm"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* FORGOT PASSWORD LINK */}
        <div className="flex justify-end">
          <button 
            type="button"
            onClick={() => onSwitchTab('forgot')}
            className="text-[11px] text-[#1B3A6B] font-black hover:underline uppercase tracking-tighter"
          >
            Forgot Password?
          </button>
        </div>

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#1B3A6B] hover:bg-[#254a85] text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 disabled:opacity-70 uppercase tracking-widest text-xs"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Log In"}
        </button>
      </form>

      {/* FOOTER */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 mb-4">
          Don't have an account? {' '}
          <button onClick={() => onSwitchTab('signup')} className="text-orange-600 font-bold hover:underline">Sign Up</button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;