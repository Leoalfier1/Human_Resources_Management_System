import React, { useState, useEffect, useCallback } from 'react';
import { Upload, CheckCircle, XCircle, FileText, Download, ClipboardCheck } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../utils/api';
import { usePersonnelRealtime } from '../../hooks/usePersonnelRealtime';

const CHECKLIST_ITEMS = [
  { label: 'Transcript of Records / S.O.', aliases: ['Transcript of Records'] },
  { label: 'Marriage Contract', aliases: ['Marriage Contract', 'Marriage Certificate'] },
  { label: 'CSC Form 211', aliases: ['CSC Form 211'] },
  { label: 'SALN', aliases: ['SALN'] },
  { label: 'NBI Clearance', aliases: ['NBI Clearance'] },
  { label: 'Police Clearance', aliases: ['Police Clearance'] },
  { label: 'BIR Form 1902/2305', aliases: ['BIR Form 1902/2305'] },
  { label: 'DBP ATM Application', aliases: ['DBP ATM Application'] },
  { label: 'PhilHealth No. (PEN)', aliases: ['PhilHealth No. (PEN)'] },
  { label: 'Pag-IBIG MID No.', aliases: ['Pag-IBIG MID No.'] },
];

const DOC_TYPE_OPTIONS = [
  ...CHECKLIST_ITEMS.map(i => i.label),
  'General',
  'Others',
];

const getChecklistStatus = (documents) => {
  return CHECKLIST_ITEMS.map(item => {
    const matched = documents.filter(doc =>
      item.aliases.some(a => a.toLowerCase() === (doc.document_type || '').toLowerCase())
    );
    if (matched.length === 0) return { ...item, status: 'missing', count: 0 };
    const hasApproved = matched.some(doc =>
      (doc.status === 'approved') || doc.is_verified
    );
    return {
      ...item,
      status: hasApproved ? 'approved' : 'submitted',
      count: matched.length,
    };
  });
};

const STATUS_CONFIG = {
  approved: { label: 'Approved', icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700' },
  submitted: { label: 'Submitted', icon: FileText, bg: 'bg-blue-50', text: 'text-blue-700' },
  missing: { label: 'Missing', icon: XCircle, bg: 'bg-red-50', text: 'text-red-600' },
};

const My201Files = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('General');

  const fetchDocs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/documents/my-documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDocuments(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  usePersonnelRealtime(['personnel:update', 'personnel:document:update'], () => {
    fetchDocs(true);
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('document_type', docType);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/documents/my-documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setSelectedFile(null);
        setDocType('General');
        await fetchDocs();
      }
    } catch {} finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  const checklist = getChecklistStatus(documents);
  const completed = checklist.filter(i => i.status === 'approved').length;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">201 Files</h1>
        <p className="text-xs font-bold text-slate-400">Upload and manage your personnel documents</p>
      </div>

      {/* CHECKLIST PROGRESS PANEL */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1B3A6B]/10">
              <ClipboardCheck size={20} className="text-[#1B3A6B]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic">201 File Checklist</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OSDS-ADMS-RSP-13, Rev.00</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#1B3A6B]">{completed}<span className="text-sm text-slate-400">/10</span></p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved</p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1B3A6B] to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${(completed / 10) * 100}%` }}
          />
        </div>

        {/* CHECKLIST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checklist.map((item, idx) => {
            const cfg = STATUS_CONFIG[item.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  item.status === 'approved' ? 'border-green-200 bg-green-50/50' :
                  item.status === 'submitted' ? 'border-blue-200 bg-blue-50/50' :
                  'border-slate-200 bg-white'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                  <StatusIcon size={14} className={cfg.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{item.label}</p>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase">
                    {item.status === 'approved' && 'Approved'}
                    {item.status === 'submitted' && `Pending Review${item.count > 1 ? ` (${item.count} files)` : ''}`}
                    {item.status === 'missing' && 'Not yet submitted'}
                  </p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {item.status === 'approved' ? '2/2' : item.status === 'submitted' ? '1/2' : '0/2'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* UPLOAD FORM */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">Upload Document</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Document Type</p>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent outline-none"
            >
              <optgroup label="201 File Requirements">
                {CHECKLIST_ITEMS.map(item => (
                  <option key={item.label} value={item.label}>{item.label}</option>
                ))}
              </optgroup>
              <optgroup label="Other">
                <option value="General">General</option>
                <option value="Others">Others</option>
              </optgroup>
            </select>
          </div>
          <div className="flex-1 w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">File</p>
            <input
              type="file"
              onChange={e => setSelectedFile(e.target.files[0])}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1B3A6B] file:text-white file:text-xs file:font-black file:uppercase"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-6 py-3 hover:bg-[#162E55] disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* MY DOCUMENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-6">My Documents</h2>
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-400">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">File Name</th>
                  <th className="pb-3 pr-4">Size (KB)</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Uploaded</th>
                  <th className="pb-3 pr-4">Download</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className="border-b border-slate-50 text-sm">
                    <td className="py-3 pr-4 font-bold text-slate-700">{doc.document_type}</td>
                    <td className="py-3 pr-4 text-slate-600">{doc.file_name}</td>
                    <td className="py-3 pr-4 text-slate-600">{doc.file_size_kb || '—'}</td>
                    <td className="py-3 pr-4">
                      {(doc.status === 'approved' || doc.is_verified) ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase"><CheckCircle size={12} /> Verified</span>
                      ) : doc.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase"><XCircle size={12} /> Rejected</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase"><XCircle size={12} /> Pending</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 text-xs">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      {doc.file_path && (
                        <a
                          href={`${SERVER_BASE}${doc.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1B3A6B] hover:text-[#D6402F] transition-colors"
                        >
                          <Download size={18} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default My201Files;
