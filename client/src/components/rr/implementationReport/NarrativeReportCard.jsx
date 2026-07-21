import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, Download, Send } from 'lucide-react';

const NarrativeReportCard = ({ narrative, isSubmitted, onChange, onSave, onGeneratePDF, onSubmit }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center">
                    <FileText size={18} className="text-[#1B3A6B]" />
                </div>
                <h3 className="text-sm font-black uppercase text-[#1B3A6B] tracking-tight">
                    Narrative Report
                </h3>
                {isSubmitted && (
                    <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                        Submitted
                    </span>
                )}
            </div>

            <textarea
                value={narrative || ''}
                onChange={e => onChange(e.target.value)}
                disabled={isSubmitted}
                rows={12}
                placeholder="Provide a narrative description of the PRAISE implementation for this cycle, including challenges encountered, lessons learned, and recommendations for the next cycle..."
                className={`w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-800 font-medium leading-relaxed outline-none resize-none
                    focus:border-[#1B3A6B]/30 transition-colors
                    ${isSubmitted ? 'opacity-60 cursor-not-allowed' : ''}`}
            />

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-5">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSave}
                    disabled={isSubmitted}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#1B3A6B] text-[#1B3A6B] text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#1B3A6B]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Save size={14} />
                    Save Draft
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onGeneratePDF}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#D6402F] hover:bg-[#c0352a] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md transition-colors"
                >
                    <Download size={14} />
                    Generate PDF Report
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSubmit}
                    disabled={isSubmitted}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1B3A6B] hover:bg-[#162f57] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                >
                    <Send size={14} />
                    Submit to Region
                </motion.button>
            </div>
        </motion.div>
    );
};

export default NarrativeReportCard;
