import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Upload, Check, ChevronDown, FileText } from 'lucide-react';

const PublicationSettingsCard = ({ callId, calls, announcement, isPublished, onSelectCall, onSaveSettings, onUploadMemo }) => {
    const [settings, setSettings] = useState({
        notify_all_nominees: true,
        notify_awardees_only: true,
        notify_dept_heads: false,
        notify_all_personnel: false
    });
    const [showCallDropdown, setShowCallDropdown] = useState(false);
    const [memoFile, setMemoFile] = useState(null);

    useEffect(() => {
        if (announcement) {
            setSettings({
                notify_all_nominees: !!announcement.notify_all_nominees,
                notify_awardees_only: !!announcement.notify_awardees_only,
                notify_dept_heads: !!announcement.notify_dept_heads,
                notify_all_personnel: !!announcement.notify_all_personnel
            });
        }
    }, [announcement]);

    const toggleSetting = (key) => {
        if (isPublished) return;
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        onSaveSettings(callId, settings);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setMemoFile(file);
            onUploadMemo(callId, file);
            e.target.value = '';
        }
    };

    const selectedCall = calls.find(c => c.id === callId);

    const CHECKBOXES = [
        { key: 'notify_all_nominees', label: 'All Nominees', desc: 'Notify all submitted nominees of results' },
        { key: 'notify_awardees_only', label: 'Awardees Only', desc: 'Notify only approved winners' },
        { key: 'notify_dept_heads', label: 'Department Heads', desc: 'Send copies to all department heads' },
        { key: 'notify_all_personnel', label: 'All Personnel', desc: 'Notify all active employees in the system' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center">
                        <Settings size={18} className="text-[#1B3A6B]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase text-[#1B3A6B] tracking-tight">
                            Publication Settings
                        </h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            Configure notifications before publishing
                        </p>
                    </div>
                </div>

                {/* Call selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowCallDropdown(!showCallDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        {selectedCall?.title || 'Select Call'}
                        <ChevronDown size={14} />
                    </button>
                    {showCallDropdown && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 min-w-[200px]">
                            {calls.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => { onSelectCall(c.id); setShowCallDropdown(false); }}
                                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors
                                        ${c.id === callId ? 'text-[#D6402F] bg-red-50' : 'text-slate-700'}`}
                                >
                                    {c.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Notification checkboxes */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {CHECKBOXES.map(cb => (
                    <button
                        key={cb.key}
                        onClick={() => toggleSetting(cb.key)}
                        disabled={isPublished}
                        className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left
                            ${settings[cb.key]
                                ? 'border-[#D6402F] bg-red-50'
                                : 'border-slate-100 bg-slate-50 hover:border-slate-200'}
                            ${isPublished ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors
                            ${settings[cb.key] ? 'bg-[#D6402F]' : 'bg-slate-200'}`}
                        >
                            {settings[cb.key] && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{cb.label}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{cb.desc}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Memo upload + save */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <label className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${isPublished ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <Upload size={14} />
                        {announcement?.memo_file_path ? 'Memo Uploaded' : 'Upload Memo (PDF)'}
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isPublished}
                        />
                    </label>
                    {announcement?.memo_file_path && (
                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                            <FileText size={12} />
                            Attached
                        </div>
                    )}
                </div>
                {!isPublished && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#162f57] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md transition-colors"
                    >
                        Save Settings
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default PublicationSettingsCard;
