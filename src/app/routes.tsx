import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom';
import { AppProviders } from './AppProviders';
import { RouteLoadingScreen } from '../components/feedback/RouteLoadingScreen';
import { AppShell } from '../components/layout/AppShell';
import { AppBootGate, AppBootProvider } from '../features/boot/AppBootProvider';
import { OperationsProvider } from '../features/operations/OperationsContext';
import { AuditPage } from '../features/audit/AuditPage';
import { useAuth } from '../features/auth/AuthContext';
import { LoginPage } from '../features/auth/LoginPage';
import { FactoryDashboardPage } from '../features/dashboard/FactoryDashboardPage';
import { FactoryWorkPage } from '../features/factory-work/FactoryWorkPage';
import { ProductDashboardPage } from '../features/dashboard/ProductDashboardPage';
import { AdminInstitutionalTrackingPage } from '../features/admin-tracking/AdminInstitutionalTrackingPage';
import { AdminSemesterDetailPage } from '../features/admin-tracking/AdminSemesterDetailPage';
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
import { ProjectProgramOperationsPage } from '../features/institutional-workflow/ProjectProgramOperationsPage';
import { SemesterOperationsPage } from '../features/institutional-workflow/SemesterOperationsPage';
import { AdminProgramDetailPage } from '../features/admin-tracking/AdminProgramDetailPage';
import { ReportsCatalogPage } from '../features/reports/ReportsCatalogPage';
import { ReportDetailPage } from '../features/reports/ReportDetailPage';
import { CDigitalUsersPage } from '../features/c-digital-users/CDigitalUsersPage';
import type { Role } from '../types/domain';
import { homePathForRole, homePathForUser, isPathAllowedForUser } from '../navigation/roleNavigation';
import { hasCDigitalUsersPermission } from '../permissions';

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    <OperationsProvider>
      <AppBootProvider>
        <AppBootGate>
          <AppShell />
        </AppBootGate>
      </AppBootProvider>
    </OperationsProvider>
  );
}

function HomeRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForUser(user)} replace />;
}

function RoleScopeGuard({ children }: { children: React.ReactNode }) {
  const { role, user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const currentPath = `${location.pathname}${location.search ?? ''}`;
  if (location.pathname === '/usuarios-c-digital') {
    if (!hasCDigitalUsersPermission(user)) {
      return <Navigate to={homePathForUser(user)} replace />;
    }
    return <>{children}</>;
  }
  if (!isPathAllowedForUser(currentPath, user)) {
    return <Navigate to={homePathForUser(user)} replace />;
  }
  return <>{children}</>;
}

function RoleRedirect({ expectedRole, children }: { expectedRole: Role; children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoadingScreen message="Validando sesión..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== expectedRole) return <Navigate to={homePathForRole(role)} replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    element: <AppProviders />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        path: '/',
        element: <RequireAuth />,
        children: [
      { index: true, element: <RoleScopeGuard><HomeRedirect /></RoleScopeGuard> },
      { path: 'product/dashboard', element: <RoleScopeGuard><RoleRedirect expectedRole="PRODUCT"><ProductDashboardPage /></RoleRedirect></RoleScopeGuard> },
      {
        path: 'admin/dashboard',
        element: <RoleScopeGuard><RoleRedirect expectedRole="ADMIN"><AdminInstitutionalTrackingPage /></RoleRedirect></RoleScopeGuard>,
      },
      {
        path: 'admin/programs/:projectId',
        element: <RoleScopeGuard><RoleRedirect expectedRole="ADMIN"><AdminProgramDetailPage /></RoleRedirect></RoleScopeGuard>,
      },
      {
        path: 'admin/programs/:projectId/semesters/:semesterId',
        element: <RoleScopeGuard><RoleRedirect expectedRole="ADMIN"><AdminSemesterDetailPage /></RoleRedirect></RoleScopeGuard>,
      },
      { path: 'product/work', element: <RoleScopeGuard><RoleRedirect expectedRole="PRODUCT"><ProductWorkPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'factory/dashboard', element: <RoleScopeGuard><RoleRedirect expectedRole="FABRICA"><FactoryDashboardPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'factory/work', element: <RoleScopeGuard><RoleRedirect expectedRole="FABRICA"><FactoryWorkPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'planning/dashboard', element: <RoleScopeGuard><RoleRedirect expectedRole="PLANEACION"><PlanningDashboardPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'lms/dashboard', element: <RoleScopeGuard><RoleRedirect expectedRole="LMS"><LmsDashboardPage /></RoleRedirect></RoleScopeGuard> },
      { path: 'subjects/:subjectId/operations', element: <RoleScopeGuard><SubjectOperationsPage /></RoleScopeGuard> },
      {
        path: 'projects/:projectId/semesters/:semesterId/operations',
        element: <RoleScopeGuard><SemesterOperationsPage /></RoleScopeGuard>,
      },
      {
        path: 'projects/:projectId/operations',
        element: <RoleScopeGuard><ProjectProgramOperationsPage /></RoleScopeGuard>,
      },
      { path: 'projects/:projectId/semesters/:semesterNumber', element: <RoleScopeGuard><ProjectSemesterSubjectsPage /></RoleScopeGuard> },
      { path: 'projects', element: <RoleScopeGuard><ProjectsPage /></RoleScopeGuard> },
      { path: 'projects/:projectId', element: <RoleScopeGuard><ProjectDetailPage /></RoleScopeGuard> },
      { path: 'workflow-preview', element: <RoleScopeGuard><OperationalWorkflowV2Provider><WorkflowPreviewPage /></OperationalWorkflowV2Provider></RoleScopeGuard> },
      { path: 'operations-v2/subjects/:subjectId', element: <RoleScopeGuard><OperationalWorkflowV2Provider><OperationalSubjectDetailV2Page /></OperationalWorkflowV2Provider></RoleScopeGuard> },
      { path: 'subjects/:subjectId', element: <RoleScopeGuard><SubjectDetailPage /></RoleScopeGuard> },
      { path: 'notifications', element: <RoleScopeGuard><NotificationsPage /></RoleScopeGuard> },
      { path: 'notifications/settings', element: <RoleScopeGuard><NotificationSettings /></RoleScopeGuard> },
      { path: 'audit', element: <RoleScopeGuard><AuditPage /></RoleScopeGuard> },
      { path: 'reports', element: <RoleScopeGuard><ReportsCatalogPage /></RoleScopeGuard> },
      { path: 'reports/:reportId', element: <RoleScopeGuard><ReportDetailPage /></RoleScopeGuard> },
      { path: 'usuarios-c-digital', element: <RoleScopeGuard><CDigitalUsersPage /></RoleScopeGuard> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
