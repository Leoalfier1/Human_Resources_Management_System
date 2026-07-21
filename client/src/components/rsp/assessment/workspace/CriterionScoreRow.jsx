import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const CriterionScoreRow = ({ criterion, score, onChange, onBlur, remarks, onRemarksChange, onRemarksBlur }) => {
  const max = Number(criterion.max_score) || 0;
  const weight = Number(criterion.weight_percent) || 0;
  const val = Number(score) || 0;
  const ratio = max ? val / max : 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  const weighted = max ? ratio * weight : 0;

  const barColorHex = ratio >= 0.7
    ? '#22c55e'
    : ratio >= 0.4
      ? '#f59e0b'
      : '#f87171';

  const [showRemarks, setShowRemarks] = useState(false);
  const remarksValue = remarks ?? '';
  const [inputValue, setInputValue] = useState(String(val));
  const inputRef = useRef(null);
  const isFocusing = useRef(false);
  const inputValueRef = useRef(String(val));

  const handleSliderChange = useCallback((e) => {
    const raw = e.target.value;
    const num = raw === '' ? 0 : parseFloat(raw);
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(0, num));
      onChange(criterion.id, clamped);
      if (!isFocusing.current) {
        setInputValue(String(clamped));
        inputValueRef.current = String(clamped);
      }
    }
  }, [criterion.id, max, onChange]);

  const handleInputFocus = useCallback(() => {
    isFocusing.current = true;
    setInputValue(String(val));
    inputValueRef.current = String(val);
  }, [val]);

  const handleInputBlur = useCallback(() => {
    isFocusing.current = false;
    const num = parseFloat(inputValueRef.current);
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(0, num));
      onChange(criterion.id, clamped);
      setInputValue(String(clamped));
      inputValueRef.current = String(clamped);
      onBlur(criterion.id, clamped);
    } else {
      setInputValue(String(val));
      inputValueRef.current = String(val);
    }
  }, [max, criterion.id, val, onChange, onBlur]);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }, []);

  // Sync inputValue with external score changes when not focused
  useEffect(() => {
    if (!isFocusing.current) setInputValue(String(val));
  }, [val]);

  return (
    <div className="px-5 py-4 border-b border-slate-100/80 last:border-0 group hover:bg-slate-50/30 transition-colors">
      <div className="flex items-center gap-4">
        {/* Label + slider column */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Criterion name + weight badge */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-slate-700 truncate leading-tight">
              {criterion.sub_criterion_label}
            </p>
            <span className="text-[9px] font-black text-[#1B3A6B] bg-[#1B3A6B]/5 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              {weight}% &middot; max {max}
            </span>
          </div>

          {/* Slider track — custom rendered */}
          <div className="relative h-4 flex items-center cursor-pointer group/slider">
            {/* Background track */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-slate-100 pointer-events-none" />
            {/* Colored fill */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-3 rounded-full pointer-events-none transition-all duration-150"
              style={{ width: `${pct}%`, backgroundColor: barColorHex }}
            />
            {/* Highlight shimmer on fill */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none opacity-30"
              style={{ width: `${pct}%`, background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)' }}
            />
            {/* Draggable handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-[2.5px] shadow-md pointer-events-none transition-all duration-150 z-10"
              style={{ left: `${pct}%`, borderColor: barColorHex }}
            >
              <div className="absolute inset-[3px] rounded-full" style={{ backgroundColor: barColorHex, opacity: 0.3 }} />
            </div>
            {/* Invisible range input for interaction */}
            <input
              type="range"
              min="0"
              max={max}
              step="0.5"
              value={val}
              onChange={handleSliderChange}
              onMouseUp={() => onBlur(criterion.id, val)}
              onTouchEnd={() => onBlur(criterion.id, val)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
          </div>
        </div>

        {/* Score input box + weighted score */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {/* Editable score box */}
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                inputValueRef.current = e.target.value;
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) {
                  onChange(criterion.id, Math.min(max, Math.max(0, num)));
                }
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className={`w-14 h-8 text-center text-sm font-black tabular-nums rounded-lg border-2 outline-none transition-colors text-right px-1.5 ${
                ratio >= 0.7
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50 focus:border-emerald-400'
                  : ratio >= 0.4
                    ? 'border-amber-300 text-amber-700 bg-amber-50 focus:border-amber-400'
                    : 'border-red-200 text-red-500 bg-red-50 focus:border-red-300'
              }`}
            />
            <span className="text-[10px] font-bold text-slate-400">/ {max}</span>
          </div>
          {/* Weighted contribution */}
          <span className="text-[10px] font-black text-[#1B3A6B] tabular-nums">
            {weighted.toFixed(2)} pts
          </span>
          {/* Remarks toggle */}
          <button
            onClick={() => setShowRemarks(!showRemarks)}
            className={`p-1 rounded transition-colors ${
              remarksValue
                ? 'text-[#1B3A6B] bg-[#1B3A6B]/10'
                : showRemarks
                  ? 'text-[#1B3A6B] bg-[#1B3A6B]/5'
                  : 'text-slate-300 hover:text-slate-500'
            }`}
            title="Add justification / remarks"
          >
            <MessageSquare size={13} />
          </button>
        </div>
      </div>

      {/* Remarks row (expandable) */}
      {showRemarks && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="mt-3 pl-0"
        >
          <textarea
            value={remarksValue}
            onChange={e => onRemarksChange?.(criterion.id, e.target.value)}
            onBlur={() => onRemarksBlur?.(criterion.id, remarksValue)}
            placeholder="Justification / evaluator notes for this criterion..."
            rows={2}
            className="w-full text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20 resize-none transition-all placeholder:text-slate-300"
          />
        </motion.div>
      )}
    </div>
  );
};

export default CriterionScoreRow;
