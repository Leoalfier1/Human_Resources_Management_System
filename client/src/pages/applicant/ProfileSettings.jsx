import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE } from '../../utils/api';

const ProfileSettings = () => {
  const [profile, setProfile] = useState({ full_name: '', email: '', mobile: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = () => localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API_BASE}/api/profile/me`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.ok && r.json())
      .then((d) => d && setProfile({ full_name: d.full_name, email: d.email, mobile: d.mobile || '' }))
      .catch(() => {});
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/profile/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ fullName: profile.full_name, mobile: profile.mobile }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message });
    } catch {
      setMessage({ type: 'error', text: 'Server error.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match.' });
    }
    if (passwordForm.newPassword.length < 8) {
      return setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/profile/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message });
      if (res.ok) setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setMessage({ type: 'error', text: 'Server error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] pb-16">
      <div className="bg-[#1B3A6B] text-white">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">My Account</p>
          <h1 className="text-2xl font-black">Profile Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {message.text}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 rounded-xl"><User size={18} className="text-[#1B3A6B]" /></div>
            <div>
              <p className="text-sm font-black text-[#1B3A6B]">Personal Information</p>
              <p className="text-[10px] font-bold text-slate-400">Update your name and contact details</p>
            </div>
          </div>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                <input value={profile.email} disabled className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-100 text-sm font-bold text-slate-400 bg-slate-50 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile</label>
                <input value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="bg-[#1B3A6B] hover:bg-[#122a4f] text-white px-6 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-50 rounded-xl"><Lock size={18} className="text-amber-600" /></div>
            <div>
              <p className="text-sm font-black text-[#1B3A6B]">Change Password</p>
              <p className="text-[10px] font-bold text-slate-400">Minimum 8 characters recommended</p>
            </div>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Password</label>
                <input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                <input type="password" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm Password</label>
                <input type="password" required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileSettings;
