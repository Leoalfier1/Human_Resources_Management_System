import React from 'react';
import MOVUploader from './MOVUploader';

const ReviewKRABlock = ({ obj, isReadOnly = false, onAccomplishmentChange, onSaveAccomplishment, onFileUpload, onDeleteFile }) => {
    return (
        <div className="pt-6 first:pt-0 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start select-none">
            {/* LEFT SIDE: KRA Details & Target */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 animate-pulse" />
                    <h4 className="text-xs font-black text-[#1e293b] uppercase tracking-tight">{obj.kra_name}</h4>
                    <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full">Wt: {obj.weight_percent}%</span>
                </div>
                <p className="text-xs font-bold text-black leading-relaxed">{obj.objective_description}</p>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-0.5">Target</span>
                    <p className="text-xs font-medium text-slate-800 leading-relaxed">{obj.target_statement}</p>
                </div>
            </div>

            {/* RIGHT SIDE: Actual accomplishments & Ratings */}
            <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/40">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black text-[#1e293b] uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-[#1e293b]" /> ACTUAL
                    </span>
                    
                    {/* Ratings buttons: read only */}
                    <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <span 
                                    key={num} 
                                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black border select-none
                                        ${obj.rating === num 
                                            ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' 
                                            : 'bg-white border-slate-200 text-slate-300'}`}
                                >
                                    {num}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Editable actual accomplishment textarea */}
                <div>
                    <textarea 
                        rows="3"
                        value={obj.actual_accomplishment || ""}
                        disabled={isReadOnly}
                        onChange={(e) => onAccomplishmentChange(obj.id, e.target.value)}
                        onBlur={(e) => onSaveAccomplishment(obj.id, e.target.value)}
                        placeholder="Fill in actual accomplishment during review cycle..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500 resize-none shadow-sm"
                    />
                </div>

                {/* MOV Uploader component */}
                <MOVUploader 
                    objId={obj.id} 
                    files={obj.mov_uploads || []}
                    isReadOnly={isReadOnly}
                    onFileUpload={onFileUpload}
                    onDeleteFile={onDeleteFile}
                />
            </div>
        </div>
    );
};

export default ReviewKRABlock;
