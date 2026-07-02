import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const Step1PersonalInfo = ({ applicationId, setApplicationId, vacancy, onNext }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const isNonTeaching = vacancy?.position_type === 'non_teaching';

    const [formData, setFormData] = useState({
        full_name: user?.fullName || '',
        email: user?.email || '',
        phone: '',
        current_school: '',
        years_experience: ''
    });

    const isComplete = formData.full_name && formData.email && formData.phone && formData.current_school && formData.years_experience !== '';

    const handleSaveAndContinue = async () => {
        if (!isComplete) return;
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            let appId = applicationId;

            if (!appId) {
                const res1 = await fetch('http://localhost:5000/api/applications', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ vacancy_id: vacancy.id })
                });
                const data1 = await res1.json();
                appId = data1.applicationId;
                setApplicationId(appId);
            }

            await fetch(`http://localhost:5000/api/applications/${appId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(formData)
            });

            onNext();
        } catch (error) {
            console.error('Error saving step 1:', error);
            alert('Failed to save progress. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-3xl mx-auto"
        >
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

                {/* Header with position type badge */}
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <h3 className="font-black text-xl text-[#1B3A6B] uppercase italic">
                        Personal Information
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        isNonTeaching
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-amber-100 text-amber-700'
                    }`}>
                        {isNonTeaching ? 'Non-Teaching' : 'Teaching'} Position
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Full Name */}
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]"
                            value={formData.full_name}
                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Contact Number *
                        </label>
                        <input
                            type="tel"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            placeholder="e.g. 0917-123-4567"
                            required
                        />
                    </div>

                    {/* Current School / Office Station */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            {isNonTeaching
                                ? 'Current Office / Station *'
                                : 'Current School / Station *'}
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]"
                            placeholder={isNonTeaching
                                ? 'e.g. DepEd Division Office, Dapitan City'
                                : 'e.g. Dapitan City National High School'}
                            value={formData.current_school}
                            onChange={e => setFormData({...formData, current_school: e.target.value})}
                            required
                        />
                    </div>

                    {/* Years of Experience */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            {isNonTeaching
                                ? 'Years of Relevant Experience'
                                : 'Years of Teaching Experience'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]"
                            placeholder={isNonTeaching
                                ? 'Years in administrative/support role'
                                : 'Years as a classroom teacher'}
                            value={formData.years_experience}
                            onChange={e => setFormData({...formData, years_experience: e.target.value})}
                            required
                        />
                    </div>

                </div>

                {/* Position-specific info note */}
                {isNonTeaching && (
                    <div className="mt-6 bg-sky-50 border border-sky-100 rounded-xl px-5 py-3 text-[11px] font-bold text-sky-700">
                        You are applying for a <span className="font-black">Non-Teaching</span> position.
                        Please provide your office/administrative experience details above.
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSaveAndContinue}
                        disabled={!isComplete || loading}
                        className={`flex items-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                            ${isComplete && !loading
                                ? 'bg-[#1B3A6B] hover:bg-[#162E55] text-white shadow-lg shadow-blue-900/20'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Continue →
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default Step1PersonalInfo;