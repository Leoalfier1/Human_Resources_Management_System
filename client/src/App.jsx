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
import IndividualEvaluationPage from './components/rsp/assessment/IndividualEvaluationPage';
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

import ApplicationWizard from './pages/applicant/ApplicationWizard';
import ResultsNotices from './pages/applicant/ResultsNotices';

import AppointmentNotice from './pages/applicant/AppointmentNotice';

// --- R&R MODULE ---
import RRAdminLayout from './components/rr/RRAdminLayout';
import RRDashboard from './components/rr/dashboard/RRDashboard';
import RRSearchManagement from './components/rr/searches/RRSearchManagement';
import RRNominationManagement from './components/rr/nominations/RRNominationManagement';
import ValidationInterview from './components/rr/validation/ValidationInterview';
import DeliberationFinalization from './components/rr/deliberation/DeliberationFinalization';
import RRAwardsManagement from './components/rr/awards/RRAwardsManagement';
import PraiseCommitteeMeeting from './components/rr/praise/PraiseCommitteeMeeting';
import CallForNominees from './components/rr/callForNominees/CallForNominees';
import PreliminaryEvaluation from './components/rr/preliminaryEvaluation/PreliminaryEvaluation';
import AnnouncementOfResults from './components/rr/announcement/AnnouncementOfResults';
import AwardingCeremony from './components/rr/ceremony/AwardingCeremony';
import RRImplementationReport from './components/rr/implementationReport/RRImplementationReport';
import MyAwards from './pages/applicant/MyAwards';
import SharedComponentLibrary from './components/shared/SharedComponentLibrary';
import RROpportunities from './components/rr/opportunities/RROpportunities';
import RRApplicantLayout from './components/rr/RRApplicantLayout';

// --- PERSONNEL MODULE (PERS) ---
import PersonalDataSheetForm from './pages/personnel/PersonalDataSheetForm';
import PersonnelLayout from './components/personnel/PersonnelLayout';
import EmployeeProfile from './pages/personnel/EmployeeProfile';
import My201Files from './pages/personnel/My201Files';
import LeaveApplication from './pages/personnel/LeaveApplication';
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
import FileChecklistAdmin from './pages/personnelAdmin/FileChecklistAdmin';
import EligibilityScreening from './pages/personnelAdmin/EligibilityScreening';
import Signatories from './pages/personnelAdmin/Signatories';
import AdminTools from './pages/personnelAdmin/AdminTools';
import SchoolsOffices from './pages/personnelAdmin/SchoolsOffices';
import ProfileChangeRequests from './pages/personnelAdmin/ProfileChangeRequests';
import ProfileSettings from './pages/applicant/ProfileSettings';
import AdviceNextSteps from './pages/applicant/AdviceNextSteps';

// --- PERFORMANCE MANAGEMENT (PM) MODULE ---
import PMAdminLayout from './components/pm/PMAdminLayout';
import PMDashboard from './pages/PMDashboard';
import PlanningCommitment from './pages/PlanningCommitment';
import MonitoringCoaching from './pages/MonitoringCoaching';
import ReviewEvaluation from './pages/ReviewEvaluation';
import RewardingDevPlanning from './pages/RewardingDevPlanning';
import FormConfiguration from './pages/FormConfiguration';
import PerformanceEvaluationList from './pages/PerformanceEvaluationList';
import PerformanceEvaluationForm from './pages/PerformanceEvaluationForm';

