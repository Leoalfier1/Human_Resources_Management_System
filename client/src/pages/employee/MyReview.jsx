import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Eye, Download, Upload, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, SOCKET_URL } from '../../utils/api';
import { getAdjectival } from '../../components/pm/pmCommon';
import useEmployeeSocket from '../../hooks/useEmployeeSocket';

const formatSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FilePreviewModal = ({ file, onClose }) => {
  if (!file) return null;
  const url = `${SOCKET_URL}/uploads/pm_movs/${file.stored_filename}`;
  const isImage = file.file_type?.startsWith('image/');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 w-full max-w-3xl shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase truncate">{file.original_filename}</h3>
          <button onClick={onClose} className="text-slate-600 hover:text-black cursor-pointer text-lg leading-none ml-2">&times;</button>
        </div>
        {isImage ? (
          <img src={url} alt={file.original_filename} className="w-full max-h-[70vh] object-contain rounded-xl" />
        ) : (
          <iframe src={url} className="w-full h-[70vh] rounded-xl border border-slate-200" title={file.original_filename} />
        )}
        <div className="mt-3">
          <a href={url} download className="text-[10px] font-black text-blue-600 uppercase hover:text-blue-800">Download File</a>
        </div>
      </div>
    </div>
  );
};

const MyReview = () => {
  const { token } = useAuth();
  const [ipcrf, setIpcrf] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [devPlanNotes, setDevPlanNotes] = useState('');
  const [raterName, setRaterName] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [deleteFileConfirm, setDeleteFileConfirm] = useState(null);

  const fetchReview = useCallback(async () => {
    try {
      const res = await apiGet('/pm/employee/review');
      if (res.ok) {
        const data = await res.json();
        setIpcrf(data.ipcrf || null);
        setObjectives(data.objectives || []);
        setDevPlanNotes(data.devPlanNotes || '');
        setRaterName(data.raterName || '');
      }
    } catch (err) {
      console.error('Failed to load review:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchReview();
  }, [token, fetchReview]);

  useEmployeeSocket({
    'review:rating_updated': fetchReview,
    'review:finalized': fetchReview,
    'rating:finalized': fetchReview,
    'commitment:returned': fetchReview,
    'commitment:approved': fetchReview,
    'ipcrf:status_changed': fetchReview,
    'performance_update': fetchReview,
  });

  const handleSaveAccomplishment = async (id, val) => {
    try {
      await apiPut(`/pm/employee/review/actual/${id}`, { actual_accomplishment: val });
    } catch (err) {
      console.error('Failed to save accomplishment:', err);
    }
  };

  const handleFileUpload = async (objId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ipcrf_objective_id', String(objId));

    try {
      const res = await apiPost('/pm/employee/review/mov/upload', formData);
      if (res.ok) {
        const data = await res.json();
        setObjectives(prev => prev.map(o =>
          o.id === objId ? { ...o, mov_uploads: [...(o.mov_uploads || []), data.file || data] } : o
        ));
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleDeleteFile = async (objId, fileId) => {
    const file = objectives.find(o => o.id === objId)?.mov_uploads?.find(f => f.id === fileId);
    setDeleteFileConfirm({ objId, fileId, fileName: file?.original_filename || 'this file' });
  };

  const handleConfirmDeleteFile = async () => {
    if (!deleteFileConfirm) return;
    const { objId, fileId } = deleteFileConfirm;
    setDeleteFileConfirm(null);
    try {
      const res = await apiDelete(`/pm/employee/ipcrf/mov/${fileId}`);
      if (res.ok) {
        setObjectives(prev => prev.map(o =>
          o.id === objId ? { ...o, mov_uploads: o.mov_uploads.filter(f => f.id !== fileId) } : o
        ));
      }
    } catch (err) {
      console.error('Delete file error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#F3F4F6]">
        <div className="text-xs font-bold text-slate-600 tracking-widest uppercase animate-pulse">Loading Evaluation Review...</div>
      </div>
    );
  }

  const statusColors = {
    not_submitted: 'bg-amber-100 text-amber-800 border-amber-200',
    submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    under_review: 'bg-purple-100 text-purple-800 border-purple-200',
    reviewed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    finalized: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    needs_revision: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-[#F3F4F6] min-h-[calc(100vh-56px)] space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">My Review & Evaluation</h1>
      </header>

      {ipcrf && (
        <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusColors[ipcrf.status] || statusColors.not_submitted}`}>
          {ipcrf.status === 'under_review' ? 'Under Review' : (ipcrf.status || '').replace(/_/g, ' ').toUpperCase()}
        </span>
      )}

      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-black uppercase tracking-widest">IPCRF \u2014 Target vs. Actual Accomplishment</h3>
        </div>

        <div className="space-y-8 divide-y divide-slate-100">
          {objectives.length > 0 ? objectives.map((obj, idx) => (
            <div key={obj.id} className={idx === 0 ? 'pt-0' : 'pt-8'}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1B3A6B] shrink-0" />
                    <h4 className="text-xs font-black text-black uppercase tracking-tight">{obj.kra_name}</h4>
                    <span className="text-[10px] text-slate-600 font-bold">Wt: {obj.weight_percent}%</span>
                  </div>
                  <p className="text-xs font-bold text-black leading-relaxed">{obj.objective_description}</p>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-0.5">Target</span>
                    <p className="text-xs font-medium text-slate-800 leading-relaxed">{obj.target_statement}</p>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#2563EB]" /> ACTUAL
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <span
                            key={num}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black border select-none ${
                              obj.rating === num
                                ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white'
                                : 'bg-white border-slate-200 text-slate-300'
                            }`}
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                      {obj.rating && (
                        <span className="text-[10px] font-bold uppercase text-slate-800">{getAdjectival(obj.rating)}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-1">Actual Accomplishment</label>
                    <textarea
                      rows={3}
                      value={obj.actual_accomplishment || ''}
                      onChange={(e) => {
                        setObjectives(prev => prev.map(o => o.id === obj.id ? { ...o, actual_accomplishment: e.target.value } : o));
                      }}
                      onBlur={(e) => handleSaveAccomplishment(obj.id, e.target.value)}
                      placeholder="Fill in actual accomplishment during review cycle..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 resize-none shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-2">Means of Verification (MOV)</label>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                      {(obj.mov_uploads || []).length > 0 ? (obj.mov_uploads || []).map((file) => (
                        <div key={file.id} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-100 text-[10px] font-bold shadow-sm">
                          <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                            <FileText size={13} className="text-slate-600 shrink-0" />
                            <span className="truncate text-black">{file.original_filename}</span>
                            <span className="text-[9px] text-slate-600 font-normal shrink-0">({formatSize(file.file_size_bytes)})</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setPreviewFile(file)} className="text-slate-600 hover:text-black p-1 cursor-pointer">
                              <Eye size={12} />
                            </button>
                            <a href={`${SOCKET_URL}/uploads/pm_movs/${file.stored_filename}`} download className="text-slate-600 hover:text-black p-1">
                              <Download size={12} />
                            </a>
                            {ipcrf && ['draft', 'needs_revision', 'under_review'].includes(ipcrf.status) && (
                              <button onClick={() => handleDeleteFile(obj.id, file.id)} className="text-slate-600 hover:text-red-600 p-1 cursor-pointer">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      )) : (
                        <p className="text-[10px] text-slate-600 font-bold">No MOV files uploaded yet.</p>
                      )}
                    </div>
                  </div>

                  <div
                    className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-1 bg-white"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) handleFileUpload(obj.id, e.dataTransfer.files[0]);
                    }}
                    onClick={() => document.getElementById(`review-file-input-${obj.id}`)?.click()}
                  >
                    <Upload size={16} className="text-slate-600" />
                    <p className="text-[9px] font-bold text-slate-800 uppercase">Drag & Drop or Browse</p>
                    <span className="text-[8px] text-slate-600">PDF, XLSX, PNG, JPG \u00B7 Max 10MB</span>
                    <input
                      type="file"
                      id={`review-file-input-${obj.id}`}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(obj.id, e.target.files[0]);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-xs text-slate-600 font-bold py-8 text-center">No objectives found for the current period.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 space-y-3">
        <h3 className="text-xs font-black text-black uppercase tracking-widest border-b border-slate-100 pb-3">Development Plan Discussion Notes</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">
            From your rater ({raterName || 'Evaluator'}):
          </span>
          <p className="text-xs font-bold text-black leading-relaxed italic whitespace-pre-wrap">
            {devPlanNotes || 'Your rater has not yet added development plan notes.'}
          </p>
        </div>
      </div>

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {deleteFileConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={() => setDeleteFileConfirm(null)}>
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Delete MOV File</h3>
            <p className="text-xs text-black">Are you sure you want to delete <span className="font-bold">{deleteFileConfirm.fileName}</span>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteFileConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-black hover:bg-slate-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleConfirmDeleteFile} className="flex-1 py-2.5 bg-[#D6402F] text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReview;
