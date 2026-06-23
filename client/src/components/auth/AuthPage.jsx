import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from './AuthLayout';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import VerifyEmailForm from './VerifyEmailForm';

const AuthPage = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // login, signup, forgot, verify

  const tabs = [
    { id: 'login', label: 'Login' },
    { id: 'signup', label: 'Sign Up' },
    { id: 'forgot', label: 'Forgot PW' },
    { id: 'verify', label: 'Verify' },
  ];

  return (
    <AuthLayout>
      {/* Tab Navigation Bar */}
      <div className="flex bg-slate-200/50 p-1 rounded-xl mb-8 w-full max-w-[400px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-[#1B3A6B] shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Animated Form Container */}
      <div className="w-full max-w-[420px] bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200 border border-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'login' && ( <LoginForm onSwitchTab={setActiveTab} onLoginSuccess={onLoginSuccess} />)}
            
            {/* We will add these in Phase 3 */}
            {activeTab === 'signup' && <SignUpForm onSwitchTab={setActiveTab} />}
            {activeTab === 'forgot' && <ForgotPasswordForm onSwitchTab={setActiveTab} />}
            {activeTab === 'verify' && <VerifyEmailForm onSwitchTab={setActiveTab} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};

export default AuthPage;