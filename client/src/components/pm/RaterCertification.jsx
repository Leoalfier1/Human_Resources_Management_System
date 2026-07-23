import React from 'react';
import { CheckCircle2, ShieldCheck, Edit3, Trash2 } from 'lucide-react';

const RaterCertification = ({
  isSigned = false,
  signatureDataUrl = null,
  name = "Jay Montealto, CESO V",
  position = "Schools Division Superintendent",
  unit = "City Schools Division of Dapitan",
  date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  onSignClick,
  onClearSignature
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-xs font-black text-[#1e293b] uppercase tracking-widest flex items-center gap-2">
          ✍️ Rater (Evaluator) Electronic Signature & Certification
        </h3>
        {isSigned ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={13} /> Verified Rater Signature
            </span>
            <button
              onClick={onSignClick}
              className="text-[9px] font-black uppercase text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl border border-blue-200 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Click to draw a new signature"
            >
              <Edit3 size={11} /> Redo Signature
            </button>
            <button
              onClick={onClearSignature}
              className="text-[9px] font-black uppercase text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-xl border border-red-200 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Clear Rater Signature"
            >
              <Trash2 size={11} /> Clear / Remove Signature
            </button>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
        I hereby certify under official authority that I have reviewed, verified, and evaluated the Individual Performance Commitment and Review Form (IPCRF) self-ratings, MOVs, and core competencies in accordance with DepEd Performance Management System standards.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
        {/* Rater Electronic Signature Stamp */}
        <div
          onClick={onSignClick}
          className={`w-64 h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-all relative p-3 shadow-inner
            ${isSigned ? 'bg-slate-50 border-emerald-500 text-emerald-800' : 'bg-slate-50/50 border-blue-400 hover:border-blue-600 text-blue-900'}`}
        >
          {isSigned ? (
            <div className="text-center space-y-1 w-full">
              {signatureDataUrl ? (
                <img src={signatureDataUrl} alt="Drawn Rater Signature" className="h-14 w-auto object-contain mx-auto border-b border-slate-300 pb-1" />
              ) : (
                <div className="font-serif italic font-black text-base md:text-lg text-slate-900 tracking-wide border-b border-slate-300 pb-0.5 px-2">
                  ✍️ {name}
                </div>
              )}
              <div className="text-[9px] font-black uppercase text-emerald-700 flex items-center justify-center gap-1 pt-0.5">
                <ShieldCheck size={12} className="text-emerald-600" /> Digitally Signed by Rater
              </div>
              <span className="text-[8px] text-slate-500 font-bold block">
                {date}
              </span>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <Edit3 size={20} className="mx-auto text-blue-600 animate-bounce" />
              <span className="text-[11px] font-black uppercase text-blue-900 block">
                Rater Sign with Finger Tip
              </span>
              <span className="text-[8px] text-slate-500 font-bold block">Click to draw Rater Electronic Signature</span>
            </div>
          )}
        </div>

        {/* Rater Metadata */}
        <div className="text-xs font-bold text-slate-800 space-y-0.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Evaluator / Rater</label>
          <p className="text-sm font-black text-slate-900">{name}</p>
          <p className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">{position}</p>
          <p className="text-slate-500 text-[10px]">{unit}</p>
        </div>
      </div>
    </div>
  );
};

export default RaterCertification;
