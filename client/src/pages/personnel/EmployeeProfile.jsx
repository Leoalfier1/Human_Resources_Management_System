import React from 'react';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';

const Field = ({ label, value }) => (
  <div className="bg-slate-50 rounded-xl px-4 py-3">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-700">{value || '—'}</p>
  </div>
);

const EmployeeProfile = () => {
  const { profile, loading, error } = useEmployeeProfile();

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin border-4 border-[#1B3A6B] border-t-transparent rounded-full w-8 h-8" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-[#D6402F] font-black text-lg">{error}</p>
    </div>
  );

  if (!profile) return (
    <div className="p-8 text-center">
      <p className="text-slate-400 font-bold">No employee profile found. Please contact HR.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">My Profile</h1>
        <p className="text-xs font-bold text-slate-400">Personal and employment information</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Employee No." value={profile.employee_no} />
          <Field label="First Name" value={profile.first_name} />
          <Field label="Middle Name" value={profile.middle_name} />
          <Field label="Last Name" value={profile.last_name} />
          <Field label="Name Extension" value={profile.name_extension} />
          <Field label="Date of Birth" value={profile.date_of_birth} />
          <Field label="Place of Birth" value={profile.place_of_birth} />
          <Field label="Sex" value={profile.sex} />
          <Field label="Civil Status" value={profile.civil_status} />
          <Field label="Blood Type" value={profile.blood_type} />
          <Field label="Mobile No." value={profile.mobile_no} />
          <Field label="Email" value={profile.email} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic">Government IDs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="GSIS ID" value={profile.gsis_id} />
          <Field label="PAG-IBIG ID" value={profile.pagibig_id} />
          <Field label="PhilHealth No." value={profile.philhealth_no} />
          <Field label="TIN No." value={profile.tin_no} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic">Employment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Position" value={profile.position_title} />
          <Field label="Employment Status" value={profile.employment_status} />
          <Field label="Employment Type" value={profile.employment_type} />
          <Field label="Salary Grade" value={profile.salary_grade} />
          <Field label="Monthly Salary" value={profile.monthly_salary ? `₱${parseFloat(profile.monthly_salary).toLocaleString()}` : '—'} />
          <Field label="Item Number" value={profile.item_number} />
          <Field label="Assigned School" value={profile.assigned_school} />
          <Field label="Date Hired" value={profile.date_hired} />
          <Field label="Date of Original Appointment" value={profile.date_original_appointment} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <h2 className="text-lg font-black text-[#1B3A6B] uppercase italic">Leave Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Sick Leave" value={profile.sick_leave_balance} />
          <Field label="Vacation Leave" value={profile.vacation_leave_balance} />
          <Field label="Forced Leave" value={profile.forced_leave_balance} />
          <Field label="Special Privilege" value={profile.special_privilege_balance} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
