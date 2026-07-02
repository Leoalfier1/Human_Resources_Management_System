import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// --- AUTH & LANDING ---
import AuthPage from './components/auth/AuthPage';
import PillarsLandingPage from './components/dashboard/PillarsLandingPage';

// --- ADMIN RSP MODULE (Sidebar Layout) ---
import RSPAdminLayout from './components/rsp/RSPAdminLayout';
import RSPDashboard from './components/rsp/dashboard/RSPDashboard';
import RSPVacancyPosting from './components/rsp/vacancy/RSPVacancyPosting';
import RSPApplicantManagement from './components/rsp/applicants/RSPApplicantManagement';
import RSPInitialEvaluation from './components/rsp/evaluation/RSPInitialEvaluation';
import RSPComparativeAssessment from './components/rsp/assessment/RSPComparativeAssessment';
import RSPResultsPosting from './components/rsp/results/RSPResultsPosting';
import RSPDeliberationShortlist from './components/rsp/deliberation/RSPDeliberationShortlist';
import RSPCongratulatoryAdvice from './components/rsp/advice/RSPCongratulatoryAdvice';
import RSPAppointmentProcessing from './components/rsp/appointment/RSPAppointmentProcessing';
import RSPNoticeOfAppointment from './components/rsp/appointment/RSPNoticeOfAppointment';

// --- APPLICANT PORTAL (Top-Tab Layout) ---
import ApplicantPortalLayout from './components/applicant/ApplicantPortalLayout';
import JobOpenings from './pages/applicant/JobOpenings';
import JobDetail from './pages/applicant/JobDetail';
import ApplicationStatus from './pages/applicant/ApplicationStatus';
import AdviceNextSteps from './pages/applicant/AdviceNextSteps';
import ApplicationWizard from './pages/applicant/ApplicationWizard';
import ResultsNotices from './pages/applicant/ResultsNotices';

import AppointmentNotice from './pages/applicant/AppointmentNotice';

// --- PERSONNEL MODULE (PERS) ---
import PersonalDataSheetForm from './pages/personnel/PersonalDataSheetForm';

function App() {
  const { isAuthenticated, isAdmin, isApplicant, loading } = useAuth();

  // Prevent UI flashing while checking the session
  if (loading) return null;

  return (
    <Router>
      <Routes>
        {/* 1. PUBLIC ROUTE: LOGIN/SIGNUP */}
        // App.jsx
<Route 
  path="/" 
  element={!isAuthenticated ? <AuthPage /> : <Navigate to="/pillars" replace />} 
/>

        {/* 2. SHARED ROUTE: THE 5 PILLARS LANDING PAGE */}
        <Route 
          path="/pillars" 
          element={isAuthenticated ? <PillarsLandingPage /> : <Navigate to="/" replace />} 
        />

        {/* 3. ADMIN RSP ROUTES (Strict Staff/Admin Only) */}
        <Route 
          path="/rsp" 
          element={(isAuthenticated && isAdmin) ? <RSPAdminLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/rsp/dashboard" replace />} />
          <Route path="dashboard" element={<RSPDashboard />} />
          <Route path="vacancy-posting" element={<RSPVacancyPosting />} />
          <Route path="applicants" element={<RSPApplicantManagement />} />
          <Route path="initial-evaluation" element={<RSPInitialEvaluation />} />
          <Route path="comparative-assessment" element={<RSPComparativeAssessment />} />
          <Route path="results-posting" element={<RSPResultsPosting />} />
          <Route path="deliberation" element={<RSPDeliberationShortlist />} />
          <Route path="congratulatory-advice" element={<RSPCongratulatoryAdvice />} />
          <Route path="appointment-processing" element={<RSPAppointmentProcessing />} />
          <Route path="notice-of-appointment" element={<RSPNoticeOfAppointment />} />
        </Route>

        {/* 4. APPLICANT RSP ROUTES (Strict Applicant Only) */}
        <Route 
          path="/jobs" 
          element={(isAuthenticated && isApplicant) ? <ApplicantPortalLayout /> : <Navigate to="/" replace />}
        >
          {/* Dashboard/List of openings */}
          <Route index element={<JobOpenings />} />
          
          {/* Phase 3: Status Tracker */}
          <Route path="my-application" element={<ApplicationStatus />} />
          
          {/* Phase 6: Results */}
          <Route path="results" element={<ResultsNotices />} />
          
          {/* Phase 4: Advice & Stage 9+ */}
          <Route path="advice" element={<AdviceNextSteps />} />
          
          {/* Phase 10: Appointment */}
          <Route path="appointment" element={<AppointmentNotice />} />
          
          {/* Phase 1: Vacancy Detail */}
          <Route path=":id" element={<JobDetail />} />

          {/* Phase 2: Apply Wizard */}
          <Route path=":id/apply" element={<ApplicationWizard />} />

          <Route path="advice" element={<AdviceNextSteps />} />
        </Route>

        {/* 4b. PERSONNEL MODULE (PERS) — applicant-accessible, standalone (no sidebar yet) */}
        <Route 
          path="/personnel/pds" 
          element={(isAuthenticated && isApplicant) ? <PersonalDataSheetForm /> : <Navigate to="/" replace />} 
        />

        {/* 5. CATCH-ALL: REDIRECT TO HOME */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;