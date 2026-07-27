import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, Send, Upload, RefreshCw, Download, CheckCircle } from 'lucide-react';
import { apiFetch, SERVER_BASE } from '../../../../utils/api';
import FileUpload from '../../shared/FileUpload';

const SectionLabel = ({ num, title }) => (
  <div className="flex items-center gap-2 mb-2 mt-4">
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black"
      style={{ background: '#1B2A50', fontSize: 10 }}>{num}</div>
    <p className="font-black uppercase" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.1em' }}>{title}</p>
  </div>
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    className="w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
    style={{ border: '1px solid #E5E7EB', fontSize: 11, resize: 'vertical', focusRingColor: '#DE4E2A' }} />
);

// ── Attachment upload + list for a single section ─────────────────────────────
const AttachmentSection = ({ label, sectionType, programId, icon: Icon, color, bg }) => {
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchFiles = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    try {
      const res  = await apiFetch(`/api/ld/programs/materials/list?program_id=${programId}&section_type=${sectionType}`);
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [programId, sectionType]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-xl p-4" style={{ background: '#FAFBFC', border: '1px solid #E5E7EB' }}>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <Icon size={14} style={{ color }} />
        </div>
        <p className="font-black uppercase" style={{ fontSize: 10, color: '#1B2A50', letterSpacing: '0.12em' }}>
          {label}
        </p>
      </div>

      {/* Existing files list */}
      {loading ? (
        <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4 mb-2" />
      ) : files.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
              style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
              <FileText size={12} style={{ color: '#6B7280', flexShrink: 0 }} />
              <span className="flex-1 truncate font-medium" style={{ fontSize: 10, color: '#374151' }}>
                {f.title || f.file_name}
              </span>
              {f.file_size && (
                <span style={{ fontSize: 9, color: '#9CA3AF' }}>{formatSize(f.file_size)}</span>
              )}
              {f.file_path && (
                <a href={`${SERVER_BASE}/${f.file_path}`} target="_blank" rel="noreferrer"
                  title="Download" className="shrink-0 hover:opacity-70 transition-opacity">
                  <Download size={12} style={{ color: '#6B7280' }} />
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3" style={{ fontSize: 10, color: '#9CA3AF' }}>No files attached yet</p>
      )}

      {/* Error message */}
      {error && (
        <p className="mb-2 text-xs" style={{ color: '#DC2626' }}>{error}</p>
      )}

      {/* Upload button */}
      <FileUpload
        endpoint={`${SERVER_BASE}/api/ld/programs/materials/upload`}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
        extraFormData={{
          program_id:   programId,
          section_type: sectionType,
          title:        (f) => f.name,
        }}
        onSuccess={() => { setError(''); fetchFiles(); }}
        onError={(err) => setError(err.message || 'Upload failed')}
      >
        {({ status }) => (
          <div
            className="w-full flex items-center justify-center gap-1.5 font-bold rounded-xl py-2 transition-all"
            style={{
              border:    '2px dashed #E5E7EB',
              fontSize:  10,
              color:     status === 'uploading' ? color : '#6B7280',
              opacity:   status === 'uploading' ? 0.7 : 1,
            }}
          >
            {status === 'uploading'
              ? <><RefreshCw size={11} className="animate-spin" /> Uploading…</>
              : <><Upload size={11} /> Upload File</>}
          </div>
        )}
      </FileUpload>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const CompletionReportForm = ({ onClose }) => {
  const [programs, setPrograms]         = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [programDetail, setProgramDetail]     = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState('');

  const [form, setForm] = useState({
    completion_date:        new Date().toISOString().split('T')[0],
    section_1_summary:      '', section_2_summary:      '', section_3_summary: '',
    section_4_summary:      '', section_5_summary:      '', section_6_summary: '',
    section_7a_recommendations: '', section_7b_challenges: '',
    pretest_avg: '', posttest_avg: '',
  });

  useEffect(() => {
    apiFetch('/api/ld/reports/completed-programs')
      .then(r => r.json()).then(d => setPrograms(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProgram) { setProgramDetail(null); return; }
    apiFetch(`/api/ld/programs/${selectedProgram}`)
      .then(r => r.json()).then(d => setProgramDetail(d))
      .catch(() => {});
  }, [selectedProgram]);

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!selectedProgram) return setError('Please select a program');
    setSubmitting(true);
    setError('');
    try {
      const body = { ...form };
      if (body.pretest_avg === '')  body.pretest_avg  = null;
      else body.pretest_avg  = parseFloat(body.pretest_avg);
      if (body.posttest_avg === '') body.posttest_avg = null;
      else body.posttest_avg = parseFloat(body.posttest_avg);

      const res  = await apiFetch(`/api/ld/reports/programs/${selectedProgram}/completion-report`, {
        method: 'POST', body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      setSuccess(true);
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  // ── Success screen with attachment upload panels ──────────────────────────
  if (success) {
    const SECTIONS = [
      {
        key:   'photo_documentation',
        label: 'Photo Documentation',
        icon:  FileText,
        color: '#7C3AED',
        bg:    '#F5F3FF',
      },
      {
        key:   'documentation',
        label: 'Documentation',
        icon:  FileText,
        color: '#2563EB',
        bg:    '#DBEAFE',
      },
      {
        key:   'recommendations',
        label: 'Recommendations',
        icon:  FileText,
        color: '#16A34A',
        bg:    '#DCFCE7',
      },
      {
        key:   'financial',
        label: 'Financial Report / PO',
        icon:  FileText,
        color: '#B45309',
        bg:    '#FEF3C7',
      },
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

          {/* Header */}
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #E5E7EB' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                <CheckCircle size={20} style={{ color: '#16A34A' }} />
              </div>
              <div>
                <p className="font-black uppercase" style={{ fontSize: 13, color: '#1B2A50', letterSpacing: '0.1em' }}>
                  Report Submitted!
                </p>
                <p style={{ fontSize: 10, color: '#6B7280' }}>
                  Now attach supporting documents for each section below.
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
              <X size={16} style={{ color: '#6B7280' }} />
            </button>
          </div>

          <div className="p-5 space-y-3">
            <p className="font-bold" style={{ fontSize: 11, color: '#6B7280' }}>
              Training records and certificates have been automatically generated for all present participants.
              Upload supporting documents for the program completion record:
            </p>

            {/* Four upload sections */}
            {SECTIONS.map(s => (
              <AttachmentSection
                key={s.key}
                sectionType={s.key}
                label={s.label}
                icon={s.icon}
                color={s.color}
                bg={s.bg}
                programId={selectedProgram}
              />
            ))}

            <button onClick={onClose}
              className="w-full text-white font-black uppercase py-3 rounded-xl mt-2 transition-opacity hover:opacity-90"
              style={{ background: '#1B2A50', fontSize: 11, letterSpacing: '0.12em' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div>
            <p className="font-black uppercase" style={{ fontSize: 13, color: '#1B2A50', letterSpacing: '0.1em' }}>
              Program Completion Report
            </p>
            <p style={{ fontSize: 10, color: '#6B7280' }}>DepEd Memorandum No. 044, s. 2023</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <X size={16} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="p-5">

          {/* Program selector */}
          <div className="mb-4">
            <label className="font-bold block mb-1" style={{ fontSize: 11, color: '#1B2A50' }}>Select Program *</label>
            <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}
              className="w-full rounded-lg px-3 py-2 focus:outline-none"
              style={{ border: '1px solid #E5E7EB', fontSize: 11 }}>
              <option value="">— Choose a program —</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.title} ({p.start_date || 'No date'})</option>
              ))}
            </select>
          </div>

          {/* Auto-filled program info */}
          {programDetail && (
            <div className="rounded-xl p-4 mb-4" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="grid grid-cols-2 gap-3" style={{ fontSize: 11 }}>
                <div><span style={{ color: '#6B7280' }}>Venue:</span> <span className="font-semibold" style={{ color: '#1B2A50' }}>{programDetail.venue || 'N/A'}</span></div>
                <div><span style={{ color: '#6B7280' }}>Methodology:</span> <span className="font-semibold" style={{ color: '#1B2A50' }}>{programDetail.methodology || 'N/A'}</span></div>
                <div><span style={{ color: '#6B7280' }}>Duration:</span> <span className="font-semibold" style={{ color: '#1B2A50' }}>{programDetail.duration_hours || 0} hrs</span></div>
                <div><span style={{ color: '#6B7280' }}>Resource Person:</span> <span className="font-semibold" style={{ color: '#1B2A50' }}>{programDetail.resource_person || 'N/A'}</span></div>
                <div><span style={{ color: '#6B7280' }}>Participants:</span> <span className="font-semibold" style={{ color: '#1B2A50' }}>{programDetail.total_attendance || 0}</span></div>
                <div><span style={{ color: '#6B7280' }}>Present:</span> <span className="font-semibold" style={{ color: '#1B2A50' }}>{programDetail.present_count || 0}</span></div>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="font-bold block mb-1" style={{ fontSize: 11, color: '#1B2A50' }}>Completion Date</label>
            <input type="date" value={form.completion_date} onChange={e => update('completion_date', e.target.value)}
              className="rounded-lg px-3 py-2 focus:outline-none"
              style={{ border: '1px solid #E5E7EB', fontSize: 11 }} />
          </div>

          <SectionLabel num="1" title="Program Overview" />
          <TextArea value={form.section_1_summary} onChange={v => update('section_1_summary', v)}
            placeholder="Brief summary of the program objectives and scope..." />

          <SectionLabel num="2" title="Participants Profile" />
          <TextArea value={form.section_2_summary} onChange={v => update('section_2_summary', v)}
            placeholder="Demographics and profile of participants..." />

          <SectionLabel num="3" title="Methodology" />
          <TextArea value={form.section_3_summary} onChange={v => update('section_3_summary', v)}
            placeholder="Training delivery methods and approach..." />

          <SectionLabel num="4" title="Results & Outcomes" />
          <TextArea value={form.section_4_summary} onChange={v => update('section_4_summary', v)}
            placeholder="Key results, outcomes, and achievements..." />

          <SectionLabel num="5" title="Problems Encountered" />
          <TextArea value={form.section_5_summary} onChange={v => update('section_5_summary', v)}
            placeholder="Challenges and issues encountered during implementation..." />

          <SectionLabel num="6" title="Financial Report" />
          <TextArea value={form.section_6_summary} onChange={v => update('section_6_summary', v)}
            placeholder="Budget utilization and financial summary..." />

          <SectionLabel num="7a" title="Recommendations" />
          <TextArea value={form.section_7a_recommendations} onChange={v => update('section_7a_recommendations', v)}
            placeholder="Recommendations for succeeding programs (this will pre-fill the M&E Summary)..." rows={4} />

          <SectionLabel num="7b" title="Challenges & Lessons Learned" />
          <TextArea value={form.section_7b_challenges} onChange={v => update('section_7b_challenges', v)}
            placeholder="Key lessons and challenges for future reference..." />

          {/* Pre/Post Test scores */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="font-bold block mb-1" style={{ fontSize: 11, color: '#1B2A50' }}>Avg Pre-test Score</label>
              <input type="number" step="0.01" min="0" max="100" value={form.pretest_avg}
                onChange={e => update('pretest_avg', e.target.value)}
                placeholder="e.g. 64.5"
                className="w-full rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #E5E7EB', fontSize: 11 }} />
            </div>
            <div>
              <label className="font-bold block mb-1" style={{ fontSize: 11, color: '#1B2A50' }}>Avg Post-test Score</label>
              <input type="number" step="0.01" min="0" max="100" value={form.posttest_avg}
                onChange={e => update('posttest_avg', e.target.value)}
                placeholder="e.g. 82.3"
                className="w-full rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: '1px solid #E5E7EB', fontSize: 11 }} />
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p style={{ fontSize: 11, color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={submitting || !selectedProgram}
            className="w-full text-white font-black uppercase py-3 rounded-xl mt-5 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#1B2A50', fontSize: 11, letterSpacing: '0.12em' }}>
            <Send size={13} className="inline mr-2" />
            {submitting ? 'Submitting...' : 'Submit Completion Report'}
          </button>
          <p className="text-center mt-2" style={{ fontSize: 9, color: '#9CA3AF' }}>
            This will mark the program as completed, update the HRD database, and auto-generate certificates for all present participants.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompletionReportForm;
