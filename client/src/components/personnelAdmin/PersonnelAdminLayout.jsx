import React from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import PersonnelAdminSidebar from './PersonnelAdminSidebar';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/personnel-admin/dashboard': 'Dashboard',
  '/personnel-admin/employees': 'Employee Directory',
  '/personnel-admin/employees/new': 'Add Employee',
  '/personnel-admin/201-checklist': '201 File Checklist',
  '/personnel-admin/leave': 'Leave Management',
  '/personnel-admin/travel': 'Travel Management',
  '/personnel-admin/document-requests': 'Document Requests',
  '/personnel-admin/profile-change-requests': 'Profile Change Requests',
  '/personnel-admin/eligibility-screening': 'Eligibility Screening',
  '/personnel-admin/reports': 'Reports & Analytics',
  '/personnel-admin/audit': 'Audit Log',
  '/personnel-admin/signatories': 'Signatories',
  '/personnel-admin/schools-offices': 'Schools & Offices',
  '/personnel-admin/admin-tools': 'Admin Tools',
};

const PersonnelAdminLayout = () => {
  const { isAuthenticated, isHRAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTitle = Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'Personnel Admin';

  const ROLE_LABELS = {
    admin: 'HR Administrator',
    hr_staff: 'HR Staff',
    hrmpsb: 'HRMPSB Secretariat',
    appointing_authority: 'Appointing Authority',
  };

  if (!isAuthenticated || !isHRAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex bg-[#F1F3F6] min-h-screen">
      <PersonnelAdminSidebar
        userName={user?.fullName}
        userRole={ROLE_LABELS[user?.role] || 'HR Staff'}
        onBack={() => navigate('/pillars')}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-black text-[#1B3A6B] uppercase italic">{currentTitle}</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">{user?.fullName || 'User'}</span>
              <div className="w-8 h-8 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-black text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PersonnelAdminLayout;
