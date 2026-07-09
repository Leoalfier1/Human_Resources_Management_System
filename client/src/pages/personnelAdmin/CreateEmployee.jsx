import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { API_BASE } from '../../utils/api';

const CreateEmployee = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    user_id: '', first_name: '', middle_name: '', last_name: '', name_extension: '',
    date_of_birth: '', place_of_birth: '', sex: '', civil_status: '', blood_type: '',
    gsis_id: '', pagibig_id: '', philhealth_no: '', tin_no: '', mobile_no: '', email: '', address: '',
    employment_status: 'permanent', employment_type: 'teaching', position_title: '',
    salary_grade: '', monthly_salary: '', item_number: '', assigned_school: '',
    date_hired: '', date_original_appointment: ''
  });
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [generatedEmployeeNo, setGeneratedEmployeeNo] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/rsp/dashboard/consolidated`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    };
    fetchUsers();
    setUsers([
      { id: 0, full_name: 'Enter user ID manually', email: '' }
    ]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/personnel/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedEmployeeNo(data.employee_no);
        setMessage({ type: 'success', text: `Employee created successfully! Employee No: ${data.employee_no}` });
        setTimeout(() => navigate(`/personnel-admin/employees/${data.id}`), 1500);
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Cannot reach the server.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#1B3A6B] outline-none";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-black text-[#1B3A6B] uppercase italic">Add Employee</h2>
        <p className="text-xs font-bold text-slate-400">Create a new employee record</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">User Account</h3>
          <div>
            <p className={labelClass}>User ID *</p>
            <input type="number" name="user_id" value={form.user_id} onChange={handleChange} required className={inputClass} placeholder="Enter the user ID from the users table" />
            <p className="text-[9px] font-bold text-slate-400 mt-1">The user must already exist in the system. Ask them to register first.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <p className={labelClass}>First Name *</p>
              <input type="text" name="first_name" value={form.first_name} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Middle Name</p>
              <input type="text" name="middle_name" value={form.middle_name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Last Name *</p>
              <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Name Extension</p>
              <input type="text" name="name_extension" value={form.name_extension} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Date of Birth</p>
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Place of Birth</p>
              <input type="text" name="place_of_birth" value={form.place_of_birth} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Sex</p>
              <select name="sex" value={form.sex} onChange={handleChange} className={inputClass}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <p className={labelClass}>Civil Status</p>
              <select name="civil_status" value={form.civil_status} onChange={handleChange} className={inputClass}>
                <option value="">Select</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="separated">Separated</option>
                <option value="others">Others</option>
              </select>
            </div>
            <div>
              <p className={labelClass}>Blood Type</p>
              <input type="text" name="blood_type" value={form.blood_type} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Mobile No.</p>
              <input type="text" name="mobile_no" value={form.mobile_no} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Email</p>
              <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
            </div>
            <div className="md:col-span-3">
              <p className={labelClass}>Address</p>
              <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">Government IDs</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><p className={labelClass}>GSIS ID</p><input type="text" name="gsis_id" value={form.gsis_id} onChange={handleChange} className={inputClass} /></div>
            <div><p className={labelClass}>PAG-IBIG ID</p><input type="text" name="pagibig_id" value={form.pagibig_id} onChange={handleChange} className={inputClass} /></div>
            <div><p className={labelClass}>PhilHealth No.</p><input type="text" name="philhealth_no" value={form.philhealth_no} onChange={handleChange} className={inputClass} /></div>
            <div><p className={labelClass}>TIN No.</p><input type="text" name="tin_no" value={form.tin_no} onChange={handleChange} className={inputClass} /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <h3 className="text-lg font-black text-[#1B3A6B] uppercase italic">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className={labelClass}>Position Title</p>
              <input type="text" name="position_title" value={form.position_title} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Employment Status</p>
              <select name="employment_status" value={form.employment_status} onChange={handleChange} className={inputClass}>
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
                <option value="casual">Casual</option>
                <option value="contractual">Contractual</option>
                <option value="coterminous">Coterminous</option>
              </select>
            </div>
            <div>
              <p className={labelClass}>Category</p>
              <select name="employment_type" value={form.employment_type} onChange={handleChange} className={inputClass}>
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
                <option value="teaching_related">Teaching-Related</option>
              </select>
            </div>
            <div>
              <p className={labelClass}>Salary Grade</p>
              <input type="text" name="salary_grade" value={form.salary_grade} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Monthly Salary</p>
              <input type="number" name="monthly_salary" value={form.monthly_salary} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Item Number</p>
              <input type="text" name="item_number" value={form.item_number} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Assigned School</p>
              <input type="text" name="assigned_school" value={form.assigned_school} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Date Hired</p>
              <input type="date" name="date_hired" value={form.date_hired} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Original Appointment Date</p>
              <input type="date" name="date_original_appointment" value={form.date_original_appointment} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <p className={labelClass}>Employee No.</p>
              <input type="text" value={generatedEmployeeNo || ''} disabled className={`${inputClass} bg-slate-50 text-slate-400 cursor-not-allowed`} placeholder="Auto-generated on save" />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={submitting} className="bg-[#1B3A6B] text-white rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-[#162E55] disabled:opacity-50 flex items-center gap-2">
            <Plus size={16} /> {submitting ? 'Creating...' : 'Create Employee'}
          </button>
          <button type="button" onClick={() => navigate('/personnel-admin/employees')} className="border border-slate-200 text-slate-500 rounded-xl font-black uppercase text-xs px-8 py-3 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEmployee;
