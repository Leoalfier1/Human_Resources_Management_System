import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../../utils/api';

const Toast = ({ message, type, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-bold text-sm flex items-center gap-2"
    style={{ background: type === 'success' ? '#16A34A' : '#DC2626' }}>
    {message}
    <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
  </div>
);

const Label = ({ children }) => (
  <label className="block font-black uppercase mb-1" style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.14em' }}>
    {children}
  </label>
);

const LDEmployeeProfile = () => {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/personnel/employees/my-profile?_=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          middle_name: data.middle_name || '',
          name_extension: data.name_extension || '',
          employee_no: data.employee_no || '',
          email: data.email || '',
          mobile_no: data.mobile_no || '',
          assigned_school: data.assigned_school || '',
          position_title: data.position_title || '',
          sex: data.sex || '',
          civil_status: data.civil_status || '',
          date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
          place_of_birth: data.place_of_birth || '',
          blood_type: data.blood_type || '',
          address: data.address || '',
          gsis_id: data.gsis_id || '',
          pagibig_id: data.pagibig_id || '',
          philhealth_no: data.philhealth_no || '',
          tin_no: data.tin_no || '',
          _stats: {
            sick_leave_balance: data.sick_leave_balance ?? 15,
            vacation_leave_balance: data.vacation_leave_balance ?? 12,
          },
        });
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const payload = { ...form };
      delete payload._stats;
      delete payload.employee_no;
      delete payload.position_title;
      const res = await apiFetch('/api/personnel/employees/my-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update profile.');
      }
      const data = await res.json();
      setToast({ type: 'success', text: data.message || 'Profile updated successfully!' });
      await fetchProfile();
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, disabled = false) => (
    <div>
      <Label>{label}</Label>
      <input value={form[key] || ''} disabled={disabled}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-400"
        style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }} />
    </div>
  );

  if (loading) {
    return <div className="text-center py-12" style={{ fontSize: 12, color: '#6B7280' }}>Loading profile...</div>;
  }

  const initials = [form.first_name, form.middle_name, form.last_name]
    .filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 260px' }}>

        {/* Personal Info */}
        <div className="rounded-2xl border border-slate-100 p-5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="font-black uppercase mb-4" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Personal Information</p>
          <div className="grid grid-cols-2 gap-3">
            {field('First Name',      'first_name')}
            {field('Last Name',       'last_name')}
            {field('Middle Name',     'middle_name')}
            {field('Name Extension',  'name_extension')}
            {field('Employee ID',     'employee_no', true)}
            {field('Email Address',   'email')}
            {field('Contact Number',  'mobile_no')}
            <div style={{ gridColumn: '1 / -1' }}>
              {field('School / Office', 'assigned_school')}
            </div>
            {field('Position',        'position_title', true)}
            {field('Date of Birth',   'date_of_birth')}
            {field('Place of Birth',  'place_of_birth')}
            <div>
              <Label>Sex</Label>
              <select value={form.sex || ''} onChange={e => setForm(p => ({ ...p, sex: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors appearance-none"
                style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }}>
                <option value="">Select...</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div>
              <Label>Civil Status</Label>
              <select value={form.civil_status || ''} onChange={e => setForm(p => ({ ...p, civil_status: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 focus:outline-none transition-colors appearance-none"
                style={{ border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }}>
                <option value="">Select...</option>
                <option>Single</option>
                <option>Married</option>
                <option>Widowed</option>
                <option>Separated</option>
              </select>
            </div>
            {field('Blood Type', 'blood_type')}
          </div>

          <p className="font-black uppercase mt-5 mb-3" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Government IDs</p>
          <div className="grid grid-cols-2 gap-3">
            {field('GSIS ID',      'gsis_id')}
            {field('Pag-IBIG ID',  'pagibig_id')}
            {field('PhilHealth No.','philhealth_no')}
            {field('TIN No.',      'tin_no')}
          </div>

          <p className="font-black uppercase mt-5 mb-3" style={{ fontSize: 11, color: '#1B2A50', letterSpacing: '0.12em' }}>Address</p>
          <div>
            {field('Complete Address', 'address')}
          </div>
        </div>

        {/* Profile summary */}
        <div className="rounded-2xl border border-slate-100 p-5 flex flex-col" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex flex-col items-center pt-3 pb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black mb-3"
              style={{ background: '#1B2A50', fontSize: 24 }}>{initials}</div>
            <p className="font-black text-center" style={{ fontSize: 14, color: '#1B2A50' }}>
              {[form.first_name, form.middle_name, form.last_name].filter(Boolean).join(' ')}
            </p>
            <p className="mt-0.5 text-center" style={{ fontSize: 11, color: '#6B7280' }}>{form.position_title}</p>
          </div>

          <div className="my-3" style={{ borderTop: '1px solid #E5E7EB' }} />

          <div className="space-y-3">
            {[
              { label: 'Employee No.', value: form.employee_no || '—' },
              { label: 'Civil Status', value: form.civil_status || '—' },
              { label: 'Sex',          value: form.sex || '—' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <p style={{ fontSize: 11, color: '#6B7280' }}>{s.label}</p>
                <p className="font-bold" style={{ fontSize: 12, color: '#1B2A50' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="w-full text-white font-black uppercase py-3.5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: '#DE4E2A', fontSize: 12, letterSpacing: '0.12em' }}>
        {saving ? 'SAVING...' : 'SAVE PROFILE'}
      </button>
    </div>
  );
};

export default LDEmployeeProfile;
