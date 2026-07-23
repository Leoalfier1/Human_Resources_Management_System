import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

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
    <div className="flex bg-[#F1F3F6] min-h-screen relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden transition-opacity"
        />
      )}

      <PersonnelAdminSidebar
        userName={user?.fullName}
        userRole={ROLE_LABELS[user?.role] || 'HR Staff'}
        onBack={() => navigate('/pillars')}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 shrink-0">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-2 text-slate-600 hover:text-[#1B3A6B] hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
                title="Open menu"
              >
                <Menu size={22} />
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-[#1B3A6B] uppercase italic truncate">{currentTitle}</h1>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">{user?.fullName || 'User'}</span>
              <div className="w-8 h-8 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-black text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PersonnelAdminLayout;
