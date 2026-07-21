import React from 'react';
import { motion } from 'framer-motion';
import { API_BASE } from '../../../utils/api';

const token = () => localStorage.getItem('token');
const headers = () => ({
    'Authorization': `Bearer ${token()}`,
    'Content-Type': 'application/json'
});

const AttendeesCard = ({ meetingId, members, onToggleAttendance, isFinalized }) => {
    const handleToggle = async (member) => {
        if (isFinalized) return;
        const newVal = !member.is_present;
        try {
            const res = await fetch(
                `${API_BASE}/api/rr/praise-meetings/${meetingId}/attendance/${member.id}`,
                {
                    method: 'PATCH',
                    headers: headers(),
                    body: JSON.stringify({ isPresent: newVal })
                }
            );
            if (res.ok) {
                onToggleAttendance(member.id, newVal);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1B3A6B] mb-4">
                Attendees
            </h3>

            <div className="space-y-1">
                {members.map((member, i) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                        <div>
                            <p className="text-sm font-bold text-[#1B3A6B]">{member.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {member.role_label}
                            </p>
                        </div>

                        <button
                            onClick={() => handleToggle(member)}
                            disabled={isFinalized}
                            className="relative w-4 h-4 rounded-full transition-all"
                        >
                            <motion.div
                                className={`w-4 h-4 rounded-full border-2 transition-all ${
                                    member.is_present
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'bg-transparent border-slate-300 group-hover:border-slate-400'
                                }`}
                                animate={member.is_present ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.3 }}
                            />
                            {member.is_present && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </motion.div>
                            )}
                        </button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default AttendeesCard;
