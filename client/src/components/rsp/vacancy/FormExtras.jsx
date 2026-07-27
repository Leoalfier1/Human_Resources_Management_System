import React from 'react';
// Changed 'Facebook' to 'Globe2' or 'Share2'
import { Upload, X, Globe, Share2, ClipboardList } from 'lucide-react'; 

export const FileDropzone = ({ file, setFile, error }) => (
  <div className="space-y-2 relative">
    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest">Division Memorandum (PDF)</label>
    <div className={`border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center bg-slate-50 ${error ? 'border-red-300' : 'border-slate-200'}`}>
      {!file ? (
        <>
          <Upload className="text-slate-400 mb-2" size={32} />
          <p className="text-xs text-slate-500 font-bold">Drag & drop PDF or <span className="text-[#1B3A6B] underline cursor-pointer">browse</span></p>
          <input 
            type="file" 
            accept=".pdf" 
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
            onChange={(e) => setFile(e.target.files[0])} 
          />
        </>
      ) : (
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200 w-full">
          <div className="bg-red-50 text-red-600 p-2 rounded-lg"><Upload size={18} /></div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
            <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={18}/>
          </button>
        </div>
      )}
    </div>
    {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
  </div>
);

export const PublishToggles = ({ values, onChange }) => {
  // NAMES MUST MATCH BACKEND/STATE KEYS EXACTLY
  const channels = [
    { id: 'publish_division_website', label: 'Division Website', icon: Globe },
    { id: 'publish_facebook', label: 'Facebook Page', icon: Share2 },
    { id: 'publish_bulletin', label: 'Bulletin Board', icon: ClipboardList },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {channels.map(ch => {
        // Read the selected state using the exact ID key
        const isSelected = values[ch.id] === true;

        return (
          <button
            key={ch.id}
            type="button" // Important: Don't submit the form on click
            onClick={() => onChange(ch.id, !isSelected)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
              isSelected 
                ? 'border-[#1B3A6B] bg-blue-50 text-[#1B3A6B] shadow-inner' 
                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
            }`}
          >
            <ch.icon size={20} className={isSelected ? 'scale-110 transition-transform' : ''} />
            <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">
              {ch.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};