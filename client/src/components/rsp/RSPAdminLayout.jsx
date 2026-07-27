import React from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Bell, GraduationCap, UserCheck } from 'lucide-react';
import RSPSidebar from './RSPSidebar';
import RSPHeader from './RSPHeader';
import { useAuth } from '../../context/AuthContext';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';

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

  // 2. REAL-TIME ADMIN NOTIFICATIONS
  const { toasts, dismissToast } = useAdminNotifications();

  const notificationIcons = {
    rsp: <UserCheck size={16} />,
    ld: <GraduationCap size={16} />,
    ld_applicant: <GraduationCap size={16} />,
  };

  const notificationColors = {
    rsp: 'bg-blue-600',
    ld: 'bg-emerald-600',
    ld_applicant: 'bg-amber-600',
  };

  // 3. DEFENSIVE CHECK: Redirect unauthorized users
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 4. HANDLERS
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
        <main className="flex-1 overflow-y-auto p-8 relative">
          {/* REAL-TIME NOTIFICATION TOASTS */}
          <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 max-w-sm">
            <AnimatePresence>
              {toasts.map(toast => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 300, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 300, scale: 0.9 }}
                  className={`${notificationColors[toast.type] || 'bg-gray-700'} text-white px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 cursor-pointer`}
                  onClick={() => dismissToast(toast.id)}
                >
                  <span className="mt-0.5 shrink-0">
                    {notificationIcons[toast.type] || <Bell size={16} />}
                  </span>
                  <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
                  <X size={14} className="shrink-0 mt-0.5 opacity-70 hover:opacity-100" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

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