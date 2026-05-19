import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AuditPage } from '../features/audit/AuditPage';
import { useAuth } from '../features/auth/AuthContext';
import { LoginPage } from '../features/auth/LoginPage';
import { FactoryDashboardPage } from '../features/dashboard/FactoryDashboardPage';
import { ProductDashboardPage } from '../features/dashboard/ProductDashboardPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { ProjectDetailPage } from '../features/projects/ProjectDetailPage';
import { ProjectSemesterSubjectsPage } from '../features/projects/ProjectSemesterSubjectsPage';
import { ProjectsPage } from '../features/projects/ProjectsPage';
import { SubjectDetailPage } from '../features/subjects/SubjectDetailPage';

function RequireAuth() {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function HomeRedirect() {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'FABRICA' ? '/factory/dashboard' : '/product/dashboard'} replace />;
}

function RoleRedirect({ expectedRole, children }: { expectedRole: 'PRODUCT' | 'FABRICA'; children: React.ReactNode }) {
  const { role } = useAuth();
  if (role !== expectedRole) return <Navigate to={role === 'FABRICA' ? '/factory/dashboard' : '/product/dashboard'} replace />;
  return children;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'product/dashboard', element: <RoleRedirect expectedRole="PRODUCT"><ProductDashboardPage /></RoleRedirect> },
      { path: 'factory/dashboard', element: <RoleRedirect expectedRole="FABRICA"><FactoryDashboardPage /></RoleRedirect> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:projectId', element: <ProjectDetailPage /> },
      { path: 'projects/:projectId/semesters/:semesterNumber', element: <ProjectSemesterSubjectsPage /> },
      { path: 'subjects/:subjectId', element: <SubjectDetailPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'audit', element: <AuditPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
