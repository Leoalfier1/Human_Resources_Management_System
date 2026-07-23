import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, CheckCircle, Edit3 } from 'lucide-react';

const SignaturePadModal = ({ isOpen, onClose, onSave, title = "Ratee Electronic Signature Pad" }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0f172a'; // Dark navy ink
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSaveSignature = () => {
    if (isEmpty) {
      alert("Please sign using your finger tip or stylus before saving.");
      return;
    }
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 select-none" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 font-black">
              ✍️
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">{title}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Use your finger tip or stylus to draw your handwritten signature</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden shadow-inner touch-none">
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              className="w-full h-48 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {/* Guide line */}
            <div className="absolute bottom-8 left-6 right-6 border-b border-slate-300 border-dashed pointer-events-none flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-widest">
              <span>Sign Above Line</span>
              <span>X</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold px-1">
            <span>👆 Draw with your finger tip on mobile or mouse on PC</span>
            {isEmpty ? (
              <span className="text-amber-600 font-black">Waiting for signature...</span>
            ) : (
              <span className="text-emerald-600 font-black flex items-center gap-1"><CheckCircle size={12}/> Signature Detected</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-all active:scale-95"
          >
            <RotateCcw size={14} /> Clear Signature
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSignature}
              disabled={isEmpty}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1B3A6B] hover:bg-blue-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle size={14} /> Save Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePadModal;
