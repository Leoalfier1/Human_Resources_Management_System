import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Palette, UserCircle } from 'lucide-react';

const EventDetailsCard = ({ ceremony, committeeMembers, onUpdate }) => {
    const [form, setForm] = useState({
        ceremonyDatetime: '',
        venue: '',
        programTheme: '',
        masterOfCeremoniesId: ''
    });
    const debounceRef = useRef(null);

    useEffect(() => {
        if (ceremony) {
            setForm({
                ceremonyDatetime: ceremony.ceremony_datetime
                    ? new Date(ceremony.ceremony_datetime).toISOString().slice(0, 16)
                    : '',
                venue: ceremony.venue || '',
                programTheme: ceremony.program_theme || '',
                masterOfCeremoniesId: ceremony.master_of_ceremonies_id || ''
            });
        }
    }, [ceremony]);

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onUpdate({ ...form, [key]: value });
        }, 800);
    };

    const fields = [
        {
            key: 'ceremonyDatetime',
            label: 'CEREMONY DATE & TIME',
            icon: <Calendar size={16} className="text-slate-400" />,
            type: 'datetime-local'
        },
        {
            key: 'venue',
            label: 'VENUE',
            icon: <MapPin size={16} className="text-slate-400" />,
            type: 'text',
            placeholder: 'e.g. University Auditorium, Main Campus'
        },
        {
            key: 'programTheme',
            label: 'PROGRAM / THEME',
            icon: <Palette size={16} className="text-slate-400" />,
            type: 'text',
            placeholder: 'e.g. Excellence in Public Service: A PRAISE Celebration'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center">
                    <Calendar size={18} className="text-[#1B3A6B]" />
                </div>
                <h3 className="text-sm font-black uppercase text-[#1B3A6B] tracking-tight">
                    Event Details
                </h3>
            </div>

            <div className="space-y-4">
                {fields.map(f => (
                    <div key={f.key}>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                            {f.label}
                        </label>
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-[#1B3A6B]/30 transition-colors">
                            {f.icon}
                            <input
                                type={f.type}
                                value={form[f.key]}
                                onChange={e => handleChange(f.key, e.target.value)}
                                placeholder={f.placeholder || ''}
                                className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                ))}

                {/* MOC Dropdown */}
                <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                        MASTER OF CEREMONIES
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-[#1B3A6B]/30 transition-colors">
                        <UserCircle size={16} className="text-slate-400" />
                        <select
                            value={form.masterOfCeremoniesId}
                            onChange={e => handleChange('masterOfCeremoniesId', e.target.value)}
                            className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">-- Select MOC --</option>
                            {committeeMembers.map(m => (
                                <option key={m.id} value={m.user_id}>
                                    {m.full_name} — {m.role_label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default EventDetailsCard;
