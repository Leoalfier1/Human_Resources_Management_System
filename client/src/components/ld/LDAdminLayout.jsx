import React from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LDSidebar from './LDSidebar';
import LDHeader from './LDHeader';
import { useAuth } from '../../context/AuthContext';

const LDAdminLayout = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Page title mapping
  const pageTitles = {
    '/ld/dashboard': 'L&D Dashboard',
    '/ld/tna': 'Training Needs Assessment (TNA)',
    '/ld/objectives': 'Learning Objectives Formulation',
    '/ld/planning': 'Program Planning & Design',
    '/ld/implementation': 'Implementation Tracking',
    '/ld/evaluation': 'Impact Evaluation',
    '/ld/reports': 'Consolidated Reports',
  };

  const currentTitle = pageTitles[location.pathname] || 'Learning & Development';

  // Defensive Check
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleBackToPillars = () => {
    navigate('/pillars');
  };

  return (
    <div className="flex bg-[#F1F3F6] min-h-screen">
      {/* LEFT SIDEBAR */}
      <LDSidebar 
        userName={user?.fullName} 
        userRole={user?.role === 'admin' ? 'HR L&D Specialist' : 'L&D Staff'} 
        onBack={handleBackToPillars} 
      />

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP HEADER */}
        <LDHeader title={currentTitle} />

        {/* DYNAMIC PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F1F3F6]">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LDAdminLayout;
