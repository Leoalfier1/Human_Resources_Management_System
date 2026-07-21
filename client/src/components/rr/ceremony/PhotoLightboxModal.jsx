import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SERVER_BASE } from '../../../utils/api';

const PhotoLightboxModal = ({ photo, onClose }) => {
    if (!photo) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-8"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative max-w-4xl max-h-[85vh] w-full"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 transition-colors z-10"
                    >
                        <X size={16} className="text-slate-700" />
                    </button>
                    <img
                        src={`${SERVER_BASE}/${photo.file_path}`}
                        alt="Ceremony photo"
                        className="w-full h-full object-contain rounded-2xl"
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PhotoLightboxModal;
