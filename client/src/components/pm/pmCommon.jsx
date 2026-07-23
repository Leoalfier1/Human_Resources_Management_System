import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Upload, FileText, CheckCircle, X, Star, Users, Target, TrendingUp, Clock } from "lucide-react";

export const NAVY = "#1B3A6B";
export const ACCENT = "#D6402F";

export const STATUS_META = {
  finalized:       { label: "Finalized",      color: "bg-green-100 text-green-700",   dot: "bg-green-500"  },
  reviewed:        { label: "Reviewed",       color: "bg-green-100 text-green-700",   dot: "bg-green-500"  },
  submitted:       { label: "Submitted",      color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"   },
  under_review:    { label: "Under Review",   color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  needs_revision:  { label: "Needs Revision", color: "bg-red-100 text-red-700",       dot: "bg-red-500"    },
  not_submitted:   { label: "Not Submitted",  color: "bg-gray-100 text-gray-500",     dot: "bg-gray-400"   },
};

export const RATING_LABELS = {
  1: "Poor",
  2: "Unsatisfactory",
  3: "Satisfactory",
  4: "Very Satisfactory",
  5: "Outstanding",
};

export function getAdjectival(rating) {
  if (!rating && rating !== 0) return "—";
  const num = Number(rating);
  if (num >= 4.50) return "Outstanding";
  if (num >= 3.50) return "Very Satisfactory";
  if (num >= 2.50) return "Satisfactory";
  if (num >= 1.50) return "Unsatisfactory";
  return "Poor";
}

export function StatusBadge({ status, size = "sm" }) {
  const m = STATUS_META[status] || STATUS_META.not_submitted;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${size === "sm" ? "text-xs" : "text-sm"} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function RatingSelector({ value, onChange, disabled }) {
  const [local, setLocal] = useState(value);
  const current = value !== undefined ? value : local;
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => {
            if (!disabled && onChange) {
              setLocal(n);
              onChange(n);
            }
          }}
          className={`w-8 h-8 rounded text-sm font-semibold border transition-all
            ${current === n ? "text-white border-transparent shadow-sm" : "text-gray-600 border-gray-300 hover:border-gray-400 bg-white"}
            ${disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:scale-105"}`}
          style={current === n ? { backgroundColor: ACCENT } : {}}
          disabled={disabled}
        >
          {n}
        </button>
      ))}
      {current && <span className="ml-2 text-[10px] text-gray-500 font-semibold uppercase">{RATING_LABELS[current]}</span>}
    </div>
  );
}

export function Avatar({ name, size = 8, className = "" }) {
  const initials = name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "??";
  const px = size * 4;
  return (
    <div className={`rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${className}`}
      style={{ backgroundColor: NAVY, width: px, height: px }}>
      {initials}
    </div>
  );
}

export function ProgressBar({ value, color = "bg-green-500" }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        className={`h-2 rounded-full transition-all ${color}`}
      />
    </div>
  );
}

