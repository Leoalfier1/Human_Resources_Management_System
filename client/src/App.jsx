import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// 1. Auth & Landing Components
import AuthPage from './components/auth/AuthPage';
import PillarsLandingPage from './components/dashboard/PillarsLandingPage';

// 2. RSP Module Shell Components
import RSPAdminLayout from './components/rsp/RSPAdminLayout';
import RSPPlaceholder from './components/rsp/RSPPlaceholder';

// 3. REAL RSP Screens (Phases 1-4)
import RSPDashboard from './components/rsp/dashboard/RSPDashboard';
import RSPVacancyPosting from './components/rsp/vacancy/RSPVacancyPosting';
import RSPApplicantManagement from './components/rsp/applicants/RSPApplicantManagement';
import RSPInitialEvaluation from './components/rsp/evaluation/RSPInitialEvaluation';

function App() {
  const { isAuthenticated, isAdmin, isApplicant, user, logout, loading } = useAuth();

  // Prevent UI flickering while checking the JWT token in localStorage
  if (loading) return null;

  return (
    <Router>
      <Routes>
        {/* --- PUBLIC AUTHENTICATION ROUTE --- */}
        <Route 
          path="/" 
          element={!isAuthenticated ? <AuthPage /> : <Navigate to="/pillars" replace />} 
        />

        {/* --- COMMON MODULE SELECTION PAGE --- */}
        <Route 
          path="/pillars" 
          element={isAuthenticated ? <PillarsLandingPage /> : <Navigate to="/" replace />} 
        />

        {/* --- RSP ADMIN MODULE PORTAL (Staff/Admin Only) --- */}
        <Route 
          path="/rsp" 
          element={(isAuthenticated && isAdmin) ? <RSPAdminLayout /> : <Navigate to="/" replace />}
        >
          {/* Default to Dashboard sub-route */}
          <Route index element={<Navigate to="/rsp/dashboard" replace />} />
          
          {/* REAL COMPONENTS (PHASES 1, 2, 3, & 4) */}
          <Route path="dashboard" element={<RSPDashboard />} />
          <Route path="vacancy-posting" element={<RSPVacancyPosting />} />
          <Route path="applicants" element={<RSPApplicantManagement />} />
          <Route path="initial-evaluation" element={<RSPInitialEvaluation />} />

          {/* PLACEHOLDERS (Remaining Phases 5-9) */}
          <Route path="comparative-assessment" element={<RSPPlaceholder title="Comparative Assessment" />} />
          <Route path="results-posting" element={<RSPPlaceholder title="Results Posting" />} />
          <Route path="deliberation" element={<RSPPlaceholder title="Deliberation & Shortlist" />} />
          <Route path="congratulatory-advice" element={<RSPPlaceholder title="Congratulatory Advice" />} />
          <Route path="appointment-processing" element={<RSPPlaceholder title="Appointment Processing" />} />
          <Route path="notice-of-appointment" element={<RSPPlaceholder title="Notice of Appointment" />} />
        </Route>

        {/* --- APPLICANT PORTAL (Applicant Role Only) --- */}
        <Route 
          path="/applicant/*" 
          element={(isAuthenticated && isApplicant) ? (
            <div className="min-h-screen bg-[#F1F3F6] p-10 flex flex-col items-center justify-center text-center">
              <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-200 max-w-2xl w-full">
                <h1 className="text-4xl font-black text-[#1B3A6B] uppercase italic mb-2 tracking-tight">Applicant Portal</h1>
                <p className="text-slate-500 mb-8 font-medium">Welcome {user?.fullName}. Your recruitment progress tracker is currently being prepared for the division.</p>
                
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => window.location.href = '/pillars'} 
                    className="px-8 py-3 bg-[#1B3A6B] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-[#162E55] transition-all"
                  >
                    Back to Pillars
                  </button>
                  <button 
                    onClick={logout} 
                    className="px-8 py-3 border-2 border-red-100 text-red-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : <Navigate to="/" replace />} 
        />

        {/* --- CATCH-ALL REDIRECT --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;