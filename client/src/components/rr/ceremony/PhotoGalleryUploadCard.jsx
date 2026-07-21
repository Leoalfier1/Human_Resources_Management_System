import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { SERVER_BASE } from '../../../utils/api';

const PhotoGalleryUploadCard = ({ photos, onUpload, onDelete, onView }) => {
    const fileInputRef = useRef(null);

    const handleFiles = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) onUpload(files);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f =>
            ['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)
        );
        if (files.length > 0) onUpload(files);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100"
        >
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center">
                    <Camera size={18} className="text-[#1B3A6B]" />
                </div>
                <h3 className="text-sm font-black uppercase text-[#1B3A6B] tracking-tight">
                    Photo Gallery Upload
                </h3>
            </div>

            {/* Dropzone */}
            <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#1B3A6B]/40 rounded-2xl p-8 text-center cursor-pointer transition-colors"
            >
                <Upload size={28} className="mx-auto text-slate-300 mb-3" />
                <p className="text-xs font-bold text-slate-500">Upload Ceremony Photos</p>
                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">
                    JPG, PNG supported &middot; Max 10MB per file
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                />
            </div>

            {/* Thumbnail grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <AnimatePresence>
                        {photos.map(photo => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-100 cursor-pointer"
                                onClick={() => onView(photo)}
                            >
                                <img
                                    src={`${SERVER_BASE}/${photo.file_path}`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} className="text-white" strokeWidth={3} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Empty placeholders */}
            {photos.length === 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="aspect-square rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center"
                        >
                            <Camera size={20} className="text-slate-200" />
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default PhotoGalleryUploadCard;
