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
import type { Role } from '../types/domain';
import { homePathForRole, isPathAllowedForRole } from '../navigation/roleNavigation';

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppShell />;
}

function HomeRedirect() {
  const { role, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(role)} replace />;
}

function RoleScopeGuard({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const currentPath = `${location.pathname}${location.search ?? ''}`;
  if (!isPathAllowedForRole(currentPath, role)) {
    return <Navigate to={homePathForRole(role)} replace />;
  }
  return <>{children}</>;
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
      { index: true, element: <RoleScopeGuard><HomeRedirect /></RoleScopeGuard> },
      { path: 'product/dashboard', element: <RoleScopeGuard><RoleRedirect expectedRole="PRODUCT"><ProductDashboardPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'product/work', element: <RoleScopeGuard><RoleRedirect expectedRole="PRODUCT"><ProductWorkPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'factory/dashboard', element: <RoleScopeGuard><RoleRedirect expectedRole="FABRICA"><FactoryDashboardPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'factory/work', element: <RoleScopeGuard><RoleRedirect expectedRole="FABRICA"><FactoryWorkPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'planning/dashboard', element: <RoleScopeGuard><RoleRedirect expectedRole="PLANEACION"><PlanningDashboardPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'lms/dashboard', element: <RoleScopeGuard><RoleRedirect expectedRole="LMS"><LmsDashboardPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'subjects/:subjectId/operations', element: <RoleScopeGuard><SubjectOperationsPage /></RoleScopeGuard> },
      { path: 'workflow-preview', element: <RoleScopeGuard><OperationalWorkflowV2Provider><WorkflowPreviewPage /></OperationalWorkflowV2Provider></RoleScopeGuard> },
      { path: 'operations-v2/subjects/:subjectId', element: <RoleScopeGuard><OperationalWorkflowV2Provider><OperationalSubjectDetailV2Page /></OperationalWorkflowV2Provider></RoleScopeGuard> },
      { path: 'projects', element: <RoleScopeGuard><ProjectsPage /></RoleScopeGuard> },
      { path: 'projects/:projectId', element: <RoleScopeGuard><ProjectDetailPage /></RoleScopeGuard> },
      { path: 'projects/:projectId/semesters/:semesterNumber', element: <RoleScopeGuard><ProjectSemesterSubjectsPage /></RoleScopeGuard> },
      { path: 'subjects/:subjectId', element: <RoleScopeGuard><SubjectDetailPage /></RoleScopeGuard> },
      { path: 'notifications', element: <RoleScopeGuard><NotificationsPage /></RoleScopeGuard> },
      { path: 'notifications/settings', element: <RoleScopeGuard><NotificationSettings /></RoleScopeGuard> },
      { path: 'audit', element: <RoleScopeGuard><AuditPage /></RoleScopeGuard> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
