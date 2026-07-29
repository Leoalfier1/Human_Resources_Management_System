import React, { useState, useEffect } from 'react';
import { Printer, X, RotateCcw } from 'lucide-react';

const DEFAULTS = {
  preparedByName: "JUAN DELA CRUZ",
  reviewedByName: "JAY MONTEALTO, CESO V",
  approvedByName: "SUDI G. ALOLOD, CESO VI",
};

const PrintSignatureModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialData = {},
  documentTitle = "DepEd Official Report"
}) => {
  const defaults = {
    preparedByName: initialData.preparedByName || DEFAULTS.preparedByName,
    reviewedByName: initialData.reviewedByName || DEFAULTS.reviewedByName,
    approvedByName: initialData.approvedByName || DEFAULTS.approvedByName,
  };

  const [formData, setFormData] = useState(defaults);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        preparedByName: initialData.preparedByName || DEFAULTS.preparedByName,
        reviewedByName: initialData.reviewedByName || DEFAULTS.reviewedByName,
        approvedByName: initialData.approvedByName || DEFAULTS.approvedByName,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleReset = () => {
    setFormData(defaults);
    setErrors({});
  };

  const handleProceed = () => {
    const newErrors = {};
    if (!formData.preparedByName?.trim()) newErrors.preparedByName = "Name is required";
    if (!formData.reviewedByName?.trim()) newErrors.reviewedByName = "Name is required";
    if (!formData.approvedByName?.trim()) newErrors.approvedByName = "Name is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onConfirm(formData);
  };

  const fields = [
    {
      key: 'preparedByName',
      label: '1. Ratee (Employee)',
      sublabel: 'RATEE (EMPLOYEE SIGNATURE)',
      color: '#111111',
      badge: 'Left Column',
    },
    {
      key: 'reviewedByName',
      label: '2. Rater (Supervisor)',
      sublabel: 'RATER (SUPERVISOR SIGNATURE)',
      color: '#1B2A50',
      badge: 'Center Column',
    },
    {
      key: 'approvedByName',
      label: '3. Approving Authority',
      sublabel: 'APPROVING AUTHORITY SIGNATURE',
      color: '#C2410C',
      badge: 'Right Column',
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: '#1B2A50' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Printer size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm leading-tight">Confirm Signature Names</h3>
              <p className="text-[11px] text-white/70">{documentTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed pb-1">
            Confirm or override the signatory names for this print session. Changes here do not affect permanent system defaults.
          </p>

          {fields.map(f => (
            <div key={f.key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: f.color }}>{f.label}</span>
                <span className="text-[10px] text-slate-400 font-medium">{f.badge}</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Full Name <span className="text-[9px] normal-case text-slate-400">(printed above signature line)</span>
                </label>
                <input
                  type="text"
                  value={formData[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  placeholder={`e.g. ${DEFAULTS[f.key]}`}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-bold focus:outline-none focus:ring-2 uppercase ${
                    errors[f.key] ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-100'
                  }`}
                  style={{ color: f.color }}
                />
                {errors[f.key] && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors[f.key]}</p>}
                <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">{f.sublabel}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 font-bold text-xs transition-colors"
          >
            <RotateCcw size={13} /> Reset Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
              style={{ background: '#1B2A50' }}
            >
              <Printer size={14} /> Confirm & Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintSignatureModal;
