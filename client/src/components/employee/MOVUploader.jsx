import React from 'react';
import { FileText, Eye, Download, Trash2, Upload } from 'lucide-react';
import { SOCKET_URL } from '../../utils/api';

const MOVUploader = ({ objId, files = [], isReadOnly = false, onFileUpload, onDeleteFile }) => {
    const formatSize = (bytes) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <div className="bg-slate-50/60 border border-slate-200/50 p-4 rounded-2xl flex flex-col justify-between space-y-3 select-none">
            <div>
                <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block mb-2">Means of Verification (MOV)</label>
                
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {files.map(file => (
                        <div key={file.id} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-100 text-[10px] font-bold shadow-sm">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <FileText size={13} className="text-slate-600 shrink-0" />
                                <span className="truncate text-black">{file.original_filename}</span>
                                <span className="text-[9px] text-slate-600 font-normal shrink-0">({formatSize(file.file_size_bytes)})</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <a 
                                    href={`${SOCKET_URL}/uploads/pm_movs/${file.stored_filename}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-600 hover:text-black transition-colors p-1"
                                >
                                    <Eye size={12} />
                                </a>
                                <a 
                                    href={`${SOCKET_URL}/uploads/pm_movs/${file.stored_filename}`}
                                    download
                                    className="text-slate-600 hover:text-black transition-colors p-1"
                                >
                                    <Download size={12} />
                                </a>
                                {!isReadOnly && onDeleteFile && (
                                    <button 
                                        onClick={() => onDeleteFile(objId, file.id)}
                                        className="text-slate-600 hover:text-red-600 transition-colors p-1 cursor-pointer"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* File Drag and Drop upload block */}
            {!isReadOnly && onFileUpload && (
                <div 
                    className="border-2 border-dashed border-slate-300 hover:border-red-400 transition-colors rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-1 bg-white"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            onFileUpload(objId, e.dataTransfer.files[0]);
                        }
                    }}
                    onClick={() => document.getElementById(`fileInput-${objId}`).click()}
                >
                    <Upload size={16} className="text-slate-600" />
                    <p className="text-[9px] font-black text-slate-800 uppercase">Drag & Drop or Browse</p>
                    <span className="text-[8px] text-slate-600">PDF, XLSX, PNG, JPG &middot; Max 10MB</span>
                    <input 
                        type="file" 
                        id={`fileInput-${objId}`}
                        className="hidden" 
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                onFileUpload(objId, e.target.files[0]);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default MOVUploader;
