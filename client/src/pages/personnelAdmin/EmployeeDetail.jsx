import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import io from 'socket.io-client';
import { API_BASE, SERVER_BASE, downloadFile } from '../../utils/api';

const Field = ({ label, value }) => (
  <div className="bg-slate-50 rounded-xl px-4 py-3">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-700">{value || '—'}</p>
  </div>
);

const CHECKLIST_LABELS = [
  'Transcript of Records / S.O.',
  'Marriage Contract',
  'CSC Form 211',
  'SALN',
  'NBI Clearance',
  'Police Clearance',
  'BIR Form 1902/2305',
  'DBP ATM Application',
  'PhilHealth No. (PEN)',
  'Pag-IBIG MID No.',
];

const CHECKLIST_ALIASES = {
  'Transcript of Records / S.O.': ['Transcript of Records'],
  'Marriage Contract': ['Marriage Contract', 'Marriage Certificate'],
  'CSC Form 211': ['CSC Form 211'],
  'SALN': ['SALN'],
  'NBI Clearance': ['NBI Clearance'],
  'Police Clearance': ['Police Clearance'],
  'BIR Form 1902/2305': ['BIR Form 1902/2305'],
  'DBP ATM Application': ['DBP ATM Application'],
  'PhilHealth No. (PEN)': ['PhilHealth No. (PEN)'],
  'Pag-IBIG MID No.': ['Pag-IBIG MID No.'],
};

const isChecklistDoc = (docType) => {
  const lower = (docType || '').toLowerCase();
  return Object.values(CHECKLIST_ALIASES).some(aliases =>
    aliases.some(a => a.toLowerCase() === lower)
  );
};

