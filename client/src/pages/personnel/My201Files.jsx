import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../utils/api';

const My201Files = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('General');

  const fetchDocs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/documents/my-documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDocuments(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

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

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">201 Files</h1>
        <p className="text-xs font-bold text-slate-400">Upload and manage your personnel documents</p>
      </div>

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
              {['General', 'Diploma', 'Transcript of Records', 'Training Certificate', 'Service Record', 'CoE', 'NBI Clearance', 'Medical Certificate', 'Marriage Certificate', 'Others'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
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
                      {doc.is_verified ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase"><CheckCircle size={12} /> Verified</span>
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
