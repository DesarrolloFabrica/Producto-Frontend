import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom';
import { RouteLoadingScreen } from '../components/feedback/RouteLoadingScreen';
import { AppShell } from '../components/layout/AppShell';
import { AuditPage } from '../features/audit/AuditPage';
import { useAuth } from '../features/auth/AuthContext';
import { LoginPage } from '../features/auth/LoginPage';
import { FactoryDashboardPage } from '../features/dashboard/FactoryDashboardPage';
import { FactoryWorkPage } from '../features/factory-work/FactoryWorkPage';
import { ProductDashboardPage } from '../features/dashboard/ProductDashboardPage';
import { ProductWorkPage } from '../features/product-work/ProductWorkPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { ProjectDetailPage } from '../features/projects/ProjectDetailPage';
import { ProjectSemesterSubjectsPage } from '../features/projects/ProjectSemesterSubjectsPage';
import { ProjectsPage } from '../features/projects/ProjectsPage';
import { SubjectDetailPage } from '../features/subjects/SubjectDetailPage';
import { WorkflowPreviewPage } from '../features/operations-v2/pages/WorkflowPreviewPage';
import { OperationalSubjectDetailV2Page } from '../features/operations-v2/pages/OperationalSubjectDetailV2Page';
import { OperationalWorkflowV2Provider } from '../features/operations-v2/store/OperationalWorkflowV2Context';
import { PlanningDashboardPage } from '../features/planning/PlanningDashboardPage';
import { LmsDashboardPage } from '../features/lms/LmsDashboardPage';
import { SubjectOperationsPage } from '../features/institutional-workflow/SubjectOperationsPage';
import { SemesterOperationsPage } from '../features/institutional-workflow/SemesterOperationsPage';
import type { Role } from '../types/domain';

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppShell />;
}

function homePathForRole(role: Role | null): string {
  if (role === 'FABRICA') return '/factory/dashboard';
  if (role === 'PLANEACION') return '/planning/dashboard';
  if (role === 'LMS') return '/lms/dashboard';
  return '/product/dashboard';
}

function HomeRedirect() {
  const { role, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(role)} replace />;
}

function RoleRedirect({ expectedRole, children }: { expectedRole: Role; children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== expectedRole && role !== 'ADMIN') return <Navigate to={homePathForRole(role)} replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'product/dashboard', element: <RoleRedirect expectedRole="PRODUCT"><ProductDashboardPage /></RoleRedirect> },
      { path: 'product/work', element: <RoleRedirect expectedRole="PRODUCT"><ProductWorkPage /></RoleRedirect> },
      { path: 'factory/dashboard', element: <RoleRedirect expectedRole="FABRICA"><FactoryDashboardPage /></RoleRedirect> },
      { path: 'factory/work', element: <RoleRedirect expectedRole="FABRICA"><FactoryWorkPage /></RoleRedirect> },
      { path: 'planning/dashboard', element: <RoleRedirect expectedRole="PLANEACION"><PlanningDashboardPage /></RoleRedirect> },
      { path: 'lms/dashboard', element: <RoleRedirect expectedRole="LMS"><LmsDashboardPage /></RoleRedirect> },
      { path: 'subjects/:subjectId/operations', element: <SubjectOperationsPage /> },
      { path: 'projects/:projectId/semesters/:semesterId/operations', element: <SemesterOperationsPage /> },
      { path: 'workflow-preview', element: <OperationalWorkflowV2Provider><WorkflowPreviewPage /></OperationalWorkflowV2Provider> },
      { path: 'operations-v2/subjects/:subjectId', element: <OperationalWorkflowV2Provider><OperationalSubjectDetailV2Page /></OperationalWorkflowV2Provider> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:projectId', element: <ProjectDetailPage /> },
      { path: 'projects/:projectId/semesters/:semesterNumber', element: <ProjectSemesterSubjectsPage /> },
      { path: 'subjects/:subjectId', element: <SubjectDetailPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'notifications/settings', element: <NotificationSettings /> },
      { path: 'audit', element: <AuditPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