import EmployeeTopNav from './components/employee/EmployeeTopNav';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyIPCRF from './pages/employee/MyIPCRF';
import MyProgress from './pages/employee/MyProgress';
import MyReview from './pages/employee/MyReview';
import RecognitionDevPlan from './pages/employee/RecognitionDevPlan';
import PerformanceHistory from './pages/employee/PerformanceHistory';
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
          <Route path="individual-evaluation" element={<IndividualEvaluationPage />} />
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

        {/* 4. APPLICANT PORTAL ROUTES (Top-Tab Layout) */}
        <Route 
          path="/jobs" 
          element={(isAuthenticated && isApplicant) ? <ApplicantPortalLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<JobOpenings />} />
          <Route path="my-application" element={<ApplicationStatus />} />
          <Route path="results" element={<ResultsNotices />} />
          <Route path="advice" element={<AdviceNextSteps />} />
          <Route path="appointment" element={<AppointmentNotice />} />
          <Route path="profile" element={<ProfileSettings />} />
          {/* Dynamic catch-alls LAST */}
          <Route path=":id" element={<JobDetail />} />
          <Route path=":id/apply" element={<ApplicationWizard />} />
        </Route>

        {/* 4a. R&R APPLICANT PAGES — dedicated R&R header */}
        <Route
          path="/jobs/rr-opportunities"
          element={(isAuthenticated && isApplicant) ? <RRApplicantLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<RROpportunities />} />
        </Route>
        <Route
          path="/jobs/my-awards"
          element={(isAuthenticated && isApplicant) ? <RRApplicantLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<MyAwards />} />
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
        {/* PM MODULE — Admin */}
<Route 
  path="/pm" 
  element={(isAuthenticated && isAdmin) ? <PMAdminLayout /> : <Navigate to="/" replace />}
>
  <Route index element={<Navigate to="/pm/dashboard" replace />} />
  <Route path="dashboard" element={<PMDashboard />} />
  <Route path="planning" element={<PlanningCommitment />} />
  <Route path="monitoring" element={<MonitoringCoaching />} />
  <Route path="review" element={<ReviewEvaluation />} />
  <Route path="rewarding" element={<RewardingDevPlanning />} />
  <Route path="form-config" element={<FormConfiguration />} />
  <Route path="evaluate-staff" element={<PerformanceEvaluationList />} />
  <Route path="evaluate/:employeeId" element={<PerformanceEvaluationForm />} />
</Route>

{/* PM MODULE — Employee self-service view */}
<Route
  path="/pm/employee"
  element={isAuthenticated && isApplicant ? <EmployeeTopNav /> : <Navigate to="/" replace />}
>
  <Route index element={<Navigate to="/pm/employee/dashboard" replace />} />
  <Route path="dashboard" element={<EmployeeDashboard />} />
  <Route path="ipcrf" element={<MyIPCRF />} />
  <Route path="progress" element={<MyProgress />} />
  <Route path="review" element={<MyReview />} />
  <Route path="recognition-dev-plan" element={<RecognitionDevPlan />} />
  <Route path="performance-history" element={<PerformanceHistory />} />
</Route>

        {/* 4e. R&R MODULE — admin layout with amber/gold sidebar */}
        <Route
          path="/rr"
          element={(isAuthenticated && isAdmin) ? <RRAdminLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/rr/dashboard" replace />} />
          <Route path="dashboard" element={<RRDashboard />} />
          <Route path="praise-committee-meeting" element={<PraiseCommitteeMeeting />} />
          <Route path="call-for-nominees" element={<CallForNominees />} />
          <Route path="preliminary-evaluation" element={<PreliminaryEvaluation />} />
          <Route path="searches" element={<RRSearchManagement />} />
          <Route path="nominations" element={<RRNominationManagement />} />
          <Route path="evaluation" element={<ValidationInterview />} />
          <Route path="deliberation" element={<DeliberationFinalization />} />
          <Route path="announcement" element={<AnnouncementOfResults />} />
          <Route path="ceremony" element={<AwardingCeremony />} />
          <Route path="awards" element={<RRAwardsManagement />} />
          <Route path="reports" element={<RRImplementationReport />} />
          <Route path="component-library" element={<SharedComponentLibrary />} />
        </Route>

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
          <Route path="201-checklist" element={<FileChecklistAdmin />} />
          <Route path="leave" element={<LeaveManagement />} />
          <Route path="travel" element={<TravelManagement />} />
          <Route path="document-requests" element={<DocumentRequests />} />
          <Route path="profile-change-requests" element={<ProfileChangeRequests />} />
          <Route path="reports" element={<Reports />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="signatories" element={<Signatories />} />
          <Route path="admin-tools" element={<AdminTools />} />
          <Route path="schools-offices" element={<SchoolsOffices />} />
          <Route path="eligibility-screening" element={<EligibilityScreening />} />
        </Route>

        {/* 5. CATCH-ALL: REDIRECT TO HOME */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;