import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// --- AUTH & LANDING ---
import AuthPage from './components/auth/AuthPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
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
import UserManagement from './components/rsp/admin/UserManagement';
import AppealManagement from './components/rsp/admin/AppealManagement';

// --- L&D MODULE ---
import LDAdminLayout from './components/ld/LDAdminLayout';
import LDDashboard from './components/ld/dashboard/LDDashboard';
import LDTNAManagement from './components/ld/tna/LDTNAManagement';
import LDObjectivesManagement from './components/ld/objectives/LDObjectivesManagement';
import LDPlanManagement from './components/ld/plans/LDPlanManagement';
import LDImplementation from './components/ld/programs/LDImplementation';
import LDEvaluationManagement from './components/ld/evaluation/LDEvaluationManagement';
import MyLearning from './pages/applicant/MyLearning';

// --- APPLICANT PORTAL (Top-Tab Layout) ---
import ApplicantPortalLayout from './components/applicant/ApplicantPortalLayout';
import JobOpenings from './pages/applicant/JobOpenings';
import JobDetail from './pages/applicant/JobDetail';
import ApplicationStatus from './pages/applicant/ApplicationStatus';
import AdviceNextSteps from './pages/applicant/AdviceNextSteps';
import ApplicationWizard from './pages/applicant/ApplicationWizard';
import ResultsNotices from './pages/applicant/ResultsNotices';

import AppointmentNotice from './pages/applicant/AppointmentNotice';

// --- R&R MODULE ---
import RRAdminLayout from './components/rr/RRAdminLayout';
import RRDashboard from './components/rr/dashboard/RRDashboard';
import RRSearchManagement from './components/rr/searches/RRSearchManagement';
import RRNominationManagement from './components/rr/nominations/RRNominationManagement';
import RREvaluationWorkspace from './components/rr/evaluation/RREvaluationWorkspace';
import RRDeliberationPanel from './components/rr/deliberation/RRDeliberationPanel';
import RRAwardsManagement from './components/rr/awards/RRAwardsManagement';
import RRReportsManagement from './components/rr/reports/RRReportsManagement';
import MyAwards from './pages/applicant/MyAwards';

// --- PERSONNEL MODULE (PERS) ---
import PersonalDataSheetForm from './pages/personnel/PersonalDataSheetForm';
import PersonnelLayout from './components/personnel/PersonnelLayout';
import EmployeeProfile from './pages/personnel/EmployeeProfile';
import My201Files from './pages/personnel/My201Files';
import LeaveApplication from './pages/personnel/LeaveApplication';
import TravelAuthority from './pages/personnel/TravelAuthority';
import CertificateRequests from './pages/personnel/CertificateRequests';
import PersonnelNotifications from './pages/personnel/PersonnelNotifications';

// --- PERSONNEL HR ADMIN PORTAL ---
import PersonnelAdminLayout from './components/personnelAdmin/PersonnelAdminLayout';
import HRDashboard from './pages/personnelAdmin/HRDashboard';
import EmployeeDirectory from './pages/personnelAdmin/EmployeeDirectory';
import EmployeeDetail from './pages/personnelAdmin/EmployeeDetail';
import CreateEmployee from './pages/personnelAdmin/CreateEmployee';
import LeaveManagement from './pages/personnelAdmin/LeaveManagement';
import TravelManagement from './pages/personnelAdmin/TravelManagement';
import DocumentRequests from './pages/personnelAdmin/DocumentRequests';
import Reports from './pages/personnelAdmin/Reports';
import AuditLog from './pages/personnelAdmin/AuditLog';
import EligibilityScreening from './pages/personnelAdmin/EligibilityScreening';
import ProfileSettings from './pages/applicant/ProfileSettings';

// --- PERFORMANCE MANAGEMENT (PM) MODULE ---
import PMAdminLayout from './components/pm/PMAdminLayout';
import PMDashboard from './components/pm/dashboard/PMDashboard';
import PMPlanningPhase from './components/pm/planning/PMPlanningPhase';
import PMMonitoringPhase from './components/pm/monitoring/PMMonitoringPhase';
import PMEvaluationPhase from './components/pm/evaluation/PMEvaluationPhase';
import PMRewardsPhase from './components/pm/rewards/PMRewardsPhase';
import MyPerformance from './pages/applicant/MyPerformance';

