import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useOperations } from './OperationsContext';

/** Carga el listado de proyectos cuando hay sesión y backend activo. */
export function ProjectsBootstrap() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { backendEnabled, loadProjects, loadNotifications } = useOperations();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      loadedRef.current = false;
      return;
    }
    if (!backendEnabled || authLoading) return;
    if (loadedRef.current) return;

    loadedRef.current = true;
    void Promise.all([loadProjects(), loadNotifications()]).catch(() => {
      loadedRef.current = false;
    });
  }, [backendEnabled, authLoading, isAuthenticated, loadProjects, loadNotifications]);

  return null;
}
