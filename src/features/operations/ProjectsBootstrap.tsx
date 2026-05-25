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

    void Promise.all([loadProjects(), loadNotificationSummary()]).catch(() => {
      // Permite reintentar si falla la carga inicial.
    });
  }, [backendEnabled, authLoading, isAuthenticated, user?.id, loadProjects, loadNotificationSummary]);

  return null;
}
