import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { API_BASE, SERVER_BASE } from '../../utils/api';

const Field = ({ label, value }) => (
  <div className="bg-slate-50 rounded-xl px-4 py-3">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-700">{value || '—'}</p>
  </div>
);

const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
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
    };
    fetch();
  }, [id]);

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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/personnel-admin/employees" className="text-slate-400 hover:text-[#1B3A6B] transition-colors">
          <ArrowLeft size={24} />
        </Link>
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
          <Field label="Status" value={employee.employment_status} />
          <Field label="Type" value={employee.employment_type} />
          <Field label="Salary Grade" value={employee.salary_grade} />
          <Field label="Monthly Salary" value={employee.monthly_salary ? `₱${parseFloat(employee.monthly_salary).toLocaleString()}` : '—'} />
          <Field label="Item Number" value={employee.item_number} />
          <Field label="School" value={employee.assigned_school} />
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
            <a href={`${SERVER_BASE}/api/personnel/certificates/${id}/service-record?token=${localStorage.getItem('token')}`} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white rounded-xl font-black uppercase text-xs px-4 py-2 hover:bg-emerald-700 flex items-center gap-1">
              <Download size={14} /> Service Record
            </a>
            <a href={`${SERVER_BASE}/api/personnel/certificates/${id}/coe?token=${localStorage.getItem('token')}`} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white rounded-xl font-black uppercase text-xs px-4 py-2 hover:bg-emerald-700 flex items-center gap-1">
              <Download size={14} /> CoE
            </a>
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
                  <th className="pb-3 pr-4">Verified</th>
                  <th className="pb-3 pr-4">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className="border-b border-slate-50 text-sm">
                    <td className="py-3 pr-4 font-bold text-slate-700">{doc.document_type}</td>
                    <td className="py-3 pr-4 text-slate-600">{doc.file_name}</td>
                    <td className="py-3 pr-4">
                      {doc.is_verified ? (
                        <span className="text-[10px] font-black bg-green-50 text-green-700 px-3 py-1 rounded-full uppercase">Verified</span>
                      ) : (
                        <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-3 py-1 rounded-full uppercase">Pending</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 text-xs">{new Date(doc.created_at).toLocaleDateString()}</td>
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

export default EmployeeDetail;
