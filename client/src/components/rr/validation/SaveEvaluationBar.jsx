import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const SaveEvaluationBar = ({ onSave, isSaving, isComplete }) => {
    return (
        <div className="relative">
            {!isComplete && (
                <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider text-center mb-2">
                    Some criteria are still missing scores — you can save as a draft
                </div>
            )}
            <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                onClick={onSave}
                disabled={isSaving}
                className="w-full py-3.5 bg-[#D6402F] hover:bg-[#c0352a] text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-[#D6402F]/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
                <Check size={18} strokeWidth={3} />
                {isSaving ? 'Saving...' : 'Save Evaluation'}
            </motion.button>
        </div>
    );
};

export default SaveEvaluationBar;