function App() {
  const { isAuthenticated, isAdmin, isApplicant, isHRAdmin, loading, user } = useAuth();

  // Prevent UI flashing while checking the session
  if (loading) return null;

  return (
    <Router>
      <Routes>
        {/* 1. PUBLIC ROUTE: LOGIN/SIGNUP */}
<Route 
  path="/" 
  element={!isAuthenticated ? <AuthPage /> : <Navigate to="/pillars" replace />} 
/>

        {/* 1b. PASSWORD RESET (public — no auth required) */}
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

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
          <Route 
            path="user-management" 
            element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/rsp/dashboard" replace />} 
          />
          <Route 
            path="appeals" 
            element={['admin', 'hr_staff', 'hrmpsb'].includes(user?.role) ? <AppealManagement /> : <Navigate to="/rsp/dashboard" replace />} 
          />
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
          <Route path="profile" element={<ProfileSettings />} />

        </Route>

        {/* 4b. L&D MODULE — admin routes with sidebar layout */}
        <Route
          path="/ld"
          element={(isAuthenticated && isAdmin) ? <LDAdminLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/ld/dashboard" replace />} />
          <Route path="dashboard" element={<LDDashboard />} />
          <Route path="tna" element={<LDTNAManagement />} />
          <Route path="objectives" element={<LDObjectivesManagement />} />
          <Route path="plans" element={<LDPlanManagement />} />
          <Route path="programs" element={<LDImplementation />} />
          <Route path="evaluation" element={<LDEvaluationManagement />} />
        </Route>

        {/* 4c. L&D — applicant My Learning page */}
        <Route
          path="/jobs/my-learning"
          element={(isAuthenticated && isApplicant) ? <MyLearning /> : <Navigate to="/" replace />}
        />

        {/* 4c. PM MODULE — admin layout with collapsible sidebar */}
        <Route 
          path="/pm" 
          element={(isAuthenticated && isAdmin) ? <PMAdminLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/pm/dashboard" replace />} />
          <Route path="dashboard" element={<PMDashboard />} />
          <Route path="planning" element={<PMPlanningPhase />} />
          <Route path="monitoring" element={<PMMonitoringPhase />} />
          <Route path="evaluation" element={<PMEvaluationPhase />} />
          <Route path="rewards" element={<PMRewardsPhase />} />
        </Route>

        {/* 4d. PM — applicant My Performance page */}
        <Route 
          path="/jobs/my-performance" 
          element={(isAuthenticated && isApplicant) ? <MyPerformance /> : <Navigate to="/" replace />} 
        />

        {/* 4e. R&R MODULE — admin layout with amber/gold sidebar */}
        <Route
          path="/rr"
          element={(isAuthenticated && isAdmin) ? <RRAdminLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/rr/dashboard" replace />} />
          <Route path="dashboard" element={<RRDashboard />} />
          <Route path="searches" element={<RRSearchManagement />} />
          <Route path="nominations" element={<RRNominationManagement />} />
          <Route path="evaluation" element={<RREvaluationWorkspace />} />
          <Route path="deliberation" element={<RRDeliberationPanel />} />
          <Route path="awards" element={<RRAwardsManagement />} />
          <Route path="reports" element={<RRReportsManagement />} />
        </Route>

        {/* 4f. R&R — applicant My Awards page */}
        <Route
          path="/jobs/my-awards"
          element={(isAuthenticated && isApplicant) ? <MyAwards /> : <Navigate to="/" replace />}
        />

        {/* 4g. PERSONNEL MODULE — EMPLOYEE PORTAL (Top-Tab Layout, applicant role) */}
        <Route
          path="/personnel"
          element={(isAuthenticated && isApplicant) ? <PersonnelLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/personnel/profile" replace />} />
          <Route path="pds" element={<PersonalDataSheetForm />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="201-files" element={<My201Files />} />
          <Route path="leave" element={<LeaveApplication />} />
          <Route path="travel" element={<TravelAuthority />} />
          <Route path="certificates" element={<CertificateRequests />} />
          <Route path="notifications" element={<PersonnelNotifications />} />
        </Route>

        {/* 4h. PERSONNEL MODULE — HR ADMIN PORTAL (Sidebar Layout) */}
        <Route
          path="/personnel-admin"
          element={(isAuthenticated && isHRAdmin) ? <PersonnelAdminLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/personnel-admin/dashboard" replace />} />
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="employees" element={<EmployeeDirectory />} />
          <Route path="employees/new" element={<CreateEmployee />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="leave" element={<LeaveManagement />} />
          <Route path="travel" element={<TravelManagement />} />
          <Route path="document-requests" element={<DocumentRequests />} />
          <Route path="reports" element={<Reports />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="eligibility-screening" element={<EligibilityScreening />} />
        </Route>

        {/* 5. CATCH-ALL: REDIRECT TO HOME */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;