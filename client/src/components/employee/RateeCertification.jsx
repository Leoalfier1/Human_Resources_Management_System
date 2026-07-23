import React from 'react';
import { CheckCircle, Edit3 } from 'lucide-react';

const RateeCertification = ({ isSigned, signatureDataUrl, name, position, date, onSignClick }) => {
    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-4 select-none">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-black text-[#1e293b] uppercase tracking-widest flex items-center gap-2">
                ✍️ Ratee (Employee) Electronic Signature & Certification
              </h3>
              {isSigned && (
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                  <CheckCircle size={13} /> Verified Signature
                </span>
              )}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                I certify under penalty of administrative sanctions that the information and performance self-ratings stated herein are true and correct. I hereby append my official electronic signature to this Individual Performance Commitment and Review Form (IPCRF).
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
                {/* Electronic Signature Box */}
                <div 
                    onClick={onSignClick}
                    className={`w-64 h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-all relative p-3 shadow-inner
                        ${isSigned ? 'bg-slate-50 border-emerald-500 text-emerald-800' : 'bg-slate-50/50 border-blue-400 hover:border-blue-600 text-blue-900'}`}
                >
                    {isSigned ? (
                        <div className="text-center space-y-1 w-full">
                            {signatureDataUrl ? (
                              <img src={signatureDataUrl} alt="Drawn Ratee Signature" className="h-14 w-auto object-contain mx-auto border-b border-slate-300 pb-1" />
                            ) : (
                              <div className="font-serif italic font-black text-base md:text-lg text-slate-900 tracking-wide border-b border-slate-300 pb-0.5 px-2">
                                  {name || 'Raul M. Colot Jr.'}
                              </div>
                            )}
                            <div className="text-[9px] font-black uppercase text-emerald-700 flex items-center justify-center gap-1 pt-0.5">
                                <CheckCircle size={11} /> Digitally Signed
                            </div>
                            <span className="text-[8px] text-slate-500 font-bold block">
                                {date ? new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : new Date().toLocaleDateString()}
                            </span>
                        </div>
                    ) : (
                        <div className="text-center space-y-1">
                            <Edit3 size={20} className="mx-auto text-blue-600 animate-bounce" />
                            <span className="text-[11px] font-black uppercase text-blue-900 block">
                                Sign with your Finger Tip
                            </span>
                            <span className="text-[8px] text-slate-500 font-bold block">Opens touch signature drawing pad</span>
                        </div>
                    )}
                </div>

                <div className="text-xs font-bold text-slate-800 space-y-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Employee / Ratee</label>
                    <p className="text-sm font-black text-slate-900">{name || 'Raul M. Colot Jr.'}</p>
                    <p className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">{position || 'Employee'}</p>
                    {date && <p className="text-slate-500 text-[10px]">Signed on: {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                </div>
            </div>
        </div>
    );
};

export default RateeCertification;