export function PhaseCard({ phaseNumber, title, icon: Icon, children, status, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div layout className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-black">
            {Icon ? <Icon size={20} /> : <Target size={20} />}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phase {phaseNumber}</div>
            <div className="text-sm font-bold text-black">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status && <StatusBadge status={status} />}
          {open ? <ChevronUp size={18} className="text-slate-600" /> : <ChevronDown size={18} className="text-slate-600" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PersonnelsList({ personnel, onSelect, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {personnel.map(person => (
        <button
          key={person.id}
          type="button"
          onClick={() => onSelect && onSelect(person)}
          className="w-full flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <Avatar name={person.name} size={9} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-black truncate">{person.name}</div>
            <div className="text-xs text-slate-600 font-medium truncate">{person.position} · {person.unit}</div>
          </div>
          <StatusBadge status={person.status} />
        </button>
      ))}
    </div>
  );
}

export function KRAAccordionRow({ kra, mode = "view", onRatingChange, onMOVUpload }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(kra.rating);
  const handleRate = (v) => {
    setRating(v);
    onRatingChange && onRatingChange(kra.id, v);
  };
  return (
    <div className="border border-slate-200 rounded-xl mb-3 overflow-hidden bg-white hover:border-slate-300 transition-all">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Target size={16} className="text-slate-600" />
          <div>
            <span className="text-sm font-bold text-black">{kra.name}</span>
            <span className="text-xs text-slate-600 ml-2 font-semibold">· Weight: {kra.weight}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <RatingSelector value={rating} onChange={handleRate} disabled={mode === "view" || mode === "planning_view"} />
          {open ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <p className="text-sm font-medium text-black mt-3 mb-4 leading-relaxed">{kra.objective}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Success Indicator</div>
              <p className="text-sm text-black font-medium leading-relaxed">{kra.successIndicator}</p>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Target</div>
              <p className="text-sm text-black font-medium leading-relaxed">{kra.target}</p>
            </div>
          </div>
          {mode !== "planning_view" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Actual Accomplishment</div>
                <p className="text-sm text-black font-semibold leading-relaxed">{kra.actual || "—"}</p>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Remarks</div>
                {mode === "edit" ? (
                  <textarea
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                    rows={2}
                    defaultValue={kra.remarks}
                  />
                ) : (
                  <p className="text-sm text-black leading-relaxed">{kra.remarks || "—"}</p>
                )}
              </div>
            </div>
          )}
          {kra.movFiles && kra.movFiles.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Means of Verification (MOV)</div>
              <div className="space-y-1.5">
                {kra.movFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-blue-500" />
                      <span className="text-sm text-blue-700 font-bold hover:underline cursor-pointer">{f.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{f.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mode !== "planning_view" && mode !== "view" && (
            <button
              type="button"
              onClick={() => onMOVUpload && onMOVUpload(kra.id)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 mt-2 bg-blue-50 hover:bg-blue-100/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Upload size={13} />
              Attach MOV
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CommitmentSignatureBlock({ label, signed, onSign, disabled }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-3">
        {signed ? (
          <CheckCircle size={20} className="text-green-500" />
        ) : (
          <Clock size={20} className="text-slate-600" />
        )}
        <div>
          <div className="text-sm font-bold text-black">{label}</div>
          <div className="text-xs text-slate-600">{signed ? "Signed" : "Awaiting signature"}</div>
        </div>
      </div>
      {!signed && (
        <button
          type="button"
          onClick={onSign}
          disabled={disabled}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-black hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Sign
        </button>
      )}
    </div>
  );
}

export function MOVUploader({ onUpload, accept = ".pdf,.doc,.docx,.jpg,.png", maxSizeMB = 10 }) {
  const [file, setFile] = useState(null);
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        alert(`File too large. Max ${maxSizeMB}MB.`);
        return;
      }
      setFile(f);
      onUpload && onUpload(f);
    }
  };
  return (
    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all cursor-pointer">
      <div className="flex flex-col items-center gap-1.5">
        <Upload size={20} className="text-slate-600" />
        <span className="text-xs font-semibold text-slate-800">
          {file ? file.name : "Drop file or click to upload"}
        </span>
        <span className="text-[10px] text-slate-600">PDF, DOC, JPG, PNG (max {maxSizeMB}MB)</span>
      </div>
      <input type="file" accept={accept} className="hidden" onChange={handleFileChange} />
    </label>
  );
}

export function QuickActions({ actions }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <button
          key={i}
          type="button"
          onClick={action.onClick}
          className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            {action.icon ? <action.icon size={18} className="text-black" /> : <Star size={18} className="text-black" />}
          </div>
          <span className="text-sm font-bold text-black">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

export function UnitCompletionChart({ units }) {
  return (
    <div className="space-y-3">
      {units.map((unit, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-black">{unit.name}</span>
            <span className="text-xs font-semibold text-slate-600">{unit.completed}/{unit.total} ({unit.percent}%)</span>
          </div>
          <ProgressBar value={unit.percent} color={unit.percent >= 80 ? "bg-green-500" : unit.percent >= 50 ? "bg-yellow-500" : "bg-red-500"} />
        </div>
      ))}
    </div>
  );
}

export function FinalRatingsTable({ data, onFinalize }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Employee</th>
            <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Position</th>
            <th className="text-center py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Weighted Avg</th>
            <th className="text-center py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Adjectival</th>
            <th className="text-center py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Rank</th>
            <th className="text-center py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="text-center py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Avatar name={row.name} size={7} />
                  <span className="font-bold text-black">{row.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-slate-800 text-xs">{row.position}</td>
              <td className="py-3 px-4 text-center font-bold text-black">{row.weightedAverage !== null ? row.weightedAverage.toFixed(2) : "—"}</td>
              <td className="py-3 px-4 text-center">
                {row.weightedAverage !== null ? (
                  <span className="text-xs font-bold">{getAdjectival(row.weightedAverage)}</span>
                ) : "—"}
              </td>
              <td className="py-3 px-4 text-center font-bold text-black">#{i + 1}</td>
              <td className="py-3 px-4 text-center"><StatusBadge status={row.status} /></td>
              <td className="py-3 px-4 text-center">
                {row.status !== "finalized" && (
                  <button
                    type="button"
                    onClick={() => onFinalize && onFinalize(row)}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                    style={{ backgroundColor: NAVY }}
                  >
                    Finalize
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KRAFormBuilder({ kras, onChange }) {
  const addKRA = () => {
    const newKRAs = [...kras, { name: "", weight: 0, sort_order: kras.length + 1 }];
    onChange(newKRAs);
  };
  const removeKRA = (index) => {
    const newKRAs = kras.filter((_, i) => i !== index).map((k, i) => ({ ...k, sort_order: i + 1 }));
    onChange(newKRAs);
  };
  const updateKRA = (index, field, value) => {
    const newKRAs = kras.map((k, i) => i === index ? { ...k, [field]: value } : k);
    onChange(newKRAs);
  };
  const totalWeight = kras.reduce((sum, k) => sum + (Number(k.weight) || 0), 0);
  const isValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="space-y-3">
      {kras.map((kra, index) => (
        <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 w-5">{index + 1}.</span>
          <input
            type="text"
            value={kra.name}
            onChange={(e) => updateKRA(index, "name", e.target.value)}
            placeholder="KRA Name"
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={kra.weight}
              onChange={(e) => updateKRA(index, "weight", e.target.value)}
              placeholder="Weight"
              className="w-20 text-sm border border-slate-200 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-slate-200"
              min="0"
              max="100"
            />
            <span className="text-xs text-slate-600 font-semibold">%</span>
          </div>
          <button
            type="button"
            onClick={() => removeKRA(index)}
            className="p-2 text-slate-600 hover:text-red-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={addKRA}
          className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          + Add KRA
        </button>
        <div className={`text-sm font-bold ${isValid ? "text-green-600" : "text-red-500"}`}>
          Total Weight: {totalWeight.toFixed(1)}% {isValid ? "✓" : "(must be 100%)"}
        </div>
      </div>
    </div>
  );
}