const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [empRes, docsRes] = await Promise.all([
        fetch(`${API_BASE}/api/personnel/employees/${id}`, { headers }),
        fetch(`${API_BASE}/api/personnel/documents?employee_id=${id}`, { headers })
      ]);

      if (empRes.ok) setEmployee(await empRes.json());
      if (docsRes.ok) setDocuments(await docsRes.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const socket = io(API_BASE);
    socket.on('personnel:update', () => {
      console.log('⚡ Live update received [personnel:update] - Refreshing EmployeeDetail...');
      fetchData(true);
    });
    return () => socket.disconnect();
  }, [fetchData]);

  const handleVerify = async (docId) => {
    setActionLoading(docId);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/personnel/documents/${docId}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchData();
    } catch {} finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (docId) => {
    setActionLoading(docId);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/personnel/documents/${docId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rejection_reason: rejectReason })
      });
      setRejectModal(null);
      setRejectReason('');
      await fetchData();
    } catch {} finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  if (!employee) return (
    <div className="p-8 text-center">
      <p className="text-[#D6402F] font-black">Employee not found</p>
    </div>
  );

  const checklistDocs = documents.filter(d => isChecklistDoc(d.document_type));
  const otherDocs = documents.filter(d => !isChecklistDoc(d.document_type));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/personnel-admin/employees" className="text-slate-400 hover:text-[#1B3A6B] transition-colors">
          <ArrowLeft size={24} />
        </Link>
        {employee.photo_path ? (
          <img
            src={`${SERVER_BASE}${employee.photo_path}`}
            alt={`${employee.first_name} ${employee.last_name}`}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#1B3A6B]/20 shadow-sm bg-slate-50"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <span className="text-lg font-black text-slate-400">
              {employee.first_name?.[0] || ''}{employee.last_name?.[0] || ''}
            </span>
          </div>
        )}
        <div>
          <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">
            {employee.last_name}, {employee.first_name}
          </h2>
          <p className="text-xs font-bold text-slate-400">{employee.employee_no || 'No employee no.'} · {employee.position_title || 'No position'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="First Name" value={employee.first_name} />
          <Field label="Middle Name" value={employee.middle_name} />
          <Field label="Last Name" value={employee.last_name} />
          <Field label="Extension" value={employee.name_extension} />
          <Field label="Date of Birth" value={employee.date_of_birth} />
          <Field label="Place of Birth" value={employee.place_of_birth} />
          <Field label="Sex" value={employee.sex} />
          <Field label="Civil Status" value={employee.civil_status} />
          <Field label="Blood Type" value={employee.blood_type} />
          <Field label="Mobile No." value={employee.mobile_no} />
          <Field label="Email" value={employee.email || employee.user_email} />
          <Field label="Address" value={employee.address} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">Government IDs</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="GSIS ID" value={employee.gsis_id} />
          <Field label="PAG-IBIG ID" value={employee.pagibig_id} />
          <Field label="PhilHealth" value={employee.philhealth_no} />
          <Field label="TIN" value={employee.tin_no} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">Employment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Position" value={employee.position_title} />
          <Field label="Employment Status" value={employee.employment_status} />
          <Field label="Category" value={employee.employment_type} />
          <Field label="Job Status" value={employee.job_status ? employee.job_status.replace(/_/g, ' ') : '—'} />
          <Field label="Eligibility" value={employee.eligibility} />
          <Field label="Employee No." value={employee.employee_no} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">Salary & Station</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Salary Grade" value={employee.salary_grade} />
          <Field label="Salary Step" value={employee.salary_step ? `Step ${employee.salary_step}` : '—'} />
          <Field label="Item Number" value={employee.item_number} />
          <Field label="Authorized Salary" value={employee.authorized_salary ? `₱${parseFloat(employee.authorized_salary).toLocaleString()}` : '—'} />
          <Field label="Actual Salary" value={employee.actual_salary ? `₱${parseFloat(employee.actual_salary).toLocaleString()}` : '—'} />
          <Field label="Monthly Salary" value={employee.monthly_salary ? `₱${parseFloat(employee.monthly_salary).toLocaleString()}` : '—'} />
          <Field label="School / Office" value={employee.location_name || employee.assigned_school || employee.office} />
          {employee.location_district && <Field label="District" value={employee.location_district} />}
          <Field label="Date Hired" value={employee.date_hired} />
          <Field label="Original Appointment" value={employee.date_original_appointment} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">Leave Credits</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Sick Leave" value={employee.sick_leave_balance} />
          <Field label="Vacation Leave" value={employee.vacation_leave_balance} />
          <Field label="Forced Leave" value={employee.forced_leave_balance} />
          <Field label="Special Privilege" value={employee.special_privilege_balance} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">201 Documents</h3>
          <div className="flex gap-2">
            <button onClick={() => downloadFile(`/api/personnel/certificates/${id}/service-record`, 'Service_Record.pdf')} className="bg-emerald-600 text-white rounded-xl font-black uppercase text-xs px-4 py-2 hover:bg-emerald-700 flex items-center gap-1">
              <Download size={14} /> Service Record
            </button>
            <button onClick={() => downloadFile(`/api/personnel/certificates/${id}/coe`, 'Certificate_of_Employment.pdf')} className="bg-emerald-600 text-white rounded-xl font-black uppercase text-xs px-4 py-2 hover:bg-emerald-700 flex items-center gap-1">
              <Download size={14} /> CoE
            </button>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm font-bold text-slate-400 text-center py-6">No documents uploaded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">File Name</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Uploaded</th>
                  <th className="pb-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => {
                  const isPending = !doc.is_verified && doc.status !== 'approved' && doc.status !== 'rejected';
                  return (
                    <tr key={doc.id} className="border-b border-slate-50 text-sm">
                      <td className="py-3 pr-4 font-bold text-slate-700">{doc.document_type}</td>
                      <td className="py-3 pr-4 text-slate-600">{doc.file_name}</td>
                      <td className="py-3 pr-4">
                        {(doc.status === 'approved' || doc.is_verified) ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase"><CheckCircle size={12} /> Verified</span>
                        ) : doc.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase"><XCircle size={12} /> Rejected</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase"><XCircle size={12} /> Pending</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 text-xs">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          {doc.file_path && (
                            <a
                              href={`${SERVER_BASE}${doc.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#1B3A6B] hover:text-[#D6402F] transition-colors p-1"
                            >
                              <Download size={16} />
                            </a>
                          )}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleVerify(doc.id)}
                                disabled={actionLoading === doc.id}
                                className="text-green-600 hover:text-green-700 transition-colors p-1 disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => setRejectModal(doc)}
                                disabled={actionLoading === doc.id}
                                className="text-[#D6402F] hover:text-red-700 transition-colors p-1 disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic mb-2">Reject Document</h3>
            <p className="text-sm font-bold text-slate-500 mb-1">{rejectModal.document_type}</p>
            <p className="text-xs text-slate-400 mb-4">{rejectModal.file_name}</p>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason for Rejection</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Optional reason..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-5 py-2.5 border border-slate-200 text-[#1B3A6B] hover:bg-slate-50 transition-all rounded-xl text-[11px] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModal.id)}
                disabled={actionLoading === rejectModal.id}
                className="px-5 py-2.5 bg-[#D6402F] text-white rounded-xl text-[11px] font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {actionLoading === rejectModal.id ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;
