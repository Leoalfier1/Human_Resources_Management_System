import React from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import RSPSidebar from './RSPSidebar';
import RSPHeader from './RSPHeader';
import { useAuth } from '../../context/AuthContext';

const RSPAdminLayout = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. PAGE TITLE MAPPING
  // This looks at the current URL and tells the Header what to display
  const pageTitles = {
    '/rsp/dashboard': 'Dashboard',
    '/rsp/vacancy-posting': 'Vacancy Posting',
    '/rsp/applicants': 'Applicant Management',
    '/rsp/initial-evaluation': 'Initial Evaluation',
    '/rsp/comparative-assessment': 'Comparative Assessment',
    '/rsp/results-posting': 'Results Posting',
    '/rsp/deliberation': 'Deliberation & Shortlist',
    '/rsp/congratulatory-advice': 'Congratulatory Advice',
    '/rsp/appointment-processing': 'Appointment Processing',
    '/rsp/notice-of-appointment': 'Notice of Appointment',
  };

  // Get the title based on the path, or default to "RSP Module"
  const currentTitle = pageTitles[location.pathname] || 'RSP Module';

  // ROLE LABEL MAPPING
  // Drives the name/role pairing shown in the sidebar footer (e.g. "HR Administrator" / "HRMPSB Secretariat")
  const ROLE_LABELS = {
    admin: 'HR Administrator',
    hr_staff: 'HR Staff',
    hrmpsb: 'HRMPSB Secretariat',
    appointing_authority: 'Appointing Authority',
  };

  // 2. DEFENSIVE CHECK: Redirect unauthorized users
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 3. HANDLERS
  const handleBackToPillars = () => {
    navigate('/pillars');
  };

  return (
    <div className="flex bg-[#F1F3F6] min-h-screen">
      
      {/* LEFT SIDEBAR */}
      <RSPSidebar 
        userName={user?.fullName} 
        userRole={ROLE_LABELS[user?.role] || 'HR Staff'} 
        onBack={handleBackToPillars} // <-- Passing the function consistently here
      />

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <RSPHeader title={currentTitle} />

        {/* DYNAMIC PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            {/* This <Outlet /> is where the individual RSP screens will render */}
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default RSPAdminLayout;