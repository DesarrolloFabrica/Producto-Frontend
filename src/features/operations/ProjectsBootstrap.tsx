import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useOperations } from './OperationsContext';
import { shouldRunProjectsBootstrap } from './projectsBootstrapState';

/** Carga el listado de proyectos y resumen de notificaciones cuando hay sesión y backend activo. */
export function ProjectsBootstrap() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { backendEnabled, loadProjects, loadNotificationSummary } = useOperations();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!backendEnabled || authLoading) return;
    if (!shouldRunProjectsBootstrap(user?.id)) return;

    const role = user?.role;
    const usesInstitutionalPanelOnly = role === 'PLANEACION' || role === 'LMS';

    void Promise.all([
      usesInstitutionalPanelOnly ? Promise.resolve() : loadProjects(),
      loadNotificationSummary(),
    ]).catch(() => {
      // Permite reintentar si falla la carga inicial.
    });
  }, [backendEnabled, authLoading, isAuthenticated, user?.id, user?.role, loadProjects, loadNotificationSummary]);

  return null;
}
