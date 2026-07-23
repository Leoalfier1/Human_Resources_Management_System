import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// 1. Auth & Landing Components
import AuthPage from './components/auth/AuthPage.jsx';
import PillarsLandingPage from './components/dashboard/PillarsLandingPage.jsx';

// 2. RSP Module Components
import RSPAdminLayout from './components/rsp/RSPAdminLayout.jsx';
import RSPPlaceholder from './components/rsp/RSPPlaceholder.jsx';
import RSPDashboard from './components/rsp/dashboard/RSPDashboard.jsx';
import RSPVacancyPosting from './components/rsp/vacancy/RSPVacancyPosting.jsx';
import RSPApplicantManagement from './components/rsp/applicants/RSPApplicantManagement.jsx';
import RSPInitialEvaluation from './components/rsp/evaluation/RSPInitialEvaluation.jsx';

// 3. PM Module Components
import PMAdminLayout from './components/pm/PMAdminLayout.jsx';
import PMDashboard from './pages/PMDashboard.jsx';
import PlanningCommitment from './pages/PlanningCommitment.jsx';
import MonitoringCoaching from './pages/MonitoringCoaching.jsx';
import ReviewEvaluation from './pages/ReviewEvaluation.jsx';
import RewardingDevPlanning from './pages/RewardingDevPlanning.jsx';
import FormConfiguration from './pages/FormConfiguration.jsx';
import PerformanceEvaluationList from './pages/PerformanceEvaluationList.jsx';
import PerformanceEvaluationForm from './pages/PerformanceEvaluationForm.jsx';

// 4. PM Employee View Pages
import EmployeeTopNav from './components/employee/EmployeeTopNav.jsx';
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import MyIPCRF from './pages/employee/MyIPCRF.jsx';
import MyProgress from './pages/employee/MyProgress.jsx';
import MyReview from './pages/employee/MyReview.jsx';
import RecognitionDevPlan from './pages/employee/RecognitionDevPlan.jsx';
import PerformanceHistory from './pages/employee/PerformanceHistory.jsx';

// 5. PM Applicant Pages
import ApplicantDashboard from './pages/applicant/ApplicantDashboard.jsx';

// 6. L&D Module Components
import LDAdminLayout from './components/ld/LDAdminLayout.jsx';
import LDDashboard from './pages/ld/LDDashboard.jsx';
import LDTNAScreen from './pages/ld/LDTNAScreen.jsx';
import LDObjectivesScreen from './pages/ld/LDObjectivesScreen.jsx';
import LDPlanningScreen from './pages/ld/LDPlanningScreen.jsx';
import LDImplementationScreen from './pages/ld/LDImplementationScreen.jsx';
import LDEvaluationScreen from './pages/ld/LDEvaluationScreen.jsx';
import LDReportsScreen from './pages/ld/LDReportsScreen.jsx';

// 7. L&D Employee View Pages
import MyLearningDashboard from './pages/employee/learning/MyLearningDashboard.jsx';
import TNASurveyPage from './pages/employee/learning/TNASurveyPage.jsx';
import ProgramCatalogPage from './pages/employee/learning/ProgramCatalogPage.jsx';
import MyProgramStatusPage from './pages/employee/learning/MyProgramStatusPage.jsx';
import TrainingSessionPage from './pages/employee/learning/TrainingSessionPage.jsx';
import PostTrainingEvaluationPage from './pages/employee/learning/PostTrainingEvaluationPage.jsx';
import LearningHistoryPage from './pages/employee/learning/LearningHistoryPage.jsx';

function App() {
  const { isAuthenticated, isAdmin, isApplicant, user, loading } = useAuth();

  if (loading) return null;

  return (
    <Router>
      <Routes>
        {/* PUBLIC AUTHENTICATION ROUTE */}
        <Route 
          path="/" 
          element={
            !isAuthenticated ? (
              <AuthPage />
            ) : isApplicant ? (
              <Navigate to="/applicant/dashboard" replace />
            ) : (
              <Navigate to="/pillars" replace />
            )
          } 
        />

        {/* MODULE SELECTION (PILLARS) */}
        <Route 
          path="/pillars" 
          element={
            (isAuthenticated && !isApplicant) ? (
              <PillarsLandingPage />
            ) : isAuthenticated ? (
              <Navigate to="/applicant/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* RSP MODULE */}
        <Route 
          path="/rsp" 
          element={(isAuthenticated && isAdmin) ? <RSPAdminLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/rsp/dashboard" replace />} />
          <Route path="dashboard" element={<RSPDashboard />} />
          <Route path="vacancy-posting" element={<RSPVacancyPosting />} />
          <Route path="applicants" element={<RSPApplicantManagement />} />
          <Route path="initial-evaluation" element={<RSPInitialEvaluation />} />
          <Route path="comparative-assessment" element={<RSPPlaceholder title="Comparative Assessment" />} />
        </Route>

        {/* PM MODULE (Paths matched with Process Flow) */}
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

        {/* PM MODULE (Employee Trainee View) */}
        <Route
          path="/pm/employee"
          element={isAuthenticated && !isApplicant ? <EmployeeTopNav /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/pm/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="ipcrf" element={<MyIPCRF />} />
          <Route path="progress" element={<MyProgress />} />
          <Route path="review" element={<MyReview />} />
          <Route path="recognition-dev-plan" element={<RecognitionDevPlan />} />
          <Route path="performance-history" element={<PerformanceHistory />} />
        </Route>

        {/* L&D MODULE (Admin Panel) */}
        <Route 
          path="/ld" 
          element={(isAuthenticated && isAdmin) ? <LDAdminLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Navigate to="/ld/dashboard" replace />} />
          <Route path="dashboard" element={<LDDashboard />} />
          <Route path="tna" element={<LDTNAScreen />} />
          <Route path="objectives" element={<LDObjectivesScreen />} />
          <Route path="planning" element={<LDPlanningScreen />} />
          <Route path="implementation" element={<LDImplementationScreen />} />
          <Route path="evaluation" element={<LDEvaluationScreen />} />
          <Route path="reports" element={<LDReportsScreen />} />
        </Route>

        {/* L&D MODULE (Employee Trainee View) */}
        <Route
          path="/employee/learning"
          element={isAuthenticated && !isApplicant ? <MyLearningDashboard /> : <Navigate to="/" replace />}
        />
        <Route
          path="/employee/learning/tna"
          element={isAuthenticated && !isApplicant ? <TNASurveyPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/employee/learning/catalog"
          element={isAuthenticated && !isApplicant ? <ProgramCatalogPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/employee/learning/status"
          element={isAuthenticated && !isApplicant ? <MyProgramStatusPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/employee/learning/session"
          element={isAuthenticated && !isApplicant ? <TrainingSessionPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/employee/learning/evaluate"
          element={isAuthenticated && !isApplicant ? <PostTrainingEvaluationPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/employee/learning/history"
          element={isAuthenticated && !isApplicant ? <LearningHistoryPage /> : <Navigate to="/" replace />}
        />

        {/* APPLICANT PORTAL */}
        <Route 
          path="/applicant/dashboard" 
          element={(isAuthenticated && (isApplicant || user?.role === 'employee')) ? <ApplicantDashboard /> : <Navigate to="/" replace />} 
        />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
